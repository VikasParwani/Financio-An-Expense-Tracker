import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get("auth")
  const isLoggedIn = authCookie?.value === "true"
  const { pathname } = request.nextUrl

  // Always redirect to login if accessing root path
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Redirect to login if not logged in and trying to access protected routes
  if (
      !isLoggedIn &&
      (pathname.startsWith("/dashboard") ||
          pathname.startsWith("/transactions") ||
          pathname.startsWith("/calendar") ||
          pathname.startsWith("/profile") ||
          pathname.startsWith("/about"))
  ) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Redirect to dashboard if logged in and trying to access login
  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
