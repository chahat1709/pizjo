import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { adminRouter } from "./routers/admin";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    // Login/logout/setup are plain REST endpoints (see server/auth/routes.ts)
    // so cookie headers work identically on Express and serverless runtimes.
    me: publicProcedure.query(opts => opts.ctx.user),
  }),
  admin: adminRouter,

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
