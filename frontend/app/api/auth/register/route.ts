import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, nip, email, opdId, password } = await req.json();

    if (!name || !email || !password || !nip) {
      return NextResponse.json({ message: "Semua field wajib diisi" }, { status: 400 });
    }

    const normalizedOpdId = opdId ? opdId.replace(/^opd-/, "") : null;

    // 1. Daftarkan ke Backend FastAPI (agar muncul di Manajemen User Admin)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
      const fastRes = await fetch(`${backendUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name,
          email,
          opd_id: normalizedOpdId,
          password,
        }),
      });
      if (!fastRes.ok && fastRes.status === 400) {
        const errData = await fastRes.json();
        return NextResponse.json({ message: errData.detail || "Email sudah terdaftar" }, { status: 409 });
      }
      if (fastRes.ok) {
        return NextResponse.json({ message: "Registrasi berhasil" }, { status: 201 });
      }
    } catch {
      // Lanjut ke Prisma jika FastAPI belum jalan
    }

    // 2. Fallback simpan ke Prisma
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ message: "Email sudah terdaftar" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: { name, nip, email, password: hashed, role: "USER", opdId: opdId || null },
    });

    return NextResponse.json({ message: "Registrasi berhasil" }, { status: 201 });
  } catch (err) {
    console.error("Error register:", err);
    return NextResponse.json({ message: "Gagal memproses registrasi" }, { status: 500 });
  }
}
