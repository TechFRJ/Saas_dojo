import { NextRequest, NextResponse } from "next/server";

const TEACHER_ROUTES = ["/dashboard", "/students", "/reports"];
const STUDENT_ROUTES = ["/me"];
const PUBLIC_ROUTES = ["/login", "/api"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("access_token")?.value;
  const role = request.cookies.get("user_role")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Protect teacher routes
  if (TEACHER_ROUTES.some((route) => pathname.startsWith(route))) {
    if (role !== "teacher") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Protect student routes
  if (STUDENT_ROUTES.some((route) => pathname.startsWith(route))) {
    if (role !== "student") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
