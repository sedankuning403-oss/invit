/* =====================================================================
   KONFIGURASI — UBAH BAGIAN INI SESUAI KEBUTUHAN ANDA
===================================================================== */
const CONFIG = {
  // URL Web App Google Apps Script (lihat DOKUMENTASI.md cara mendapatkannya)
  SHEET_API_URL: "https://script.google.com/macros/s/GANTI_DENGAN_DEPLOYMENT_ID/exec",

  // Tanggal & jam acara (format ISO, sesuai zona waktu WIB / GMT+7)
  EVENT: {
    akad: {
      title: "Akad Nikah Bagus & Anggi",
      start: "2026-10-18T08:00:00+07:00",
      end:   "2026-10-18T10:00:00+07:00",
      location: "Jl. Kenanga No. 12, Yogyakarta"
    },
    resepsi: {
      title: "Resepsi Pernikahan Bagus & Anggi",
      start: "2026-10-18T11:00:00+07:00",
      end:   "2026-10-18T14:00:00+07:00",
      location: "Gedung Serbaguna Purnama, Jl. Melati No. 45, Yogyakarta"
    }
  },

  // Target countdown (biasanya sama dengan jadwal akad)
  COUNTDOWN_TARGET: "2026-10-18T08:00:00+07:00"
};

/* =====================================================================
   UTIL
===================================================================== */
function qs(name){
  return new URLSearchParams(window.location.search).get(name);
}
function toGCalDate(iso){
  const d = new Date(iso);
  return d.toISOString().replace(/[-:]/g,"").split(".")[0] + "Z";
}
function buildGCalLink(ev){
  const dates = `${toGCalDate(ev.start)}/${toGCalDate(ev.end)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates,
    location: ev.location,
    details: "Undangan Pernikahan Bagus & Anggi"
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}
function escapeHTML(str){
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* =====================================================================
   GATE / NAMA TAMU DARI URL (?to=Nama+Tamu)
===================================================================== */
const guestNameEl = document.getElementById("guestName");
const guestFromURL = qs("to");
if (guestFromURL) {
  guestNameEl.textContent = decodeURIComponent(guestFromURL.replace(/\+/g, " "));
}

const gate = document.getElementById("gate");
const mainContent = document.getElementById("mainContent");
const openBtn = document.getElementById("openBtn");
const bgAudio = document.getElementById("bgAudio");
const musicToggle = document.getElementById("musicToggle");

openBtn.addEventListener("click", () => {
  gate.classList.add("gate--closed");
  mainContent.classList.remove("hidden");
  document.body.style.overflow = "auto";
  window.scrollTo(0,0);
  setTimeout(() => { gate.style.display = "none"; }, 950);

  // Coba putar musik otomatis setelah interaksi pengguna
  bgAudio.play().then(() => {
    musicToggle.classList.add("is-playing");
  }).catch(() => { /* browser mungkin tetap memblokir; biarkan pengguna klik tombol musik */ });

  initCountdown();
  initReveal();
  loadGuestbook();
});

// Kunci scroll selagi gate terbuka
document.body.style.overflow = "hidden";

musicToggle.addEventListener("click", () => {
  if (bgAudio.paused) {
    bgAudio.play();
    musicToggle.classList.add("is-playing");
  } else {
    bgAudio.pause();
    musicToggle.classList.remove("is-playing");
  }
});

/* =====================================================================
   COUNTDOWN
===================================================================== */
function initCountdown(){
  const target = new Date(CONFIG.COUNTDOWN_TARGET).getTime();
  const els = {
    d: document.getElementById("cd-days"),
    h: document.getElementById("cd-hours"),
    m: document.getElementById("cd-mins"),
    s: document.getElementById("cd-secs")
  };
  function tick(){
    const diff = target - Date.now();
    if (diff <= 0) {
      els.d.textContent = els.h.textContent = els.m.textContent = els.s.textContent = "00";
      clearInterval(timer);
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    els.d.textContent = String(d).padStart(2,"0");
    els.h.textContent = String(h).padStart(2,"0");
    els.m.textContent = String(m).padStart(2,"0");
    els.s.textContent = String(s).padStart(2,"0");
  }
  tick();
  const timer = setInterval(tick, 1000);
}

/* =====================================================================
   TAUTAN "TAMBAH KE KALENDER"
===================================================================== */
document.getElementById("calAkad").href = buildGCalLink(CONFIG.EVENT.akad);
document.getElementById("calResepsi").href = buildGCalLink(CONFIG.EVENT.resepsi);

/* =====================================================================
   REVEAL ON SCROLL
===================================================================== */
function initReveal(){
  const targets = document.querySelectorAll(".section, .couple-card, .event-card, .gift-card");
  targets.forEach(el => el.classList.add("reveal"));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  targets.forEach(el => io.observe(el));
}

/* =====================================================================
   SALIN NOMOR REKENING
===================================================================== */
document.querySelectorAll("[data-copy]").forEach(btn => {
  btn.addEventListener("click", async () => {
    const text = btn.getAttribute("data-copy");
    try {
      await navigator.clipboard.writeText(text);
      const original = btn.textContent;
      btn.textContent = "Tersalin ✓";
      setTimeout(() => { btn.textContent = original; }, 1800);
    } catch (e) {
      alert("Nomor rekening: " + text);
    }
  });
});

/* =====================================================================
   BUKU TAMU — SINKRON DENGAN GOOGLE SHEETS
   (via Google Apps Script Web App, lihat DOKUMENTASI.md)
===================================================================== */
const guestForm = document.getElementById("guestForm");
const guestListEl = document.getElementById("guestList");
const gfStatus = document.getElementById("gf-status");
const gfSubmit = document.getElementById("gf-submit");

function renderGuestbook(items){
  if (!items || items.length === 0) {
    guestListEl.innerHTML = `<p class="guest-list__empty">Jadilah yang pertama mengirim ucapan &amp; doa restu.</p>`;
    return;
  }
  guestListEl.innerHTML = items.map(item => `
    <div class="guest-item">
      <div class="guest-item__head">
        <span class="guest-item__name">${escapeHTML(item.name)}</span>
        <span class="guest-item__tag">${escapeHTML(item.attendance || "")}</span>
      </div>
      <p class="guest-item__msg">${escapeHTML(item.message)}</p>
      <p class="guest-item__time">${item.timestamp ? new Date(item.timestamp).toLocaleString("id-ID", { dateStyle:"medium", timeStyle:"short" }) : ""}</p>
    </div>
  `).join("");
}

async function loadGuestbook(){
  if (CONFIG.SHEET_API_URL.includes("GANTI_DENGAN_DEPLOYMENT_ID")) {
    guestListEl.innerHTML = `<p class="guest-list__empty">Buku tamu belum terhubung ke Google Sheets. Lihat DOKUMENTASI.md.</p>`;
    return;
  }
  try {
    const res = await fetch(`${CONFIG.SHEET_API_URL}?action=list&t=${Date.now()}`);
    const json = await res.json();
    if (json.status === "success") {
      renderGuestbook(json.data);
    } else {
      throw new Error(json.message || "Gagal memuat data");
    }
  } catch (err) {
    guestListEl.innerHTML = `<p class="guest-list__empty">Belum bisa memuat ucapan saat ini.</p>`;
    console.error("Gagal memuat buku tamu:", err);
  }
}

guestForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("gf-name").value.trim();
  const message = document.getElementById("gf-message").value.trim();
  const attendance = document.querySelector('input[name="attendance"]:checked').value;

  if (!name || !message) return;

  if (CONFIG.SHEET_API_URL.includes("GANTI_DENGAN_DEPLOYMENT_ID")) {
    gfStatus.textContent = "Buku tamu belum terhubung ke Google Sheets. Lihat DOKUMENTASI.md.";
    gfStatus.className = "guest-form__status err";
    return;
  }

  gfSubmit.disabled = true;
  gfStatus.textContent = "Mengirim ucapan...";
  gfStatus.className = "guest-form__status";

  const payload = { name, message, attendance };

  try {
    // Dikirim sebagai text/plain agar tidak memicu CORS preflight
    // yang tidak didukung langsung oleh Google Apps Script Web App.
    await fetch(CONFIG.SHEET_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    gfStatus.textContent = "Terima kasih atas doa & ucapannya!";
    gfStatus.className = "guest-form__status ok";
    guestForm.reset();

    // Tampilkan optimis di daftar sebelum reload dari sheet
    const optimisticItem = { name, message, attendance, timestamp: new Date().toISOString() };
    const current = guestListEl.querySelectorAll(".guest-item").length;
    if (current === 0) guestListEl.innerHTML = "";
    guestListEl.insertAdjacentHTML("afterbegin", `
      <div class="guest-item">
        <div class="guest-item__head">
          <span class="guest-item__name">${escapeHTML(name)}</span>
          <span class="guest-item__tag">${escapeHTML(attendance)}</span>
        </div>
        <p class="guest-item__msg">${escapeHTML(message)}</p>
        <p class="guest-item__time">Baru saja</p>
      </div>
    `);

    // Sinkronkan ulang dari sumber data setelah beberapa saat
    setTimeout(loadGuestbook, 2500);

  } catch (err) {
    gfStatus.textContent = "Gagal mengirim. Silakan coba lagi.";
    gfStatus.className = "guest-form__status err";
    console.error("Gagal mengirim ucapan:", err);
  } finally {
    gfSubmit.disabled = false;
  }
});
