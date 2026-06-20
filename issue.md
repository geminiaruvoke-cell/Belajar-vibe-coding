# ISSUE: Implementasi Halaman Login (SvelteKit + TypeScript)

## Latar Belakang
Frontend akan dibuat menggunakan SvelteKit dan TypeScript yang terhubung dengan backend API pada repository berikut:
[Belajar-vibe-coding Repository](https://github.com/geminiaruvoke-cell/Belajar-vibe-coding)

Issue ini hanya berfokus pada pembuatan halaman Login. Jangan mengerjakan fitur lain seperti Register, Dashboard, Profile, Navbar global, Footer global, atau fitur tambahan lainnya. Tujuan utama adalah membuat halaman Login yang modern, rapi, dan siap digunakan pada tahap pengembangan berikutnya.

---

## Teknologi yang Digunakan
Gunakan teknologi berikut:
- SvelteKit
- TypeScript
- TailwindCSS
- Axios
- Zod
- Lucide Svelte

Jangan menambahkan dependency lain kecuali benar-benar diperlukan.

---

## Ruang Lingkup Pekerjaan
Hanya buat/ubah file berikut:
1. `src/routes/login/+page.svelte`
2. `src/lib/api/axios.ts`
3. `src/lib/api/auth.ts`
4. `src/lib/stores/auth.ts`
5. `src/lib/utils/token.ts`

*Catatan: Jangan membuat file atau halaman lain di luar daftar di atas.*

---

## Desain & Layout (Apple-inspired)
- **Route**: `/login`
- **Aesthetic**: Bersih, minimalis, profesional, banyak whitespace, modern, responsive.
- **Palet Warna**:
  - Background: `#ffffff`
  - Text: `#000000`
  - Secondary: `#6e6e73`
  - Border: `#e5e5e7`
  - Card: `#fafafa`
- **Styles**: `rounded-2xl`, `shadow-sm`, `border`, `transition duration-300`
- **Layout**:
  - **Desktop (>= 1024px)**: Grid 2 kolom (Kolom Kiri 50%, Kolom Kanan 50%).
  - **Mobile (< 1024px)**: Stack menjadi 1 kolom (Kolom kanan/card login menjadi fokus utama, kolom kiri bisa disembunyikan atau ditaruh di atas).
- **Kolom Kiri (Desktop)**:
  - Logo sederhana: "User Management"
  - Judul: "Welcome Back"
  - Deskripsi: "Sign in to continue using User Management System."
  - 3 Poin Fitur dengan Lucide Svelte Icons:
    - **Secure Authentication** (Icon: `ShieldCheck` atau `Lock`)
    - **Fast API Connection** (Icon: `Zap` atau `Activity`)
    - **Session Management** (Icon: `UserCheck` atau `Key`)
- **Kolom Kanan (Card Login)**:
  - Input Email (Label, input field, placeholder: `you@example.com`)
  - Input Password (Label, input field, placeholder: `••••••••`, tombol Show/Hide Password)
  - Checkbox "Remember me"
  - Tombol Submit (Default: "Sign In", Saat Loading: "Signing in...")

---

## Panduan Langkah-Demi-Langkah Implementasi

Berikut adalah urutan langkah pengerjaan yang detail dan terstruktur agar dapat diikuti dengan mudah oleh Junior Programmer atau AI Model.

### Langkah 1: Setup Environment Variable & Type Safety
Di root directory proyek SvelteKit, buat atau pastikan file `.env` memiliki konfigurasi API Base URL. Jangan melakukan hardcode URL API.

1. Tambahkan baris berikut ke file `.env`:
   ```env
   PUBLIC_API_BASE_URL=http://localhost:3000
   ```
2. Di SvelteKit, variabel ini dapat diakses secara type-safe melalui:
   ```typescript
   import { PUBLIC_API_BASE_URL } from '$env/static/public';
   ```

---

### Langkah 2: Buat Utility Token (`src/lib/utils/token.ts`)
Fungsi-fungsi pembantu untuk mengelola token di `localStorage` menggunakan key `auth_token`. Karena SvelteKit mendukung Server-Side Rendering (SSR), pastikan untuk memeriksa apakah kode sedang berjalan di client browser (`typeof window !== 'undefined'`) sebelum mengakses `localStorage` agar tidak terjadi error crash server.

**Kerangka Kode `src/lib/utils/token.ts`:**
```typescript
const TOKEN_KEY = 'auth_token';

export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}
```

---

### Langkah 3: Konfigurasi Axios Client (`src/lib/api/axios.ts`)
Buat instance Axios yang terkonfigurasi dengan Base URL dan header bawaan.

**Kerangka Kode `src/lib/api/axios.ts`:**
```typescript
import axios from 'axios';
import { PUBLIC_API_BASE_URL } from '$env/static/public';

const axiosInstance = axios.create({
  baseURL: PUBLIC_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Anda dapat menambahkan interceptor di sini jika diperlukan di masa depan.
export default axiosInstance;
```

---

### Langkah 4: Buat Service API Authentication (`src/lib/api/auth.ts`)
Buat fungsi `login` untuk menembak endpoint backend.

- **Endpoint**: `POST /api/users/login`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "data": "session-token"
  }
  ```

**Kerangka Kode `src/lib/api/auth.ts`:**
```typescript
import axiosInstance from './axios';
import type { LoginPayload, LoginResponse } from '../types/auth'; // atau deklarasikan inline interface

export interface LoginPayload {
  email: string;
  password:  string;
}

export interface LoginResponse {
  data: string; // token
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await axiosInstance.post<LoginResponse>('/api/users/login', payload);
  return response.data;
}
```

---

### Langkah 5: Buat Authentication Store (`src/lib/stores/auth.ts`)
Gunakan Svelte `writable` store untuk melacak status login, token, dan state loading secara global/reaktif. Sinkronisasikan dengan token utility yang telah dibuat.

**Kerangka Kode `src/lib/stores/auth.ts`:**
```typescript
import { writable } from 'svelte/store';
import { getToken, setToken as saveTokenUtil, removeToken as clearTokenUtil } from '../utils/token';

// Inisialisasi token dari localStorage jika ada
const initialToken = getToken();

export const token = writable<string | null>(initialToken);
export const isAuthenticated = writable<boolean>(!!initialToken);
export const loading = writable<boolean>(false);

export function setAuthToken(newToken: string): void {
  saveTokenUtil(newToken);
  token.set(newToken);
  isAuthenticated.set(true);
}

export function clearAuth(): void {
  clearTokenUtil();
  token.set(null);
  isAuthenticated.set(false);
}
```

---

### Langkah 6: Implementasi Validasi Form dengan Zod & Tampilan Svelte
Buat halaman Login utama di `src/routes/login/+page.svelte`. Implementasikan validasi form secara real-time menggunakan Zod, toggle show/hide password, visual state loading pada tombol, penanganan error, dan integrasi store.

#### Aturan Validasi Zod:
- **Email**: Wajib diisi, format email harus valid.
- **Password**: Wajib diisi, minimal 8 karakter.

#### Kerangka Kode Logic (`<script>` di `src/routes/login/+page.svelte`):
```html
<script lang="ts">
  import { login } from '$lib/api/auth';
  import { setAuthToken, loading } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { z } from 'zod';
  import { ShieldCheck, Zap, UserCheck, Eye, EyeOff, Loader2 } from 'lucide-svelte';

  // State Form
  let email = '';
  let password = '';
  let rememberMe = false;
  let showPassword = false;

  // Error States
  let errors: { email?: string; password?: string } = {};
  let serverError = '';

  // Zod Schema
  const loginSchema = z.object({
    email: z.string().min(1, 'Email wajib diisi.').email('Format email tidak valid.'),
    password: z.string().min(1, 'Password wajib diisi.').min(8, 'Password minimal 8 karakter.')
  });

  // Real-time validation helper
  function validateField(field: 'email' | 'password') {
    const result = loginSchema.safeParse({ email, password });
    if (result.success) {
      errors = {};
      return;
    }

    const formatted = result.error.format();
    if (field === 'email') {
      errors.email = formatted.email?._errors[0] || '';
    }
    if (field === 'password') {
      errors.password = formatted.password?._errors[0] || '';
    }
  }

  // Form Submit Handler
  async function handleSubmit() {
    serverError = '';
    
    // Validasi final
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const formatted = result.error.format();
      errors = {
        email: formatted.email?._errors[0],
        password: formatted.password?._errors[0]
      };
      return;
    }

    try {
      loading.set(true);
      
      const response = await login({ email, password });
      const sessionToken = response.data;

      // Simpan token ke localStorage & update store
      setAuthToken(sessionToken);

      // Redirect ke /dashboard
      await goto('/dashboard');
    } catch (err: any) {
      // Tangani error dari backend API
      if (err.response && err.response.data && err.response.data.message) {
        serverError = err.response.data.message;
      } else {
        serverError = 'Terjadi kesalahan koneksi. Silakan coba beberapa saat lagi.';
      }
    } finally {
      loading.set(false);
    }
  }
</script>
```

#### Kerangka HTML & Tailwind CSS (`src/routes/login/+page.svelte`):
Pastikan menggunakan gaya Apple (minimalis, banyak whitespace, border halus, rounded-2xl, background putih bersih/card abu tipis, text hitam pekat dan abu sekunder).

```html
<main class="min-h-screen bg-white text-black flex flex-col lg:flex-row font-sans">
  <!-- SISI KIRI: Brand & Fitur (Desktop Only) -->
  <div class="hidden lg:flex lg:w-1/2 bg-white flex-col justify-between p-16 border-r border-[#e5e5e7]">
    <!-- Top Brand -->
    <div class="text-sm font-semibold tracking-tight text-[#000000]">
      User Management
    </div>

    <!-- Center Content -->
    <div class="max-w-md my-auto space-y-8">
      <h1 class="text-5xl font-bold tracking-tight text-[#000000] leading-tight">
        Welcome Back
      </h1>
      <p class="text-lg text-[#6e6e73]">
        Sign in to continue using User Management System.
      </p>

      <!-- Poin Fitur -->
      <div class="space-y-6 pt-4">
        <div class="flex items-start space-x-4">
          <div class="text-[#000000] p-1 bg-[#fafafa] rounded-lg border border-[#e5e5e7]">
            <ShieldCheck class="w-6 h-6" />
          </div>
          <div>
            <h4 class="font-semibold text-base text-[#000000]">Secure Authentication</h4>
            <p class="text-sm text-[#6e6e73]">Enkripsi data end-to-end yang aman untuk melindungi akun Anda.</p>
          </div>
        </div>

        <div class="flex items-start space-x-4">
          <div class="text-[#000000] p-1 bg-[#fafafa] rounded-lg border border-[#e5e5e7]">
            <Zap class="w-6 h-6" />
          </div>
          <div>
            <h4 class="font-semibold text-base text-[#000000]">Fast API Connection</h4>
            <p class="text-sm text-[#6e6e73]">Responsivitas backend tinggi dengan latensi super rendah.</p>
          </div>
        </div>

        <div class="flex items-start space-x-4">
          <div class="text-[#000000] p-1 bg-[#fafafa] rounded-lg border border-[#e5e5e7]">
            <UserCheck class="w-6 h-6" />
          </div>
          <div>
            <h4 class="font-semibold text-base text-[#000000]">Session Management</h4>
            <p class="text-sm text-[#6e6e73]">Manajemen sesi login pintar yang persisten dan andal.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Kiri -->
    <div class="text-xs text-[#6e6e73]">
      &copy; {new Date().getFullYear()} User Management System. All rights reserved.
    </div>
  </div>

  <!-- SISI KANAN: Form Card Login -->
  <div class="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:p-16 bg-white">
    <!-- Brand khusus Mobile (muncul hanya jika di layar kecil) -->
    <div class="lg:hidden mb-8 text-center">
      <h2 class="text-2xl font-bold tracking-tight text-[#000000]">User Management</h2>
      <p class="text-sm text-[#6e6e73] mt-1">Sign in to continue using User Management System.</p>
    </div>

    <!-- Login Card -->
    <div class="w-full max-w-[440px] bg-[#fafafa] p-8 lg:p-10 rounded-2xl border border-[#e5e5e7] shadow-sm transition duration-300">
      <div class="mb-8">
        <h3 class="text-2xl font-semibold tracking-tight text-[#000000]">Sign In</h3>
        <p class="text-sm text-[#6e6e73] mt-1">Enter your details below to login.</p>
      </div>

      <!-- Server Error Alert -->
      {#if serverError}
        <div class="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm" role="alert">
          {serverError}
        </div>
      {/if}

      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        <!-- Input Email -->
        <div class="space-y-2">
          <label for="email" class="block text-sm font-medium text-[#000000]">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autocomplete="email"
            bind:value={email}
            on:input={() => validateField('email')}
            placeholder="you@example.com"
            aria-label="Email Address"
            class="w-full px-4 py-3 bg-white text-black border border-[#e5e5e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base transition duration-300 {errors.email ? 'border-red-500 focus:ring-red-500' : ''}"
            disabled={$loading}
          />
          {#if errors.email}
            <p class="text-xs text-red-500 mt-1">{errors.email}</p>
          {/if}
        </div>

        <!-- Input Password -->
        <div class="space-y-2">
          <label for="password" class="block text-sm font-medium text-[#000000]">
            Password
          </label>
          <div class="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autocomplete="current-password"
              bind:value={password}
              on:input={() => validateField('password')}
              placeholder="••••••••"
              aria-label="Password"
              class="w-full pl-4 pr-12 py-3 bg-white text-black border border-[#e5e5e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base transition duration-300 {errors.password ? 'border-red-500 focus:ring-red-500' : ''}"
              disabled={$loading}
            />
            <!-- Show/Hide Button -->
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#6e6e73] hover:text-[#000000] focus:outline-none"
              on:click={() => (showPassword = !showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={$loading}
            >
              {#if showPassword}
                <EyeOff class="w-5 h-5" />
              {:else}
                <Eye class="w-5 h-5" />
              {/if}
            </button>
          </div>
          {#if errors.password}
            <p class="text-xs text-red-500 mt-1">{errors.password}</p>
          {/if}
        </div>

        <!-- Remember Me & Reset Password Links (Opsional) -->
        <div class="flex items-center justify-between">
          <label class="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              bind:checked={rememberMe}
              disabled={$loading}
              class="w-4 h-4 rounded text-black border-[#e5e5e7] focus:ring-black cursor-pointer"
            />
            <span class="text-sm text-[#6e6e73]">Remember me</span>
          </label>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          disabled={$loading}
          class="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-[#000000] hover:bg-[#1d1d1f] text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-sm"
        >
          {#if $loading}
            <Loader2 class="w-5 h-5 animate-spin" />
            <span>Signing in...</span>
          {:else}
            <span>Sign In</span>
          {/if}
        </button>
      </form>
    </div>
  </div>
</main>
```

---

## Kriteria Penerimaan (Acceptance Criteria)

Tugas ini dianggap berhasil diselesaikan apabila memenuhi seluruh daftar periksa berikut:

- [ ] **Akses Halaman**: Halaman login dapat diakses dengan membuka `/login` tanpa error routing.
- [ ] **Tata Letak & Responsivitas**: Tampilan terbagi menjadi grid 50:50 di desktop (>= 1024px) dan otomatis menumpuk menjadi 1 kolom (hanya card login) di layar mobile.
- [ ] **Validasi Zod Real-time**: Pesan kesalahan validasi (misal: format email salah, password kurang dari 8 karakter) muncul langsung di bawah field input yang sesuai saat user mengetik, dan divalidasi ulang saat form di-submit.
- [ ] **Toggle Show/Hide Password**: Menekan icon mata pada input password dapat mengganti jenis input antara tipe `password` dan `text`.
- [ ] **Loading & Submit State**: Ketika tombol submit ditekan dan API dipanggil, tombol berubah menjadi disabled (mencegah klik ganda) dan teks/icon berubah menjadi loading state ("Signing in...").
- [ ] **Penyimpanan Token**: Token yang dikembalikan oleh server berhasil disimpan ke `localStorage` dengan key `auth_token`.
- [ ] **Penanganan Error API**: Jika API backend mengembalikan status HTTP error (misal 401 atau 400), pesan error yang dikembalikan (atau pesan fallback umum) ditampilkan secara jelas di bagian atas form.
- [ ] **Pengalihan Halaman (Redirect)**: Setelah login berhasil, sistem otomatis melakukan redirect ke halaman `/dashboard`.
- [ ] **TypeScript Strict**: Tidak ada error static check / TypeScript error dan dilarang keras menggunakan tipe `any`.
- [ ] **Keamanan & Aksesibilitas**: Tag input telah memiliki atribut penunjang aksesibilitas (`aria-label`, `autocomplete`, focus state yang terlihat jelas).
- [ ] **Lingkup Pekerjaan Bersih**: Tidak ada halaman atau file tambahan lain yang dibuat di luar ruang lingkup issue.
