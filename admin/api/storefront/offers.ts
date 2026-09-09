import { listStorefrontOffers } from "../../server/db";
import { jsonResponse, withFeedCors } from "../_lib";

export default async function handler(req: Request): Promise<Response> {
  const headers = new Headers();
  withFeedCors(req, headers);
  try {
    const offers = await listStorefrontOffers();
    headers.set("Cache-Control", "public, max-age=60");
    headers.set("Content-Type", "application/json; charset=utf-8");
    return new Response(
      JSON.stringify({ generatedAt: new Date().toISOString(), offers }),
      { status: 200, headers },
    );
  } catch (error) {
    console.error("[storefront offers]", error);
    return jsonResponse({ status: 503, headers: {}, body: { error: "Offer data is temporarily unavailable" } });
  }
}
