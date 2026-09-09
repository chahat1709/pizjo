import { handleSetupStatus } from "../../server/auth/routes";
import { jsonResponse } from "../_lib";

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return jsonResponse({ status: 405, headers: {}, body: { error: "Method not allowed" } });
  }
  return jsonResponse(await handleSetupStatus());
}
