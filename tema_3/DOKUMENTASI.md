# Dokumentasi — Undangan Pernikahan Digital "Reverie"

Undangan single-page (HTML, CSS, JS murni — tanpa framework, tanpa build tool)
dengan buku tamu yang tersinkron otomatis ke **Google Sheets**.

```
undangan-reverie/
├── index.html          → struktur halaman
├── style.css            → seluruh styling
├── script.js             → logika: countdown, gate, buku tamu, dll
├── apps-script/
│   └── Code.gs           → kode backend Google Apps Script (buku tamu)
└── DOKUMENTASI.md        → file ini
```

---

## 1. Cara Kerja Buku Tamu

Karena ini adalah website statis (tanpa server sendiri), buku tamu
memakai **Google Sheets sebagai database** dan **Google Apps Script**
sebagai jembatan (API) antara website dan spreadsheet.

Alurnya:

1. Tamu mengisi form di website → `script.js` mengirim data ke Apps Script (`doPost`).
2. Apps Script menyimpan data itu sebagai baris baru di Google Sheets.
3. Saat halaman dibuka, `script.js` meminta daftar ucapan ke Apps Script (`doGet`) dan menampilkannya.

Semua tamu melihat data yang sama karena sumbernya satu spreadsheet.

---

## 2. Setup Google Sheets + Apps Script (sekali saja)

### Langkah 1 — Buat Spreadsheet baru
1. Buka [sheets.google.com](https://sheets.google.com) → buat spreadsheet baru.
2. Beri nama bebas, misalnya **"Buku Tamu Ayla & Rangga"**.

### Langkah 2 — Buka Apps Script
1. Di spreadsheet, klik menu **Extensions → Apps Script** (Ekstensi → Apps Script).
2. Akan terbuka editor kode baru dengan file `Code.gs` kosong.

### Langkah 3 — Tempel kode
1. Hapus semua isi `Code.gs` bawaan.
2. Buka file `apps-script/Code.gs` dari folder proyek ini, salin seluruh isinya.
3. Tempel ke editor Apps Script, lalu klik ikon disket (Simpan project).

### Langkah 4 — Jalankan `setup` satu kali
1. Di bagian atas editor, pilih fungsi **`setup`** dari dropdown (di sebelah tombol Run/▷).
2. Klik **Run**.
3. Akan muncul dialog izin akses (Authorize access) → pilih akun Google Anda → klik **Advanced/Lanjutan** → **Go to (nama project) (unsafe)** → **Allow/Izinkan**.
   > Ini normal — Google menampilkan peringatan ini untuk semua script buatan sendiri yang belum diverifikasi publik. Karena Anda pemilik script dan spreadsheetnya sendiri, aman untuk dilanjutkan.
4. Setelah selesai, cek spreadsheet Anda — akan muncul sheet baru bernama **GuestBook** dengan header: `Timestamp | Nama | Kehadiran | Ucapan`.

### Langkah 5 — Deploy sebagai Web App
1. Klik tombol **Deploy → New deployment** (Deploy → Deployment baru) di pojok kanan atas.
2. Klik ikon gerigi ⚙️ di samping "Select type" → pilih **Web app**.
3. Isi pengaturan:
   - **Execute as**: `Me (email Anda)`
   - **Who has access**: `Anyone` (Siapa saja) — *wajib*, agar tamu bisa mengirim ucapan tanpa login.
4. Klik **Deploy**.
5. Google akan menampilkan **Web app URL**, formatnya seperti:
   ```
   https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/exec
   ```
6. **Salin URL ini** — akan dipakai di langkah berikutnya.

> **Setiap kali Anda mengubah isi `Code.gs`**, Anda perlu membuat deployment baru
> (Deploy → Manage deployments → ikon pensil → Version: New version → Deploy)
> agar perubahan benar-benar aktif di URL yang sama.

---

## 3. Menghubungkan Website ke Apps Script

1. Buka `script.js`.
2. Cari baris berikut di bagian paling atas (`CONFIG`):
   ```js
   GOOGLE_SHEET_API_URL: "https://script.google.com/macros/s/GANTI_DENGAN_DEPLOYMENT_ID_ANDA/exec",
   ```
3. Ganti dengan URL Web App yang Anda salin di Langkah 5 sebelumnya.
4. Simpan file. Buku tamu sekarang aktif — coba buka `index.html` di browser dan kirim ucapan uji coba, lalu cek apakah muncul baris baru di Google Sheets.

---

## 4. Mengubah Data Undangan

Semua data yang sering diganti ada di bagian atas `script.js` (objek `CONFIG`)
dan langsung di `index.html`.

| Yang ingin diubah | Di mana |
|---|---|
| Nama mempelai, tanggal di layar pembuka | `index.html` → cari `#gate-names`, `#gate-date` |
| Nama mempelai & orang tua | `index.html` → bagian `<!-- COUPLE -->` |
| Tanggal & waktu countdown | `script.js` → `CONFIG.weddingDateISO` |
| Alamat & link Google Maps Akad/Resepsi | `index.html` bagian `<!-- EVENTS -->` (teks) dan `script.js` → `CONFIG.akad.mapsUrl` / `CONFIG.resepsi.mapsUrl` |
| Data untuk tombol "Tambahkan ke Kalender" | `script.js` → `CONFIG.calendar` |
| Kisah cinta (timeline) | `index.html` → bagian `<!-- LOVE STORY -->` |
| Nomor rekening / hadiah | `script.js` → `CONFIG.bankNumber`, dan teks bank di `index.html` bagian `<!-- GIFT -->` |
| URL Apps Script buku tamu | `script.js` → `CONFIG.GOOGLE_SHEET_API_URL` |

### Nama tamu personal (`?to=Nama`)

Link undangan bisa dipersonalisasi lewat parameter URL, contoh:

```
https://domain-anda.com/index.html?to=Budi%20Santoso
```

Nama "Budi Santoso" akan otomatis tampil di layar pembuka. Gunakan spasi
sebagai `%20` atau `+` saat membagikan link ke tiap tamu (bisa dibuatkan
massal dengan Google Sheets + fungsi `=CONCATENATE` atau alat sejenis).

---

## 5. Mengganti Foto (Galeri & Foto Mempelai)

Saat ini galeri dan foto mempelai memakai kotak warna sebagai placeholder
(agar file tetap ringan tanpa perlu foto asli). Untuk memasang foto sungguhan:

1. Siapkan folder `assets/` di proyek ini, taruh file foto di sana (misalnya `assets/foto1.jpg`).
2. Di `style.css`, cari kelas seperti `.ph-1 { background: ... }` dan ganti dengan:
   ```css
   .ph-1{ background-image:url('assets/foto1.jpg'); }
   ```
   Ulangi untuk `.ph-2` sampai `.ph-6`.
3. Untuk foto bulat mempelai, cari `.couple__photo` di `style.css` dan tambahkan:
   ```css
   .couple__photo{ background-image:url('assets/mempelai-1.jpg'); background-size:cover; background-position:center; }
   ```
   (Karena ada dua foto berbeda, beri class tambahan di HTML, misal `couple__photo couple__photo--1` dan `--2`, lalu atur masing-masing background-image-nya.)

Gunakan foto berformat `.jpg`/`.webp` yang sudah dikompres (idealnya di bawah 300 KB per foto) agar halaman tetap cepat dibuka.

---

## 6. Cara Hosting / Mempublikasikan

Karena ini murni HTML/CSS/JS statis, Anda bisa host gratis di:

- **Netlify** — seret folder proyek ke [app.netlify.com/drop](https://app.netlify.com/drop)
- **Vercel** — `vercel deploy` lewat CLI, atau hubungkan repo GitHub
- **GitHub Pages** — push folder ke repo GitHub, aktifkan Pages di Settings

Setelah live, bagikan link beserta parameter `?to=NamaTamu` ke masing-masing tamu.

---

## 7. Pemecahan Masalah (Troubleshooting)

**Buku tamu menampilkan "Buku tamu belum terhubung"**
→ URL di `CONFIG.GOOGLE_SHEET_API_URL` belum diganti, atau deployment Apps Script belum di-set "Anyone" pada akses.

**Ucapan terkirim tapi tidak muncul di Google Sheets**
→ Pastikan fungsi `setup` sudah pernah dijalankan sekali, dan pastikan Anda men-deploy ulang setelah mengedit `Code.gs` (lihat catatan di Langkah 5).

**Muncul halaman "Authorization required" saat mengakses URL Apps Script**
→ Pengaturan **Who has access** belum `Anyone`. Buka Deploy → Manage deployments → edit → ubah ke `Anyone` → Deploy ulang.

**Ucapan baru tidak langsung terlihat oleh tamu lain**
→ Normal — setiap tamu memuat daftar ucapan saat halaman dibuka. Ucapan milik tamu sendiri langsung muncul di layar tanpa refresh (ditambahkan langsung lewat JavaScript), tapi tamu lain akan melihatnya saat mereka membuka/refresh halaman.

**Ingin membatasi siapa saja yang bisa mengisi buku tamu**
→ Google Apps Script Web App dengan akses "Anyone" tidak mendukung login/otentikasi bawaan. Jika perlu pembatasan, pertimbangkan menambahkan captcha sederhana atau reCAPTCHA di form (di luar cakupan dokumentasi ini).

---

## 8. Ringkasan Checklist

- [ ] Sudah membuat spreadsheet Google Sheets
- [ ] Sudah menempel kode `Code.gs` ke Apps Script
- [ ] Sudah menjalankan fungsi `setup` sekali
- [ ] Sudah deploy sebagai Web App dengan akses **Anyone**
- [ ] Sudah menempelkan URL Web App ke `CONFIG.GOOGLE_SHEET_API_URL` di `script.js`
- [ ] Sudah uji coba kirim ucapan dan mengecek data masuk ke sheet `GuestBook`
- [ ] Sudah mengganti nama mempelai, tanggal, lokasi, dan foto
- [ ] Sudah di-hosting dan link dibagikan ke tamu
