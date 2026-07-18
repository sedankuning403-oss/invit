/**
 * REVERIE — Buku Tamu Google Apps Script
 * -----------------------------------------
 * File ini di-deploy sebagai Web App di Google Apps Script,
 * bukan dijalankan di browser. Lihat DOKUMENTASI.md untuk
 * langkah instalasi lengkap.
 */

const SHEET_NAME = "GuestBook";

/**
 * Jalankan fungsi ini SATU KALI secara manual dari editor Apps Script
 * (pilih "setup" di dropdown lalu klik Run) untuk membuat sheet
 * dan header kolom secara otomatis.
 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  sheet.clear();
  sheet.appendRow(["Timestamp", "Nama", "Kehadiran", "Ucapan"]);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, 4);
}

/**
 * Menangani permintaan GET — mengembalikan seluruh isi buku tamu.
 * Mendukung JSONP lewat parameter ?callback=namaFungsi
 * agar bisa dibaca dari browser tanpa masalah CORS.
 */
function doGet(e) {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  const headers = values.shift() || [];

  const data = values
    .filter(row => row.some(cell => cell !== "")) // buang baris kosong
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => (obj[h] = row[i]));
      return obj;
    })
    .reverse(); // ucapan terbaru tampil lebih dulu

  const payload = JSON.stringify({ status: "success", data: data });

  const callback = e && e.parameter && e.parameter.callback;
  if (callback) {
    return ContentService
      .createTextOutput(callback + "(" + payload + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(payload)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Menangani permintaan POST — menambahkan satu baris ucapan baru.
 * Body dikirim sebagai JSON di dalam text/plain agar browser tidak
 * melakukan CORS preflight (lihat script.js).
 */
function doPost(e) {
  try {
    const sheet = getSheet_();
    const body = JSON.parse(e.postData.contents);

    const nama = sanitize_(body.nama) || "Anonim";
    const kehadiran = sanitize_(body.kehadiran) || "-";
    const ucapan = sanitize_(body.ucapan) || "";

    sheet.appendRow([new Date(), nama, kehadiran, ucapan]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["Timestamp", "Nama", "Kehadiran", "Ucapan"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function sanitize_(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim().slice(0, 500);
}
