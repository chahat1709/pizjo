export default async function handler(): Promise<Response> {
  return new Response(JSON.stringify({ ok: true, service: "pizjo-admin", time: new Date().toISOString() }), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
