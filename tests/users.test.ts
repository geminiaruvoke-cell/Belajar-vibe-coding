import { describe, it, expect, beforeEach, afterAll } from "bun:test";
import { app } from "../src/index";
import { db } from "../src/db";
import { sessions, users } from "../src/db/schema";
import { sql, eq } from "drizzle-orm";

describe("Users API Tests", () => {
  beforeEach(async () => {
    // Truncate tables for a clean state before each test
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0;`);
    await db.execute(sql`TRUNCATE TABLE sessions;`);
    await db.execute(sql`TRUNCATE TABLE users;`);
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1;`);
  });

  afterAll(async () => {
    // Clean up after all tests
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0;`);
    await db.execute(sql`TRUNCATE TABLE sessions;`);
    await db.execute(sql`TRUNCATE TABLE users;`);
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1;`);
  });

  describe("A. POST /api/users (Registration)", () => {
    it("should successfully register a valid user", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test User",
            email: "valid@example.com",
            password: "password123",
          }),
        })
      );
      
      expect(response.status).toBe(200);
      const json: any = await response.json();
      expect(json.data).toBe("ok");
    });

    it("should fail to register if email is already registered", async () => {
      // First registration
      await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test User 1",
            email: "duplicate@example.com",
            password: "password123",
          }),
        })
      );

      // Second registration with same email
      const response = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test User 2",
            email: "duplicate@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(400);
      const json: any = await response.json();
      expect(json.error).toBe("email sudah terdaftar");
    });

    it("should fail registration validation if input exceeds length limits", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "a".repeat(300), // Exceeds 256
            email: "long@example.com",
            password: "password123",
          }),
        })
      );
      
      expect(response.status).toBe(422); // Unprocessable Entity
    });

    it("should fail registration validation if email format is invalid", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test User",
            email: "not-an-email",
            password: "password123",
          }),
        })
      );
      
      expect(response.status).toBe(422);
    });
  });

  describe("B. POST /api/users/login (Login)", () => {
    beforeEach(async () => {
      // Create a user to test login
      await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Login User",
            email: "login@example.com",
            password: "password123",
          }),
        })
      );
    });

    it("should successfully login with correct credentials", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "login@example.com",
            password: "password123",
          }),
        })
      );
      
      expect(response.status).toBe(200);
      const json: any = await response.json();
      expect(json.data).toBeDefined(); // Token
      expect(typeof json.data).toBe("string");
    });

    it("should fail to login if user does not exist", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "unknown@example.com",
            password: "password123",
          }),
        })
      );
      
      expect(response.status).toBe(400);
      const json: any = await response.json();
      expect(json.error).toBe("email atau password salah");
    });

    it("should fail to login with incorrect password", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "login@example.com",
            password: "wrongpassword",
          }),
        })
      );
      
      expect(response.status).toBe(400);
      const json: any = await response.json();
      expect(json.error).toBe("email atau password salah");
    });
  });

  describe("C. GET /api/users/current (Get Current User)", () => {
    let validToken: string;

    beforeEach(async () => {
      const regRes = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Current User",
            email: "current@example.com",
            password: "password123",
          }),
        })
      );
      if (regRes.status !== 200) console.log("Reg failed:", await regRes.text());

      const loginRes = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "current@example.com",
            password: "password123",
          }),
        })
      );
      const loginJson: any = await loginRes.json();
      if (loginRes.status !== 200) console.log("Login failed:", loginJson);
      validToken = loginJson.data;
    });

    it("should get current user with valid token", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "GET",
          headers: { "Authorization": `Bearer ${validToken}` },
        })
      );
      
      expect(response.status).toBe(200);
      const json: any = await response.json();
      expect(json.data.name).toBe("Current User");
      expect(json.data.email).toBe("current@example.com");
      expect(json.data.password).toBeUndefined(); // Should not return password
    });

    it("should fail to get user without Authorization header", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "GET",
        })
      );
      
      expect(response.status).toBe(401);
    });

    it("should fail to get user with wrong token format", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "GET",
          headers: { "Authorization": `${validToken}` }, // Missing "Bearer "
        })
      );
      
      expect(response.status).toBe(401);
    });

    it("should fail to get user with invalid token", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "GET",
          headers: { "Authorization": `Bearer invalid-token` },
        })
      );
      
      expect(response.status).toBe(401);
    });
  });

  describe("D. DELETE /api/users/logout (Logout)", () => {
    let validToken: string;

    beforeEach(async () => {
      await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Logout User",
            email: "logout@example.com",
            password: "password123",
          }),
        })
      );

      const loginRes = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "logout@example.com",
            password: "password123",
          }),
        })
      );
      const loginJson: any = await loginRes.json();
      validToken = loginJson.data;
    });

    it("should successfully logout with valid token", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${validToken}` },
        })
      );
      
      expect(response.status).toBe(200);
      const json: any = await response.json();
      expect(json.data).toBe("OK");
    });

    it("should fail to logout with invalid token", async () => {
      const response = await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
          headers: { "Authorization": `Bearer invalid-token` },
        })
      );
      
      expect(response.status).toBe(401);
    });

    it("should not be able to get current user after logout", async () => {
      // 1. Get current user before logout
      const getResBefore = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "GET",
          headers: { "Authorization": `Bearer ${validToken}` },
        })
      );
      expect(getResBefore.status).toBe(200);

      // 2. Logout
      const logoutRes = await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${validToken}` },
        })
      );
      expect(logoutRes.status).toBe(200);

      // 3. Get current user after logout
      const getResAfter = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "GET",
          headers: { "Authorization": `Bearer ${validToken}` },
        })
      );
      expect(getResAfter.status).toBe(401);
    });
  });
});
