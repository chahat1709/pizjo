import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { getUserById } from "../db";
import type { User } from "../../drizzle/schema";
import { getSessionTokenFromCookie, verifySession } from "../auth/session";

export type TrpcContext = {
  user: User | null;
};

/** Framework-agnostic: resolve the session user from Cookie / Bearer headers. */
export async function createContextFromHeaders(headers: {
  cookie?: string | string[] | null;
  authorization?: string | null;
}): Promise<TrpcContext> {
  const cookieHeader = Array.isArray(headers.cookie) ? headers.cookie.join("; ") : (headers.cookie ?? null);
  let token = getSessionTokenFromCookie(cookieHeader);
  if (!token && headers.authorization) {
    const match = headers.authorization.match(/^Bearer\s+(.+)$/i);
    if (match) token = match[1].trim();
  }
  if (!token) return { user: null };
  const session = await verifySession(token);
  if (!session) return { user: null };
  try {
    const user = await getUserById(session.sub);
    return { user: user ?? null };
  } catch {
    // Database unreachable: treat as anonymous rather than crashing queries.
    return { user: null };
  }
}

/** Back-compat alias used by older call sites. */
export const createContextFromCookie = (cookieHeader: string | null | undefined) =>
  createContextFromHeaders({ cookie: cookieHeader });

/** Express adapter wrapper (local dev server). */
export async function createContext(
  opts: CreateExpressContextOptions,
): Promise<TrpcContext> {
  return createContextFromHeaders({
    cookie: opts.req.headers?.cookie ?? null,
    authorization: Array.isArray(opts.req.headers?.authorization)
      ? opts.req.headers.authorization.join(", ")
      : (opts.req.headers?.authorization ?? null),
  });
}

/** Fetch adapter wrapper (Vercel serverless functions). */
export async function createFetchContext(req: Request): Promise<TrpcContext> {
  return createContextFromHeaders({
    cookie: req.headers.get("cookie"),
    authorization: req.headers.get("authorization"),
  });
}
