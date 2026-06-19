import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

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

export const getCurrentUser = async (token: string) => {
  const result = await db
    .select({
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
    .limit(1);

  const row = result[0];
  if (!row || !row.user) {
    throw new Error("Unauthorized");
  }

  const user = row.user;

  return {
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.createdAt,
    }
  };
};

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
