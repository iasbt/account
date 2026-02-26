import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import bcryptjs from "bcryptjs";
import request from "supertest";

process.env.SSO_JWT_SECRET = "testsecret";

const mockQuery = vi.fn().mockResolvedValue({ rows: [], rowCount: 0 });

vi.mock("../../../db.js", () => ({
  default: {
    query: (...args: unknown[]) => mockQuery(...args),
  },
}));

// Mock Redis
vi.mock("../../../utils/verificationStore.js", () => ({
  setVerificationCode: vi.fn(),
  getVerificationCode: vi.fn(),
  deleteVerificationCode: vi.fn(),
}));

// Mock Email Queue (BullMQ)
vi.mock("../../../utils/emailQueue.js", () => ({
  emailQueue: {
    add: vi.fn(),
  },
  addEmailJob: vi.fn(),
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
      if (text.includes("FROM public.users WHERE email = $1 OR name = $1")) {
        return Promise.resolve({
          rowCount: 1,
          rows: [
            {
              id: "user-1",
              email: "user@test.com",
              name: "user",
              password: passwordHash,
              is_admin: false,
            },
          ],
        });
      }
      return Promise.reject(new Error(`Unexpected query: ${text}`));
    });

    const response = await request(app as Parameters<typeof request>[0])
      .post("/auth/login")
      .send({ account: "user@test.com", password });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user.isAdmin).toBe(false);
  });

  it("管理员登录成功", async () => {
    const password = "AdminPass123!";
    const passwordHash = await bcryptjs.hash(password, 10);
    mockQuery.mockImplementation((text: string) => {
      if (text.includes("FROM public.users WHERE email = $1 OR name = $1")) {
        return Promise.resolve({
          rowCount: 1,
          rows: [
            {
              id: "admin-1",
              email: "admin@test.com",
              name: "admin",
              password: passwordHash,
              is_admin: true,
            },
          ],
        });
      }
      return Promise.reject(new Error(`Unexpected query: ${text}`));
    });

    const response = await request(app as Parameters<typeof request>[0])
      .post("/admin/auth/login")
      .send({ account: "admin@test.com", password });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user.isAdmin).toBe(true);
  });
});
