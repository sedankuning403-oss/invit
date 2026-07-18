/**
 * ============================================================
 *  BUKU TAMU UNDANGAN — BACKEND GOOGLE APPS SCRIPT
 * ============================================================
 * Script ini dijalankan DI DALAM Google Sheets (Extensions > Apps Script),
 * bukan di komputer Anda. Fungsinya menerima data dari form buku tamu
 * di website undangan, lalu menyimpannya sebagai baris baru di sheet,
 * dan menyediakan data tersebut kembali dalam format JSON.
 *
 * Cara pakai lengkap ada di DOKUMENTASI.md, bagian "Menghubungkan Buku Tamu".
 * ============================================================
 */

const SHEET_NAME = "Guestbook";

/**
 * Dipanggil saat website melakukan GET request, contoh:
 * .../exec?action=list
 * Mengembalikan seluruh data ucapan dalam format JSON, terbaru di atas.
 */
function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const values = sheet.getDataRange().getValues();

    // Baris pertama adalah header, jadi dilewati (slice(1))
    const rows = values.slice(1)
      .filter(r => r[1]) // hanya baris yang punya nama
      .map(r => ({
        timestamp: r[0] instanceof Date ? r[0].toISOString() : r[0],
        name: r[1],
        attendance: r[2],
        message: r[3]
      }))
      .reverse(); // ucapan terbaru tampil paling atas

    return jsonResponse({ status: "success", data: rows });
  } catch (err) {
    return jsonResponse({ status: "error", message: err.message });
  }
}

/**
 * Dipanggil saat website mengirim ucapan baru (POST request).
 * Body request berupa teks JSON: { name, attendance, message }
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    const name = String(body.name || "").trim().slice(0, 100);
    const attendance = String(body.attendance || "").trim().slice(0, 30);
    const message = String(body.message || "").trim().slice(0, 800);

    if (!name || !message) {
      return jsonResponse({ status: "error", message: "Nama dan ucapan wajib diisi." });
    }

    const sheet = getOrCreateSheet();
    sheet.appendRow([new Date(), name, attendance, message]);

    return jsonResponse({ status: "success" });
  } catch (err) {
    return jsonResponse({ status: "error", message: err.message });
  }
}

/**
 * Mengambil sheet "Guestbook". Jika belum ada, sheet baru akan
 * dibuat otomatis lengkap dengan header kolom.
 */
function getOrCreateSheet() {
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
