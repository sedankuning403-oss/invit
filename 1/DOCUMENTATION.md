# Dokumentasi — Undangan Pernikahan Online (Tema Lumière)

Undangan single-page berbasis HTML/CSS/JS murni (tanpa framework/build tool), terinspirasi dari nuansa elegan tema *Lumiere*. Buku tamu (RSVP + ucapan) tersinkron otomatis ke Google Sheets lewat Google Apps Script, jadi tidak perlu database atau hosting backend terpisah.

## 1. Struktur File

```
undangan/
├── index.html              ← markup halaman + data undangan (nama, tanggal, dst)
├── css/
│   └── style.css           ← seluruh styling
├── js/
│   └── script.js           ← logic: countdown, reveal animasi, RSVP, dll
├── google-apps-script.gs   ← kode backend (ditempel di Google Apps Script)
├── assets/                 ← taruh foto & musik di sini (lihat bagian 3)
└── DOCUMENTATION.md        ← file ini
```

## 2. Menjalankan di Lokal

Karena `fetch()` butuh HTTP (bukan `file://`), jalankan lewat server lokal sederhana:

```bash
cd undangan
python3 -m http.server 8080
# lalu buka http://localhost:8080
```

## 3. Mengisi Data & Aset

### 3.1 Data teks
Semua data (nama mempelai, tanggal, lokasi, rekening, dst) ada di **satu tempat**: blok `<script>window.INVITATION_DATA = {...}</script>` di bagian atas `index.html`. Edit langsung nilai-nilainya — tidak perlu menyentuh HTML lain.

Field penting:
- `couple` — nama lengkap, nama panggilan, nama orang tua, akun Instagram.
- `quote` — ayat/kutipan pembuka.
- `events` — array acara (akad, resepsi, dst), masing-masing dengan tanggal, jam, lokasi, dan link Google Maps.
- `weddingDate` — format ISO `YYYY-MM-DDTHH:mm:ss+07:00`, dipakai untuk hitung mundur.
- `gallery` — daftar path foto galeri.
- `gift` — rekening bank, e-wallet, dan alamat kado fisik.
- `gasEndpoint` — URL Web App Google Apps Script (lihat bagian 4).

### 3.2 Foto & musik
Taruh file di folder `assets/` dengan nama:
- `cover.jpg` — foto sampul (rasio potret/landscape lebar, akan di-crop otomatis)
- `groom.jpg`, `bride.jpg` — foto masing-masing mempelai (rasio ± 3:4)
- `gallery-1.jpg` … `gallery-6.jpg` — foto galeri (boleh tambah lebih, sesuaikan array `gallery` di data)
- `music.mp3` — musik latar (opsional; tombol musik di pojok kanan atas akan otomatis disembunyikan efeknya jika file tidak ada, tapi sebaiknya tetap disediakan)

Link tamu memakai parameter URL, contoh:
```
https://domainkamu.com/?to=Budi+Santoso
```
Nama tamu otomatis muncul di halaman sampul.

## 4. Setup Buku Tamu → Google Sheets (Google Apps Script)

Ini bagian intinya. Tidak perlu API key atau server tambahan — semua jalan lewat akun Google kamu sendiri.

### Langkah 1 — Buat Spreadsheet
1. Buka [Google Sheets](https://sheets.google.com), buat spreadsheet baru.
2. Boleh diberi nama bebas, misalnya "Buku Tamu Rafi & Aisyah".
3. Kamu **tidak perlu** membuat sheet atau header manual — kode akan membuat sheet bernama `BukuTamu` beserta headernya secara otomatis saat pertama kali dipanggil.

### Langkah 2 — Tempel Kode Apps Script
1. Di spreadsheet, buka menu **Extensions → Apps Script** (Ekstensi → Apps Script).
2. Hapus semua isi editor default (`function myFunction() {...}`).
3. Buka file `google-apps-script.gs` dari paket ini, salin seluruh isinya, tempel ke editor Apps Script.
4. Simpan project (ikon disket / `Ctrl+S`), beri nama misalnya "Backend Undangan".

### Langkah 3 — Deploy sebagai Web App
1. Klik tombol **Deploy → New deployment** (Deploy → Deployment baru).
2. Klik ikon gerigi di sebelah "Select type", pilih **Web app**.
3. Isi:
   - **Description**: bebas, misalnya "Buku Tamu v1"
   - **Execute as**: **Me (akun kamu)**
   - **Who has access**: **Anyone** (wajib, agar bisa diakses dari halaman undangan tanpa login)
4. Klik **Deploy**. Google akan meminta izin akses — klik **Authorize access**, pilih akun kamu, lalu **Advanced → Go to (nama project) → Allow**. Ini normal karena Apps Script belum diverifikasi Google (aplikasi milik sendiri).
5. Setelah selesai, akan muncul **Web app URL** seperti:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```
   Salin URL ini.

### Langkah 4 — Sambungkan ke Halaman Undangan
1. Buka `index.html`.
2. Cari baris:
   ```js
   gasEndpoint: "https://script.google.com/macros/s/GANTI_DENGAN_ID_DEPLOYMENT/exec"
   ```
3. Ganti dengan URL Web App dari Langkah 3.
4. Simpan, refresh halaman. Coba isi form RSVP — data akan otomatis muncul sebagai baris baru di sheet `BukuTamu`, dan juga tampil di daftar "Buku Tamu" pada halaman.

### Catatan Penting
- **Setiap kali kamu mengubah isi `google-apps-script.gs`**, kamu harus membuat deployment baru: **Deploy → Manage deployments → ikon pensil → Version: New version → Deploy**. Sekadar menyimpan kode tidak otomatis memperbarui URL yang sudah aktif.
- Data yang tersimpan: `Timestamp`, `Nama`, `Kehadiran`, `Ucapan` — bisa kamu buka, filter, atau export dari Google Sheets kapan saja seperti data pada umumnya.
- Jika ingin membatasi siapa yang bisa mengisi (misalnya butuh kode undangan), itu bisa ditambahkan di sisi form (field tersembunyi + validasi di `doPost`) — beri tahu saya jika ingin fitur ini ditambahkan.
- Request POST dari `script.js` sengaja menggunakan header `Content-Type: text/plain` (bukan `application/json`) — ini trik standar agar browser tidak mengirim *CORS preflight request*, yang tidak didukung oleh Apps Script Web App.

## 5. Kustomisasi Desain

Semua token warna & font ada di bagian `:root` paling atas `css/style.css`:

```css
--ink:#0e0d0b;      /* latar utama */
--gold:#c9a15c;     /* aksen emas */
--cream:#f3ecdd;    /* warna teks */
--ember:#8b5e3c;    /* aksen sekunder */
```

Ganti nilai hex ini untuk mengubah keseluruhan nuansa warna tanpa perlu menyentuh bagian lain dari CSS.

## 6. Checklist Sebelum Kirim ke Tamu

- [ ] Semua data di `INVITATION_DATA` sudah benar (nama, tanggal, alamat, rekening)
- [ ] Foto sudah diganti (cover, groom, bride, gallery)
- [ ] `gasEndpoint` sudah diarahkan ke Web App yang sudah di-deploy dengan akses **Anyone**
- [ ] Sudah dites: isi form RSVP → cek muncul di Google Sheets & di daftar Buku Tamu
- [ ] Sudah dites tampilan di HP (buka lewat browser HP, bukan cuma desktop)
- [ ] Link tamu final sudah pakai format `?to=Nama+Tamu` per tamu (atau bisa dibuatkan generator link kalau perlu)

## 7. Deploy ke Hosting

Karena ini murni file statis, bisa langsung diupload ke:
- **GitHub Pages** (gratis)
- **Netlify** / **Vercel** (drag & drop folder, gratis)
- Hosting Blogger/cPanel yang sudah biasa dipakai — cukup upload seluruh isi folder `undangan/` beserta strukturnya.

Tidak ada proses build — file `index.html`, `css/`, `js/`, `assets/` tinggal diupload apa adanya.
