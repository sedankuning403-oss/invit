# Dokumentasi Undangan Pernikahan Digital

Undangan ini dibuat sebagai **satu file HTML** (`index.html`) yang sudah berisi
HTML, CSS, dan JavaScript — jadi bisa langsung dibuka di browser atau di-hosting
di mana saja, tanpa perlu proses build/compile apa pun.

Buku tamu (RSVP + ucapan) disinkronkan ke **Google Sheets** memakai
**Google Apps Script** sebagai jembatan (backend gratis, tanpa perlu server sendiri).

File yang Anda terima:
- `index.html` — halaman undangan (edit isi & konten di sini)
- `Code.gs` — kode backend untuk Google Apps Script (buku tamu ↔ Google Sheets)
- `DOKUMENTASI.md` — file ini

---

## 1. Cara Kerja Singkat

```
Tamu buka index.html
      │
      ├─ Kirim ucapan  ──POST──▶  Google Apps Script (Code.gs) ──▶ Google Sheets
      │
      └─ Lihat ucapan ──GET──▶  Google Apps Script (Code.gs) ──▶ baca Google Sheets
```

Selama Anda **belum** menghubungkan ke Google Sheets, halaman tetap berfungsi
penuh dalam **mode demo**: ucapan disimpan sementara di `localStorage` browser
tamu (hanya terlihat oleh tamu itu sendiri, hilang jika cache dibersihkan).
Ini memudahkan Anda mencoba tampilan sebelum setup backend selesai.

---

## 2. Setup Google Sheets + Apps Script (Buku Tamu Permanen)

### Langkah 1 — Buat Spreadsheet
1. Buka [Google Sheets](https://sheets.google.com), buat spreadsheet baru.
2. Beri nama bebas, misalnya "Buku Tamu Pernikahan Prasetya & Anindya".
3. Anda **tidak perlu** membuat sheet atau header manual — script akan
   membuatkannya otomatis di langkah berikutnya.

### Langkah 2 — Tempel Script
1. Di spreadsheet tadi, klik menu **Extensions → Apps Script**.
2. Hapus semua kode default (`myFunction() {}`) di editor yang terbuka.
3. Buka file `Code.gs` yang sudah disediakan, salin **seluruh isinya**,
   lalu tempel ke editor Apps Script tadi.
4. Klik ikon **Save** (atau `Ctrl+S` / `Cmd+S`).

### Langkah 3 — Jalankan Setup Sekali
1. Di bagian atas editor Apps Script, pilih fungsi **`setup`** dari dropdown
   daftar fungsi (di sebelah tombol Run/ikon ▷).
2. Klik **Run**.
3. Akan muncul permintaan izin ("Authorization required") → klik
   **Review permissions** → pilih akun Google Anda → klik **Advanced** →
   **Go to (nama project) (unsafe)** → **Allow**.
   > Peringatan "unsafe" ini normal untuk script buatan sendiri yang belum
   > diverifikasi Google — aman karena Anda sendiri yang menulis/memakainya.
4. Setelah selesai, kembali ke spreadsheet: sheet baru bernama **`GuestBook`**
   dengan header `Timestamp | Nama | Kehadiran | Ucapan` sudah otomatis dibuat.

### Langkah 4 — Deploy sebagai Web App
1. Di editor Apps Script, klik tombol **Deploy → New deployment**.
2. Klik ikon gerigi ⚙️ di samping "Select type", pilih **Web app**.
3. Isi pengaturan:
   - **Description**: bebas, misalnya "Buku Tamu v1"
   - **Execute as**: **Me (akun Anda)**
   - **Who has access**: **Anyone**
     > Wajib "Anyone" agar halaman undangan bisa diakses tamu tanpa mereka
     > perlu login Google. Data tetap hanya bisa dibaca/ditulis lewat kode
     > yang Anda kontrol di `Code.gs`.
4. Klik **Deploy**, lalu konfirmasi izin akses jika diminta lagi.
5. Setelah selesai, salin **Web app URL** yang muncul — bentuknya seperti:
   ```
   https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxxxxxx/exec
   ```

### Langkah 5 — Hubungkan ke index.html
1. Buka `index.html` dengan text editor apa pun.
2. Cari bagian `CONFIG` di dalam tag `<script>` (dekat akhir file):
   ```js
   const CONFIG = {
     weddingDate: "2026-09-12T08:00:00+07:00",
     scriptURL: "GANTI_DENGAN_URL_WEB_APP_ANDA",
     guestbookPageSize: 5
   };
   ```
3. Ganti nilai `scriptURL` dengan URL Web App dari Langkah 4:
   ```js
   scriptURL: "https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxxxxxx/exec",
   ```
4. Simpan file. Mode demo otomatis nonaktif dan buku tamu akan membaca/menulis
   langsung ke Google Sheets Anda.

> **Setiap kali Anda mengubah isi `Code.gs`** setelah deploy pertama, Anda perlu
> membuat deployment baru: **Deploy → Manage deployments → ikon pensil (Edit)
> → Version: New version → Deploy**. URL Web App biasanya tetap sama.

---

## 3. Mengubah Isi Undangan

Semua konten (nama, tanggal, lokasi, foto, rekening) ada langsung di dalam
`index.html`, tidak ada file konfigurasi terpisah. Gunakan `Ctrl+F` / `Cmd+F`
di text editor untuk mencari bagian yang ingin diubah.

| Yang ingin diubah | Cari di file |
|---|---|
| Nama kedua mempelai, tanggal cover | Bagian `<div id="cover">` |
| Ayat/quote pembuka | Bagian `<section id="quote">` |
| Nama orang tua, Instagram | Bagian `<section id="couple">` |
| Tanggal hitung mundur | `CONFIG.weddingDate` di bagian `<script>` |
| Jam & lokasi Akad/Resepsi | Bagian `<section id="events">` |
| Foto galeri | Bagian `<section id="gallery">`, ganti atribut `src` tiap `<img>` |
| Rekening/e-wallet | Bagian `<section id="gift">` |
| Musik latar | Atribut `src` pada tag `<audio id="bgm">` |

### Mengganti Foto
Foto placeholder memakai layanan `picsum.photos` (foto acak, hanya contoh).
Untuk memakai foto asli:
1. Upload foto ke hosting gambar (Google Drive dengan akses publik, Imgur,
   Cloudinary, atau folder yang sama dengan `index.html`).
2. Ganti nilai `src="..."` pada tag `<img>` yang bersangkutan dengan URL/nama
   file foto Anda, contoh:
   ```html
   <img src="foto/prasetya.jpg" alt="Foto Mempelai Pria">
   ```

### Nama Tamu Otomatis di Cover
Bagikan link undangan dengan parameter `?to=`, contoh:
```
https://domain-anda.com/index.html?to=Bapak+Budi+Santoso
```
Nama "Bapak Budi Santoso" akan otomatis muncul di cover undangan.

---

## 4. Hosting / Cara Membagikan Undangan

`index.html` adalah file statis biasa, bisa di-hosting gratis di berbagai
tempat, misalnya:

**Netlify (paling mudah, tanpa akun Git):**
1. Buka [app.netlify.com/drop](https://app.netlify.com/drop).
2. Seret (drag & drop) file `index.html` ke halaman tersebut.
3. Netlify memberi URL publik siap dibagikan.

**GitHub Pages:**
1. Buat repository baru, upload `index.html` (ganti nama jadi `index.html`
   tetap di root, atau di folder `docs/`).
2. Aktifkan GitHub Pages di Settings → Pages.

**Hosting umum (cPanel, dsb.):**
Cukup upload `index.html` ke folder `public_html`, tidak perlu setup database
karena backend memakai Google Sheets.

---

## 5. Menguji Sebelum Dibagikan

1. Buka `index.html` langsung di browser (bisa lewat double-click file, atau
   setelah di-hosting).
2. Klik **Buka Undangan**, cek animasi, musik, hitung mundur, galeri.
3. Isi form RSVP dengan data uji coba, klik **Kirim Ucapan**.
4. Buka Google Sheets Anda → sheet `GuestBook` → pastikan baris baru muncul.
5. Refresh halaman undangan → ucapan uji coba tadi harus tampil di daftar
   "Ucapan & Doa".
6. Hapus baris data uji coba di Google Sheets sebelum menyebarkan undangan
   ke tamu asli.

---

## 6. Troubleshooting

| Masalah | Kemungkinan Penyebab & Solusi |
|---|---|
| Banner "Mode demo" masih muncul | `CONFIG.scriptURL` di `index.html` belum diganti dengan URL Web App asli. |
| Ucapan terkirim tapi tidak muncul di Sheets | Pastikan Anda menjalankan `setup()` dan deploy dengan **Execute as: Me** & **Who has access: Anyone**. |
| Ucapan terkirim tapi tidak muncul kembali di halaman (list kosong) | Cek nama sheet harus persis `GuestBook`; jangan ganti nama sheet setelah setup. |
| Setelah edit `Code.gs`, perubahan tidak berlaku | Harus buat **New version** lewat Deploy → Manage deployments, bukan hanya Save. |
| Musik tidak otomatis bunyi | Kebijakan browser mencegah autoplay audio sebelum ada interaksi user — musik akan mulai saat tombol "Buka Undangan" diklik (ini sudah ditangani di kode). |
| Link Google Maps salah lokasi | Ganti URL pada tombol "Lihat Lokasi" di bagian `<section id="events">` dengan link Google Maps lokasi Anda sendiri (buka Google Maps → Share → Copy link). |

---

## 7. Struktur Data Google Sheets

Sheet `GuestBook` akan berisi kolom berikut (dibuat otomatis oleh `setup()`):

| Timestamp | Nama | Kehadiran | Ucapan |
|---|---|---|---|
| 2026-07-09T10:00:00.000Z | Budi Santoso | Hadir | Selamat menempuh hidup baru! |

Anda bebas mengolah data ini di Google Sheets, misalnya membuat rekap jumlah
tamu yang konfirmasi hadir memakai `COUNTIF`.
