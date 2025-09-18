import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (request: NextRequest, data: T) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      let data: unknown;

      if (request.method === "GET") {
        const { searchParams } = new URL(request.url);
        const params: Record<string, string> = {};
        searchParams.forEach((value, key) => {
          params[key] = value;
        });
        data = params;
      } else {
        data = await request.json();
      }

      const validatedData = schema.parse(data);
      return handler(request, validatedData);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: "Validation error",
            details: error.issues,
          },
          { status: 400 }
        );
      }

      console.error("Validation middleware error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

export function withQueryValidation<T>(
  schema: ZodSchema<T>,
  handler: (request: NextRequest, query: T) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const params: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });

      const validatedQuery = schema.parse(params);
      return handler(request, validatedQuery);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: "Query validation error",
            details: error.issues,
          },
          { status: 400 }
        );
      }

      console.error("Query validation middleware error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
