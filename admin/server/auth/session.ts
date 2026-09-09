import { COOKIE_NAME } from "@shared/const";
import { jwtVerify, SignJWT } from "jose";

export type SessionPayload = { sub: number; role: "admin" | "staff"; name: string };

const THIRTY_DAYS_S = 60 * 60 * 24 * 30;

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET || "";
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET (min 32 chars) is required");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.sub))
    .setIssuedAt()
    .setExpirationTime(`${THIRTY_DAYS_S}s`)
    .sign(secretKey());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const sub = Number(payload.sub);
    if (!Number.isInteger(sub)) return null;
    const role = payload.role === "admin" ? "admin" : "staff";
    return { sub, role, name: String(payload.name ?? "") };
  } catch {
    return null;
  }
}

export function getSessionTokenFromCookie(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  const prefix = `${COOKIE_NAME}=`;
  const pair = cookieHeader.split(";").find(part => part.trim().startsWith(prefix));
  if (!pair) return null;
  return decodeURIComponent(pair.trim().slice(prefix.length)) || null;
}

function cookieBase(secure: boolean): string {
  // SameSite=Lax works for same-origin admin; Secure only on https.
  return `${COOKIE_NAME}=%s; Path=/; HttpOnly; SameSite=Lax; Max-Age=${THIRTY_DAYS_S}${secure ? "; Secure" : ""}`;
}

export function buildSessionSetCookie(token: string, secure: boolean): string {
  return cookieBase(secure).replace("%s", encodeURIComponent(token));
}

export function buildSessionClearCookie(secure: boolean): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
}

export function isSecureHost(host: string | null | undefined, proto: string | null | undefined): boolean {
  if (proto === "https") return true;
  const h = (host || "").split(":")[0].toLowerCase();
  return h !== "localhost" && h !== "127.0.0.1" && h !== "::1" && h !== "";
}
