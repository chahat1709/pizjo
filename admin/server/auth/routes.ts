import { createUser, getUserByUsername, hasAnyUser } from "../db";
import { hashPassword, verifyPassword } from "./password";
import {
  buildSessionClearCookie,
  buildSessionSetCookie,
  isSecureHost,
  signSession,
} from "./session";

export type AuthRequest = {
  body: unknown;
  /** Client IP for best-effort login rate limiting (per-instance on serverless). */
  ip?: string | null;
  host?: string | null;
  proto?: string | null;
};

export type AuthResponse = {
  status: number;
  headers: Record<string, string>;
  body: unknown;
};

// Best-effort brute-force guard. NOTE: in-memory only — on serverless each
// instance keeps its own counters. Real protection comes from strong passwords.
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;

function rateLimited(ip: string | null | undefined): boolean {
  if (!ip) return false;
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

function validUsername(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9._-]{3,64}$/i.test(value.trim());
}

export async function handleSetupStatus(): Promise<AuthResponse> {
  try {
    return { status: 200, headers: {}, body: { setupRequired: !(await hasAnyUser()) } };
  } catch {
    return { status: 503, headers: {}, body: { error: "Database unavailable" } };
  }
}

export async function handleSetup(req: AuthRequest): Promise<AuthResponse> {
  if (rateLimited(req.ip)) return { status: 429, headers: {}, body: { error: "Too many attempts, try again later" } };
  const body = (req.body ?? {}) as Record<string, unknown>;
  try {
    if (await hasAnyUser()) {
      return { status: 403, headers: {}, body: { error: "Setup is already complete" } };
    }
    if (!validUsername(body.username)) {
      return { status: 400, headers: {}, body: { error: "Username must be 3-64 chars (letters, numbers, . _ -)" } };
    }
    const id = await createUser({
      username: String(body.username),
      passwordHash: await hashPassword(String(body.password ?? "")),
      name: typeof body.name === "string" ? body.name.slice(0, 180) : null,
      role: "admin",
    });
    const token = await signSession({ sub: id, role: "admin", name: typeof body.name === "string" ? body.name : "" });
    const secure = isSecureHost(req.host, req.proto);
    return {
      status: 201,
      headers: { "Set-Cookie": buildSessionSetCookie(token, secure) },
      // Token is also returned so the login page can mirror it into
      // sessionStorage for the Safari-ITP Bearer fallback.
      body: { ok: true, token },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Setup failed";
    const status = /taken|required|least|long/.test(message) ? 400 : 500;
    return { status, headers: {}, body: { error: message } };
  }
}

export async function handleLogin(req: AuthRequest): Promise<AuthResponse> {
  if (rateLimited(req.ip)) return { status: 429, headers: {}, body: { error: "Too many attempts, try again later" } };
  const body = (req.body ?? {}) as Record<string, unknown>;
  try {
    if (!validUsername(body.username) || typeof body.password !== "string" || !body.password) {
      return { status: 400, headers: {}, body: { error: "Username and password are required" } };
    }
    const user = await getUserByUsername(String(body.username));
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return { status: 401, headers: {}, body: { error: "Invalid username or password" } };
    }
    const { touchLastSignedIn } = await import("../db");
    await touchLastSignedIn(user.id);
    const token = await signSession({ sub: user.id, role: user.role === "admin" ? "admin" : "staff", name: user.name ?? "" });
    const secure = isSecureHost(req.host, req.proto);
    return {
      status: 200,
      headers: { "Set-Cookie": buildSessionSetCookie(token, secure) },
      // Token is also returned so the login page can mirror it into
      // sessionStorage for the Safari-ITP Bearer fallback.
      body: { ok: true, token },
    };
  } catch {
    return { status: 500, headers: {}, body: { error: "Login failed" } };
  }
}

export async function handleLogout(req: AuthRequest): Promise<AuthResponse> {
  const secure = isSecureHost(req.host, req.proto);
  return { status: 200, headers: { "Set-Cookie": buildSessionClearCookie(secure) }, body: { success: true } };
}
