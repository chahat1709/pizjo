import { ENV } from "../server/_core/env";

export function allowedOrigins(): Set<string> {
  return new Set([ENV.storefrontOrigin, process.env.STOREFRONT_ORIGIN].filter(Boolean) as string[]);
}

export function withFeedCors(req: Request, headers: Headers): void {
  const origin = req.headers.get("origin");
  if (origin && allowedOrigins().has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
}

export function clientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  const first = (forwarded ?? "").split(",")[0]?.trim();
  return first || null;
}

export function requestMeta(req: Request): { ip: string | null; host: string | null; proto: string | null } {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
  return { ip: clientIp(req), host, proto };
}

export async function readJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

export function jsonResponse(result: { status: number; headers: Record<string, string>; body: unknown }): Response {
  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });
  for (const [key, value] of Object.entries(result.headers)) headers.set(key, value);
  return new Response(JSON.stringify(result.body), { status: result.status, headers });
}
