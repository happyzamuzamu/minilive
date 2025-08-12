import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/")) return NextResponse.next();
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};