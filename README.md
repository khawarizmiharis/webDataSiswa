# Katalog Data Siswa

Aplikasi ini menggunakan React untuk antarmuka dan Node.js + Express untuk API serta penyimpanan data.

## Struktur folder

```text
KATALOG_DATA_SISWA/
├── client/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx       # Katalog pengguna dan dashboard admin
│       ├── main.jsx      # Bootstrap React
│       └── styles.css    # Tampilan responsif
├── server/
│   ├── data/
│   │   └── students.json # Data siswa persisten, dibuat otomatis saat server pertama kali berjalan
│   └── index.js          # API, autentikasi sesi, dan CRUD
├── .env.example          # Contoh konfigurasi login admin
├── package.json
└── README.md
```

## Menjalankan aplikasi

Pastikan Node.js dan npm sudah terpasang, lalu jalankan dari folder proyek:

```powershell
npm install
Copy-Item .env.example .env
```

Ubah nilai `ADMIN_USERNAME` dan `ADMIN_PASSWORD` di `.env`, lalu isi `SESSION_SECRET` dengan rahasia acak minimal 32 karakter. Contoh membuat rahasia sesi di PowerShell:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Jangan bagikan atau commit file `.env`. Setelah konfigurasi selesai, jalankan:

```powershell
npm run dev
```

Buka alamat Vite yang ditampilkan (biasanya `http://localhost:5173`). Server API berjalan pada `http://localhost:3001`.

Untuk produksi, jalankan `npm run build`, kemudian `npm start`; server Node.js menyajikan hasil build React dari port `3001` (atau port pada variabel `PORT`).

## Fitur

- **Pengguna**: lihat katalog siswa dan cari berdasarkan nama, NIS, kelas, atau jurusan.
- **Admin**: wajib login sebelum membuka dashboard atau melakukan operasi tambah, edit, dan hapus; NIS duplikat ditolak.
- Sesi admin memakai cookie `HttpOnly`, `SameSite=Strict`, berumur 8 jam, dan dibatasi lima percobaan login gagal dalam 15 menit.
- Data disimpan oleh server pada `server/data/students.json`, bukan di penyimpanan browser.
- Jika file atau folder data belum ada, server membuat katalog kosong saat startup. File data lokal tetap dikecualikan dari Git.

**Catatan:** Kredensial admin diatur melalui `.env`; endpoint CRUD dilindungi di server, bukan hanya di tampilan. Gunakan HTTPS saat produksi. Untuk penggunaan nyata, pertimbangkan basis data terkelola dan kebijakan keamanan yang sesuai untuk data pribadi siswa.
