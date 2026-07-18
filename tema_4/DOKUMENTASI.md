# Dokumentasi Undangan Pernikahan Online

Undangan ini adalah website satu halaman (HTML, CSS, JS murni — tanpa framework
dan tanpa proses build) dengan tema garden-arch bernuansa sage green, blush,
dan emas. Buku tamu terhubung langsung ke Google Sheets, sehingga setiap
ucapan yang masuk tersimpan otomatis dan bisa Anda lihat/ekspor kapan saja.

## Isi Folder

```
undangan/
├── index.html        → struktur halaman
├── style.css          → seluruh tampilan/desain
├── script.js          → logika interaktif + koneksi buku tamu
├── apps-script.gs      → kode backend (ditempel di Google Apps Script)
└── DOKUMENTASI.md      → dokumen ini
```

Tidak ada folder `assets/music.mp3` yang disertakan — jika ingin memakai musik
latar, tambahkan file audio Anda sendiri di path tersebut (lihat bagian
"Musik Latar" di bawah).

---

## 1. Menghubungkan Buku Tamu ke Google Sheets

Bagian ini yang membuat ucapan tamu tersinkron otomatis ke spreadsheet Anda.
Ikuti langkah berikut satu per satu.

### Langkah 1 — Buat Google Sheet baru
1. Buka [sheets.google.com](https://sheets.google.com) → **Blank spreadsheet**.
2. Beri nama file, misalnya `Buku Tamu Bagus & Anggi`.
3. Anda tidak perlu membuat kolom apa pun secara manual — script akan
   membuatkannya otomatis saat pertama kali dijalankan.

### Langkah 2 — Tempel kode Apps Script
1. Di spreadsheet tadi, klik menu **Extensions (Ekstensi) → Apps Script**.
2. Akan terbuka tab baru berisi editor kode. Hapus semua kode contoh
   (`function myFunction() {...}`) yang sudah ada di sana.
3. Buka file **`apps-script.gs`** dari folder undangan ini, salin **seluruh isinya**,
   lalu tempelkan ke editor Apps Script tersebut.
4. Simpan dengan menekan ikon disket atau `Ctrl/Cmd + S`.
   Anda boleh mengganti nama project di pojok kiri atas, misalnya
   `Backend Undangan`.

### Langkah 3 — Deploy sebagai Web App
1. Klik tombol biru **Deploy** (kanan atas) → **New deployment**.
2. Klik ikon ⚙️ di samping "Select type", pilih **Web app**.
3. Isi konfigurasi:
   - **Description**: bebas, misalnya `Buku Tamu v1`
   - **Execute as**: **Me (email Anda)**
   - **Who has access**: **Anyone** — ini wajib "Anyone" (bukan "Anyone with
     Google account") agar tamu tanpa akun Google tetap bisa mengirim ucapan.
4. Klik **Deploy**.
5. Google akan meminta **otorisasi izin** karena script ini mengakses
   spreadsheet Anda:
   - Klik **Authorize access**
   - Pilih akun Google Anda
   - Jika muncul peringatan "Google hasn't verified this app", klik
     **Advanced** → **Go to (nama project) (unsafe)** — ini normal karena
     script ini milik Anda sendiri, bukan aplikasi pihak ketiga.
   - Klik **Allow**.
6. Setelah berhasil, akan muncul **Web app URL** berbentuk:
   ```
   https://script.google.com/macros/s/AKfycb.......x/exec
   ```
   **Salin URL ini** — inilah yang menghubungkan website ke spreadsheet Anda.

### Langkah 4 — Tempel URL ke `script.js`
1. Buka file `script.js`.
2. Cari baris di bagian paling atas:
   ```js
   SHEET_API_URL: "https://script.google.com/macros/s/GANTI_DENGAN_DEPLOYMENT_ID/exec",
   ```
3. Ganti seluruh URL tersebut dengan URL Web App yang Anda salin tadi.
4. Simpan file.

Buku tamu sudah aktif. Setiap ucapan yang dikirim dari website akan otomatis
tersimpan sebagai baris baru di sheet bernama **"Guestbook"** pada spreadsheet
Anda (kolom: Timestamp, Nama, Kehadiran, Ucapan), dan daftar ucapan yang
tampil di website juga diambil langsung dari sana.

### Jika nanti mengedit `apps-script.gs` lagi
Setiap kali Anda **mengubah kode** di Apps Script, perubahan tidak otomatis
berlaku pada URL yang sudah ada. Anda perlu:
1. Klik **Deploy → Manage deployments**
2. Klik ikon pensil (edit) pada deployment yang aktif
3. Pada "Version", pilih **New version**
4. Klik **Deploy**

URL Web App-nya tetap sama, jadi tidak perlu mengganti apa pun di `script.js`.

### Troubleshooting Buku Tamu

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| "Buku tamu belum terhubung..." | URL di `script.js` belum diganti | Ulangi Langkah 4 |
| Ucapan terkirim tapi tidak muncul di sheet | Deployment "Execute as" bukan Anda | Buat ulang deployment, pastikan "Execute as: Me" |
| Muncul error saat tamu mengirim ucapan | "Who has access" bukan "Anyone" | Edit deployment, ubah ke "Anyone" |
| Daftar ucapan gagal dimuat di beberapa browser | Cache lama | Tambahkan parameter `?t=` sudah otomatis ditangani di kode, coba refresh (hard reload) |

---

## 2. Mengganti Isi Undangan

Semua teks bisa diedit langsung di `index.html` dengan mencari teks yang
ingin diganti. Beberapa bagian penting:

- **Nama mempelai & tanggal** → bagian `<section id="gate">`
- **Nama orang tua & Instagram** → bagian `<section id="couple">`
- **Tanggal, jam, lokasi acara** → bagian `<section id="event">`
  *(jangan lupa juga sesuaikan `CONFIG.EVENT` dan `CONFIG.COUNTDOWN_TARGET`
  di `script.js` agar tombol "Tambah ke Kalender" dan hitung mundur akurat)*
- **Nomor rekening** → bagian `<section id="gift">`, ganti juga atribut
  `data-copy="..."` pada tombol agar tombol salin ikut berubah.
- **Nomor WhatsApp & Instagram** → bagian `<footer>`.

### Mengganti Foto
Saat ini foto memakai kotak placeholder bergradasi (belum ada foto asli).
Untuk memasang foto sungguhan:
1. Siapkan foto, simpan di folder yang sama (misalnya buat folder `assets/`).
2. Di `index.html`, ganti misalnya:
   ```html
   <div class="couple-frame__photo" data-placeholder="Foto Mempelai Pria"></div>
   ```
   menjadi:
   ```html
   <div class="couple-frame__photo" style="background-image:url('assets/pria.jpg'); background-size:cover; background-position:center;"></div>
   ```
3. Lakukan hal sama untuk foto mempelai wanita dan tiap `.gallery-item`
   di bagian galeri.

### Musik Latar
1. Siapkan file musik format `.mp3` (durasi pendek/instrumental disarankan).
2. Buat folder `assets/` di dalam folder undangan, letakkan file di sana
   dengan nama `music.mp3` (atau sesuaikan nama di tag `<source>` pada
   `index.html`).
3. Tombol lingkaran di pojok kanan bawah otomatis akan memutar/menjeda musik.

### Nama Tamu Personal (opsional)
Undangan mendukung penyebutan nama tamu lewat parameter URL, contoh:
```
https://domainanda.com/?to=Bapak+Budi+Santoso
```
Halaman pembuka otomatis menampilkan "Bapak Budi Santoso" sebagai
tujuan undangan. Jika parameter `?to=` tidak disertakan, akan tampil teks
default "Tamu Undangan".

---

## 3. Cara Mempublikasikan Website

Karena ini website statis (HTML/CSS/JS biasa), Anda bisa meng-hostingnya
gratis di beberapa layanan berikut. Pilih salah satu:

### Opsi A — Netlify (paling mudah, drag & drop)
1. Buka [app.netlify.com/drop](https://app.netlify.com/drop)
2. Seret (drag) seluruh folder undangan ke halaman tersebut
3. Netlify otomatis memberi URL publik, misalnya `nama-acak.netlify.app`
4. Bisa diganti ke domain sendiri lewat menu **Domain settings**

### Opsi B — GitHub Pages
1. Unggah seluruh isi folder ke sebuah repository GitHub
2. Buka **Settings → Pages**
3. Pilih branch `main` dan folder `/root`, klik **Save**
4. Website akan tersedia di `https://namauser.github.io/namarepo/`

### Opsi C — Vercel
1. Buat akun di [vercel.com](https://vercel.com)
2. **Add New → Project → Deploy** lalu unggah folder ini (atau hubungkan repo Git)
3. Vercel otomatis memberi URL publik

Setelah online, Anda bisa membagikan link tersebut lewat WhatsApp, dan
menambahkan `?to=Nama+Tamu` di akhir link untuk personalisasi tiap tamu.

---

## 4. Melihat & Mengekspor Data Buku Tamu

Karena semua ucapan tersimpan di Google Sheets, Anda bisa:
- Membukanya langsung dan menyortir/menyaring berdasarkan kolom **Kehadiran**
  untuk merekap jumlah tamu yang hadir/tidak hadir/masih ragu.
- Mengekspor ke Excel/PDF lewat menu **File → Download** di Google Sheets.
- Membuat rekap otomatis (misalnya pakai `COUNTIF`) di sheet lain dalam
  spreadsheet yang sama tanpa mengganggu sheet "Guestbook".

---

## 5. Catatan Teknis

- Website ini tidak memakai library eksternal apa pun selain Google Fonts
  (Cormorant Garamond, Alex Brush, Jost) — sepenuhnya HTML/CSS/JS murni.
- Pengiriman data ke Google Apps Script dilakukan dengan `Content-Type:
  text/plain` (bukan `application/json`) secara sengaja, agar browser tidak
  melakukan **CORS preflight request** — karena Google Apps Script Web App
  tidak menangani preflight `OPTIONS` secara default. Ini adalah teknik umum
  dan aman untuk kasus ini.
- Data yang dikirim tetap divalidasi & dibatasi panjangnya baik di sisi
  browser (`maxlength`) maupun di sisi server (`apps-script.gs`).
- Untuk menjaga privasi, jangan bagikan URL Web App Apps Script Anda secara
  publik di tempat lain selain di dalam `script.js`, karena siapa pun yang
  memiliki URL tersebut secara teknis bisa mengirim data ke sheet Anda
  (walau tidak bisa membaca/menghapus data lain). Jika ingin proteksi lebih
  ketat, tambahkan kolom "kata kunci acara" tersembunyi yang divalidasi di
  `doPost()`.
