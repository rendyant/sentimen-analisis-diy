import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { OPD_LIST } from "@/lib/api";

// Akun Fallback Darurat untuk Super Admin + seluruh 24 OPD Pemda DIY
const FALLBACK_OPD_USERS = OPD_LIST.filter((o) => Boolean(o.id)).map((opd, idx) => ({
  id: opd.id === "dikpora" ? "user-fallback-002" : `opd-fallback-${idx + 1}`,
  email: `user@${opd.id.replace(/_/g, "-")}.go.id`,
  password: "password123",
  name: `Admin Analis ${opd.nama}`,
  role: "USER",
  opdId: opd.id,
  opdName: opd.nama,
}));

const FALLBACK_USERS = [
  {
    id: "admin-fallback-001",
    email: "admin@jogjaprov.go.id",
    password: "password123",
    name: "Super Admin Pemda DIY",
    role: "ADMIN",
    opdId: "sekda",
    opdName: "Pemerintah Daerah Istimewa Yogyakarta",
  },
  ...FALLBACK_OPD_USERS,
];

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Format request tidak valid" }, { status: 400 });
    }

    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

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
            opdId: fastData.user.opd_id || "dikpora",
            opdName: fastData.user.opd_name || "OPD Pemda DIY",
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

    // 2. Jika belum ketemu, cek Database Prisma lokal
    if (!user) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { email },
          include: { opd: true },
        });
        if (dbUser) {
          const valid = await bcrypt.compare(password, dbUser.password);
          if (!valid) {
            return NextResponse.json({ message: "Kata sandi salah" }, { status: 401 });
          }
          const matchedOpd = OPD_LIST.find(
            (o) => o.id && (o.id === dbUser.opd?.code || email.includes(`@${o.id.replace(/_/g, "-")}.`))
          );
          user = {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
            opdId: matchedOpd?.id || (dbUser.opd?.code?.startsWith("OPD-") ? "dikpora" : dbUser.opd?.code) || "dikpora",
            opdName: dbUser.opd?.name || matchedOpd?.nama || "OPD Pemda DIY",
          };
        }
      } catch {
        // Abaikan jika Prisma tidak terhubung
      }
    }

    // 3. Jika belum ketemu, cek Akun Fallback Default (Super Admin + 24 OPD)
    if (!user) {
      const fallback = FALLBACK_USERS.find(
        (u) => u.email.toLowerCase() === email && u.password === password
      );
      if (fallback) {
        user = fallback;
      }
    }

    // 4. Jika tetap tidak cocok
    if (!user) {
      return NextResponse.json({ message: "Email atau kata sandi tidak terdaftar" }, { status: 401 });
    }

    // 5. Buat Token JWT Sesi lengkap dengan identitas OPD
    const token = await signToken({
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      opdId: user.opdId,
      opdName: user.opdName,
    });

    const res = NextResponse.json({
      role: user.role,
      name: user.name,
      email: user.email,
      opdId: user.opdId,
      opdName: user.opdName,
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
