import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createFetchContext } from "../../server/_core/context";
import { appRouter } from "../../server/routers";

export default function handler(req: Request): Promise<Response> {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createFetchContext(req),
  });
}
