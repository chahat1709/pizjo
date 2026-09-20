import type { User } from "../drizzle/schema";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { adminRouter } from "./routers/admin";

export type SafeUser = Omit<User, "passwordHash">;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    // Login/logout/setup are plain REST endpoints (see server/auth/routes.ts)
    // so cookie headers work identically on Express and serverless runtimes.
    // Never leak the password hash to the client.
    me: publicProcedure.query((opts): SafeUser | null => {
      if (!opts.ctx.user) return null;
      const { passwordHash: _omitted, ...safeUser } = opts.ctx.user;
      return safeUser;
    }),
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
