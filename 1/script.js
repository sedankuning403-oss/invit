(() => {
  'use strict';
  const DATA = window.INVITATION_DATA;

  /* ============================================================
     1. GUEST NAME FROM URL (?to=Nama+Tamu)
  ============================================================ */
  const params = new URLSearchParams(window.location.search);
  const guestName = params.get('to') ? decodeURIComponent(params.get('to').replace(/\+/g, ' ')) : 'Tamu Undangan';
  document.getElementById('guest-name').textContent = guestName;

  /* ============================================================
     2. FILL STATIC CONTENT FROM DATA OBJECT
  ============================================================ */
  document.getElementById('cover-initials').textContent = DATA.couple.initials;
  document.getElementById('quote-arabic').textContent = DATA.quote.arabic;
  document.getElementById('quote-translation').textContent = DATA.quote.translation;
  document.getElementById('quote-source').textContent = `— ${DATA.quote.source}`;

  document.getElementById('groom-name').textContent = DATA.couple.groomNick;
  document.getElementById('groom-desc').textContent = DATA.couple.groomChild;
  document.getElementById('groom-ig-text').textContent = '@' + DATA.couple.groomIG;
  document.getElementById('groom-ig').href = `https://instagram.com/${DATA.couple.groomIG}`;

  document.getElementById('bride-name').textContent = DATA.couple.brideNick;
  document.getElementById('bride-desc').textContent = DATA.couple.brideChild;
  document.getElementById('bride-ig-text').textContent = '@' + DATA.couple.brideIG;
  document.getElementById('bride-ig').href = `https://instagram.com/${DATA.couple.brideIG}`;

  // Events
  const eventsList = document.getElementById('events-list');
  DATA.events.forEach(ev => {
    const el = document.createElement('div');
    el.className = 'event-card';
    el.innerHTML = `
      <h3 class="event-label">${ev.label}</h3>
      <p class="event-date">${ev.date}</p>
      <p class="event-time">${ev.time}</p>
      <p class="event-place">${ev.place}</p>
      <p class="event-address">${ev.address}</p>
      <a class="event-maps" href="${ev.mapsUrl}" target="_blank" rel="noopener">Lihat Peta</a>
    `;
    eventsList.appendChild(el);
  });

  // Gallery
  const galleryGrid = document.getElementById('gallery-grid');
  DATA.gallery.forEach(src => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Galeri Foto';
    img.loading = 'lazy';
    img.addEventListener('click', () => openLightbox(src));
    galleryGrid.appendChild(img);
  });

  // Gift banks
  const banksEl = document.getElementById('gift-banks');
  if (DATA.gift.banks.length) {
    banksEl.innerHTML = `<p class="gift-group-label">Transfer Bank</p>` + DATA.gift.banks.map(b => `
      <div class="gift-row">
        <div class="gift-row-info"><b>${b.bank}</b><span>${b.noRek} a.n ${b.an}</span></div>
        <button class="copy-btn" data-copy="${b.noRek}">Salin</button>
      </div>`).join('');
  }
  const ewalletsEl = document.getElementById('gift-ewallets');
  if (DATA.gift.ewallets.length) {
    ewalletsEl.innerHTML = `<p class="gift-group-label">E-Wallet</p>` + DATA.gift.ewallets.map(e => `
      <div class="gift-row">
        <div class="gift-row-info"><b>${e.name}</b><span>${e.number}</span></div>
        <button class="copy-btn" data-copy="${e.number}">Salin</button>
      </div>`).join('');
  }
  document.getElementById('gift-address').textContent = DATA.gift.address;

  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        btn.textContent = 'Tersalin!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Salin'; btn.classList.remove('copied'); }, 1800);
      } catch (e) { /* clipboard unavailable, ignore silently */ }
    });
  });

  document.getElementById('gift-toggle').addEventListener('click', (e) => {
    const panel = document.getElementById('gift-panel');
    panel.hidden = !panel.hidden;
    e.target.textContent = panel.hidden ? 'Kirim Hadiah' : 'Sembunyikan';
  });

  /* ============================================================
     3. LOADER
  ============================================================ */
  window.addEventListener('load', () => {
    setTimeout(() => document.getElementById('loader').classList.add('hide'), 500);
  });

  /* ============================================================
     4. OPEN INVITATION (cover -> main content)
  ============================================================ */
  document.getElementById('open-invitation').addEventListener('click', () => {
    const cover = document.getElementById('cover');
    const main = document.getElementById('main-content');
    main.hidden = false;
    document.body.style.overflow = 'auto';
    main.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => { cover.style.display = 'none'; }, 900);
    initRevealObserver();
    startCountdown();
    tryPlayMusic();
  });
  document.body.style.overflow = 'hidden'; // locked until opened

  /* ============================================================
     5. SCROLL REVEAL
  ============================================================ */
  function initRevealObserver() {
    const els = document.querySelectorAll('[data-reveal]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    els.forEach(el => io.observe(el));
  }

  /* ============================================================
     6. COUNTDOWN
  ============================================================ */
  function startCountdown() {
    const target = new Date(DATA.weddingDate).getTime();
    const dateObj = new Date(DATA.weddingDate);
    const fmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('countdown-date-full').textContent = fmt.format(dateObj);

    const dEl = document.getElementById('cd-days');
    const hEl = document.getElementById('cd-hours');
    const mEl = document.getElementById('cd-mins');
    const sEl = document.getElementById('cd-secs');

    function tick() {
      const now = Date.now();
      let diff = Math.max(0, target - now);
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      dEl.textContent = String(days).padStart(2, '0');
      hEl.textContent = String(hours).padStart(2, '0');
      mEl.textContent = String(mins).padStart(2, '0');
      sEl.textContent = String(secs).padStart(2, '0');
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ============================================================
     7. LIGHTBOX
  ============================================================ */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  function openLightbox(src) {
    lightboxImg.src = src;
    lightbox.hidden = false;
  }
  document.getElementById('lightbox-close').addEventListener('click', () => lightbox.hidden = true);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.hidden = true; });

  /* ============================================================
     8. MUSIC TOGGLE
  ============================================================ */
  const audio = document.getElementById('bg-audio');
  const musicBtn = document.getElementById('music-toggle');
  function tryPlayMusic() {
    audio.volume = 0.5;
    audio.play().then(() => musicBtn.dataset.playing = 'true').catch(() => { /* needs user gesture, fine */ });
  }
  musicBtn.addEventListener('click', () => {
    if (audio.paused) { audio.play(); musicBtn.dataset.playing = 'true'; }
    else { audio.pause(); musicBtn.dataset.playing = 'false'; }
  });

  /* ============================================================
     9. AMBIENT PARTICLE CANVAS (signature "lumière" light motes)
  ============================================================ */
  (function ambientParticles() {
    const canvas = document.getElementById('lumiere-canvas');
    const ctx = canvas.getContext('2d');
    let w, h, particles;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    function makeParticles() {
      const count = Math.min(36, Math.floor(w / 32));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h + h,
        r: Math.random() * 1.6 + 0.4,
        speed: Math.random() * 0.35 + 0.08,
        drift: (Math.random() - 0.5) * 0.25,
        alpha: Math.random() * 0.5 + 0.15
      }));
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.y -= p.speed;
        p.x += p.drift;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,161,92,${p.alpha})`;
        ctx.fill();
      });
      requestAnimationFrame(frame);
    }
    resize();
    makeParticles();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      requestAnimationFrame(frame);
    }
    window.addEventListener('resize', () => { resize(); makeParticles(); });
  })();

  /* ============================================================
     10. RSVP + GUESTBOOK — SYNCED WITH GOOGLE SHEETS
     Backend: Google Apps Script Web App (see google-apps-script.gs
     & DOCUMENTATION.md for setup). Endpoint set in INVITATION_DATA.gasEndpoint
  ============================================================ */
  const GAS_URL = DATA.gasEndpoint;
  const form = document.getElementById('rsvp-form');
  const submitBtn = document.getElementById('rsvp-submit');
  const list = document.getElementById('guestbook-list');
  const emptyEl = document.getElementById('guestbook-empty');
  const countEl = document.getElementById('guestbook-count');
  const moreBtn = document.getElementById('guestbook-more');
  const refreshBtn = document.getElementById('guestbook-refresh');

  let page = 0;
  const PAGE_SIZE = 10;
  let allEntries = [];

  function renderEntries(reset) {
    if (reset) list.innerHTML = '';
    const slice = allEntries.slice(0, (page + 1) * PAGE_SIZE);
    list.innerHTML = '';
    if (!slice.length) {
      list.innerHTML = '<li class="guestbook-empty">Jadilah yang pertama mengirim ucapan.</li>';
    } else {
      slice.forEach(entry => {
        const li = document.createElement('li');
        li.className = 'guestbook-item';
        const statusClass = entry.kehadiran === 'Tidak Hadir' ? 'tidak' : '';
        li.innerHTML = `
          <div class="guestbook-item-head">
            <span class="guestbook-name">${escapeHtml(entry.nama)}</span>
            <span class="guestbook-status ${statusClass}">${escapeHtml(entry.kehadiran || '-')}</span>
          </div>
          <p class="guestbook-msg">${escapeHtml(entry.ucapan)}</p>
        `;
        list.appendChild(li);
      });
    }
    countEl.textContent = `${allEntries.length} ucapan`;
    moreBtn.hidden = slice.length >= allEntries.length;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  async function loadGuestbook() {
    emptyEl && (emptyEl.textContent = 'Memuat ucapan…');
    try {
      const res = await fetch(`${GAS_URL}?action=list`, { method: 'GET' });
      const json = await res.json();
      allEntries = (json.data || []).slice().reverse(); // newest first
      page = 0;
      renderEntries(true);
    } catch (err) {
      list.innerHTML = '<li class="guestbook-empty">Gagal memuat ucapan. Periksa koneksi atau konfigurasi endpoint.</li>';
    }
  }

  moreBtn.addEventListener('click', () => { page++; renderEntries(false); });
  refreshBtn.addEventListener('click', loadGuestbook);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nama = document.getElementById('rsvp-name').value.trim();
    const kehadiran = document.getElementById('rsvp-attend').value;
    const ucapan = document.getElementById('rsvp-message').value.trim();
    if (!nama || !kehadiran || !ucapan) return;

    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = 'Mengirim…';

    try {
      await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // avoids CORS preflight to Apps Script
        body: JSON.stringify({ action: 'add', nama, kehadiran, ucapan })
      });
      form.reset();
      submitBtn.querySelector('span').textContent = 'Terkirim ✓';
      // Optimistically prepend, then re-sync from sheet shortly after
      allEntries.unshift({ nama, kehadiran, ucapan });
      page = 0;
      renderEntries(true);
      setTimeout(loadGuestbook, 2500);
    } catch (err) {
      submitBtn.querySelector('span').textContent = 'Gagal, coba lagi';
    } finally {
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = 'Kirim Ucapan';
      }, 2200);
    }
  });

  // initial guestbook load (works even before "buka undangan")
  loadGuestbook();

})();
