# Perencanaan Fitur Logout User (`DELETE /api/users/logout`)

Dokumen ini berisi panduan untuk mengimplementasikan API endpoint untuk proses logout user. Fitur ini akan menghapus data sesi yang aktif di tabel `sessions` berdasarkan token autentikasi yang dikirimkan.

---

## 1. Alur Logout Sesi

Sistem akan memverifikasi token yang dikirimkan, lalu menghapus data sesi tersebut dari tabel `sessions` agar token tersebut tidak dapat digunakan lagi.

### Cara Kerja:
1. Client mengirimkan request ke endpoint `DELETE /api/users/logout` dengan header:
   ```http
   Authorization: Bearer <token-session>
   ```
2. Server mengambil token dari header `Authorization`.
3. Server memverifikasi keberadaan token tersebut di tabel `sessions`.
4. Jika token tidak ditemukan di tabel `sessions`, kembalikan error `Unauthorized`.
5. Jika token ditemukan, hapus baris (*delete*) data sesi tersebut dari tabel `sessions`.
6. Kembalikan response sukses.

---

## 2. Implementasi Logika Bisnis (`src/services/users-service.ts`)

Tambahkan fungsi untuk melakukan proses penghapusan sesi berdasarkan token.

### Tahapan Logika:
1. Buat fungsi baru bernama `logoutUser(token: string)` di `src/services/users-service.ts`.
2. Periksa apakah sesi dengan token tersebut ada di tabel `sessions`.
   - Contoh query cek session:
     ```typescript
     const existingSession = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
     if (existingSession.length === 0) {
       throw new Error("Unauthorized");
     }
     ```
3. Jika sesi ditemukan, jalankan perintah hapus data (*delete*) dari tabel `sessions`.
   - Contoh query delete Drizzle ORM:
     ```typescript
     await db.delete(sessions).where(eq(sessions.token, token));
     ```
4. Kembalikan response sukses dalam format:
   ```typescript
   return {
     data: "OK"
   };
   ```

---

## 3. Implementasi Routing Endpoint (`src/routes/users-route.ts`)

Tambahkan routing endpoint untuk logout pada file `users-route.ts`.

### Informasi Endpoint:
- **Method**: `DELETE`
- **Path**: `/users/logout` (endpoint lengkap: `/api/users/logout`)
- **Header**: `Authorization` (format: `Bearer <token>`)

### Tahapan Logika:
1. Tambahkan method `.delete("/users/logout", ...)` di dalam chaining `usersRoute`.
2. Ambil header `Authorization` dari request headers.
   - Contoh: `const authHeader = headers['authorization'];`
3. Lakukan validasi awal pada header:
   - Jika header `Authorization` tidak ada atau tidak diawali dengan `"Bearer "`, langsung kembalikan status `401` dengan response:
     ```json
     {
         "error": "Unauthorized"
     }
     ```
4. Ekstrak token dengan membuang prefix `"Bearer "`.
5. Panggil fungsi `logoutUser(token)` dari service di dalam blok `try-catch`.
6. Jika sukses, kembalikan response datanya.
7. Di dalam blok `catch`:
   - Jika error bertipe/berisi pesan `"Unauthorized"`, kembalikan HTTP status `401` dan response:
     ```json
     {
         "error": "Unauthorized"
     }
     ```
   - Untuk error lainnya, kembalikan HTTP status `500` dengan pesan `"Internal server error"`.

---

## 4. Pengujian dan Verifikasi (QC)

1. **Test Case 1: Logout Sukses (Token Valid)**
   - **Endpoint**: `DELETE http://localhost:3000/api/users/logout`
   - **Headers**:
     - `Authorization`: `Bearer <token_aktif_dari_login>`
   - **Ekspektasi Response**: HTTP Status `200` dengan JSON berisi:
     ```json
     {
         "data": "OK"
     }
     ```
   - **Database Check**: Pastikan record session dengan token tersebut di tabel `sessions` sudah **terhapus**.
   - **Verifikasi Lanjutan**: Coba panggil endpoint `GET /api/users/current` menggunakan token yang baru saja didelete tadi. Ekspektasi response harus mengembalikan status `401 Unauthorized`.

2. **Test Case 2: Gagal Logout (Tanpa Token / Header Kosong)**
   - **Endpoint**: `DELETE http://localhost:3000/api/users/logout`
   - **Ekspektasi Response**: HTTP Status `401` dengan JSON berisi:
     ```json
     {
         "error": "Unauthorized"
     }
     ```

3. **Test Case 3: Gagal Logout (Token Salah / Sudah Expired)**
   - **Endpoint**: `DELETE http://localhost:3000/api/users/logout`
   - **Headers**:
     - `Authorization`: `Bearer token-sembarang-yang-tidak-ada-di-db`
   - **Ekspektasi Response**: HTTP Status `401` dengan JSON berisi:
     ```json
     {
         "error": "Unauthorized"
     }
     ```
