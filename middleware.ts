import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {
  // Get custom auth token from Authorization header or cookies
  const authHeader = req.headers.get('authorization')
  const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null
  const tokenFromCookie = req.cookies.get('token')?.value

  const token = tokenFromHeader || tokenFromCookie
  const isAuth = !!token
  
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register")

  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    return NextResponse.next()
  }

  // Temporarily disabled for development - allow all dashboard access
  // TODO: Implement proper JWT validation in production
  // if (!isAuth && req.nextUrl.pathname.startsWith("/dashboard")) {
  //   let to = encodeURIComponent(req.nextUrl.pathname)
  //   if (req.nextUrl.search) {
  //     to = encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)
  //   }

  //   return NextResponse.redirect(
  //     new URL(`/login?to=${to}`, req.url)
  //   )
  // }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/editor/:path*", "/login", "/register"],
}
