/**
 * =========================================================
 *  BACKEND BUKU TAMU — Google Apps Script
 *  Undangan Pernikahan (sinkron ke Google Sheets)
 * =========================================================
 *
 * CARA PAKAI — lihat DOCUMENTATION.md untuk langkah lengkap.
 * Ringkasnya:
 *  1. Buat Google Spreadsheet baru, buat sheet bernama "BukuTamu"
 *     dengan header di baris 1: Timestamp | Nama | Kehadiran | Ucapan
 *  2. Buka Extensions > Apps Script, hapus isi default, tempel file ini.
 *  3. Deploy > New deployment > Web app.
 *     - Execute as: Me
 *     - Who has access: Anyone
 *  4. Salin URL Web App yang dihasilkan ke `gasEndpoint` di index.html.
 */

const SHEET_NAME = 'BukuTamu';

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Nama', 'Kehadiran', 'Ucapan']);
  }
  return sheet;
}

/**
 * GET  ?action=list   -> mengembalikan seluruh data buku tamu (JSON)
 */
function doGet(e) {
  const action = (e.parameter.action || 'list');
  if (action === 'list') {
    return respondJson_({ ok: true, data: readAll_() });
  }
  return respondJson_({ ok: false, error: 'Unknown action' });
}

/**
 * POST body JSON: { action: "add", nama, kehadiran, ucapan }
 * Catatan: request dikirim dengan Content-Type: text/plain dari sisi
 * front-end agar tidak memicu CORS preflight (yang tidak didukung Apps Script).
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action !== 'add') {
      return respondJson_({ ok: false, error: 'Unknown action' });
    }
    const nama = sanitize_(body.nama);
    const kehadiran = sanitize_(body.kehadiran);
    const ucapan = sanitize_(body.ucapan);

    if (!nama || !ucapan) {
      return respondJson_({ ok: false, error: 'Nama dan ucapan wajib diisi' });
    }

    const sheet = getSheet_();
    sheet.appendRow([new Date(), nama, kehadiran, ucapan]);

    return respondJson_({ ok: true });
  } catch (err) {
    return respondJson_({ ok: false, error: String(err) });
  }
}

function readAll_() {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1); // skip header
  return rows
    .filter(r => r[1]) // must have a name
    .map(r => ({
      timestamp: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      nama: String(r[1] || ''),
      kehadiran: String(r[2] || ''),
      ucapan: String(r[3] || '')
    }));
}

function sanitize_(str) {
  if (!str) return '';
  return String(str).trim().slice(0, 500); // basic length guard
}

function respondJson_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
