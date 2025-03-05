import { NextRequest, NextResponse } from "next/server";

function isProtected(request: NextRequest) {
  return ["/play"].includes(request.nextUrl.pathname);
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get(process.env.TWITCH_ACCESS_TOKEN_NAME);

  if (!token && isProtected(request)) {
    return NextResponse.redirect(new URL("/", request.url));
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
