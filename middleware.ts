import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/tools/solar-leads/login";
  const isApi = pathname.startsWith("/api/solar");
  const authed = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (isLogin) {
    if (authed) {
      return NextResponse.redirect(new URL("/tools/solar-leads", request.url));
    }
    return NextResponse.next();
  }

  if (authed) {
    return NextResponse.next();
  }

  if (isApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/tools/solar-leads/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/tools/solar-leads", "/tools/solar-leads/:path*", "/api/solar/:path*"],
};
