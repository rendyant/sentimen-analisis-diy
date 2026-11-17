import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

// Akun Fallback Darurat (Pasti Berhasil Meskipun DB Bermasalah)
const FALLBACK_USERS = [
  {
    id: "admin-fallback-001",
    email: "admin@jogjaprov.go.id",
    password: "password123",
    name: "Super Admin Pemda DIY",
    role: "ADMIN",
  },
  {
    id: "user-fallback-002",
    email: "user@dikpora.go.id",
    password: "password123",
    name: "Admin Analis Dikpora DIY",
    role: "USER",
  },
];

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Format request tidak valid" }, { status: 400 });
    }

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: "Email dan password wajib diisi" }, { status: 400 });
    }

    let user: any = null;

    // 1. Coba autentikasi ke Backend FastAPI (user_accounts) terlebih dahulu
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
      const fastApiRes = await fetch(`${backendUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (fastApiRes.ok) {
        const fastData = await fastApiRes.json();
        if (fastData?.user) {
          user = {
            id: fastData.user.id,
            email: fastData.user.email,
            name: fastData.user.full_name,
            role: fastData.user.role?.toUpperCase() === "ADMIN" ? "ADMIN" : "USER",
          };
        }
      } else if (fastApiRes.status === 403) {
        const errData = await fastApiRes.json();
        return NextResponse.json(
          { message: errData.detail || "Akun Anda masih menunggu persetujuan admin." },
          { status: 403 }
        );
      }
    } catch {
      // Lanjut jika backend FastAPI tidak merespons
    }

    // 2. Jika belum ketemu, cek Akun Fallback Default
    if (!user) {
      const fallback = FALLBACK_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
      );
      if (fallback) {
        user = fallback;
      }
    }

    // 3. Jika belum ketemu, coba cari di Database Prisma
    if (!user) {
      try {
        const dbUser = await prisma.user.findUnique({ where: { email } });
        if (dbUser) {
          const valid = await bcrypt.compare(password, dbUser.password);
          if (!valid) {
            return NextResponse.json({ message: "Kata sandi salah" }, { status: 401 });
          }
          user = dbUser;
        }
      } catch {
        // Abaikan jika Prisma tidak terhubung
      }
    }

    // 4. Jika tetap tidak cocok
    if (!user) {
      return NextResponse.json({ message: "Email atau kata sandi tidak terdaftar" }, { status: 401 });
    }

    // 5. Buat Token JWT Sesi
    const token = await signToken({ id: user.id, role: user.role });

    const res = NextResponse.json({
      role: user.role,
      name: user.name,
      message: "Login berhasil",
    });

    res.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 hari
    });

    return res;
  } catch (error) {
    console.error("Error di login route:", error);
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 });
  }
}
