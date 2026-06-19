# Perencanaan Unit Test Menggunakan Bun Test

Dokumen ini berisi panduan skenario unit test yang harus diimplementasikan untuk semua endpoint API yang ada di aplikasi. Implementasi pengujian ini menggunakan library test bawaan dari **Bun (`bun test`)**.

---

## 1. Persyaratan Umum & Konfigurasi Test

* **Tempat Penyimpanan**: Seluruh file test harus disimpan di dalam folder `tests/` (misalnya: `tests/users.test.ts`).
* **Konsistensi Data**: Agar pengujian berjalan dengan konsisten, **setiap skenario test (atau sebelum setiap test berjalan) harus menghapus seluruh data di tabel `sessions` dan `users`** terlebih dahulu (*database truncation/cleanup*).
* **Test Runner**: Test harus dapat dijalankan dengan menjalankan perintah:
  ```bash
  bun test
  ```

---

## 2. Skenario Test per API

Berikut adalah daftar skenario test minimum yang harus dicakup oleh junior programmer atau model AI:

### A. API Registrasi (`POST /api/users`)
1. **Skenario Registrasi Sukses**:
   * Mengirim request dengan data nama, email, dan password yang valid.
   * Ekspektasi: Response HTTP Status `200` (atau `201`) dengan payload sukses, dan data user tersimpan di database.
2. **Skenario Gagal - Email Sudah Terdaftar**:
   * Mendaftarkan user baru dengan email yang sama dengan user yang sudah terdaftar sebelumnya.
   * Ekspektasi: Response HTTP Status `400` dengan pesan error "email sudah terdaftar".
3. **Skenario Gagal - Validasi Skema (Panjang Karakter / Format Email)**:
   * Mengirim request dengan nama, email, atau password melebihi 256 karakter.
   * Mengirim request dengan format email yang tidak valid (misal tanpa `@`).
   * Ekspektasi: Response HTTP Status `422` (Unprocessable Entity) karena validasi skema gagal.

### B. API Login (`POST /api/users/login`)
1. **Skenario Login Sukses**:
   * Mengirim request dengan email dan password yang sesuai dengan user terdaftar.
   * Ekspektasi: Response HTTP Status `200` dengan mengembalikan token sesi baru, dan sesi tersebut tersimpan di tabel `sessions`.
2. **Skenario Gagal - User Tidak Terdaftar**:
   * Login menggunakan email yang tidak ada di database.
   * Ekspektasi: Response HTTP Status `400` dengan pesan error "email atau password salah".
3. **Skenario Gagal - Password Salah**:
   * Login menggunakan email terdaftar namun password tidak sesuai.
   * Ekspektasi: Response HTTP Status `400` dengan pesan error "email atau password salah".
4. **Skenario Gagal - Validasi Skema**:
   * Mengirim payload dengan format email salah atau karakter melebihi batas 256 karakter.
   * Ekspektasi: Response HTTP Status `422` karena kegagalan validasi input.

### C. API Get Current User (`GET /api/users/current`)
1. **Skenario Sukses**:
   * Mengirim request dengan header `Authorization: Bearer <token>` yang valid dan aktif di database.
   * Ekspektasi: Response HTTP Status `200` dengan data user lengkap (`id`, `name`, `email`, `created_at`), tanpa menyertakan password.
2. **Skenario Gagal - Tanpa Token**:
   * Mengirim request tanpa menyertakan header `Authorization`.
   * Ekspektasi: Response HTTP Status `401 Unauthorized` dengan body `{ "error": "Unauthorized" }`.
3. **Skenario Gagal - Format Token Salah**:
   * Mengirim header `Authorization` yang tidak berformat `Bearer <token>` (misal hanya token saja tanpa kata `Bearer`).
   * Ekspektasi: Response HTTP Status `401 Unauthorized` dengan body `{ "error": "Unauthorized" }`.
4. **Skenario Gagal - Sesi Tidak Valid/Expired**:
   * Mengirim header `Authorization: Bearer <token_palsu_atau_tidak_ada_di_db>`.
   * Ekspektasi: Response HTTP Status `401 Unauthorized` dengan body `{ "error": "Unauthorized" }`.

### D. API Logout (`DELETE /api/users/logout`)
1. **Skenario Logout Sukses**:
   * Mengirim request dengan header `Authorization: Bearer <token>` yang valid.
   * Ekspektasi: Response HTTP Status `200` dengan body `{ "data": "OK" }`, dan data sesi tersebut **dihapus** dari tabel `sessions` di database.
2. **Skenario Gagal - Sesi Tidak Valid / Tanpa Token**:
   * Mengirim request logout tanpa token valid atau tanpa header `Authorization`.
   * Ekspektasi: Response HTTP Status `401 Unauthorized`.
3. **Skenario Integrasi (Pasca-Logout)**:
   * Lakukan login $\rightarrow$ panggil get current user (sukses) $\rightarrow$ panggil logout (sukses) $\rightarrow$ panggil kembali get current user dengan token yang sama.
   * Ekspektasi: Pemanggilan get current user kedua harus mengembalikan status `401 Unauthorized` karena token sesi sudah dihapus saat logout.
