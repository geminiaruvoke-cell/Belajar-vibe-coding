# Belajar Vibe Coding - RESTful API User Management

Project ini adalah aplikasi RESTful API sederhana untuk manajemen pengguna (User Management) yang mencakup fitur registrasi, login, melihat profil aktif (get current user), dan logout. Dibangun menggunakan stack modern yang sangat cepat berbasis JavaScript runtime Bun dan framework Elysia.js.

---

## 🛠️ Technology Stack & Library

* **Runtime**: [Bun (v1.3.14)](https://bun.sh/) — Runtime JavaScript all-in-one yang super cepat.
* **Web Framework**: [Elysia.js (v1.4.29)](https://elysiajs.com/) — Web framework berkinerja tinggi, ramah TypeScript, dan ringan untuk Bun.
* **ORM**: [Drizzle ORM (v0.45.2)](https://orm.drizzle.team/) — ORM TypeScript-first yang ringan dan cepat.
* **Database Driver**: [mysql2](https://github.com/sidorares/node-mysql2) — Driver MySQL berkinerja tinggi untuk koneksi database.
* **Database Engine**: MySQL / MariaDB (direkomendasikan via XAMPP atau Docker).
* **Testing Tool**: `bun test` — Test runner terintegrasi bawaan Bun yang cepat.

---

## 📂 Arsitektur dan Struktur File

Aplikasi ini menggunakan arsitektur berlapis (layered architecture) yang memisahkan antara routing (API endpoints), logika bisnis (service layer), dan akses database (database schema).

```text
├── drizzle/                     # File migrasi database hasil generate Drizzle Kit
├── src/
│   ├── db/
│   │   ├── index.ts             # Inisialisasi koneksi Drizzle ORM
│   │   └── schema.ts            # Definisi skema tabel database (Users & Sessions)
│   ├── routes/
│   │   └── users-route.ts       # Endpoint API, skema validasi request, & middleware auth
│   ├── services/
│   │   └── users-service.ts     # Logika bisnis (register, login, logout, get user)
│   └── index.ts                 # Entry point aplikasi (Elysia server initialization)
├── tests/
│   └── users.test.ts            # Unit test suite menggunakan Bun Test
├── .env.example                 # Template file environment variables
├── drizzle.config.ts            # Konfigurasi Drizzle Kit untuk migrasi database
├── package.json                 # Manifest dependensi project
├── README.md                    # Dokumentasi project
└── tsconfig.json                # Konfigurasi TypeScript compiler
```

---

## 🗄️ Skema Database

Database yang digunakan terdiri atas dua tabel utama dengan relasi satu-ke-banyak (One-to-Many) antara `users` dan `sessions`.

```mermaid
erDiagram
    users ||--o{ sessions : "has"
    users {
        bigint id PK "auto_increment, unsigned"
        varchar name "max 256"
        varchar email UK "max 256"
        varchar password "max 256"
        timestamp created_at "default current_timestamp"
    }
    sessions {
        bigint id PK "auto_increment, unsigned"
        varchar token UK "max 255"
        bigint user_id FK "references users.id"
        timestamp created_at "default current_timestamp"
    }
```

### 1. Tabel `users`
Menyimpan informasi dasar pengguna. Password dienkripsi menggunakan hashing bcrypt sebelum disimpan ke database.
* `id` (`bigint unsigned`, Primary Key, Auto Increment)
* `name` (`varchar(256)`, Not Null)
* `email` (`varchar(256)`, Not Null, Unique Index)
* `password` (`varchar(256)`, Not Null) — Hash bcrypt
* `created_at` (`timestamp`, Not Null, Default Now)

### 2. Tabel `sessions`
Menyimpan token sesi aktif yang didapatkan pengguna setelah berhasil login.
* `id` (`bigint unsigned`, Primary Key, Auto Increment)
* `token` (`varchar(255)`, Not Null, Unique Index) — UUID V4
* `user_id` (`bigint unsigned`, Foreign Key ke `users.id`, Not Null)
* `created_at` (`timestamp`, Not Null, Default Now)

---

## 🚀 API Endpoints

Seluruh API menggunakan prefix URL `/api`.

### 1. Registrasi User
* **Method**: `POST`
* **Path**: `/api/users`
* **Request Body** (JSON):
  ```json
  {
    "name": "Nama Pengguna",
    "email": "user@example.com",
    "password": "password_aman"
  }
  ```
* **Validasi**: `name`, `email`, dan `password` maksimal 256 karakter. Format `email` harus valid.
* **Response Sukses (200 OK)**:
  ```json
  {
    "data": "ok"
  }
  ```

### 2. Login User
* **Method**: `POST`
* **Path**: `/api/users/login`
* **Request Body** (JSON):
  ```json
  {
    "email": "user@example.com",
    "password": "password_aman"
  }
  ```
* **Response Sukses (200 OK)**:
  ```json
  {
    "data": "session-uuid-token-here"
  }
  ```

### 3. Get Current User (Profil Aktif)
* **Method**: `GET`
* **Path**: `/api/users/current`
* **Headers**: `Authorization: Bearer <session-token>`
* **Response Sukses (200 OK)**:
  ```json
  {
    "data": {
      "id": 1,
      "name": "Nama Pengguna",
      "email": "user@example.com",
      "createdAt": "2026-06-19T08:00:00.000Z"
    }
  }
  ```

### 4. Logout User
* **Method**: `DELETE`
* **Path**: `/api/users/logout`
* **Headers**: `Authorization: Bearer <session-token>`
* **Response Sukses (200 OK)**:
  ```json
  {
    "data": "OK"
  }
  ```

---

## ⚙️ Cara Setup Project

### 1. Prasyarat
Pastikan Anda sudah menginstal **Bun** di komputer Anda. Jika belum, instal via terminal:
```bash
powershell -c "irm bun.sh/install.ps1 | iex" # Untuk Windows
# atau
curl -fsSL https://bun.sh/install | bash # Untuk Linux/macOS
```

### 2. Install Dependensi
Klon repositori ini, lalu masuk ke direktori project dan jalankan:
```bash
bun install
```

### 3. Setup Environment Variables
Buat file bernama `.env` di root direktori project dan tentukan koneksi database MySQL/MariaDB Anda:
```env
DATABASE_URL=mysql://username:password@localhost:3306/elysia_db
```
*(Catatan: Jika menggunakan XAMPP lokal secara default, isinya adalah `mysql://root:@localhost:3306/elysia_db`)*

### 4. Setup Database Schema
Jalankan perintah push schema Drizzle untuk membuat tabel `users` dan `sessions` secara otomatis ke dalam database Anda:
```bash
bunx drizzle-kit push
```

---

## 🏃 Cara Menjalankan Aplikasi

Untuk menjalankan server pengembangan (development server) lokal dengan fitur auto-reload:
```bash
bun run --watch src/index.ts
```
Server akan berjalan secara default di `http://localhost:3000`.

---

## 🧪 Cara Menjalankan Unit Test

Untuk menjalankan seluruh rangkaian test otomatis (*test suite*) yang mencakup 14 skenario pengujian API:
```bash
bun test
```

*(Catatan: Pastikan service database Anda sedang berjalan saat menjalankan test, karena unit test akan melakukan operasi baca/tulis langsung ke database serta melakukan pembersihan data otomatis di setiap sebelum skenario pengujian dimulai).*
