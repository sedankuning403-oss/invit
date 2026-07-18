/**
 * ROYAL JAVANESE — Guestbook backend (Google Apps Script)
 *
 * Cara pakai: lihat DOKUMENTASI.md, bagian "Menghubungkan Buku Tamu
 * ke Google Sheets". Ringkasnya:
 *   1. Buat Google Sheet baru.
 *   2. Extensions > Apps Script, hapus isi default, tempel file ini.
 *   3. Deploy > New deployment > Web app.
 *      - Execute as: Me
 *      - Who has access: Anyone
 *   4. Salin URL Web App yang dihasilkan ke CONFIG.GSHEET_URL di script.js
 */

const SHEET_NAME = "Guestbook";

function doGet(e) {
  const sheet = getSheet();

  if (e.parameter.action === "list") {
    const values = sheet.getDataRange().getValues();
    values.shift(); // buang baris header
    const guests = values
      .filter(row => row[1]) // baris dengan nama terisi
      .map(row => ({
        timestamp: row[0],
        nama: row[1],
        kehadiran: row[2],
        ucapan: row[3],
      }))
      .reverse(); // ucapan terbaru tampil di atas
    return jsonResponse({ status: "success", data: guests });
  }

  return jsonResponse({ status: "error", message: "Aksi tidak dikenali" });
}

function doPost(e) {
  const sheet = getSheet();

  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ status: "error", message: "Format data tidak valid" });
  }

  const nama = (body.nama || "").toString().trim();
  const kehadiran = (body.kehadiran || "").toString().trim();
  const ucapan = (body.ucapan || "").toString().trim();

  if (!nama || !ucapan) {
    return jsonResponse({ status: "error", message: "Nama dan ucapan wajib diisi" });
  }

  sheet.appendRow([new Date(), nama, kehadiran || "-", ucapan]);
  return jsonResponse({ status: "success", message: "Ucapan berhasil dikirim" });
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["Timestamp", "Nama", "Kehadiran", "Ucapan"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
