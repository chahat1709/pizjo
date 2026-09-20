// End-to-end migration proof: setup -> login -> me -> catalog sync ->
// order create -> status flow -> feeds. Run with server booted.
const BASE = process.env.E2E_BASE || "http://localhost:4182";
const jar = {};

async function call(path, { method = "GET", body = null, batch = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (jar.cookie) headers.Cookie = jar.cookie;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) jar.cookie = setCookie.split(";")[0];
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

async function trpc(path, input) {
  const q = `?batch=1&input=${encodeURIComponent(JSON.stringify({ 0: { json: input ?? {} } }))}`;
  return call(`/api/trpc/${path}${q}`, { method: "GET" });
}

const results = [];
function check(name, cond, extra = "") {
  results.push({ name, pass: !!cond, extra });
  console.log(`${cond ? "PASS" : "FAIL"} ${name} ${extra}`);
}

// 1. setup-status: DB is migrated but empty -> setup required
let r = await call("/api/auth/setup-status");
check("setup-status reports required", r.status === 200 && r.data?.setupRequired === true, JSON.stringify(r.data));

// 2. setup owner
r = await call("/api/auth/setup", { method: "POST", body: { username: "owner", password: "verify-pass-123", name: "Owner" } });
check("setup creates owner admin", r.status === 201 && r.data?.ok === true, `status=${r.status}`);

// 3. setup again -> 403
r = await call("/api/auth/setup", { method: "POST", body: { username: "intruder", password: "verify-pass-123" } });
check("second setup blocked", r.status === 403, `status=${r.status}`);

// 4. bad login -> 401, then good login -> 200 + cookie
r = await call("/api/auth/login", { method: "POST", body: { username: "owner", password: "wrong-pass" } });
check("bad password rejected", r.status === 401, `status=${r.status}`);
r = await call("/api/auth/login", { method: "POST", body: { username: "owner", password: "verify-pass-123" } });
check("good login sets session", r.status === 200 && !!jar.cookie, `status=${r.status}`);

// 5. auth.me via tRPC
r = await trpc("auth.me");
check("auth.me returns owner", r.status === 200 && r.data?.[0]?.result?.data?.json?.username === "owner", JSON.stringify(r.data)?.slice(0, 120));

// 6. catalog sync -> 81/11 on real Postgres (mutation => POST batch)
r = await call("/api/trpc/admin.catalog.sync?batch=1", { method: "POST", body: { 0: { json: {} } } });
check("catalog sync 81/11", r.status === 200 && JSON.stringify(r.data).includes('"items":81'), JSON.stringify(r.data)?.slice(0, 120));

// 7. create order (walk-in, cash) + status flow
const menu = await trpc("admin.catalog.list");
const firstItem = menu.data?.[0]?.result?.data?.json?.[0];
r = await call("/api/trpc/admin.orders.create?batch=1", { method: "POST", body: { 0: { json: { source: "walk_in", paymentMethod: "cash", paymentStatus: "unpaid", discountPaise: 0, lines: [{ menuItemId: firstItem?.id ?? 1, quantity: 2 }] } } } });
const createdId = r.data?.[0]?.result?.data?.json;
check("order created", r.status === 200 && Number.isInteger(createdId) && createdId > 0, `id=${createdId}`);

// 8. feeds serve the synced catalog
r = await call("/api/storefront/availability");
const avail = r.data;
check("availability feed live", r.status === 200 && Array.isArray(avail?.items) && avail.items.length === 81, `items=${avail?.items?.length}`);
r = await call("/api/storefront/offers");
check("offers feed live", r.status === 200 && Array.isArray(r.data?.offers), JSON.stringify(r.data)?.slice(0, 100));

// 9. logout clears session
r = await call("/api/auth/logout", { method: "POST" });
check("logout clears cookie", r.status === 200, `status=${r.status}`);

const failed = results.filter(x => !x.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
