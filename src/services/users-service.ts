import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Mendaftarkan pengguna baru ke database.
 * Melakukan pengecekan duplikasi email, melakukan hashing password dengan bcrypt,
 * dan menyimpan entri pengguna baru ke database.
 * 
 * @param data Data pengguna yang akan didaftarkan (name, email, password)
 * @returns Object berisi payload data sukses {"data": "ok"}
 */
export const registerUser = async (data: typeof users.$inferInsert) => {
  // Check for duplicate email
  const existingUser = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
  if (existingUser.length > 0) {
    throw new Error("email sudah terdaftar");
  }

  // Hash password using Bun's built-in bcrypt
  const hashedPassword = await Bun.password.hash(data.password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  // Insert to DB
  await db.insert(users).values({
    name: data.name,
    email: data.email,
    password: hashedPassword,
  });

  return { data: "ok" };
};

/**
 * Melakukan verifikasi login pengguna (autentikasi).
 * Memeriksa email dan mencocokkan hash password. Jika sukses, men-generate token
 * sesi UUID baru, menyimpannya di tabel sessions, dan mengembalikan token tersebut.
 * 
 * @param data Kredensial login pengguna (email, password)
 * @returns Object berisi token sesi {"data": token}
 */
export const loginUser = async (data: Pick<typeof users.$inferInsert, "email" | "password">) => {
  const existingUser = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
  if (existingUser.length === 0) {
    throw new Error("email atau password salah");
  }

  const user = existingUser[0];
  if (!user) {
    throw new Error("email atau password salah");
  }

  const isPasswordValid = await Bun.password.verify(data.password, user.password);
  
  if (!isPasswordValid) {
    throw new Error("email atau password salah");
  }

  const token = crypto.randomUUID();
  
  await db.insert(sessions).values({
    token: token,
    userId: user.id,
  });

  return { data: token };
};

/**
 * Mengambil profil detail pengguna yang sedang aktif berdasarkan token sesi.
 * Memvalidasi apakah token sesi aktif di database, kemudian mencari entri
 * pengguna yang sesuai tanpa mengembalikan field password demi keamanan.
 * 
 * @param token Token sesi pengguna (Bearer token)
 * @returns Object berisi data profil pengguna (id, name, email, created_at)
 */
export const getCurrentUser = async (token: string) => {
  const sessionResult = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  const session = sessionResult[0];
  if (!session) {
    throw new Error("Unauthorized");
  }

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  const user = userResult[0];
  if (!user) {
    throw new Error("Unauthorized");
  }

  return {
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.createdAt,
    }
  };
};

/**
 * Melakukan proses logout untuk menghapus sesi pengguna.
 * Memeriksa keberadaan token sesi aktif di database dan menghapusnya agar
 * token tersebut tidak dapat digunakan lagi.
 * 
 * @param token Token sesi yang ingin dihapus/di-invalidate
 * @returns Object berisi status sukses {"data": "OK"}
 */
export const logoutUser = async (token: string) => {
  const existingSession = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
  if (existingSession.length === 0) {
    throw new Error("Unauthorized");
  }

  await db.delete(sessions).where(eq(sessions.token, token));

  return {
    data: "OK"
  };
};
