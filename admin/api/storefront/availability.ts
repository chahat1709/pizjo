import { listMenuItems } from "../../server/db";
import { headersToRecord, jsonResponse, withFeedCors } from "../_lib";

export default async function handler(req: Request): Promise<Response> {
  const headers = new Headers();
  withFeedCors(req, headers);
  try {
    const items = await listMenuItems();
    headers.set("Cache-Control", "public, max-age=60");
    headers.set("Content-Type", "application/json; charset=utf-8");
    return new Response(
      JSON.stringify({
        generatedAt: new Date().toISOString(),
        items: items.map(item => ({ catalogId: item.catalogId, isAvailable: item.isAvailable && !item.isOutOfStock })),
      }),
      { status: 200, headers },
    );
  } catch (error) {
    console.error("[storefront availability]", error);
    return jsonResponse({ status: 503, headers: headersToRecord(headers), body: { error: "Availability data is temporarily unavailable" } });
  }
}
