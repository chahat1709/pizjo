import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.SESSION_SECRET = "test-secret-that-is-long-enough-for-hs256";

import { hashPassword, verifyPassword } from "./password";
import { handleLogin, handleSetupStatus } from "./routes";
import {
  buildSessionClearCookie,
  buildSessionSetCookie,
  getSessionTokenFromCookie,
  verifySession,
} from "./session";
import { signSession } from "./session";

describe("local password auth", () => {
  it("hashes with scrypt and verifies, rejecting wrong passwords", async () => {
    const hash = await hashPassword("correct-horse-123");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct-horse-123", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
    expect(await verifyPassword("correct-horse-123", "not-a-hash")).toBe(false);
  });

  it("rejects short passwords at hash time", async () => {
    await expect(hashPassword("short")).rejects.toThrow(/8 characters/);
  });
});

describe("session cookies", () => {
  it("round-trips a signed session through the cookie helpers", async () => {
    const token = await signSession({ sub: 7, role: "admin", name: "Owner" });
    const setCookie = buildSessionSetCookie(token, true);
    expect(setCookie).toContain("app_session_id=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
    const extracted = getSessionTokenFromCookie(setCookie.split(";")[0] + "; other=1");
    expect(extracted).toBe(token);
    expect(await verifySession(token)).toMatchObject({ sub: 7, role: "admin" });
  });

  it("rejects forged tokens and builds a clearing cookie on logout", async () => {
    expect(await verifySession("forged.token.here")).toBeNull();
    expect(buildSessionClearCookie(false)).toContain("Max-Age=0");
  });
});

describe("auth REST handlers", () => {
  beforeEach(() => vi.unstubAllEnvs());

  it("reports setup status without crashing when no database is configured", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const res = await handleSetupStatus();
    expect([200, 503]).toContain(res.status);
  });

  it("rate-limits repeated login attempts", async () => {
    const ip = `test-ip-${Date.now()}`;
    let last = 0;
    for (let i = 0; i < 12; i++) {
      const res = await handleLogin({ body: {}, ip });
      last = res.status;
    }
    expect(last).toBe(429);
  });

  it("rejects empty credentials without touching the database", async () => {
    const res = await handleLogin({ body: { username: "", password: "" }, ip: null });
    expect(res.status).toBe(400);
  });
});
