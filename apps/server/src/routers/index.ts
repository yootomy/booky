import { protectedProcedure, publicProcedure } from "../lib/orpc";
import { sagaRouter } from "./saga.router";
import type { RouterClient } from "@orpc/server";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  privateData: protectedProcedure.handler(({ context }) => {
    return {
      message: "This is private",
      user: context.user,
    };
  }),
  
  // Saga routes
  sagas: sagaRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
