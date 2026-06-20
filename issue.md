# Rencana Implementasi: Fitur Swagger API Documentation

Dokumen ini berisi panduan langkah-demi-langkah bagi junior programmer atau model AI untuk mengimplementasikan fitur Swagger API Documentation pada project ini. Tujuannya adalah mempermudah developer lain untuk mempelajari dan menguji endpoint API secara langsung melalui browser.

---

## 🛠️ Langkah 1: Instalasi Library Swagger

Elysia memiliki plugin resmi untuk integrasi Swagger UI, yaitu `@elysiajs/swagger`.

Jalankan perintah berikut pada terminal di root direktori project:
```bash
bun add @elysiajs/swagger
```

---

## ⚙️ Langkah 2: Registrasi Swagger Plugin di `src/index.ts`

Impor dan pasang plugin swagger pada server utama di file [src/index.ts](file:///c:/Users/USER/Developments/GITHUB/belajar-vibe-coding/src/index.ts).

### Petunjuk Implementasi:
1. Impor `swagger` dari `@elysiajs/swagger`.
2. Gunakan method `.use(swagger(...))` pada instance `app`.
3. Letakkan konfigurasi Swagger **sebelum** routing `.use(usersRoute)` agar UI dapat digenerate dengan benar.
4. Konfigurasikan opsi Swagger untuk mendeskripsikan API ini dan tambahkan skema autentikasi Bearer Token agar route yang terproteksi dapat diuji dari Swagger UI.

### Contoh Potongan Kode:
```typescript
import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { usersRoute } from "./routes/users-route";

export const app = new Elysia()
  .use(
    swagger({
      path: "/swagger", // Endpoint untuk membuka dokumentasi UI
      documentation: {
        info: {
          title: "Belajar Vibe Coding API",
          version: "1.0.0",
          description: "Dokumentasi RESTful API untuk User Management & Autentikasi",
        },
        components: {
          securitySchemes: {
            BearerAuth: {
              type: "apiKey",
              name: "Authorization",
              in: "header",
              description: "Masukkan token dengan format: Bearer <token_sesi>",
            },
          },
        },
      },
    })
  )
  .get("/", () => "Hello World! Server is up and running.")
  .use(usersRoute)
  .listen(3000);
```

---

## 📝 Langkah 3: Dokumentasikan Route di `src/routes/users-route.ts`

Untuk melengkapi informasi request dan response di Swagger UI, tambahkan metadata properti `response` dan `detail` pada tiap endpoint di file [src/routes/users-route.ts](file:///c:/Users/USER/Developments/GITHUB/belajar-vibe-coding/src/routes/users-route.ts).

Lengkapi masing-masing route dengan:
- **`detail.tags`**: Mengelompokkan route (contoh: `['Users']`).
- **`detail.summary`**: Deskripsi singkat kegunaan API.
- **`response`**: Skema validasi response untuk masing-masing HTTP status code (200, 400, 401, 422).
- **`detail.security`**: (Khusus route terproteksi) Menandakan bahwa endpoint membutuhkan header Authorization Bearer.

### Detail Skenario Route:

### A. Registrasi User (`POST /users`)
* **Tags**: `['Users']`
* **Summary**: `'Registrasi pengguna baru'`
* **Response**:
  - `200`: `t.Object({ data: t.String() })` — Jika berhasil mengembalikan `{ "data": "ok" }`.
  - `400`: `t.Object({ error: t.String() })` — Jika email sudah terdaftar.
  - `422`: Schema validasi error (otomatis digenerate oleh Elysia).
  - `500`: `t.Object({ error: t.String() })` — Internal server error.

*Contoh Konfigurasi:*
```typescript
  {
    body: t.Object({
      name: t.String({ maxLength: 256 }),
      email: t.String({ format: "email", maxLength: 256 }),
      password: t.String({ maxLength: 256 }),
    }),
    response: {
      200: t.Object({ data: t.String() }),
      400: t.Object({ error: t.String() }),
      500: t.Object({ error: t.String() }),
    },
    detail: {
      tags: ["Users"],
      summary: "Registrasi pengguna baru",
    },
  }
```

### B. Login User (`POST /users/login`)
* **Tags**: `['Users']`
* **Summary**: `'Login untuk mendapatkan token sesi'`
* **Response**:
  - `200`: `t.Object({ data: t.String() })` — Mengembalikan token UUID.
  - `400`: `t.Object({ error: t.String() })` — Password salah/user tidak ada.
  - `422`: Schema validasi error.
  - `500`: `t.Object({ error: t.String() })` — Internal server error.

### C. Get Current User (`GET /users/current`)
* **Tags**: `['Users']`
* **Summary**: `'Mengambil profil detail user aktif'`
* **Security**: `[{ BearerAuth: [] }]`
* **Response**:
  - `200`: `t.Object({ data: t.Object({ id: t.Number(), name: t.String(), email: t.String(), created_at: t.Date() }) })`
  - `401`: `t.Object({ error: t.String() })` — Token invalid/tidak dikirim.
  - `500`: `t.Object({ error: t.String() })` — Internal server error.

*Contoh Konfigurasi:*
```typescript
  {
    response: {
      200: t.Object({
        data: t.Object({
          id: t.Number(),
          name: t.String(),
          email: t.String(),
          created_at: t.Any(), // tipe timestamp MySQL
        }),
      }),
      401: t.Object({ error: t.String() }),
      500: t.Object({ error: t.String() }),
    },
    detail: {
      tags: ["Users"],
      summary: "Mengambil profil detail user aktif",
      security: [{ BearerAuth: [] }],
    },
  }
```

### D. Logout User (`DELETE /users/logout`)
* **Tags**: `['Users']`
* **Summary**: `'Logout dan hapus sesi token aktif'`
* **Security**: `[{ BearerAuth: [] }]`
* **Response**:
  - `200`: `t.Object({ data: t.String() })` — Jika sukses mengembalikan `{ "data": "OK" }`.
  - `401`: `t.Object({ error: t.String() })` — Token invalid/tidak dikirim.
  - `500`: `t.Object({ error: t.String() })` — Internal server error.

---

## 🧪 Langkah 4: Pengujian dan Verifikasi

Setelah seluruh langkah di atas selesai diimplementasikan:
1. Jalankan aplikasi menggunakan Bun:
   ```bash
   bun run src/index.ts
   ```
2. Buka browser dan arahkan alamat ke:
   ```text
   http://localhost:3000/swagger
   ```
3. **Verifikasi Tampilan UI**:
   - Pastikan terdapat dokumentasi 4 endpoint API `/users`, `/users/login`, `/users/current`, dan `/users/logout`.
   - Pastikan tombol **Authorize** (ikon gembok) muncul di kanan atas halaman Swagger, klik tombol tersebut dan masukkan Bearer Token Anda untuk mencoba endpoint yang terproteksi langsung dari Swagger UI.
   - Uji masing-masing endpoint dengan skenario sukses dan gagal untuk memverifikasi bahwa skema input/output di Swagger bekerja sebagaimana mestinya.
4. **Verifikasi Unit Test**:
   - Jalankan `bun test` untuk memastikan penambahan konfigurasi skema swagger tidak merusak jalannya fungsionalitas API utama.
