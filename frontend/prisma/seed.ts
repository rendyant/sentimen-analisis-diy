import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = bcrypt.hashSync("password123", 10);

  // OPD
  const dikpora = await prisma.opd.upsert({
    where: { code: "OPD-001" },
    update: {},
    create: { code: "OPD-001", name: "Dinas Pendidikan, Pemuda, dan Olahraga", category: "Pendidikan" },
  });
  const dinkes = await prisma.opd.upsert({
    where: { code: "OPD-002" },
    update: {},
    create: { code: "OPD-002", name: "Dinas Kesehatan", category: "Kesehatan & Medis" },
  });

  // Users: 1 admin, 1 user OPD
  await prisma.user.upsert({
    where: { email: "admin@jogjaprov.go.id" },
    update: {},
    create: { name: "Budi Santoso, S.Kom., M.T.", email: "admin@jogjaprov.go.id", password: hash, role: "ADMIN", nip: "19780512 200312 1 004" },
  });
  await prisma.user.upsert({
    where: { email: "user@dikpora.go.id" },
    update: {},
    create: { name: "Admin Analyst", email: "user@dikpora.go.id", password: hash, role: "USER", opdId: dikpora.id, nip: "19850101 201001 1 001" },
  });

  // Contoh ulasan (nanti diganti import CSV)
  await prisma.ulasan.createMany({
    data: [
      { tanggal: new Date("2024-08-12"), sumber: "Google Reviews", pengadu: "Warga DIY", isi: "Sistem pendaftaran PPDB online servernya down terus sejak pagi. Tolong segera diperbaiki.", bintang: 1, sentimen: "NEGATIF", aspek: "Sistem Digital", akurasi: 94, status: "PENDING", opdId: dikpora.id },
      { tanggal: new Date("2024-08-11"), sumber: "Instagram", pengadu: "Pelajar", isi: "Alhamdulillah, pencairan beasiswa pendidikan bulan ini lancar dan cepat prosesnya.", bintang: 5, sentimen: "POSITIF", aspek: "Pelayanan", akurasi: 91, status: "SELESAI", opdId: dikpora.id },
      { tanggal: new Date("2024-08-10"), sumber: "X (Twitter)", pengadu: "Orang Tua Wali", isi: "Mohon info jadwal pembagian seragam gratis untuk siswa SD di wilayah Bantul.", bintang: 3, sentimen: "NETRAL", aspek: "Informasi", akurasi: 88, status: "PENDING", opdId: dikpora.id },
      { tanggal: new Date("2024-08-09"), sumber: "Google Maps", pengadu: "Pasien", isi: "Pelayanan Puskesmas memadai dan obat lengkap, tapi waktu tunggu dokter agak lama.", bintang: 4, sentimen: "POSITIF", aspek: "Pelayanan", akurasi: 88.2, status: "SELESAI", opdId: dinkes.id },
    ],
  });

  console.log("✅ Seed selesai: 2 OPD, 2 user, 4 ulasan");
}

main().finally(() => prisma.$disconnect());