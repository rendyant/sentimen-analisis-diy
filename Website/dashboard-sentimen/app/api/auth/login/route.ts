import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    console.log("📥 Login request masuk");

    // Parse body dengan aman
    let body;
    try {
      body = await req.json();
      console.log("📦 Body diterima:", { email: body.email, password: "***" });
    } catch (e) {
      console.log("❌ Gagal parse JSON:", e);
      return NextResponse.json({ message: "Format request tidak valid" }, { status: 400 });
    }

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: "Email dan password wajib diisi" }, { status: 400 });
    }

    // Cari user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log("❌ User tidak ditemukan:", email);
      return NextResponse.json({ message: "Email tidak terdaftar" }, { status: 401 });
    }

    console.log("✅ User ditemukan:", user.email, "role:", user.role);

    // Verifikasi password
    const valid = await bcrypt.compare(password, user.password);
    console.log("🔐 Password valid?", valid);

    if (!valid) {
      return NextResponse.json({ message: "Kata sandi salah" }, { status: 401 });
    }

    // Buat token
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
      maxAge: 60 * 60 * 24 * 7,
    });

    console.log("✅ Login sukses, redirect ke:", user.role === "ADMIN" ? "/admin" : "/");
    return res;
  } catch (error) {
    console.error("💥 Error di login route:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}