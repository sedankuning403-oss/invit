# Undangan Pernikahan "Royal Javanese" — Dokumentasi

Undangan web single-page (HTML/CSS/JS murni, tanpa framework) dengan tema
gapura/gate Jawa klasik, lengkap dengan buku tamu yang tersinkronisasi ke
Google Sheets.

## Isi Paket

| File | Fungsi |
|---|---|
| `index.html` | Struktur halaman (cover, mempelai, acara, galeri, hadiah, RSVP, dst) |
| `style.css` | Seluruh desain visual (warna, tipografi, animasi) |
| `script.js` | Semua konten dinamis (CONFIG), countdown, dan koneksi ke Google Sheets |
| `apps-script.gs` | Kode backend yang ditempel ke Google Apps Script |
| `DOKUMENTASI.md` | Berkas ini |

---

## 1. Menjalankan di Lokal

Karena ini murni HTML/CSS/JS, cukup buka `index.html` langsung di browser,
atau jalankan local server sederhana agar `fetch()` ke Google Sheets
berjalan normal (disarankan, beberapa browser membatasi `fetch` dari `file://`):

```bash
cd undangan-royal-javanese
python3 -m http.server 8000
# lalu buka http://localhost:8000
```

---

## 2. Mengganti Konten (Nama, Tanggal, Rekening, dll)

Semua yang perlu diedit ada di **dua tempat**:

**a. `script.js` → objek `CONFIG` di bagian paling atas file**
- `weddingDateISO` — tanggal & jam akad (dipakai countdown & label tanggal cover)
- `calendar` — data untuk tombol "Tambahkan ke Kalender"
- `gallery` — array warna/gambar galeri (ganti dengan URL foto asli)
- `audioSrc` — URL musik latar (opsional)
- `GSHEET_URL` — URL Web App Google Sheets (lihat bagian 3)

**b. `index.html` — teks langsung**
- Nama mempelai, nama orang tua, alamat acara, nomor rekening, link
  YouTube/Instagram/Zoom, dan alamat pengiriman hadiah ditulis langsung
  di HTML karena sifatnya teks panjang. Cari dan ganti sesuai kebutuhan
  (semua sudah diberi contoh data agar mudah diikuti polanya).

Untuk mengganti nama tamu secara personal per-link, gunakan parameter URL:

```
https://domainanda.com/?to=Bapak+Slamet
```

Nama tamu akan otomatis muncul di layar cover.

---

## 3. Menghubungkan Buku Tamu ke Google Sheets

Buku tamu (form RSVP + ucapan) tersambung ke Google Sheets lewat
**Google Apps Script** sebagai jembatan API, tanpa perlu server sendiri.

### Langkah 1 — Buat Google Sheet
1. Buka [sheets.google.com](https://sheets.google.com), buat spreadsheet baru.
2. Beri nama bebas, misalnya "Buku Tamu — Raras & Bagus".
3. Tidak perlu membuat header manual — script akan membuatnya otomatis.

### Langkah 2 — Tempel Kode Apps Script
1. Di spreadsheet, buka menu **Extensions > Apps Script**.
2. Hapus semua kode default di editor (`function myFunction() {}` dst).
3. Buka file `apps-script.gs` dari paket ini, salin seluruh isinya, dan
   tempel ke editor Apps Script.
4. Klik ikon disket (Simpan project), beri nama misalnya "Guestbook API".

### Langkah 3 — Deploy sebagai Web App
1. Klik tombol **Deploy > New deployment**.
2. Klik ikon gerigi di samping "Select type", pilih **Web app**.
3. Isi:
   - **Description**: bebas, misal "Guestbook v1"
   - **Execute as**: `Me (email Anda)`
   - **Who has access**: `Anyone`
     (wajib "Anyone", bukan "Anyone with Google account", agar tamu tanpa
     login Google tetap bisa mengirim ucapan)
4. Klik **Deploy**.
5. Google akan meminta otorisasi izin akses — klik **Authorize access**,
   pilih akun Anda, lalu klik **Advanced > Go to (nama project) (unsafe)**
   → **Allow**. (Ini normal karena script belum diverifikasi Google,
   dan aman karena Anda sendiri pembuatnya.)
6. Setelah deploy selesai, salin **Web app URL** yang muncul
   (bentuknya seperti `https://script.google.com/macros/s/AKfycb.../exec`).

### Langkah 4 — Sambungkan ke Website
1. Buka `script.js`.
2. Isi `GSHEET_URL` dengan URL yang disalin tadi:
   ```js
   GSHEET_URL: "https://script.google.com/macros/s/AKfycbXXXXXXXX/exec",
   ```
3. Simpan, refresh halaman. Form RSVP & buku tamu kini sudah aktif.

### Menguji Koneksi
- Isi form RSVP di halaman, klik **Kirim Ucapan**.
- Cek spreadsheet — baris baru otomatis muncul di sheet "Guestbook".
- Refresh halaman — ucapan yang baru dikirim akan tampil di daftar
  "Buku Tamu" (ambil data lewat `?action=list`).

### Memperbarui Kode Setelah Deploy
Jika Anda mengedit `apps-script.gs` di kemudian hari (misalnya menambah
kolom), URL Web App **tidak berubah** selama Anda memilih:
**Deploy > Manage deployments > ikon pensil > Version: New version > Deploy**.
Membuat *deployment baru* (bukan "manage") akan menghasilkan URL baru dan
mengharuskan Anda memperbarui `GSHEET_URL` lagi.

---

## 4. Menghosting Website

Karena hanya file statis, bisa dihosting gratis di:

- **GitHub Pages** — push folder ini ke repo GitHub, aktifkan Pages di
  Settings > Pages, pilih branch `main`.
- **Netlify / Vercel** — drag-and-drop folder ke dashboard mereka.
- **Domain sendiri** — upload lewat FTP/cPanel ke `public_html`.

Tidak ada proses build; upload apa adanya.

---

## 5. Kustomisasi Desain

Semua warna dan jarak ada di `:root` pada `style.css`:

```css
--maroon-deep:#3D0C1B;  /* warna dasar gelap */
--maroon:#5B1526;       /* warna aksen utama */
--gold:#C9A24B;         /* warna garis ornamen & tombol */
--gold-light:#E8CD8A;   /* warna teks terang di atas maroon */
--cream:#F7F0DE;        /* warna latar konten */
```

Ganti nilai hex ini untuk mengubah keseluruhan palet tanpa menyentuh
bagian lain dari CSS.

Motif gapura (gate) di cover dan penutup adalah SVG murni di dalam
`index.html` (elemen `.gate-svg`), dianimasikan lewat `stroke-dashoffset`
di CSS (`@keyframes draw-gate`). Bentuknya bisa disesuaikan langsung di
path SVG jika ingin ornamen berbeda.

---

## 6. Troubleshooting

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| Ucapan tidak muncul setelah dikirim | `GSHEET_URL` belum diisi | Isi sesuai Langkah 4 di atas |
| Error "Failed to fetch" di console | Deployment "Who has access" bukan "Anyone" | Ubah setting akses lalu buat versi deployment baru |
| Sheet tidak bertambah baris baru | Salah tempel kode, atau sheet name berubah | Pastikan `apps-script.gs` ditempel utuh, `SHEET_NAME` tetap "Guestbook" |
| Countdown menampilkan 00 semua | `weddingDateISO` sudah lewat dari tanggal hari ini | Perbarui tanggal di `CONFIG` |
| Musik tidak bisa autoplay | Kebijakan browser memblokir autoplay tanpa interaksi | Musik baru diputar setelah tombol "Buka Undangan" ditekan (sudah dihandle) |

---

Dibuat oleh 296 Studios.
