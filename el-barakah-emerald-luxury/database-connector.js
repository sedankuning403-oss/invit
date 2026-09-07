(function () {
  "use strict";

  var cfg = window.UNDANGAN_296_CONFIG || {};
  var page = window.UNDANGAN_296_PAGE || {};
  var placeholder = !cfg.API_URL || /MASUKKAN_|GANTI_|YOUR_/i.test(cfg.API_URL);

  function log() {
    if (cfg.DEBUG && window.console) console.log.apply(console, ["[296 Undangan]"].concat([].slice.call(arguments)));
  }

  function findField(form, aliases, tag) {
    var fields = [].slice.call(form.querySelectorAll(tag || "input,select,textarea"));
    for (var i = 0; i < fields.length; i++) {
      var key = ((fields[i].name || "") + " " + (fields[i].id || "")).toLowerCase();
      if (aliases.some(function (a) { return key.indexOf(a) !== -1; })) return fields[i];
    }
    return null;
  }

  function valueOf(field, form) {
    if (!field) return "";
    if (field.type === "radio") {
      var checked = form.querySelector('input[name="' + field.name + '"]:checked');
      return checked ? checked.value : "";
    }
    return String(field.value || "").trim();
  }

  function extract(form) {
    var name = findField(form, ["nama", "name"]);
    var attendance = findField(form, ["kehadiran", "attendance", "attend", "status", "presence", "hadir"]);
    var count = findField(form, ["jumlah", "count", "qty", "guests"]);
    var message = findField(form, ["pesan", "message", "ucapan", "wish", "comment", "doa"], "textarea,input");
    if (!name || !attendance) return null;

    var params = new URLSearchParams(location.search);
    return {
      event_id: page.eventId || document.documentElement.dataset.eventId || "DEFAULT",
      guest_id: params.get("guest_id") || params.get("guestId") || params.get("gid") || params.get("kode") || "",
      nama: valueOf(name, form),
      kehadiran: valueOf(attendance, form),
      jumlah_tamu: valueOf(count, form),
      pesan: valueOf(message, form),
      template: page.template || page.eventId || "",
      source_url: location.href
    };
  }

  function send(data) {
    if (placeholder) {
      log("API_URL belum diisi. Data belum dikirim ke Google Sheets.", data);
      return Promise.resolve({ status: "configuration_required" });
    }
    return fetch(cfg.API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data),
      keepalive: true
    }).then(function (r) { return r.json(); }).then(function (json) {
      log("Respons tersimpan", json);
      return json;
    }).catch(function (err) {
      console.warn("[296 Undangan] Gagal mengirim ke Google Sheets:", err);
      return { status: "error", message: String(err) };
    });
  }

  // Capture dijalankan sebelum handler lama mereset formulir. Handler visual lama tetap berjalan.
  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!form || form.dataset.undangan296Sent === "1") return;
    var data = extract(form);
    if (!data || !data.nama || !data.kehadiran) return;
    form.dataset.undangan296Sent = "1";
    send(data).finally(function () {
      setTimeout(function () { delete form.dataset.undangan296Sent; }, 800);
    });
  }, true);

  function addFallbackForm() {
    var forms = [].slice.call(document.forms);
    if (!cfg.ADD_FALLBACK_FORM || forms.some(function (f) { return extract(f); })) return;

    var style = document.createElement("style");
    style.textContent = ".u296-btn{position:fixed;right:18px;bottom:82px;z-index:99998;border:0;border-radius:999px;padding:12px 18px;background:#7b2d3b;color:#fff;font:600 14px Arial;box-shadow:0 8px 24px #0004;cursor:pointer}.u296-modal{display:none;position:fixed;inset:0;z-index:99999;background:#0009;padding:20px;align-items:center;justify-content:center}.u296-modal.open{display:flex}.u296-card{width:min(430px,100%);background:#fff;color:#222;border-radius:18px;padding:22px;font-family:Arial;box-shadow:0 20px 60px #0006}.u296-card h3{margin:0 0 14px}.u296-card input,.u296-card select,.u296-card textarea{box-sizing:border-box;width:100%;margin:6px 0 12px;padding:11px;border:1px solid #ccc;border-radius:9px}.u296-actions{display:flex;gap:8px}.u296-actions button{flex:1;border:0;border-radius:9px;padding:11px;cursor:pointer}.u296-send{background:#7b2d3b;color:#fff}.u296-close{background:#eee;color:#222}";
    document.head.appendChild(style);

    var button = document.createElement("button");
    button.type = "button"; button.className = "u296-btn"; button.textContent = "Konfirmasi Kehadiran";
    var modal = document.createElement("div"); modal.className = "u296-modal";
    modal.innerHTML = '<div class="u296-card"><h3>Konfirmasi Kehadiran</h3><form id="u296-fallback-form"><label>Nama</label><input name="nama" required><label>Kehadiran</label><select name="kehadiran" required><option value="">Pilih…</option><option value="Hadir">Hadir</option><option value="Tidak Hadir">Tidak Hadir</option><option value="Ragu-ragu">Ragu-ragu</option></select><label>Jumlah tamu</label><select name="jumlah_tamu"><option value="1">1 orang</option><option value="2">2 orang</option><option value="3">3 orang</option><option value="4">4 orang</option></select><label>Pesan/ucapan (opsional)</label><textarea name="pesan" rows="3"></textarea><div class="u296-actions"><button type="button" class="u296-close">Tutup</button><button type="submit" class="u296-send">Kirim</button></div><p class="u296-status" aria-live="polite"></p></form></div>';
    document.body.appendChild(button); document.body.appendChild(modal);
    button.onclick = function () { modal.classList.add("open"); };
    modal.querySelector(".u296-close").onclick = function () { modal.classList.remove("open"); };
    modal.addEventListener("click", function (e) { if (e.target === modal) modal.classList.remove("open"); });
    modal.querySelector("form").addEventListener("submit", function (e) {
      e.preventDefault();
      var form=e.currentTarget, status=form.querySelector(".u296-status"), data=extract(form);
      status.textContent = placeholder ? "URL Apps Script belum diisi pada 296-undangan-config.js." : "Mengirim…";
      if (placeholder) return;
      send(data).then(function (r) {
        status.textContent = r.status === "success" ? "Terima kasih, konfirmasi telah tersimpan." : (r.message || "Pengiriman gagal.");
        if (r.status === "success") form.reset();
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addFallbackForm);
  else addFallbackForm();
})();
