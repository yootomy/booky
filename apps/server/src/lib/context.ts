import type { NextRequest } from "next/server";
import { getUserFromRequest } from "./auth";

export async function createContext(req: NextRequest) {
  const user = await getUserFromRequest(req);
  return {
    user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
