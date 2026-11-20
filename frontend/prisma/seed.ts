import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ALL_OPDS = [
  { id: "dinkes", name: "Dinas Kesehatan DIY", category: "Kesehatan" },
  { id: "dinsos", name: "Dinas Sosial DIY", category: "Sosial" },
  { id: "dishub", name: "Dinas Perhubungan DIY", category: "Perhubungan" },
  { id: "dispar", name: "Dinas Pariwisata DIY", category: "Pariwisata" },
  { id: "dikpora", name: "Dinas Pendidikan, Pemuda dan Olahraga DIY", category: "Pendidikan" },
  { id: "pupesdm", name: "Dinas PUP-ESDM DIY", category: "Infrastruktur" },
  { id: "dlhk", name: "Dinas Lingkungan Hidup dan Kehutanan DIY", category: "Lingkungan" },
  { id: "diskopukm", name: "Dinas Koperasi dan UKM DIY", category: "Ekonomi" },
  { id: "disperindag", name: "Dinas Perindustrian dan Perdagangan DIY", category: "Ekonomi" },
  { id: "dpmptsp", name: "Dinas Penanaman Modal dan PTSP DIY", category: "Perizinan" },
  { id: "disnakertrans", name: "Dinas Tenaga Kerja dan Transmigrasi DIY", category: "Ketenagakerjaan" },
  { id: "satpolpp", name: "Satuan Polisi Pamong Praja DIY", category: "Ketertiban" },
  { id: "diskominfo", name: "Dinas Komunikasi dan Informatika DIY", category: "Informatika" },
  { id: "disbud", name: "Dinas Kebudayaan DIY", category: "Kebudayaan" },
  { id: "dispursip", name: "Dinas Perpustakaan dan Arsip Daerah DIY", category: "Perpustakaan" },
  { id: "dispertaru", name: "Dinas Pertanahan dan Tata Ruang DIY", category: "Tata Ruang" },
  { id: "dispertan", name: "Dinas Pertanian dan Ketahanan Pangan DIY", category: "Pertanian" },
  { id: "dkp", name: "Dinas Kelautan dan Perikanan DIY", category: "Kelautan" },
  { id: "dp3ap2", name: "DP3AP2 DIY", category: "Pemberdayaan" },
  { id: "sekda", name: "Sekretariat Daerah / Biro-biro", category: "Pemerintahan" },
  { id: "paniradya", name: "Paniradya Kaistimewan", category: "Keistimewaan" },
  { id: "dprd", name: "Sekretariat DPRD DIY", category: "Legislatif" },
  { id: "inspektorat", name: "Inspektorat DIY", category: "Pengawasan" },
  { id: "badan_daerah", name: "Badan-badan Daerah DIY", category: "Badan Daerah" },
];

async function main() {
  const hash = bcrypt.hashSync("password123", 10);

  // Super Admin
  await prisma.user.upsert({
    where: { email: "admin@jogjaprov.go.id" },
    update: { name: "Super Admin Pemda DIY", password: hash, role: "ADMIN" },
    create: {
      name: "Super Admin Pemda DIY",
      email: "admin@jogjaprov.go.id",
      password: hash,
      role: "ADMIN",
      nip: "19780512 200312 1 004",
    },
  });

  // Upsert 24 OPD & 24 Akun Role OPD (user@<opd>.go.id)
  for (let i = 0; i < ALL_OPDS.length; i++) {
    const item = ALL_OPDS[i];
    const opd = await prisma.opd.upsert({
      where: { code: item.id },
      update: { name: item.name, category: item.category },
      create: { code: item.id, name: item.name, category: item.category },
    });

    const email = `user@${item.id.replace(/_/g, "-")}.go.id`;
    await prisma.user.upsert({
      where: { email },
      update: {
        name: `Admin Analis ${item.name}`,
        password: hash,
        role: "USER",
        opdId: opd.id,
      },
      create: {
        name: `Admin Analis ${item.name}`,
        email,
        password: hash,
        role: "USER",
        opdId: opd.id,
        nip: `19850101 201001 1 ${String(i + 1).padStart(3, "0")}`,
      },
    });
  }

  console.log("✅ Seed selesai: 1 Super Admin + 24 OPD + 24 akun user OPD aktif (password: password123)");
}

main().finally(() => prisma.$disconnect());
