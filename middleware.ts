import { NextRequest, NextResponse } from "next/server";

const isProtected = (pathname: string) => {
  const protectedPaths = ["/play", "/api/publish"];

  return protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
};

export function middleware(request: NextRequest) {
  const token = request.cookies.get(process.env.ACCESS_TOKEN_NAME);
  const refreshToken = request.cookies.get(process.env.REFRESH_TOKEN_NAME);

  if (!token && refreshToken) {
    return NextResponse.redirect(
      new URL(process.env.AUTH_REFRESH_URL, request.url),
    );
  }

  if (!token && isProtected(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) except for api/publish
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api(?!/publish)|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    "/api/publish/:path*",
  ],
};
