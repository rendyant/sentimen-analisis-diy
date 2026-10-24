import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log("🔍 Middleware path:", pathname);

  const token = request.cookies.get("token")?.value;
  const payload = token ? await verifyToken(token) : null;
  console.log("👤 Payload:", payload);

  const isAuthPage = pathname === "/login" || pathname === "/daftar";
  const isApi = pathname.startsWith("/api");
  const isAdminArea = pathname.startsWith("/admin");

  // Abaikan API, static files, dll
  if (isApi) return NextResponse.next();

  // 1. Belum login → lempar ke /login
  if (!payload && !isAuthPage) {
    console.log("🚫 Belum login → redirect ke /login");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Sudah login & buka halaman auth → lempar sesuai role
  if (payload && isAuthPage) {
    const dest = payload.role === "ADMIN" ? "/admin" : "/";
    console.log("✅ Sudah login → redirect ke:", dest);
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // 3. User biasa coba buka /admin → tolak
  if (payload && isAdminArea && payload.role !== "ADMIN") {
    console.log("🚫 User biasa coba akses admin → redirect ke /");
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};