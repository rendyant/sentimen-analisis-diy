# Sentimen Analisis Pelayanan Publik DIY

Sistem agregasi ulasan multi-platform (Google Maps, Berita, Media Sosial) dan analisis sentimen berbasis AI untuk 24 Organisasi Perangkat Daerah (OPD) Pemerintah Daerah Istimewa Yogyakarta.

## Struktur Direktori

```text
sentimen-analisis-diy/
├── backend/                # Server API FastAPI (Scraping, AI Analysis, Auth & Manajemen OPD)
│   ├── ai/                 # Modul analisis sentimen & rekomendasi AI (Gemini)
│   ├── database/           # Koneksi database & model SQLAlchemy (Review, UserAccount, OPD)
│   ├── routers/            # Endpoint API (reviews, analyze, scraper, users/auth/admin)
│   ├── scrapers/           # Modul scraping (maps, news, social)
│   ├── config.py           # Konfigurasi & daftar 24 instansi OPD DIY
│   ├── main.py             # Entrypoint utama FastAPI (Port 8000)
│   └── scheduler.py        # Penjadwalan scraping otomatis
│
├── frontend/               # Aplikasi Web Next.js (Dashboard Admin & OPD)
│   ├── app/
│   │   ├── (admin)/admin/  # Halaman Super Admin (Dashboard, Ulasan, Analisis, Manajemen User, Pengaturan)
│   │   ├── (auth)/         # Halaman Login (/login) & Registrasi OPD (/daftar)
│   │   ├── (user)/         # Halaman User OPD (Dashboard, Ulasan, Analisis, Pengaturan)
│   │   ├── api/auth/       # Endpoint autentikasi sesi Next.js
│   │   └── laporan/        # Halaman cetak laporan
│   ├── components/
│   │   ├── ai/             # Komponen AI Insight & AI Action Plans
│   │   ├── dashboard/      # Komponen Statistik, Grafik Sentimen, Platform, Wordcloud, Aspek
│   │   ├── layout/         # Sidebar & Header (User OPD & Admin)
│   │   └── ulasan/         # Tabel Ulasan Terbaru & Ulasan Negatif
│   ├── lib/                # Helper API client, autentikasi JWT, & Prisma
│   └── prisma/             # Skema database lokal Next.js
│
└── design/                 # Referensi desain UI/UX
```

## Cara Menjalankan Proyek

### 1. Jalankan Backend (FastAPI - Port 8000)

```powershell
cd backend
.\venv\Scripts\activate
python main.py
```
- API berjalan di: `http://localhost:8000`
- Dokumentasi Swagger UI: `http://localhost:8000/docs`

### 2. Jalankan Frontend (Next.js - Port 3000)

Buka terminal baru:
```powershell
cd frontend
npm run dev
```
- Website dapat diakses di: `http://localhost:3000`

### Akun Login Default (Siap Pakai)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin DIY** | `admin@jogjaprov.go.id` | `password123` |
| **Admin OPD (Dikpora)** | `user@dikpora.go.id` | `password123` |
