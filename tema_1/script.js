/* ============================================================
   ROYAL JAVANESE — Wedding Invitation
   All content, dates, links, and integrations live in CONFIG.
   Edit this object only — no need to touch the rest of the file
   unless you want to change behaviour.
   ============================================================ */

const CONFIG = {

  // ---- Google Sheets guestbook sync -------------------------------
  // Paste the Web App URL you get after deploying apps-script.gs
  // (see DOKUMENTASI.md, step 3). Leave empty to disable sync —
  // the form will show an error instead of submitting.
  GSHEET_URL: "",

  // ---- couple & event -----------------------------------------------
  weddingDateISO: "2026-12-12T08:00:00+07:00", // akad date/time, used by countdown

  calendar: {
    title: "Pernikahan Raras & Bagus",
    location: "Pendopo Agung Royal Ambarrukmo, Yogyakarta",
    description: "Resepsi pernikahan Raras & Bagus",
    startISO: "2026-12-12T11:00:00+07:00",
    endISO:   "2026-12-12T14:00:00+07:00",
  },

  // ---- gallery images (replace with real URLs; keep the array length flexible) ----
  gallery: [
    "linear-gradient(160deg,#5B1526,#C9A24B)",
    "linear-gradient(160deg,#3D0C1B,#E8CD8A)",
    "linear-gradient(160deg,#C9A24B,#3D0C1B)",
    "linear-gradient(160deg,#E8CD8A,#5B1526)",
    "linear-gradient(160deg,#5B1526,#3D0C1B)",
    "linear-gradient(160deg,#C9A24B,#E8CD8A)",
  ],

  // ---- background music (optional, leave empty to hide control effectively muted) ----
  audioSrc: "",
};

// ============================================================
// Guest name from URL (?to=Nama%20Tamu)
// ============================================================
(function initGuestName(){
  const params = new URLSearchParams(window.location.search);
  const to = params.get("to");
  if (to) {
    document.getElementById("guest-name").textContent = decodeURIComponent(to.replace(/\+/g, " "));
  }
})();

// ============================================================
// Cover open -> reveal main content
// ============================================================
const coverEl = document.getElementById("cover");
const mainEl = document.getElementById("main-content");
const openBtn = document.getElementById("open-invitation");
const audio = document.getElementById("bg-audio");
const audioToggle = document.getElementById("audio-toggle");

if (CONFIG.audioSrc) {
  audio.querySelector("source").src = CONFIG.audioSrc;
  audio.load();
}

openBtn.addEventListener("click", () => {
  mainEl.hidden = false;
  document.body.style.overflow = "auto";
  requestAnimationFrame(() => {
    coverEl.style.transition = "opacity .8s ease, transform .8s ease";
    coverEl.style.opacity = "0";
    coverEl.style.transform = "translateY(-24px)";
  });
  setTimeout(() => {
    coverEl.style.display = "none";
    mainEl.scrollIntoView({ behavior: "instant" });
  }, 800);

  if (CONFIG.audioSrc) {
    audio.play().catch(() => {});
  }
  initScrollReveal();
});

audioToggle.addEventListener("click", () => {
  if (!CONFIG.audioSrc) return;
  if (audio.paused) { audio.play().catch(()=>{}); audioToggle.classList.add("playing"); }
  else { audio.pause(); audioToggle.classList.remove("playing"); }
});

document.body.style.overflow = "hidden"; // locked until invitation opens

// ============================================================
// Countdown
// ============================================================
(function initCountdown(){
  const target = new Date(CONFIG.weddingDateISO).getTime();
  const els = {
    days: document.getElementById("cd-days"),
    hours: document.getElementById("cd-hours"),
    minutes: document.getElementById("cd-minutes"),
    seconds: document.getElementById("cd-seconds"),
  };
  function tick(){
    const diff = target - Date.now();
    if (diff <= 0) {
      Object.values(els).forEach(el => el.textContent = "00");
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    els.days.textContent = String(d).padStart(2,"0");
    els.hours.textContent = String(h).padStart(2,"0");
    els.minutes.textContent = String(m).padStart(2,"0");
    els.seconds.textContent = String(s).padStart(2,"0");
  }
  tick();
  setInterval(tick, 1000);
})();

// ============================================================
// Add to calendar (Google Calendar link)
// ============================================================
document.getElementById("btn-calendar").addEventListener("click", () => {
  const fmt = iso => new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, "");
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", CONFIG.calendar.title);
  url.searchParams.set("dates", `${fmt(CONFIG.calendar.startISO)}/${fmt(CONFIG.calendar.endISO)}`);
  url.searchParams.set("details", CONFIG.calendar.description);
  url.searchParams.set("location", CONFIG.calendar.location);
  window.open(url.toString(), "_blank");
});

// ============================================================
// Cover date label (from CONFIG)
// ============================================================
(function initCoverDate(){
  const d = new Date(CONFIG.weddingDateISO);
  const dd = String(d.getDate()).padStart(2,"0");
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const yyyy = d.getFullYear();
  document.getElementById("cover-date").textContent = `${dd} . ${mm} . ${yyyy}`;
})();

// ============================================================
// Gallery injection
// ============================================================
(function initGallery(){
  const grid = document.getElementById("gallery-grid");
  CONFIG.gallery.forEach(bg => {
    const div = document.createElement("div");
    div.className = "gallery-item";
    div.style.backgroundImage = bg.startsWith("linear-gradient") ? bg : `url('${bg}')`;
    grid.appendChild(div);
  });
})();

// ============================================================
// Copy to clipboard (bank number / address)
// ============================================================
document.querySelectorAll(".btn-copy").forEach(btn => {
  btn.addEventListener("click", async () => {
    const targetId = btn.dataset.copyTarget;
    const text = document.getElementById(targetId).textContent.trim();
    try {
      await navigator.clipboard.writeText(text);
      const original = btn.textContent;
      btn.textContent = "Tersalin!";
      btn.classList.add("copied");
      setTimeout(() => { btn.textContent = original; btn.classList.remove("copied"); }, 1800);
    } catch (err) {
      alert("Gagal menyalin. Silakan salin manual: " + text);
    }
  });
});

// ============================================================
// Scroll reveal for sections
// ============================================================
function initScrollReveal(){
  const items = document.querySelectorAll("[data-reveal]");
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach(item => io.observe(item));
}

// ============================================================
// Guestbook — Google Sheets sync
// ============================================================
const gbForm = document.getElementById("guestbook-form");
const gbStatus = document.getElementById("gb-status");
const gbList = document.getElementById("guestbook-list");
const gbEmpty = document.getElementById("guestbook-empty");
const gbCount = document.getElementById("gb-count");
const gbSubmit = document.getElementById("gb-submit");

function escapeHTML(str){
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function renderGuestbook(entries){
  gbList.innerHTML = "";
  gbCount.textContent = entries.length;
  if (!entries.length) {
    gbList.innerHTML = `<p class="guestbook-empty">Jadilah yang pertama mengirimkan ucapan.</p>`;
    return;
  }
  entries.forEach(entry => {
    const el = document.createElement("div");
    el.className = "guestbook-entry";
    el.innerHTML = `
      <div class="gb-entry-head">
        <span class="gb-entry-name">${escapeHTML(entry.nama)}</span>
        <span class="gb-entry-status">${escapeHTML(entry.kehadiran || "")}</span>
      </div>
      <p class="gb-entry-text">${escapeHTML(entry.ucapan)}</p>
    `;
    gbList.appendChild(el);
  });
}

async function loadGuestbook(){
  if (!CONFIG.GSHEET_URL) {
    gbEmpty.textContent = "Buku tamu belum terhubung. Lihat DOKUMENTASI.md untuk menghubungkan Google Sheets.";
    return;
  }
  try {
    const res = await fetch(`${CONFIG.GSHEET_URL}?action=list`);
    const json = await res.json();
    if (json.status === "success") {
      renderGuestbook(json.data);
    } else {
      gbEmpty.textContent = "Belum ada ucapan.";
    }
  } catch (err) {
    gbEmpty.textContent = "Gagal memuat buku tamu. Periksa koneksi atau URL Google Sheets.";
  }
}
loadGuestbook();

gbForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!CONFIG.GSHEET_URL) {
    gbStatus.textContent = "Buku tamu belum terhubung ke Google Sheets. Lihat DOKUMENTASI.md.";
    gbStatus.className = "form-status err";
    return;
  }

  const nama = document.getElementById("gb-nama").value.trim();
  const kehadiran = document.getElementById("gb-kehadiran").value;
  const ucapan = document.getElementById("gb-ucapan").value.trim();

  if (!nama || !kehadiran || !ucapan) return;

  gbSubmit.disabled = true;
  gbSubmit.querySelector(".btn-label").textContent = "Mengirim...";
  gbStatus.textContent = "";
  gbStatus.className = "form-status";

  try {
    const res = await fetch(CONFIG.GSHEET_URL, {
      method: "POST",
      // text/plain avoids a CORS preflight against Apps Script's web app endpoint
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ nama, kehadiran, ucapan }),
    });
    const json = await res.json();
    if (json.status === "success") {
      gbStatus.textContent = "Terima kasih atas ucapan dan doanya!";
      gbStatus.className = "form-status ok";
      gbForm.reset();
      loadGuestbook();
    } else {
      gbStatus.textContent = json.message || "Gagal mengirim ucapan.";
      gbStatus.className = "form-status err";
    }
  } catch (err) {
    gbStatus.textContent = "Gagal mengirim. Periksa koneksi internet Anda.";
    gbStatus.className = "form-status err";
  } finally {
    gbSubmit.disabled = false;
    gbSubmit.querySelector(".btn-label").textContent = "Kirim Ucapan";
  }
});
