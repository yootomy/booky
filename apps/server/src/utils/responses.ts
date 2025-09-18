import { NextResponse } from "next/server";

export const responses = {
  success: <T>(data: T, message?: string) => {
    return NextResponse.json({
      success: true,
      data,
      message,
    });
  },

  error: (message: string, status: number = 400, code?: string) => {
    return NextResponse.json(
      {
        success: false,
        error: message,
        code,
      },
      { status }
    );
  },

  notFound: (resource: string = "Resource") => {
    return NextResponse.json(
      {
        success: false,
        error: `${resource} not found`,
      },
      { status: 404 }
    );
  },

  unauthorized: (message: string = "Authentication required") => {
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 401 }
    );
  },

  forbidden: (message: string = "Access denied") => {
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 403 }
    );
  },

  serverError: (message: string = "Internal server error") => {
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  },
};
