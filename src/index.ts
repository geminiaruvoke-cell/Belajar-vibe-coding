import { Elysia } from "elysia";
import { usersRoute } from "./routes/users-route";

export const app = new Elysia()
  .get("/", () => "Hello World! Server is up and running.")
  .use(usersRoute)
  .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
