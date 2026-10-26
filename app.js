(() => {
  'use strict';

  const config = window.SALON_CONFIG || {};
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const galleryEntries = [
    { src: 'assets/media/sample.webp', alt: 'مقایسه ناحیه وکس‌شده و اصلاح‌نشده در نمونه کار واقعی سالن', caption: 'نمونه واقعی وکس بدن؛ مقایسه دو ناحیه در یک تصویر', category: 'work' },
    { src: 'assets/media/room.webp', alt: 'اتاق خدمات بدن زیبا با تخت اپیلاسیون', caption: 'اتاق خدمات و تجهیزات سالن بدن زیبا', category: 'studio' },
    { src: 'assets/media/room2.webp', alt: 'نمای داخلی سالن بدن زیبا با نور طبیعی', caption: 'نمای دیگری از فضای واقعی سالن', category: 'studio' },
  ];

  // Navigation stays usable without JavaScript; this adds the mobile disclosure.
  const menuToggle = $('.menu-toggle');
  const mobileNav = $('#mobile-nav');
  function closeMenu() {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'باز کردن منو');
    mobileNav.hidden = true;
  }
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(expanded));
    menuToggle.setAttribute('aria-label', expanded ? 'بستن منو' : 'باز کردن منو');
    mobileNav.hidden = !expanded;
  });
  $$('#mobile-nav a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !mobileNav.hidden) {
      closeMenu();
      menuToggle.focus();
    }
  });
  window.matchMedia('(min-width: 681px)').addEventListener('change', closeMenu);

  // Ambient video is muted and only runs while visible. Respect data/motion preferences.
  const heroVideo = $('#hero-video');
  let motionPaused = reducedMotion.matches || Boolean(navigator.connection?.saveData);
  let heroVisible = true;
  function syncMotion() {
    const paused = motionPaused || !heroVisible || document.hidden || Boolean($('dialog[open]'));
    document.body.classList.toggle('motion-paused', paused);
    if (paused) { heroVideo.pause(); return; }
    if (!heroVideo.getAttribute('src')) heroVideo.src = config.backgroundVideo || heroVideo.dataset.src;
    heroVideo.play().catch(() => { /* A static poster remains visible when autoplay is unavailable. */ });
  }
  reducedMotion.addEventListener('change', event => { motionPaused = event.matches; syncMotion(); });
  document.addEventListener('visibilitychange', syncMotion);

  function openDialog(dialog) {
    closeMenu();
    dialog.showModal();
    document.body.classList.add('dialog-open');
    syncMotion();
  }
  $$('dialog').forEach(dialog => {
    $$('[data-close-dialog]', dialog).forEach(button => button.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
      $('video', dialog)?.pause();
      syncMotion();
    });
  });
  $$('[data-open-film]').forEach(button => button.addEventListener('click', () => {
    const dialog = $('#' + (button.dataset.openFilm || 'film-dialog'));
    openDialog(dialog);
    $('video', dialog).play().catch(() => {});
  }));

  let activeFilter = 'all';
  let currentImage = 0;
  const galleryDialog = $('#gallery-dialog');
  function visibleGalleryIndices() {
    return galleryEntries.map((entry, index) => ({ ...entry, index }))
      .filter(entry => activeFilter === 'all' || entry.category === activeFilter).map(entry => entry.index);
  }
  function updateLightbox(index) {
    currentImage = index;
    const entry = galleryEntries[index];
    $('#lightbox-image').src = entry.src;
    $('#lightbox-image').alt = entry.alt;
    $('#lightbox-caption').textContent = entry.caption;
    const indices = visibleGalleryIndices();
    $('#lightbox-count').textContent = `${indices.indexOf(index) + 1} / ${indices.length}`;
    $$('.lightbox-prev, .lightbox-next').forEach(button => { button.hidden = indices.length < 2; });
  }
  function moveLightbox(direction) {
    const indices = visibleGalleryIndices();
    const next = (indices.indexOf(currentImage) + direction + indices.length) % indices.length;
    updateLightbox(indices[next]);
  }
  $$('[data-gallery-index]').forEach(button => button.addEventListener('click', () => {
    updateLightbox(Number(button.dataset.galleryIndex));
    openDialog(galleryDialog);
  }));
  $('.lightbox-next').addEventListener('click', () => moveLightbox(1));
  $('.lightbox-prev').addEventListener('click', () => moveLightbox(-1));
  galleryDialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      moveLightbox(event.key === 'ArrowLeft' ? 1 : -1);
    }
  });
  $$('[data-filter]').forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    $$('[data-filter]').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    $$('[data-category]').forEach(card => { card.hidden = activeFilter !== 'all' && card.dataset.category !== activeFilter; });
    $('.gallery-grid').classList.toggle('filtered-work', activeFilter === 'work');
    $('.gallery-grid').classList.toggle('filtered-studio', activeFilter === 'studio');
  }));

  // Native links work without JavaScript; configuration keeps both methods in sync.
  if (/^09\d{9}$/.test(config.phone || '')) {
    const international = '+98' + config.phone.slice(1);
    $$('[data-phone-link]').forEach(link => { link.href = `tel:${international}`; });
    $$('[data-phone-text]').forEach(text => { text.textContent = `${config.phone.slice(0,4)} ${config.phone.slice(4,7)} ${config.phone.slice(7)}`; });
  }
  if (/^989\d{9}$/.test(config.whatsappNumber || '')) {
    const message = 'سلام، برای مشاوره و هماهنگی نوبت در سالن بدن زیبا پیام می‌دهم.';
    $$('[data-whatsapp-link]').forEach(link => {
      link.href = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(message)}`;
    });
  }

  $('#copyright-year').textContent = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', timeZone: 'Asia/Tehran' }).format(new Date());

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
    }), { threshold: 0.08 });
    $$('.reveal').forEach(element => revealObserver.observe(element));
    document.documentElement.classList.add('js-ready');
    new IntersectionObserver(entries => { heroVisible = entries[0].isIntersecting; syncMotion(); }, { threshold: 0 }).observe($('.hero'));
    const activeObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      $$('.desktop-nav a, #mobile-nav a').forEach(link => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }), { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
    activeObserver.observe($('.hero'));
    $$('#services, #master, #gallery, #wax-game, #faq, #contact').forEach(section => activeObserver.observe(section));
    const hiddenMobileTargets = new Set();
    const mobileBookObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? hiddenMobileTargets.add(entry.target) : hiddenMobileTargets.delete(entry.target));
      $('.mobile-book').classList.toggle('is-hidden', hiddenMobileTargets.size > 0);
    }, { threshold: 0 });
    mobileBookObserver.observe($('#contact'));
    mobileBookObserver.observe($('.site-footer'));
  }
  syncMotion();
})();
