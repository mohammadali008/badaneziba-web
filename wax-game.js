(() => {
  'use strict';
  const root = document.getElementById('wax-game');
  if (!root) return;
  const $ = selector => root.querySelector(selector);
  const board = $('.wax-board');
  const grid = $('.wax-patches');
  const start = $('.wax-start');
  const pause = $('.wax-pause');
  const cover = $('.wax-cover');
  const status = $('.wax-status');
  const timer = $('.wax-seconds');
  const count = $('.wax-count');
  const meter = $('.wax-meter-fill');
  const result = $('.wax-result');
  const digits = new Intl.NumberFormat('fa-IR');
  const total = 12;
  const duration = 20000;
  const storageKey = 'badaneziba-wax-result-v1';
  let state = 'idle';
  let order = [];
  let cleared = 0;
  let remaining = duration;
  let deadline = 0;
  let frame = 0;
  let gesture = null;
  let lastSecond = 20;
  const buttons = [];

  function shuffle(items) {
    const list = [...items];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  function rewardPoints() {
    const random = new Uint32Array(1);
    const limit = Math.floor(4294967296 / 401) * 401;
    do { crypto.getRandomValues(random); } while (random[0] >= limit);
    return 100 + random[0] % 401;
  }

  function showReward(saved, restored = false) {
    $('.wax-reward-number').textContent = digits.format(saved.points);
    $('.wax-reward-equivalent').textContent = `معادل ${digits.format(saved.points)} تومان تخفیف خدمات`;
    $('.wax-reward-date').dateTime = saved.date;
    $('.wax-reward-date').textContent = new Intl.DateTimeFormat('fa-IR', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tehran',
    }).format(new Date(saved.date));
    $('.wax-reward-title').textContent = restored ? 'آخرین بردت اینجاست!' : 'تمیز و حرفه‌ای! بردی.';
    result.hidden = false;
  }

  function markTarget(focus = false) {
    buttons.forEach((button, index) => {
      const active = state === 'playing' && index === order[cleared];
      button.classList.toggle('is-target', active);
      button.setAttribute('aria-label', `${digits.format(index + 1)}${active ? '؛ نوار روشن، برای وکس بکشید یا Enter بزنید' : '؛ منتظر روشن‌شدن نوار بمانید'}`);
      button.disabled = !active;
    });
    if (focus && state === 'playing') buttons[order[cleared]]?.focus({ preventScroll: true });
  }

  function finish(won) {
    if (state !== 'playing') return;
    state = won ? 'won' : 'lost';
    cancelAnimationFrame(frame);
    gesture = null;
    board.classList.remove('is-playing', 'is-urgent');
    pause.hidden = true;
    start.disabled = false;
    start.textContent = won ? 'دوباره بازی کن ↗' : 'یک فرصت دیگر ↗';
    markTarget();
    cover.hidden = false;
    if (won) {
      const saved = { points: rewardPoints(), date: new Date().toISOString() };
      try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch { /* The reward also works without storage. */ }
      showReward(saved);
      $('.wax-cover-title').textContent = '۱۲ حرکتِ تمیز!';
      $('.wax-cover-copy').textContent = 'امتیازت پایین بازی آماده است. از نتیجه اسکرین‌شات بگیر.';
      status.textContent = `برنده شدی! ${digits.format(saved.points)} امتیاز، برابر با ${digits.format(saved.points)} تومان تخفیف.`;
      result.focus({ preventScroll: true });
      result.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
    } else {
      $('.wax-cover-title').textContent = 'نزدیک بود!';
      $('.wax-cover-copy').textContent = `${digits.format(cleared)} نوار از ${digits.format(total)} پاک شد. این بار سریع‌تر امتحان کن.`;
      status.textContent = 'زمان تمام شد. بازی محدودیتی ندارد؛ دوباره امتحان کن.';
      start.focus({ preventScroll: true });
    }
  }

  function tick() {
    if (state !== 'playing') return;
    remaining = Math.max(0, deadline - performance.now());
    const seconds = Math.ceil(remaining / 1000);
    if (lastSecond !== seconds) {
      timer.textContent = digits.format(seconds).padStart(2, '۰');
      lastSecond = seconds;
    }
    board.classList.toggle('is-urgent', seconds <= 5);
    if (remaining <= 0) { finish(false); return; }
    frame = requestAnimationFrame(tick);
  }

  function clearPatch(index, focusNext) {
    if (state !== 'playing' || index !== order[cleared]) return;
    if (performance.now() >= deadline) { finish(false); return; }
    buttons[index].classList.add('is-cleared');
    cleared++;
    count.textContent = `${digits.format(cleared)} / ${digits.format(total)}`;
    meter.style.width = `${cleared / total * 100}%`;
    $('.wax-meter').setAttribute('aria-valuenow', String(cleared));
    if (cleared === total) { finish(true); return; }
    markTarget(focusNext);
  }

  for (let i = 0; i < total; i++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'wax-patch';
    button.disabled = true;
    button.innerHTML = '<span class="wax-hair" aria-hidden="true">⌁ ⌁ ⌁<br>⌁ ⌁ ⌁</span><span class="wax-strip" aria-hidden="true">↗</span>';
    button.addEventListener('pointerdown', event => {
      if (state !== 'playing' || i !== order[cleared] || (event.pointerType === 'mouse' && event.button !== 0)) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, index: i };
      button.setPointerCapture(event.pointerId);
      button.classList.add('is-pulling');
    });
    button.addEventListener('pointermove', event => {
      if (!gesture || gesture.id !== event.pointerId || gesture.index !== i) return;
      if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) >= 22) {
        clearPatch(i, false);
        gesture = null;
        button.classList.remove('is-pulling');
      }
    });
    const release = () => { gesture = null; button.classList.remove('is-pulling'); };
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('click', event => clearPatch(i, event.detail === 0));
    grid.append(button);
    buttons.push(button);
  }

  start.addEventListener('click', event => {
    cancelAnimationFrame(frame);
    if (!result.hidden) $('.wax-reward-title').textContent = 'نتیجه آخرین بردت';
    order = shuffle(Array.from({ length: total }, (_, i) => i));
    cleared = 0;
    remaining = duration;
    lastSecond = 20;
    timer.textContent = '۲۰';
    count.textContent = '۰ / ۱۲';
    meter.style.width = '0%';
    $('.wax-meter').setAttribute('aria-valuenow', '0');
    buttons.forEach(button => button.classList.remove('is-cleared', 'is-pulling'));
    state = 'playing';
    deadline = performance.now() + duration;
    cover.hidden = true;
    start.disabled = true;
    pause.hidden = false;
    pause.textContent = 'مکث';
    board.classList.add('is-playing');
    status.textContent = 'بازی شروع شد. فقط نوار روشن را بکش یا لمس کن؛ ۱۲ نوار در ۲۰ ثانیه.';
    markTarget(event.detail === 0);
    tick();
  });

  function pauseGame() {
    if (state !== 'playing') return;
    remaining = Math.max(0, deadline - performance.now());
    if (remaining <= 0) { finish(false); return; }
    state = 'paused';
    cancelAnimationFrame(frame);
    gesture = null;
    pause.textContent = 'ادامه بازی';
    markTarget();
    cover.hidden = false;
    $('.wax-cover-title').textContent = 'یک نفس کوتاه';
    $('.wax-cover-copy').textContent = 'هر وقت آماده بودی، «ادامه بازی» را بزن.';
    status.textContent = 'بازی و زمان متوقف شدند.';
  }
  pause.addEventListener('click', event => {
    if (state === 'playing') { pauseGame(); return; }
    if (state !== 'paused') return;
    state = 'playing';
    deadline = performance.now() + remaining;
    cover.hidden = true;
    pause.textContent = 'مکث';
    status.textContent = 'بازی ادامه دارد.';
    markTarget(event.detail === 0);
    tick();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && Number.isInteger(saved.points) && saved.points >= 100 && saved.points <= 500 && Number.isFinite(Date.parse(saved.date))) showReward(saved, true);
  } catch { /* Storage is optional, and invalid data never blocks the game. */ }
  markTarget();
  $('.wax-controls').hidden = false;
  $('.wax-unavailable').hidden = true;
})();
