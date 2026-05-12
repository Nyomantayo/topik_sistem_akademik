# Sistem KRS Akademik

Aplikasi web manajemen akademik modern untuk mengelola data **Mahasiswa**, **Dosen**, dan relasi **Dosen Pembimbing Akademik (PA)**. Dibangun dengan React + Golang Echo + MySQL + Redis menggunakan Clean Architecture.

---

## Fitur Utama

- **Autentikasi JWT** — Login, Register, ganti password, update profil
- **4 Mode Akses** — Admin, Mahasiswa, Dosen, dan Tamu (Guest)
- **CRUD Mahasiswa** — Tambah, edit, hapus, cari, pagination
- **CRUD Dosen** — Tambah, edit, hapus, cari, pagination
- **Relasi Dosen PA** — Setiap mahasiswa dapat memiliki satu Dosen Pembimbing Akademik
- **Profil Akademik** — Mahasiswa login dapat melihat data & Dosen PA-nya langsung di profil
- **Login sebagai Tamu** — Akses read-only daftar Mahasiswa & Dosen tanpa perlu akun
- **Dashboard Statistik** — Ringkasan jumlah mahasiswa, dosen, dan distribusi per jurusan
- **Redis Caching** — Cache TTL otomatis untuk performa query
- **Responsive UI** — Tampilan mobile-friendly dengan sidebar collapsible

---

## Tech Stack

| Lapisan    | Teknologi                                                          |
|------------|---------------------------------------------------------------------|
| Frontend   | React 18, Vite 5, TailwindCSS 3, React Router v6, Axios, Lucide React |
| Backend    | Go 1.21, Echo v4, go-playground/validator, godotenv               |
| Database   | MySQL 8.0, sqlx                                                     |
| Cache      | Redis 7, go-redis/v9                                               |
| Auth       | JWT HS256, bcrypt (cost=10)                                        |
| Container  | Docker, Docker Compose                                             |

---

## Arsitektur Sistem

```
┌──────────────────────────────────────────────────────┐
│                   CLIENT BROWSER                     │
│           React 18 + Vite + TailwindCSS              │
└───────────────────────┬──────────────────────────────┘
                        │ HTTP REST (JSON)
┌───────────────────────▼──────────────────────────────┐
│               BACKEND  (Go + Echo v4)                │
│                                                      │
│  Handler → Middleware (JWT / Role / DenyGuest)       │
│         → Service (Business Logic + Cache)           │
│         → Repository (sqlx + MySQL)                  │
└──────────┬───────────────────────────┬───────────────┘
           │ SQL                       │ Cache
┌──────────▼──────────┐   ┌───────────▼───────────────┐
│     MySQL 8.0       │   │        Redis 7             │
│  (Data Permanen)    │   │  (TTL Cache 2–10 menit)   │
└─────────────────────┘   └───────────────────────────┘
```

### Layer Backend

```
cmd/main.go
    ├── config          → Load .env, koneksi DB & Redis
    ├── internal/
    │   ├── domain      → Struct entitas (User, Dosen, Mahasiswa)
    │   ├── dto         → Request & Response DTO
    │   ├── repository  → Query SQL dengan sqlx
    │   ├── service     → Business logic + Redis caching
    │   ├── handler     → HTTP handler (Echo)
    │   ├── middleware  → JWT, RequireRole, DenyGuest
    │   └── routes      → Registrasi semua endpoint
    ├── pkg/
    │   ├── cache       → Redis wrapper (Get/Set/Delete/DeleteByPattern)
    │   ├── pagination  → Helper query page+limit+search
    │   └── response    → Standar JSON response helper
    └── utils           → JWT generate/parse, bcrypt hash/check
```

---

## Skema Database (ERD)

```
users                           dosen
─────                           ─────
id          PK                  id            PK
name                            user_id       FK → users.id (UNIQUE)
email       UNIQUE              nidn          UNIQUE
password    bcrypt              nama
role        admin/mahasiswa/    email         UNIQUE
            dosen/guest         prodi
created_at                      created_at
updated_at                      updated_at
                                     │ 1
                                     │
mahasiswa                            │ N
─────────                       ─────┘
id          PK
user_id     FK → users.id
nim         UNIQUE
nama
email       UNIQUE
jurusan
semester    1–14
dosen_pa_id FK → dosen.id (nullable)
created_at
updated_at
```

---

## Hak Akses Per Role

| Fitur                      | Admin | Dosen | Mahasiswa | Tamu |
|----------------------------|:-----:|:-----:|:---------:|:----:|
| Dashboard statistik        | ✅    | ✅    | ✅        | ❌   |
| Lihat daftar Mahasiswa     | ✅    | ✅    | ❌        | ✅   |
| Tambah / Edit / Hapus Mahasiswa | ✅ | ❌  | ❌        | ❌   |
| Lihat daftar Dosen         | ✅    | ✅    | ❌        | ✅   |
| Tambah / Edit / Hapus Dosen| ✅    | ❌    | ❌        | ❌   |
| Lihat mahasiswa bimbingan dosen | ✅ | ✅  | ❌        | ✅   |
| Profil akun (edit nama/password) | ✅ | ✅ | ✅       | ❌   |
| Profil akademik + Dosen PA | ❌    | ❌    | ✅        | ❌   |

> Tamu mendapat JWT sementara (TTL 2 jam) yang hanya berlaku untuk endpoint read-only.

---

## API Endpoints

### Authentication

| Method | Endpoint                    | Auth | Deskripsi                           |
|--------|-----------------------------|:----:|-------------------------------------|
| POST   | `/api/auth/register`        | ❌   | Buat akun baru (admin/mahasiswa/dosen) |
| POST   | `/api/auth/login`           | ❌   | Login, mendapat JWT                 |
| POST   | `/api/auth/guest`           | ❌   | Login sebagai tamu (JWT 2 jam)      |
| GET    | `/api/auth/profile`         | ✅   | Lihat profil sendiri                |
| PUT    | `/api/auth/profile`         | ✅   | Update nama profil                  |
| PUT    | `/api/auth/change-password` | ✅   | Ganti password                      |

### Dashboard

| Method | Endpoint               | Auth | Role         | Deskripsi          |
|--------|------------------------|:----:|:-------------|---------------------|
| GET    | `/api/dashboard/stats` | ✅   | Bukan tamu   | Statistik ringkasan |

### Mahasiswa

| Method | Endpoint               | Auth | Role         | Deskripsi                     |
|--------|------------------------|:----:|:-------------|-------------------------------|
| GET    | `/api/mahasiswa`       | ✅   | Semua        | List + search + pagination    |
| GET    | `/api/mahasiswa/me`    | ✅   | Mahasiswa    | Profil akademik milik sendiri |
| GET    | `/api/mahasiswa/:id`   | ✅   | Semua        | Detail satu mahasiswa         |
| POST   | `/api/mahasiswa`       | ✅   | Admin        | Tambah mahasiswa baru         |
| PUT    | `/api/mahasiswa/:id`   | ✅   | Admin        | Edit mahasiswa                |
| DELETE | `/api/mahasiswa/:id`   | ✅   | Admin        | Hapus mahasiswa               |

### Dosen

| Method | Endpoint                     | Auth | Role  | Deskripsi                  |
|--------|------------------------------|:----:|:------|----------------------------|
| GET    | `/api/dosen`                 | ✅   | Semua | List + search + pagination |
| GET    | `/api/dosen/:id`             | ✅   | Semua | Detail satu dosen          |
| GET    | `/api/dosen/:id/mahasiswa`   | ✅   | Semua | Daftar mahasiswa bimbingan |
| POST   | `/api/dosen`                 | ✅   | Admin | Tambah dosen baru          |
| PUT    | `/api/dosen/:id`             | ✅   | Admin | Edit dosen                 |
| DELETE | `/api/dosen/:id`             | ✅   | Admin | Hapus dosen                |

### Query Parameters (endpoint list)

| Parameter | Default | Contoh              |
|-----------|:-------:|---------------------|
| `page`    | `1`     | `?page=2`           |
| `limit`   | `10`    | `?limit=20`         |
| `search`  | `""`    | `?search=budi`      |

---

## Strategi Redis Cache

| Cache Key                             | TTL      | Dihapus saat                    |
|---------------------------------------|:--------:|---------------------------------|
| `mahasiswa:list:p=*:l=*:q=*`         | 5 menit  | Create / Update / Delete mahasiswa |
| `mahasiswa:{id}`                      | 10 menit | Update / Delete mahasiswa       |
| `dosen:list:p=*:l=*:q=*`            | 5 menit  | Create / Update / Delete dosen  |
| `dosen:{id}`                         | 10 menit | Update / Delete dosen           |
| `dosen:{id}:mahasiswa:p=*:l=*:q=*`  | 5 menit  | Create / Update / Delete mahasiswa |
| `dashboard:stats`                     | 2 menit  | Semua operasi CRUD              |

---

## Cara Menjalankan

### Prasyarat

- Go 1.21+
- Node.js 18+ dan npm
- MySQL 8.0+
- Redis 7+ (atau Docker)

> **Auto-Migration:** Backend secara otomatis membuat tabel dan seed data saat pertama kali dijalankan. Tidak perlu menjalankan file SQL secara manual.

---

### Opsi A — Docker Compose (Paling Mudah)

Docker Compose akan menjalankan MySQL, Redis, Backend, dan Frontend sekaligus.

```bash
# Clone / buka folder project
cd topik_sistem_akademik

# Build dan jalankan semua service
docker compose up -d --build

# Cek status semua container
docker compose ps

# Pantau log backend secara real-time
docker compose logs -f backend

# Hentikan semua service
docker compose down
```

Setelah berhasil:

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:3000        |
| Backend  | http://localhost:8080        |
| Health   | http://localhost:8080/health |

---

### Opsi B — Jalankan Manual (Development)

#### 1. Persiapkan Database MySQL

Buat database dan jalankan file migrasi:

```bash
# Linux / macOS
mysql -u root -p < backend/migrations/001_init.sql

# Windows (PowerShell / Command Prompt)
mysql -u root < backend\migrations\001_init.sql

# Atau masuk ke MySQL terlebih dahulu
mysql -u root -p
source backend/migrations/001_init.sql;
```

> Jika menggunakan **Laragon** (Windows), MySQL berjalan tanpa password untuk user `root`.
>
> **Alternatif:** Jika menjalankan backend via `go run`, migrasi akan otomatis dijalankan saat startup sehingga langkah ini bersifat opsional.

#### 2. Jalankan Redis

```bash
# Menggunakan Docker (cara termudah)
docker run -d --name krs-redis -p 6379:6379 redis:7-alpine

# Atau install Redis secara native dan jalankan
redis-server
```

#### 3. Setup dan Jalankan Backend

```bash
cd backend

# Install dependencies Go
go mod tidy

# Salin file konfigurasi
cp .env.example .env       # Linux/macOS
copy .env.example .env     # Windows

# Edit .env sesuai konfigurasi lokal Anda (lihat bagian Konfigurasi di bawah)

# Jalankan server
go run ./cmd/...
```

Server backend berjalan di: `http://localhost:8080`

#### 4. Setup dan Jalankan Frontend

```bash
cd frontend

# Install dependencies Node
npm install

# Jalankan development server
npm run dev
```

Aplikasi frontend berjalan di: `http://localhost:5173`

---

### Opsi C — Deploy ke Cloud (Railway + Vercel)

Backend di-deploy ke **Railway**, frontend di-deploy ke **Vercel**.

#### 1. Deploy Backend ke Railway

1. Push project ke **GitHub**
2. Buka [railway.com](https://railway.com) → **New Project** → pilih repo GitHub
3. Set **Root Directory** ke `backend`
4. Tambahkan plugin **MySQL** dan **Redis** di project Railway
5. Di service backend, buka tab **Variables** dan tambahkan:

| Variable | Value |
|----------|-------|
| `MYSQL_URL` | `${{MySQL.MYSQL_URL}}` |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` |
| `JWT_SECRET` | *(string acak yang kuat)* |
| `CORS_ORIGIN` | `https://nama-frontend.vercel.app` |
| `APP_ENV` | `production` |

> `PORT` otomatis disediakan Railway. `MYSQL_URL` dan `REDIS_URL` akan di-parse otomatis oleh backend.

6. Di tab **Settings** → **Networking** → klik **Generate Domain**
7. Database otomatis ter-migrate saat backend pertama kali start

#### 2. Deploy Frontend ke Vercel

1. Buka [vercel.com](https://vercel.com) → **New Project** → pilih repo GitHub
2. Set **Root Directory** ke `frontend`
3. Framework Preset: **Vite**
4. Di tab **Settings** → **Environment Variables**, tambahkan:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://nama-backend.up.railway.app/api` |

> **Penting:** Pastikan URL diawali dengan `https://` dan diakhiri dengan `/api`.

5. Deploy dan tunggu build selesai

---

## Konfigurasi

### Environment Variables — Backend (`backend/.env`)

```env
APP_PORT=8080
APP_ENV=development

# Koneksi MySQL (untuk development lokal)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=               # kosongkan jika Laragon tanpa password
DB_NAME=krs_db

# Koneksi Redis (untuk development lokal)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASS=            # kosongkan jika Redis tanpa password

# JWT
JWT_SECRET=ganti-ini-dengan-string-acak-yang-kuat
JWT_EXPIRY=24          # dalam jam

# CORS (sesuaikan dengan URL frontend, pisahkan dengan koma untuk multiple origins)
CORS_ORIGIN=http://localhost:5173
```

### Auto-Detect (Railway / Cloud)

Backend otomatis mendeteksi variabel dari platform cloud:

| Variabel Platform | Pengganti |
|-------------------|-----------|
| `MYSQL_URL` | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` |
| `REDIS_URL` | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASS` |
| `PORT` | `APP_PORT` |

Jika `MYSQL_URL` atau `REDIS_URL` tersedia, variabel individual tidak perlu di-set.

### Environment Variables — Frontend

| Variable | Default | Keterangan |
|----------|---------|------------|
| `VITE_API_URL` | `/api` | URL lengkap backend API (contoh: `https://backend.up.railway.app/api`) |

---

## Akun Demo

Akun berikut otomatis tersedia setelah backend pertama kali dijalankan (auto-migration):

| Role       | Email                         | Password       |
|------------|-------------------------------|----------------|
| Admin      | `admin2@krs.ac.id`            | `Admin@123`    |
| Dosen      | `dosen@krs.ac.id`             | `Dosen@123`    |
| Mahasiswa  | `mahasiswa@krs.ac.id`         | `Mahasiswa@123`|
| Tamu       | *(klik tombol "Masuk sebagai Tamu" di halaman login)* | — |

> Akun dosen terhubung ke record dosen **Dr. Budi Santoso, M.Kom**, dan akun mahasiswa terhubung ke record mahasiswa **Andi Pratama**.

Untuk membuat akun admin baru via API:

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Administrator",
    "email": "admin@kampus.ac.id",
    "password": "Password@123",
    "role": "admin"
  }'
```

---

## Struktur Folder

```
topsus_claude_krs/
│
├── backend/
│   ├── cmd/
│   │   └── main.go                   # Entry point server
│   ├── config/
│   │   └── config.go                 # Load env, init DB & Redis
│   ├── internal/
│   │   ├── domain/                   # Struct entitas murni
│   │   │   ├── user.go
│   │   │   ├── dosen.go
│   │   │   └── mahasiswa.go
│   │   ├── dto/                      # Data Transfer Objects
│   │   │   ├── auth_dto.go
│   │   │   ├── dosen_dto.go
│   │   │   └── mahasiswa_dto.go
│   │   ├── repository/               # Akses database (sqlx)
│   │   │   ├── user_repository.go
│   │   │   ├── dosen_repository.go
│   │   │   └── mahasiswa_repository.go
│   │   ├── service/                  # Business logic + caching
│   │   │   ├── auth_service.go
│   │   │   ├── dosen_service.go
│   │   │   ├── mahasiswa_service.go
│   │   │   └── dashboard_service.go
│   │   ├── handler/                  # HTTP handlers (Echo)
│   │   │   ├── auth_handler.go
│   │   │   ├── dosen_handler.go
│   │   │   ├── mahasiswa_handler.go
│   │   │   └── dashboard_handler.go
│   │   ├── middleware/
│   │   │   ├── jwt_middleware.go     # Validasi token Bearer
│   │   │   └── role_middleware.go    # RequireRole & DenyGuest
│   │   └── routes/
│   │       └── routes.go             # Registrasi semua route
│   ├── pkg/
│   │   ├── cache/
│   │   │   └── redis_cache.go        # Wrapper Get/Set/Delete/Pattern
│   │   ├── pagination/
│   │   │   └── pagination.go         # Helper page+limit+search
│   │   └── response/
│   │       └── response.go           # Standar JSON response
│   ├── utils/
│   │   ├── jwt.go                    # GenerateToken, ParseToken
│   │   └── hash.go                   # HashPassword, CheckPassword
│   ├── migrations/
│   │   ├── 001_init.sql              # Schema + data seed awal
│   │   └── migrations.go             # Auto-migration (embed SQL + run on startup)
│   ├── Dockerfile
│   ├── railway.json                  # Konfigurasi deploy Railway
│   ├── go.mod
│   ├── go.sum
│   ├── .env
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # State auth global (JWT, user, isGuest)
│   │   ├── services/                 # Pemanggilan API via Axios
│   │   │   ├── api.js                # Instance Axios + interceptor
│   │   │   ├── authService.js
│   │   │   ├── mahasiswaService.js
│   │   │   ├── dosenService.js
│   │   │   └── dashboardService.js
│   │   ├── routes/
│   │   │   └── index.jsx             # React Router + ProtectedRoute + NoGuestRoute
│   │   ├── layouts/
│   │   │   ├── AuthLayout.jsx        # Layout halaman login/register
│   │   │   └── DashboardLayout.jsx   # Layout app utama + guest banner
│   │   ├── components/               # Komponen UI reusable
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── DataTable.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   ├── StatCard.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   └── pages/
│   │       ├── LoginPage.jsx         # Form login + tombol tamu
│   │       ├── RegisterPage.jsx
│   │       ├── DashboardPage.jsx     # Statistik (admin/dosen/mahasiswa)
│   │       ├── MahasiswaPage.jsx     # CRUD mahasiswa
│   │       ├── DosenPage.jsx         # CRUD dosen + mahasiswa bimbingan
│   │       └── ProfilePage.jsx       # Edit profil + data akademik (mahasiswa)
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── vercel.json                   # SPA rewrite rule untuk Vercel
│   ├── Dockerfile
│   └── nginx.conf
│
└── docker-compose.yml
```

---

## Troubleshooting

**Backend gagal konek ke MySQL**
```
Error: dial tcp: connection refused
```
Pastikan MySQL berjalan dan konfigurasi `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` di `.env` sudah benar. Untuk Laragon, `DB_PASS` dibiarkan kosong.

---

**Backend gagal konek ke Redis**
```
Error: dial tcp: connection refused
```
Jalankan Redis terlebih dahulu. Cara cepat dengan Docker:
```bash
docker run -d --name krs-redis -p 6379:6379 redis:7-alpine
```

---

**Port sudah digunakan**
```
listen tcp :8080: bind: address already in use
```
Cari dan hentikan proses yang menggunakan port tersebut:
```bash
# Linux/macOS
lsof -ti:8080 | xargs kill -9

# Windows (PowerShell)
$pid = (Get-NetTCPConnection -LocalPort 8080).OwningProcess
Stop-Process -Id $pid -Force
```

---

**CORS error di browser**
Pastikan nilai `CORS_ORIGIN` di `.env` backend sama persis dengan URL frontend yang berjalan (termasuk port). Contoh: `CORS_ORIGIN=http://localhost:5173`.

---

**Login tamu tidak bisa akses dashboard**
Ini adalah perilaku yang disengaja. Tamu hanya dapat mengakses halaman **Mahasiswa** dan **Dosen**. Untuk akses penuh, gunakan akun yang terdaftar.

---

## Pengembangan Lanjutan (Ide)

- [ ] Fitur KRS — mahasiswa memilih mata kuliah per semester
- [ ] Notifikasi — jadwal pertemuan PA via email/in-app
- [ ] Export data — download daftar mahasiswa ke CSV/Excel
- [ ] Audit log — rekam siapa mengubah data apa dan kapan
- [ ] Rate limiting — proteksi endpoint dari request berlebihan
- [ ] Refresh token — perpanjang sesi tanpa login ulang
- [ ] Unit & integration tests

---

## Lisensi

Project ini dibuat untuk keperluan akademik (Topik Khusus). Bebas digunakan dan dimodifikasi untuk tujuan pembelajaran.
