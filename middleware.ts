// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 이미 editor 페이지에 있거나 내부 경로인 경우 리다이렉트하지 않음
  if (
    pathname === "/editor" ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/logo")
  ) {
    return NextResponse.next();
  }

  // editor로 리다이렉트
  return NextResponse.redirect(new URL("/editor", request.url));
}

// 미들웨어가 실행될 경로 지정
export const config = {
  matcher: ["/((?!api|_next|editor|favicon.ico).*)"],
};
