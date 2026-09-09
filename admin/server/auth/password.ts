import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options?: Record<string, number>,
) => Promise<Buffer>;

// scrypt with OWASP-ish interactive parameters. Format:
//   scrypt$<N>$<r>$<p>$<saltHex>$<keyHex>
export async function hashPassword(password: string): Promise<string> {
  if (typeof password !== "string" || password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  if (password.length > 256) throw new Error("Password is too long");
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [algo, nStr, rStr, pStr, saltHex, keyHex] = String(stored).split("$");
    if (algo !== "scrypt" || !saltHex || !keyHex) return false;
    const key = await scryptAsync(password, Buffer.from(saltHex, "hex"), 64, {
      N: Number(nStr),
      r: Number(rStr),
      p: Number(pStr),
      maxmem: 64 * 1024 * 1024,
    });
    const expected = Buffer.from(keyHex, "hex");
    return key.length === expected.length && timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}
