import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ message: "Sesi tidak valid" }, { status: 401 });
  }

  return NextResponse.json({
    id: payload.id,
    role: payload.role,
    name: payload.name || (payload.role === "ADMIN" ? "Super Admin Pemda DIY" : "Admin Analis OPD"),
    email: payload.email || (payload.role === "ADMIN" ? "admin@jogjaprov.go.id" : "user@dikpora.go.id"),
    opdId: payload.opdId || (payload.role === "ADMIN" ? "" : "dikpora"),
    opdName: payload.opdName || (payload.role === "ADMIN" ? "Semua 24 Instansi Pemda DIY" : "Dinas Pendidikan, Pemuda dan Olahraga DIY"),
  });
}
