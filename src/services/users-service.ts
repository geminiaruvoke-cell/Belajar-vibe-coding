import { db } from "../db";
import { users } from "../db/schema";
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
