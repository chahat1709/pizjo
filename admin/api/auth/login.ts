import { handleLogin } from "../../server/auth/routes";
import { jsonResponse, readJsonBody, requestMeta } from "../_lib";

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ status: 405, headers: {}, body: { error: "Method not allowed" } });
  }
  const meta = requestMeta(req);
  return jsonResponse(await handleLogin({ body: await readJsonBody(req), ...meta }));
}
