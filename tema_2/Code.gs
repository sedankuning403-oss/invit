/**
 * ============================================================================
 *  BACKEND BUKU TAMU UNDANGAN — GOOGLE APPS SCRIPT
 * ============================================================================
 *  Cara pakai lengkap ada di DOKUMENTASI.md.
 *  Ringkasan:
 *  1. Buat Google Spreadsheet baru.
 *  2. Buka Extensions > Apps Script, hapus isi default, tempel seluruh isi
 *     file ini.
 *  3. Jalankan fungsi setup() sekali (lihat menu Run > setup) untuk membuat
 *     sheet "GuestBook" beserta header-nya secara otomatis.
 *  4. Deploy > New deployment > pilih tipe "Web app".
 *       - Execute as     : Me
 *       - Who has access : Anyone
 *  5. Salin "Web app URL" yang muncul, tempel ke variabel CONFIG.scriptURL
 *     pada file index.html.
 * ============================================================================
 */

const SHEET_NAME = 'GuestBook';
const HEADERS = ['Timestamp', 'Nama', 'Kehadiran', 'Ucapan'];

/**
 * Jalankan fungsi ini SEKALI secara manual dari editor Apps Script
 * (pilih "setup" di dropdown fungsi, lalu klik Run) untuk membuat
 * sheet "GuestBook" beserta header kolomnya.
 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonOutput_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * GET — dipanggil dari index.html untuk mengambil daftar ucapan.
 * Mengembalikan data terbaru lebih dulu.
 */
function doGet(e) {
  try {
    const sheet = getSheet_();
    const values = sheet.getDataRange().getValues();
    const rows = values.slice(1); // lewati baris header

    const data = rows
      .filter(r => r[1]) // lewati baris kosong (tanpa nama)
      .map(r => ({
        timestamp: r[0] instanceof Date ? r[0].toISOString() : r[0],
        name: r[1],
        attendance: r[2],
        message: r[3]
      }))
      .reverse(); // terbaru di atas

    return jsonOutput_({ status: 'success', data: data });
  } catch (err) {
    return jsonOutput_({ status: 'error', message: err.message });
  }
}

/**
 * POST — dipanggil dari index.html saat tamu mengirim ucapan baru.
 * Body dikirim sebagai JSON string dengan Content-Type: text/plain
 * (agar tidak memicu preflight CORS dari browser).
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const name = (body.name || '').toString().trim().slice(0, 100);
    const attendance = (body.attendance || '-').toString().trim().slice(0, 50);
    const message = (body.message || '').toString().trim().slice(0, 500);

    if (!name || !message) {
      return jsonOutput_({ status: 'error', message: 'Nama dan ucapan wajib diisi.' });
    }

    const sheet = getSheet_();
    sheet.appendRow([new Date(), name, attendance, message]);

    return jsonOutput_({ status: 'success' });
  } catch (err) {
    return jsonOutput_({ status: 'error', message: err.message });
  }
}
