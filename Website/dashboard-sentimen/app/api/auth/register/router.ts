import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { name, nip, email, opdId, password } = await req.json();

  if (!name || !email || !password || !nip) {
    return NextResponse.json({ message: "Semua field wajib diisi" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ message: "Email sudah terdaftar" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { name, nip, email, password: hashed, role: "USER", opdId: opdId || null },
  });

  return NextResponse.json({ message: "Registrasi berhasil" }, { status: 201 });
}