# Sistem KRS Akademik

Aplikasi web manajemen akademik modern untuk mengelola data **Mahasiswa**, **Dosen**, dan relasi **Dosen Pembimbing Akademik (PA)**. Dibangun dengan Go Echo backend + tiga varian frontend, MySQL, dan Redis.

---

## Fitur Utama

- **Autentikasi JWT** — Login, Register, ganti password, update profil
- **4 Mode Akses** — Admin, Mahasiswa, Dosen, dan Tamu (Guest)
- **CRUD Mahasiswa** — Tambah, edit, hapus, cari, pagination
- **CRUD Dosen** — Tambah, edit, hapus, cari, pagination
- **Relasi Dosen PA** — Setiap mahasiswa dapat memiliki satu Dosen Pembimbing Akademik
- **Profil Akademik** — Mahasiswa login dapat melihat data & Dosen PA-nya langsung di dashboard
- **Login sebagai Tamu** — Akses read-only daftar Mahasiswa & Dosen tanpa perlu akun
- **Dashboard Statistik** — Ringkasan jumlah mahasiswa, dosen, dan distribusi per jurusan
- **Redis Caching** — Cache TTL otomatis untuk performa query

---

## Varian Frontend

Project ini memiliki **tiga varian frontend** yang semuanya terhubung ke backend Go yang sama:

| Varian | Teknologi | Port | Folder |
|--------|-----------|:----:|--------|
| **Original** | React 18 + Vite + TailwindCSS | 3000 | `frontend/` |
| **AdminLTE** | Bootstrap 4 + jQuery + AdminLTE 3 | 3001 | `frontend-refactor-adminLTE/` |
| **Bootswatch Brite** | Bootstrap 5 + iziToast (tanpa jQuery) | 3002 | `frontend-refactor-brite/` |

Ketiganya berjalan bersamaan via Docker Compose dan berbagi satu backend API.

---

## Tech Stack

| Lapisan | Teknologi |
|---------|-----------|
| **Backend** | Go 1.21, Echo v4, go-playground/validator, godotenv |
| **Database** | MySQL 8.0, sqlx |
| **Cache** | Redis 7, go-redis/v9 |
| **Auth** | JWT HS256, bcrypt (cost=10) |
| **Frontend 1** | React 18, Vite 5, TailwindCSS 3, React Router v6, Axios |
| **Frontend 2** | AdminLTE 3.2, Bootstrap 4, jQuery 3, Toastr |
| **Frontend 3** | Bootstrap 5, Bootswatch Brite (CDN), iziToast (tanpa jQuery) |
| **Container** | Docker, Docker Compose, nginx:alpine |

---

## Arsitektur Sistem

```
                    ┌─────────────────────┐
                    │   CLIENT BROWSER    │
                    │                     │
   :3000 ──────────►│  React + TailwindCSS│
   :3001 ──────────►│  AdminLTE (BS4+JQ)  │
   :3002 ──────────►│  Bootswatch Brite   │
                    └──────────┬──────────┘
                               │ /api/ (proxied via nginx)
                    ┌──────────▼──────────────────┐
                    │  BACKEND  (Go + Echo v4)     │
                    │                              │
                    │  Handler → Middleware (JWT)  │
                    │    → Service (Logic+Cache)   │
                    │    → Repository (sqlx)       │
                    └──────────┬──────────┬────────┘
                               │ SQL      │ Cache
                    ┌──────────▼──┐  ┌────▼──────────┐
                    │  MySQL 8.0  │  │   Redis 7      │
                    │ (Permanen)  │  │ (TTL 2–10 min) │
                    └─────────────┘  └───────────────┘
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

| Fitur | Admin | Dosen | Mahasiswa | Tamu |
|-------|:-----:|:-----:|:---------:|:----:|
| Dashboard statistik | ✅ | ✅ | ✅ | ❌ |
| Lihat daftar Mahasiswa | ✅ | ✅ | ❌ | ✅ |
| Tambah / Edit / Hapus Mahasiswa | ✅ | ❌ | ❌ | ❌ |
| Lihat daftar Dosen | ✅ | ✅ | ❌ | ✅ |
| Tambah / Edit / Hapus Dosen | ✅ | ❌ | ❌ | ❌ |
| Lihat mahasiswa bimbingan dosen | ✅ | ✅ | ❌ | ✅ |
| Profil akun (edit nama/password) | ✅ | ✅ | ✅ | ❌ |
| Profil akademik + Dosen PA | ❌ | ❌ | ✅ | ❌ |

> Tamu mendapat JWT sementara (TTL 2 jam) yang hanya berlaku untuk endpoint read-only.

---

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|:----:|-----------|
| POST | `/api/auth/register` | ❌ | Buat akun baru |
| POST | `/api/auth/login` | ❌ | Login, mendapat JWT |
| POST | `/api/auth/guest` | ❌ | Login sebagai tamu (JWT 2 jam) |
| GET | `/api/auth/profile` | ✅ | Lihat profil sendiri |
| PUT | `/api/auth/profile` | ✅ | Update nama profil |
| PUT | `/api/auth/change-password` | ✅ | Ganti password |

### Dashboard

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|:----:|:-----|-----------|
| GET | `/api/dashboard/stats` | ✅ | Bukan tamu | Statistik ringkasan |

### Mahasiswa

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|:----:|:-----|-----------|
| GET | `/api/mahasiswa` | ✅ | Semua | List + search + pagination |
| GET | `/api/mahasiswa/me` | ✅ | Mahasiswa | Profil akademik milik sendiri |
| GET | `/api/mahasiswa/:id` | ✅ | Semua | Detail satu mahasiswa |
| POST | `/api/mahasiswa` | ✅ | Admin | Tambah mahasiswa baru |
| PUT | `/api/mahasiswa/:id` | ✅ | Admin | Edit mahasiswa |
| DELETE | `/api/mahasiswa/:id` | ✅ | Admin | Hapus mahasiswa |

### Dosen

| Method | Endpoint | Auth | Role | Deskripsi |
|--------|----------|:----:|:-----|-----------|
| GET | `/api/dosen` | ✅ | Semua | List + search + pagination |
| GET | `/api/dosen/:id` | ✅ | Semua | Detail satu dosen |
| GET | `/api/dosen/:id/mahasiswa` | ✅ | Semua | Daftar mahasiswa bimbingan |
| POST | `/api/dosen` | ✅ | Admin | Tambah dosen baru |
| PUT | `/api/dosen/:id` | ✅ | Admin | Edit dosen |
| DELETE | `/api/dosen/:id` | ✅ | Admin | Hapus dosen |

### Query Parameters (endpoint list)

| Parameter | Default | Contoh |
|-----------|:-------:|--------|
| `page` | `1` | `?page=2` |
| `limit` | `10` | `?limit=20` |
| `search` | `""` | `?search=budi` |

---

## Strategi Redis Cache

| Cache Key | TTL | Dihapus saat |
|-----------|:---:|--------------|
| `mahasiswa:list:p=*:l=*:q=*` | 5 menit | Create / Update / Delete mahasiswa |
| `mahasiswa:{id}` | 10 menit | Update / Delete mahasiswa |
| `dosen:list:p=*:l=*:q=*` | 5 menit | Create / Update / Delete dosen |
| `dosen:{id}` | 10 menit | Update / Delete dosen |
| `dosen:{id}:mahasiswa:p=*:l=*:q=*` | 5 menit | Create / Update / Delete mahasiswa |
| `dashboard:stats` | 2 menit | Semua operasi CRUD |

---

## Cara Menjalankan

### Opsi A — Docker Compose (Paling Mudah)

Docker Compose menjalankan MySQL, Redis, Backend, dan **ketiga frontend** sekaligus.

```bash
# Clone project
git clone https://github.com/Nyomantayo/topik_sistem_akademik.git
cd topik_sistem_akademik

# Build dan jalankan semua service
docker compose up -d --build

# Cek status semua container
docker compose ps

# Pantau log backend
docker compose logs -f backend

# Hentikan semua service
docker compose down
```

Setelah berhasil:

| Service | URL | Keterangan |
|---------|-----|-----------|
| Frontend React | http://localhost:3000 | Original (React + Tailwind) |
| Frontend AdminLTE | http://localhost:3001 | Refactor (Bootstrap 4 + jQuery) |
| Frontend Brite | http://localhost:3002 | Refactor (Bootstrap 5, no jQuery) |
| Backend API | http://localhost:8080 | Go Echo API |
| Health Check | http://localhost:8080/health | Status backend |

---

### Opsi B — Jalankan Manual (Development)

#### 1. Persiapkan Database MySQL

```bash
# Linux / macOS
mysql -u root -p < backend/migrations/001_init.sql

# Windows (PowerShell)
mysql -u root < backend\migrations\001_init.sql
```

> **Auto-Migration:** Jika menjalankan backend via `go run`, migrasi otomatis berjalan saat startup.

#### 2. Jalankan Redis

```bash
docker run -d --name krs-redis -p 6379:6379 redis:7-alpine
```

#### 3. Jalankan Backend

```bash
cd backend
go mod tidy
cp .env.example .env    # Linux/macOS
copy .env.example .env  # Windows

# Edit .env sesuai konfigurasi lokal
go run ./cmd/...
```

Server backend: `http://localhost:8080`

#### 4a. Jalankan Frontend React (Original)

```bash
cd frontend
npm install
npm run dev
```

Buka: `http://localhost:5173`

#### 4b. Jalankan Frontend AdminLTE / Brite (Static HTML)

Frontend AdminLTE dan Brite adalah **static HTML murni** — tidak perlu build step. Cukup jalankan dengan web server sederhana:

```bash
# Menggunakan Python (tersedia di hampir semua sistem)
cd frontend-refactor-adminLTE
python -m http.server 3001

# Di terminal lain
cd frontend-refactor-brite
python -m http.server 3002
```

> **Catatan:** Untuk development lokal tanpa Docker, request ke `/api/` tidak akan di-proxy secara otomatis. Ubah `js/config.js` dari `/api` ke `http://localhost:8080/api`.

---

### Opsi C — Deploy ke Cloud (Railway + Vercel)

#### 1. Deploy Backend ke Railway

1. Push project ke GitHub
2. Buka [railway.com](https://railway.com) → **New Project** → pilih repo
3. Set **Root Directory** ke `backend`
4. Tambahkan plugin **MySQL** dan **Redis**
5. Set environment variables:

| Variable | Value |
|----------|-------|
| `MYSQL_URL` | `${{MySQL.MYSQL_URL}}` |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` |
| `JWT_SECRET` | *(string acak yang kuat)* |
| `CORS_ORIGIN` | `https://nama-frontend.vercel.app` |
| `APP_ENV` | `production` |

6. **Settings → Networking → Generate Domain**

#### 2. Deploy Frontend React ke Vercel

1. Buka [vercel.com](https://vercel.com) → **New Project** → pilih repo
2. **Root Directory:** `frontend`, Framework: **Vite**
3. Environment variable:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://nama-backend.up.railway.app/api` |

> Frontend AdminLTE dan Brite (static HTML) juga bisa di-deploy ke Vercel dengan Root Directory masing-masing, tanpa environment variable.

---

## Konfigurasi

### Backend (`backend/.env`)

```env
APP_PORT=8080
APP_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=krs_db

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASS=

JWT_SECRET=ganti-ini-dengan-string-acak-yang-kuat
JWT_EXPIRY=24

# Untuk menjalankan semua frontend sekaligus:
CORS_ORIGIN=http://localhost:5173,http://localhost:3001,http://localhost:3002
```

### Auto-Detect (Railway / Cloud)

| Variabel Platform | Pengganti |
|-------------------|-----------|
| `MYSQL_URL` | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` |
| `REDIS_URL` | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASS` |
| `PORT` | `APP_PORT` |

---

## Akun Demo

Akun berikut otomatis tersedia setelah backend pertama kali dijalankan:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin2@krs.ac.id` | `Admin@123` |
| Dosen | `dosen@krs.ac.id` | `Dosen@123` |
| Mahasiswa | `mahasiswa@krs.ac.id` | `Mahasiswa@123` |
| Tamu | *(klik "Masuk sebagai Tamu" di halaman login)* | — |

> Akun dosen terhubung ke **Dr. Budi Santoso, M.Kom**, akun mahasiswa ke **Andi Pratama**.

---

## Struktur Folder

```
topik_sistem_akademik/
│
├── backend/                          # Go Echo API
│   ├── cmd/main.go
│   ├── config/config.go
│   ├── internal/
│   │   ├── domain/                   # Entitas: User, Dosen, Mahasiswa
│   │   ├── dto/                      # Request & Response DTO
│   │   ├── repository/               # Query SQL (sqlx)
│   │   ├── service/                  # Business logic + Redis cache
│   │   ├── handler/                  # HTTP handler (Echo)
│   │   ├── middleware/               # JWT, RequireRole, DenyGuest
│   │   └── routes/routes.go
│   ├── pkg/cache/, pagination/, response/
│   ├── utils/jwt.go, hash.go
│   ├── migrations/001_init.sql
│   ├── Dockerfile
│   ├── .env.example
│   └── go.mod
│
├── frontend/                         # React 18 + Vite + TailwindCSS (port 3000)
│   ├── src/
│   │   ├── context/AuthContext.jsx
│   │   ├── services/                 # Axios API calls
│   │   ├── routes/index.jsx
│   │   ├── layouts/
│   │   ├── components/
│   │   └── pages/                    # Login, Dashboard, Mahasiswa, Dosen, Profile
│   ├── Dockerfile
│   ├── nginx.conf
│   └── vite.config.js
│
├── frontend-refactor-adminLTE/       # Bootstrap 4 + jQuery + AdminLTE (port 3001)
│   ├── js/
│   │   ├── config.js                 # API_URL config
│   │   ├── api.js                    # Fetch wrapper + JWT injection
│   │   ├── auth.js                   # Auth guard + layout init
│   │   ├── dashboard.js
│   │   ├── mahasiswa.js
│   │   └── dosen.js
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── mahasiswa.html
│   ├── dosen.html
│   ├── profile.html
│   ├── Dockerfile
│   └── nginx.conf
│
├── frontend-refactor-brite/          # Bootstrap 5 + Bootswatch Brite (port 3002)
│   ├── js/
│   │   ├── config.js
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── mahasiswa.js
│   │   ├── dosen.js
│   │   └── profile.js
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── mahasiswa.html
│   ├── dosen.html
│   ├── profile.html
│   ├── Dockerfile
│   └── nginx.conf
│
└── docker-compose.yml                # Semua service: MySQL + Redis + Backend + 3 Frontend
```

---

## Troubleshooting

**Backend gagal konek ke MySQL**
```
Error: dial tcp: connection refused
```
Pastikan MySQL berjalan dan konfigurasi `.env` sudah benar. Untuk Laragon, `DB_PASS` dibiarkan kosong.

---

**Backend gagal konek ke Redis**
```bash
docker run -d --name krs-redis -p 6379:6379 redis:7-alpine
```

---

**Port sudah digunakan**
```bash
# Linux/macOS
lsof -ti:8080 | xargs kill -9

# Windows (PowerShell)
$pid = (Get-NetTCPConnection -LocalPort 8080).OwningProcess
Stop-Process -Id $pid -Force
```

---

**CORS error di browser**
Pastikan `CORS_ORIGIN` di `.env` backend mencakup URL frontend yang aktif, pisahkan dengan koma:
```env
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:3002
```

---

**Perubahan JS tidak ter-refresh setelah Docker rebuild**
Static file HTML/JS di-cache oleh browser. Lakukan hard reload:
- Windows/Linux: `Ctrl + Shift + R`
- macOS: `Cmd + Shift + R`

Nginx pada frontend AdminLTE dan Brite sudah dikonfigurasi dengan `Cache-Control: no-cache` untuk file JS/CSS/HTML.

---

**Login tamu tidak bisa akses dashboard**
Ini perilaku yang disengaja. Tamu hanya dapat mengakses halaman **Mahasiswa** dan **Dosen**. Untuk akses penuh, gunakan akun terdaftar.

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
