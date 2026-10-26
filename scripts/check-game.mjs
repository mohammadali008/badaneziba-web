import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../wax-game.js', import.meta.url), 'utf8');

// Exercise the controller without a browser: time, storage and input are explicit.
function gameHarness(initialStorage = new Map(), randomSource = globalThis.crypto) {
  const nodes = new Map();
  const frames = new Map();
  const listeners = {};
  let now = 0, frameId = 0;
  class Node {
    constructor() {
      this.hidden = false; this.disabled = false; this.textContent = ''; this.style = {};
      this.attrs = {}; this.events = {}; this.children = [];
      const classes = new Set();
      this.classList = {
        add: (...names) => names.forEach(name => classes.add(name)),
        remove: (...names) => names.forEach(name => classes.delete(name)),
        contains: name => classes.has(name),
        toggle: (name, force = !classes.has(name)) => { force ? classes.add(name) : classes.delete(name); return force; },
      };
    }
    querySelector(selector) { if (!nodes.has(selector)) nodes.set(selector, new Node()); return nodes.get(selector); }
    setAttribute(key, value) { this.attrs[key] = value; }
    addEventListener(type, fn) { this.events[type] = fn; }
    append(child) { this.children.push(child); }
    focus() { this.focused = true; }
    scrollIntoView() {}
    setPointerCapture() {}
    emit(type, event = {}) { this.events[type]?.(event); }
  }
  const root = new Node();
  const document = { hidden: false, getElementById: () => root, createElement: () => new Node(), addEventListener: (type, fn) => { listeners[type] = fn; } };
  const storage = initialStorage;
  vm.runInNewContext(source, {
    document, Intl, Date, Math, JSON, Number, Array, Uint32Array,
    crypto: randomSource,
    performance: { now: () => now },
    requestAnimationFrame: fn => { const id = ++frameId; frames.set(id, fn); return id; },
    cancelAnimationFrame: id => frames.delete(id),
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, val) => storage.set(key, val) },
    matchMedia: () => ({ matches: true }),
  });
  const get = selector => nodes.get(selector);
  const patches = get('.wax-patches').children;
  function advance(ms) {
    now += ms;
    const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn());
  }
  return { get, patches, storage, advance, document, listeners,
    start: () => get('.wax-start').emit('click', { detail: 0 }),
    target: () => patches.find(button => button.classList.contains('is-target')),
    wonResult: () => JSON.parse(storage.get('badaneziba-wax-result-v1')),
  };
}

const game = gameHarness();
assert.equal(game.patches.length, 12);
assert.equal(game.get('.wax-controls').hidden, false);
game.start();
assert.equal(game.get('.wax-start').disabled, true);
assert.equal(game.patches.filter(button => !button.disabled).length, 1);
const wrong = game.patches.find(button => button.disabled);
wrong.emit('click', { detail: 0 });
assert.equal(game.get('.wax-count').textContent, '۰ / ۱۲');
const first = game.target();
first.emit('pointerdown', { pointerId: 1, clientX: 0, clientY: 0, pointerType: 'touch' });
first.emit('pointermove', { pointerId: 1, clientX: 30, clientY: 0 });
assert.equal(game.get('.wax-count').textContent, '۱ / ۱۲');
first.emit('click', { detail: 1 });
assert.equal(game.get('.wax-count').textContent, '۱ / ۱۲', 'A swipe followed by click must not score twice');
for (let i = 1; i < 12; i++) game.target().emit('click', { detail: 0 });
assert.equal(game.get('.wax-result').hidden, false);
assert.equal(game.get('.wax-meter').attrs['aria-valuenow'], '12');
assert.equal(game.get('.wax-start').disabled, false);
assert.ok(game.wonResult().points >= 100 && game.wonResult().points <= 500);
const reward = game.storage.get('badaneziba-wax-result-v1');

game.start();
game.advance(20001);
assert.equal(game.get('.wax-start').disabled, false);
assert.equal(game.get('.wax-cover-title').textContent, 'نزدیک بود!');
assert.equal(game.storage.get('badaneziba-wax-result-v1'), reward, 'A loss must not award a new result');

game.start(); game.advance(5000);
game.document.hidden = true; game.listeners.visibilitychange();
assert.equal(game.get('.wax-pause').textContent, 'ادامه بازی');
assert.equal(game.patches.filter(button => !button.disabled).length, 0);
game.advance(60000);
game.document.hidden = false;
game.get('.wax-pause').emit('click', { detail: 0 });
assert.equal(game.patches.filter(button => !button.disabled).length, 1);
game.advance(14999);
assert.equal(game.get('.wax-start').disabled, true, 'Hidden time must not consume the game timer');
game.advance(2);
assert.equal(game.get('.wax-cover-title').textContent, 'نزدیک بود!');

const restored = gameHarness(game.storage);
assert.equal(restored.get('.wax-result').hidden, false);
assert.equal(restored.get('.wax-reward-title').textContent, 'آخرین بردت اینجاست!');
gameHarness(new Map([['badaneziba-wax-result-v1', '{broken']]));

const results = new Set();
for (let round = 0; round < 200; round++) {
  restored.start();
  for (let i = 0; i < 12; i++) restored.target().emit('click', { detail: 0 });
  const points = restored.wonResult().points;
  assert.ok(Number.isInteger(points) && points >= 100 && points <= 500);
  results.add(points);
}
assert.ok(results.size > 1, 'Unlimited replay should generate fresh rewards');
const values = [0, 400, 4294967295, 0];
const endpoints = gameHarness(new Map(), { getRandomValues: buffer => { buffer[0] = values.shift(); return buffer; } });
for (const expected of [100, 500, 100]) {
  endpoints.start();
  for (let i = 0; i < 12; i++) endpoints.target().emit('click', { detail: 0 });
  assert.equal(endpoints.wonResult().points, expected, 'Inclusive reward boundaries and rejection sampling');
}
console.log('PASS: swipe/keyboard, no double score, win/loss, timeout, hidden-tab pause, restore and 200 replay rewards');
