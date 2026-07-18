/* =====================================================
   REVERIE — script.js
   Semua data undangan & konfigurasi ada di CONFIG di bawah ini.
===================================================== */

const CONFIG = {
  // Ganti dengan URL Web App Google Apps Script Anda (lihat DOKUMENTASI.md)
  GOOGLE_SHEET_API_URL: "https://script.google.com/macros/s/GANTI_DENGAN_DEPLOYMENT_ID_ANDA/exec",

  weddingDateISO: "2026-09-12T08:00:00+07:00", // dipakai untuk hitung mundur (acara pertama)

  akad: {
    mapsUrl: "https://maps.google.com/?q=Masjid+Al-Muttaqin+Yogyakarta"
  },
  resepsi: {
    mapsUrl: "https://maps.google.com/?q=Graha+Kirana+Ballroom+Yogyakarta"
  },

  calendar: {
    title: "Pernikahan Ayla & Rangga",
    location: "Masjid Al-Muttaqin, Jl. Kenanga No. 21, Yogyakarta",
    startISO: "2026-09-12T08:00:00+07:00",
    endISO: "2026-09-12T14:00:00+07:00",
    details: "Akad Nikah & Resepsi Pernikahan Ayla & Rangga"
  },

  bankNumber: "1234 5678 9099",

  guestbookPageSize: 5
};

/* =====================================================
   1. NAMA TAMU DARI URL (?to=Nama)
===================================================== */
(function personalizeGuest(){
  const params = new URLSearchParams(window.location.search);
  const guest = params.get("to");
  if (guest) {
    const decoded = decodeURIComponent(guest).replace(/\+/g, " ");
    document.getElementById("guest-name").textContent = decoded;
  }
})();

/* =====================================================
   2. GATE / BUKA UNDANGAN
===================================================== */
const gate = document.getElementById("gate");
const openBtn = document.getElementById("open-btn");
const invitation = document.getElementById("invitation");

openBtn.addEventListener("click", () => {
  gate.classList.add("is-hidden");
  invitation.hidden = false;
  document.body.style.overflow = "auto";
  initGuestbook(); // muat buku tamu setelah undangan dibuka
});
document.body.style.overflow = "hidden"; // kunci scroll saat gate aktif

/* =====================================================
   3. COUNTDOWN
===================================================== */
function updateCountdown(){
  const target = new Date(CONFIG.weddingDateISO).getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);

  const day = Math.floor(diff / 86400000);
  const hour = Math.floor((diff % 86400000) / 3600000);
  const min = Math.floor((diff % 3600000) / 60000);
  const sec = Math.floor((diff % 60000) / 1000);

  document.getElementById("cd-day").textContent = String(day).padStart(2,"0");
  document.getElementById("cd-hour").textContent = String(hour).padStart(2,"0");
  document.getElementById("cd-min").textContent = String(min).padStart(2,"0");
  document.getElementById("cd-sec").textContent = String(sec).padStart(2,"0");
}
updateCountdown();
setInterval(updateCountdown, 1000);

/* =====================================================
   4. MAPS + KALENDER + SALIN REKENING
===================================================== */
document.getElementById("map-akad").href = CONFIG.akad.mapsUrl;
document.getElementById("map-resepsi").href = CONFIG.resepsi.mapsUrl;

document.getElementById("bank-number").textContent = CONFIG.bankNumber;
document.getElementById("copy-bank").addEventListener("click", async (e) => {
  try {
    await navigator.clipboard.writeText(CONFIG.bankNumber.replace(/\s/g, ""));
    const btn = e.currentTarget;
    const original = btn.textContent;
    btn.textContent = "Tersalin!";
    setTimeout(() => (btn.textContent = original), 1800);
  } catch (err) {
    alert("Nomor rekening: " + CONFIG.bankNumber);
  }
});

document.getElementById("add-calendar").addEventListener("click", () => {
  const fmt = (iso) => new Date(iso).toISOString().replace(/[-:]/g,"").split(".")[0] + "Z";
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", CONFIG.calendar.title);
  url.searchParams.set("dates", `${fmt(CONFIG.calendar.startISO)}/${fmt(CONFIG.calendar.endISO)}`);
  url.searchParams.set("details", CONFIG.calendar.details);
  url.searchParams.set("location", CONFIG.calendar.location);
  window.open(url.toString(), "_blank");
});

/* =====================================================
   5. BUKU TAMU — SINKRON DENGAN GOOGLE SHEETS
   Menggunakan JSONP untuk membaca data (menghindari isu CORS)
   dan fetch (text/plain) untuk mengirim data baru.
===================================================== */
let gbAllEntries = [];
let gbShownCount = 0;
let gbLoaded = false;

function initGuestbook(){
  if (gbLoaded) return;
  gbLoaded = true;
  loadGuestbookEntries();
}

// --- Ambil data via JSONP ---
function loadGuestbookEntries(){
  const listEl = document.getElementById("guestbook-list");
  const loadingEl = document.getElementById("gb-loading");

  const callbackName = "gbCallback_" + Date.now();
  window[callbackName] = function(response){
    delete window[callbackName];
    script.remove();

    if (loadingEl) loadingEl.remove();

    if (!response || response.status !== "success") {
      listEl.innerHTML = '<p class="guestbook__empty">Belum bisa memuat ucapan. Coba muat ulang halaman.</p>';
      return;
    }

    gbAllEntries = response.data || [];
    gbShownCount = 0;

    if (gbAllEntries.length === 0) {
      listEl.innerHTML = '<p class="guestbook__empty">Jadilah yang pertama mengirim ucapan &amp; doa. ✦</p>';
      return;
    }

    renderGuestbookPage();
  };

  const script = document.createElement("script");
  const url = new URL(CONFIG.GOOGLE_SHEET_API_URL);
  url.searchParams.set("callback", callbackName);
  script.src = url.toString();
  script.onerror = () => {
    if (loadingEl) loadingEl.remove();
    listEl.innerHTML = '<p class="guestbook__empty">Buku tamu belum terhubung. Lihat DOKUMENTASI.md untuk menghubungkan Google Sheets.</p>';
  };
  document.body.appendChild(script);
}

function renderGuestbookPage(){
  const listEl = document.getElementById("guestbook-list");
  const loadMoreBtn = document.getElementById("gb-load-more");

  const next = gbAllEntries.slice(gbShownCount, gbShownCount + CONFIG.guestbookPageSize);
  next.forEach(entry => listEl.appendChild(renderGuestbookEntry(entry)));
  gbShownCount += next.length;

  if (gbShownCount < gbAllEntries.length) {
    loadMoreBtn.hidden = false;
  } else {
    loadMoreBtn.hidden = true;
  }
}

function renderGuestbookEntry(entry){
  const wrap = document.createElement("div");
  wrap.className = "gb-entry";

  const attendance = (entry.Kehadiran || entry.kehadiran || "").toString();
  let tagClass = "gb-entry__tag--ragu";
  if (/^hadir$/i.test(attendance)) tagClass = "gb-entry__tag--hadir";
  else if (/tidak/i.test(attendance)) tagClass = "gb-entry__tag--tidak";

  const name = escapeHTML(entry.Nama || entry.nama || "Anonim");
  const message = escapeHTML(entry.Ucapan || entry.ucapan || "");

  wrap.innerHTML = `
    <div class="gb-entry__top">
      <span class="gb-entry__name">${name}</span>
      <span class="gb-entry__tag ${tagClass}">${escapeHTML(attendance || "-")}</span>
    </div>
    <p class="gb-entry__text">${message}</p>
  `;
  return wrap;
}

function escapeHTML(str){
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}

document.getElementById("gb-load-more").addEventListener("click", renderGuestbookPage);

// --- Kirim data baru via fetch (text/plain menghindari CORS preflight) ---
const gbForm = document.getElementById("guestbook-form");
const gbStatus = document.getElementById("gb-status");
const gbSubmit = document.getElementById("gb-submit");

gbForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nama = document.getElementById("gb-name").value.trim();
  const kehadiran = document.getElementById("gb-attend").value;
  const ucapan = document.getElementById("gb-message").value.trim();

  if (!nama || !kehadiran || !ucapan) return;

  gbSubmit.disabled = true;
  gbStatus.textContent = "Mengirim...";
  gbStatus.classList.remove("is-error");

  try {
    await fetch(CONFIG.GOOGLE_SHEET_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // hindari CORS preflight
      body: JSON.stringify({ nama, kehadiran, ucapan })
    });

    gbStatus.textContent = "Terima kasih! Ucapan Anda telah terkirim.";
    gbForm.reset();

    // Tampilkan langsung di daftar tanpa menunggu refresh sheet
    const listEl = document.getElementById("guestbook-list");
    const emptyMsg = listEl.querySelector(".guestbook__empty");
    if (emptyMsg) emptyMsg.remove();
    listEl.prepend(renderGuestbookEntry({ Nama: nama, Kehadiran: kehadiran, Ucapan: ucapan }));

  } catch (err) {
    gbStatus.textContent = "Gagal mengirim. Periksa koneksi internet Anda dan coba lagi.";
    gbStatus.classList.add("is-error");
  } finally {
    gbSubmit.disabled = false;
  }
});

/* =====================================================
   6. AMBIENT CANVAS — kelopak & bintang melayang
===================================================== */
(function ambientParticles(){
  const canvas = document.getElementById("reverie-canvas");
  if (!canvas) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ctx = canvas.getContext("2d");
  let w, h, particles;

  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  const COUNT = window.innerWidth < 600 ? 16 : 28;
  particles = Array.from({ length: COUNT }, () => spawnParticle());

  function spawnParticle(){
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1 + Math.random() * 2.4,
      speed: .15 + Math.random() * .35,
      drift: (Math.random() - .5) * .3,
      opacity: .15 + Math.random() * .35
    };
  }

  function tick(){
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#B79355";
    particles.forEach(p => {
      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      p.y += p.speed;
      p.x += p.drift;
      if (p.y > h + 10) {
        p.y = -10;
        p.x = Math.random() * w;
      }
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }
  tick();
})();
