import { Elysia, t } from "elysia";
import { db } from "./db";
import { users } from "./db/schema";

const app = new Elysia()
  .get("/", () => "Hello World! Server is up and running.")
  .get("/users", async () => {
    return await db.select().from(users);
  })
  .post(
    "/users",
    async ({ body }) => {
      await db.insert(users).values({
        name: body.name,
        email: body.email,
      });
      return { success: true, message: "User created" };
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
      }),
    }
  )
  .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
