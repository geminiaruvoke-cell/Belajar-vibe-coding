import { Elysia, t } from "elysia";
import { registerUser, loginUser, getCurrentUser, logoutUser } from "../services/users-service";



export const usersRoute = new Elysia({ prefix: "/api" })
  .post(
    "/users",
    async ({ body, set }) => {
      try {
        const result = await registerUser(body);
        return result;
      } catch (error: any) {
        if (error.message === "email sudah terdaftar") {
          set.status = 400;
          return { error: error.message };
        }
        set.status = 500;
        return { error: "Internal server error" };
      }
    },
    {
      body: t.Object({
        name: t.String({ maxLength: 256 }),
        email: t.String({ format: "email", maxLength: 256 }),
        password: t.String({ maxLength: 256 }),
      }),
      detail: {
        tags: ["Users"],
        summary: "Register new user",
      },
      response: {
        200: t.Object({ data: t.String() }),
        400: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() }),
      },
    }
  )
  .post(
    "/users/login",
    async ({ body, set }) => {
      try {
        const result = await loginUser(body);
        return result;
      } catch (error: any) {
        if (error.message === "email atau password salah") {
          set.status = 400;
          return { error: error.message };
        }
        set.status = 500;
        return { error: "Internal server error" };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email", maxLength: 256 }),
        password: t.String({ maxLength: 256 }),
      }),
      detail: {
        tags: ["Users"],
        summary: "Login user",
      },
      response: {
        200: t.Object({ data: t.String() }),
        400: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() }),
      },
    }
  )
  .derive(({ headers, set }) => {
    const authHeader = headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      set.status = 401;
      throw new Error("Unauthorized");
    }
    const token = authHeader.split(" ")[1];
    return { token };
  })
  .get(
    "/users/current",
    async ({ token, set }: any) => {
      try {
        const result = await getCurrentUser(token);
        return result;
      } catch (error: any) {
        if (error.message === "Unauthorized") {
          set.status = 401;
          return { error: "Unauthorized" };
        }
        set.status = 500;
        return { error: "Internal server error" };
      }
    },
    {
      detail: {
        tags: ["Users"],
        summary: "Get current user info",
        security: [{ bearerAuth: [] }],
      },
      response: {
        200: t.Object({
          data: t.Object({
            id: t.Number(),
            name: t.String(),
            email: t.String(),
            created_at: t.Any(),
          }),
        }),
        401: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() }),
      },
    }
  )
  .delete(
    "/users/logout",
    async ({ token, set }: any) => {
      try {
        const result = await logoutUser(token);
        return result;
      } catch (error: any) {
        if (error.message === "Unauthorized") {
          set.status = 401;
          return { error: "Unauthorized" };
        }
        set.status = 500;
        return { error: "Internal server error" };
      }
    },
    {
      detail: {
        tags: ["Users"],
        summary: "Logout user",
        security: [{ bearerAuth: [] }],
      },
      response: {
        200: t.Object({ data: t.String() }),
        401: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() }),
      },
    }
  );
