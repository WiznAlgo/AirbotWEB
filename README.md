# AirBot Panel

Website login (satu akun) untuk mengakses 2 bot WhatsApp sekaligus:

- **Bot A — Barcode** (`bc.radenunlock.com/api`)
- **Bot B — CEIR** (`cr.radenunlock.com/api`)

Fitur: dashboard per bot, console command (preview/kirim), riwayat perintah,
riwayat isi saldo (tanpa menampilkan siapa yang mengisi), dan halaman profile
(saldo Bot A + Bot B, ganti password).

## Arsitektur singkat

```
Browser (React/Vite)  ──fetch same-origin──>  Express (server/server.js)  ──master token──>  Bot A / Bot B REST API
        │                                              │
   cookie sesi httpOnly                        session di memori server
   (tidak pernah pegang token bot)              (jid tersimpan di sini)
```

Kenapa lewat backend sendiri, bukan langsung dari browser ke API bot?
Karena endpoint seperti `/history/saldo`, `/history/pemakaian`, `/users`, `/db`,
`/raw` di kedua bot **mengembalikan data SEMUA user** kalau dipanggil dengan
token apapun yang valid (tidak ada scoping per-user di sisi bot). Supaya
"tiap user cuma lihat data dirinya sendiri" benar-benar terjamin, penyaringan
harus terjadi di server yang kita kendalikan (`server/lib/botApi.js`), bukan
di kode yang jalan di browser orang lain.

Login tetap memakai sistem login bawaan tiap bot (`POST /login` dengan
username + password yang sama seperti dipakai untuk daftar/login lewat
WhatsApp) — hanya dipakai untuk **verifikasi password**. Di layar login, user
memilih dulu mau masuk lewat Bot A (Barcode) atau Bot B (CEIR); password
diverifikasi hanya ke bot yang dipilih itu. Setelah berhasil, panel otomatis
mengecek juga apakah akun yang sama terdaftar di bot satunya (pakai token
master, tanpa perlu password cocok), supaya saldo/riwayat bot satunya tetap
tampil kalau memang ada. Setelah login, panel memakai token master (rahasia,
hanya di server) untuk mengambil & menyaring semua data sesuai jid yang login.

## Struktur folder

```
├── api/
│   └── index.js             Entry point khusus Vercel (serverless function)
├── server/                   Backend Express (API + auth + proxy ke bot)
│   ├── app.js                Definisi Express app + semua route (dipakai bersama)
│   ├── server.js             Entry point untuk lokal/VPS (app.listen)
│   ├── config.js             Konfigurasi (token, base URL) - edit di sini
│   └── lib/
│       ├── botApi.js         Semua panggilan ke REST API bot + penyaringan data
│       ├── session.js        Encode/decode sesi (stateless, disimpan di cookie)
│       ├── authMiddleware.js
│       └── jid.js            Normalisasi & pencocokan JID
├── src/                       Frontend React + Vite + Tailwind
│   ├── App.tsx                Orchestrator: auth flow, status check, routing antar halaman
│   ├── main.tsx
│   ├── types.ts
│   ├── constants.ts           Branding, kredit developer, kontak bot (RadenUnlock/WiznAlgo)
│   ├── lib/
│   │   ├── api.ts             Fetch wrapper ke backend
│   │   ├── format.ts          formatRupiah, groupCount, dll
│   │   ├── media.ts           extractOutputs + download/zip media
│   │   ├── theme.ts           Hook dark/light mode (localStorage)
│   │   └── utils.ts           cn() (clsx + tailwind-merge)
│   ├── components/
│   │   ├── AppShell.tsx       Sidebar, header, bot switcher, toggle dark mode
│   │   ├── ui.tsx             Card, LoadingSpinner, EmptyState, StatusDot
│   │   ├── Footer.tsx         Footer "Powered by/Developed by" di semua halaman
│   │   ├── ErrorBoundary.tsx  Fallback UI kalau ada crash tak terduga
│   │   ├── JsonViewer.tsx
│   │   └── MediaViewer.tsx
│   └── pages/
│       ├── LoginScreen.tsx
│       ├── MaintenancePage.tsx  Halaman kalau semua bot API down
│       ├── AboutPage.tsx        Halaman "Tentang" (fitur, versi, kredit)
│       ├── Dashboard.tsx
│       ├── Console.tsx
│       ├── History.tsx
│       ├── Saldo.tsx
│       └── Profile.tsx
├── vercel.json                Konfigurasi build & routing untuk Vercel
├── .env.example                Contoh konfigurasi (salin jadi .env)
└── package.json
```

## Fitur tambahan (branding, UI/UX, reliability)

- **Footer di semua halaman**: "Powered by RadenUnlock · Developed by WiznAlgo" (link ke GitHub). Edit di `src/constants.ts`.
- **Halaman About** (`/` → menu "Tentang" di sidebar): deskripsi, daftar fitur, versi, dan kredit developer dengan tombol GitHub/WhatsApp/Email.
- **Dark mode**: tombol toggle di sidebar (ikon bulan/matahari), tersimpan di localStorage browser, otomatis mengikuti preferensi sistem saat pertama kali dibuka.
- **Halaman Maintenance**: kalau KEDUA bot API tidak bisa dihubungi sama sekali, panel otomatis menampilkan halaman "Layanan sedang tidak tersedia" (bukan halaman rusak/blank), lengkap dengan status per bot dan tombol "Coba Lagi".
- **Error Boundary**: kalau ada error tak terduga di React, muncul layar fallback yang rapi dengan tombol "Muat Ulang", bukan halaman putih kosong.
- **Animasi tombol Execute** di Console: `Execute → Running... → Done → kembali ke Execute` setiap kali command dijalankan.
- **Kode di-refactor** dari 1 file besar menjadi modul-modul kecil per halaman/komponen (lihat Struktur folder), supaya lebih mudah dikembangkan ke depannya. Tidak ada perubahan pada logic/endpoint API bot.



Buka `server/config.js`, isi 2 token di bagian atas file:

```js
barcode: {
  baseUrl: "https://bc.radenunlock.com/api",
  apiToken: "PASTE_TOKEN_MASTER_BOT_BARCODE_DI_SINI", // <- isi ini
},
ceir: {
  baseUrl: "https://cr.radenunlock.com/api",
  apiToken: "PASTE_TOKEN_MASTER_BOT_CEIR_DI_SINI", // <- isi ini
},
```

Token-nya diambil dari `config.api.authToken` di masing-masing project bot
kamu. Boleh juga ganti `sessionSecret` dengan string acak bebas (tidak wajib,
tapi lebih aman kalau diganti dari default).

⚠️ **Token ini kunci master** yang bisa baca/ubah data semua user di bot
terkait. Aman-aman saja disimpan langsung di file ini SELAMA repo/project
kamu tidak publik atau dibagikan ke orang lain. Kalau nanti repo GitHub-nya
public, pindahkan ke Environment Variables (lihat bagian bawah) supaya token
tidak ikut ke-commit ke git.

## Deploy ke Vercel

Project ini sudah disiapkan untuk Vercel (lihat `vercel.json` + `api/index.js`).

### Cara paling simpel: Vercel CLI (gak perlu GitHub sama sekali)

1. Isi `server/config.js` seperti di atas.
2. Install Vercel CLI sekali saja: `npm install -g vercel`
3. Di folder project ini, jalankan:
   ```bash
   vercel
   ```
   Ikuti pertanyaannya (login/daftar kalau belum, pilih nama project, dsb).
4. Kalau sudah oke, deploy ke production dengan:
   ```bash
   vercel --prod
   ```

Cara ini paling aman untuk simpan token langsung di `config.js`, karena file
kamu di-upload langsung ke Vercel tanpa lewat GitHub — jadi tidak ada risiko
token ke-expose di repo publik.

### Alternatif: lewat GitHub

1. Isi `server/config.js` seperti di atas.
2. Push folder ini ke repo GitHub (**private**, karena `config.js` berisi
   token master).
3. Di Vercel dashboard → **New Project** → import repo ini. Framework preset
   boleh dibiarkan "Other" (build command & output directory sudah diatur
   lewat `vercel.json`).
4. Deploy — tidak perlu mengisi apapun di tab Environment Variables.

Kalau nanti butuh custom domain, tinggal tambahkan lewat tab **Domains** di
project Vercel-nya, seperti biasa.

### Opsi: pakai Environment Variables (kalau repo public)

Kalau suatu saat repo-nya jadi public dan kamu tidak mau token ikut
ter-commit, kosongkan isi token di `server/config.js` (biarkan placeholder),
lalu isi Environment Variables di Vercel dashboard dengan nama persis seperti
di `.env.example` (`BOT_BARCODE_API_TOKEN`, `BOT_CEIR_API_TOKEN`, dst) — nilai
dari sana otomatis dipakai duluan, menimpa isi `config.js`.

## Menjalankan secara lokal (opsional, kalau punya VPS/komputer sendiri)

1. Install dependency:
   ```bash
   npm install
   ```
2. Isi `server/config.js` (lihat bagian Konfigurasi di atas) kalau belum.
3. Jalankan backend + frontend bersamaan:
   ```bash
   npm run dev
   ```
   - Frontend (Vite) di `http://localhost:3000`
   - Backend (Express API) di `http://localhost:4000`
   - Vite otomatis meneruskan semua request `/api/*` ke backend (lihat
     `vite.config.ts`), jadi cukup buka `http://localhost:3000` di browser.

**Catatan:** AI Studio preview hanya menjalankan bagian frontend (Vite), jadi
panggilan `/api/*` tidak akan berfungsi kalau di-preview di sana. Untuk
mencoba fungsi login/data secara nyata, pakai `npm run dev` di komputer/VPS
sendiri, atau langsung deploy ke Vercel.

## Build manual untuk production (VPS, bukan Vercel)

```bash
npm run build   # menghasilkan folder dist/
npm start        # menjalankan server/server.js, yang otomatis menyajikan dist/ + API
```

Setelah `npm run build`, satu proses `node server/server.js` sudah cukup
untuk melayani seluruh website (tidak perlu proses Vite lagi).

## Catatan keamanan & batasan yang perlu diketahui

- **Password beda antar bot**: saat login kamu pilih dulu mau lewat Bot A
  atau Bot B, dan password diverifikasi ke bot itu saja. Data bot satunya
  tetap ditampilkan (dicek keberadaannya lewat token master), jadi walau
  password Bot A & Bot B beda, saldo/riwayat keduanya tetap muncul. Ganti
  password lewat halaman **Profile** akan menyamakan password di kedua bot
  sekaligus untuk ke depannya.
- **Sesi login stateless**: data sesi (jid, nama, username, access) disimpan
  langsung di dalam cookie yang ditandatangani (signed), bukan di memori
  server. Ini sengaja dibuat begitu supaya kompatibel dengan serverless
  (Vercel dkk) yang bisa memproses tiap request di instance berbeda-beda.
  Cookie tidak terenkripsi (hanya anti-tamper), jadi jangan pernah ubah kode
  ini untuk menaruh password/data sensitif lain ke dalamnya.
- **Rate limit login**: dibatasi 20 percobaan / 15 menit per IP untuk
  mengurangi brute-force (disimpan di memori proses, jadi di lingkungan
  serverless batasnya best-effort per instance, bukan strict global).
- **Field "eksekutor"**: sengaja dihapus sebelum data riwayat saldo dikirim
  ke frontend (sesuai permintaan: siapa yang mengisi saldo tidak ditampilkan).

## Belum termasuk (bisa ditambah kalau perlu)

- Halaman admin untuk melihat semua user (sengaja tidak dibuat, karena bot
  API tidak scoping data — kalau dibutuhkan, ini perlu dirancang terpisah
  dengan role/permission yang jelas).
- Notifikasi/alert saat saldo hampir habis.
- Export riwayat ke Excel/PDF.
