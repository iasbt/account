import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import bcryptjs from "bcryptjs";
import request from "supertest";

process.env.SSO_JWT_SECRET = "testsecret";

const mockQuery = vi.fn();

vi.mock("../../../db.js", () => ({
  default: {
    query: (...args: unknown[]) => mockQuery(...args),
  },
}));

let app: unknown;

beforeAll(async () => {
  app = (await import("../../../app.js")).default;
});

beforeEach(() => {
  mockQuery.mockReset();
});

describe("auth login", () => {
  it("用户登录成功", async () => {
    const password = "UserPass123!";
    const passwordHash = await bcryptjs.hash(password, 10);
    mockQuery.mockImplementation((text: string) => {
      if (text.includes("FROM public.legacy_users")) {
        return Promise.resolve({
          rowCount: 1,
          rows: [
            {
              id: "user-1",
              email: "user@test.com",
              username: "user",
              password_hash: passwordHash,
            },
          ],
        });
      }
      return Promise.reject(new Error(`Unexpected query: ${text}`));
    });

    const response = await request(app as Parameters<typeof request>[0])
      .post("/api/auth/login")
      .send({ account: "user@test.com", password });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user.isAdmin).toBe(false);
  });

  it("管理员登录成功", async () => {
    const password = "AdminPass123!";
    const passwordHash = await bcryptjs.hash(password, 10);
    mockQuery.mockImplementation((text: string) => {
      if (text.includes("FROM public.admin_accounts")) {
        return Promise.resolve({
          rowCount: 1,
          rows: [
            {
              id: "admin-1",
              email: "admin@test.com",
              password_hash: passwordHash,
              security_level: 10,
            },
          ],
        });
      }
      return Promise.reject(new Error(`Unexpected query: ${text}`));
    });

    const response = await request(app as Parameters<typeof request>[0])
      .post("/api/admin/auth/login")
      .send({ account: "admin@test.com", password });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user.isAdmin).toBe(true);
  });
});
