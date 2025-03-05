import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(process.env.TWITCH_ACCESS_TOKEN_NAME);
  const refreshToken = request.cookies.get(
    process.env.TWITCH_REFRESH_TOKEN_NAME,
  );

  if (!token && refreshToken) {
    return NextResponse.redirect(
      new URL("/api/auth/twitch/refresh", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
