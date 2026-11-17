import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ---------- OPD dengan keyword SUPER KAYA ----------
const OPDS = [
  {
    code: "OPD-BUD",
    name: "Dinas Kebudayaan (Kundha Kabudayan) DIY",
    category: "Kebudayaan",
    keywords: [
      "kebudayaan", "kabudayan", "disbud", "kundha",
      "museum", "wayang", "gamelan", "tari", "seni budaya",
      "gandhok kiwa", "pendopo", "cendana", "ruang bima",
      "bus heritage", "bus kebudayaan", "jogja heritage",
      "jssp", "street sculpture", "cagar budaya",
      "keistimewaan", "budaya jawa",
    ],
  },
  {
    code: "OPD-PAR",
    name: "Dinas Pariwisata DIY",
    category: "Pariwisata",
    keywords: [
      "pariwisata", "dinpar", "dinparbud", "tourism", "tourist", "wisatawan",
      "malioboro", "kotabaru", "gramedia",
      "andong", "becak", "ojek wisata",
      "gembira loka", "kebun binatang",
      "alun-alun", "alun2",
      "live music", "event wisata", "hunting foto",
    ],
  },
  {
    code: "OPD-TAN",
    name: "Dinas Pertanian dan Ketahanan Pangan DIY",
    category: "Pertanian",
    keywords: [
      "pertanian", "pangan", "tani", "petani", "aspartan",
      "pasar tani", "bazar tani", "dpkp",
      "anabul", "hewan peliharaan", "ternak",
      "jambu", "sirsak", "srikaya", "kepel", "pohon buah",
      "pangan", "ketahanan pangan", "food waste", "b2sa",
      "pengiriman hewan", "surat rekom hewan",
    ],
  },
  {
    code: "OPD-PUS",
    name: "Dinas Perpustakaan dan Arsip Daerah DIY",
    category: "Perpustakaan",
    keywords: [
      "perpustakaan", "arsip", "dpad", "literasi", "buku",
      "diorama", "jogja book fair", "pasar kangen",
      "koleksi buku", "film pendidikan", "festival literasi",
      "arsip daerah", "arsip nasional",
    ],
  },
  {
    code: "OPD-DP3",
    name: "DP3AP2 DIY (Pemberdayaan Perempuan & Anak)",
    category: "Sosial",
    keywords: [
      "dp3ap2", "bppm", "women", "perempuan", "child", "anak",
      "molin", "perlindungan anak", "perlindungan perempuan",
      "janabadra", "ibu hamil", "breastfeeding", "preggo",
      "family planning", "kb", "population control",
    ],
  },
  {
    code: "OPD-PMD",
    name: "Dinas Pemberdayaan Masyarakat Desa DIY",
    category: "Sosial",
    keywords: [
      "bumdes", "p3md", "desa", "pemberdayaan masyarakat",
      "pemberdayaan desa", "kelurahan",
    ],
  },
  {
    code: "OPD-LAIN",
    name: "Instansi Lainnya (Tidak Teridentifikasi)",
    category: "Lainnya",
    keywords: [],
  },
];

function detectOpd(text: string) {
  const t = (text || "").toLowerCase();
  if (!t || t.length < 5) return OPDS[OPDS.length - 1];

  let bestMatch = OPDS[OPDS.length - 1];
  let bestScore = 0;

  for (const opd of OPDS) {
    if (opd.keywords.length === 0) continue;
    let score = 0;
    for (const k of opd.keywords) {
      if (t.includes(k.toLowerCase())) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = opd;
    }
  }
  return bestMatch;
}

function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function addMonths(d: Date, m: number) { const x = new Date(d); x.setMonth(x.getMonth() + m); return x; }

function parseRelativeTime(s: string): Date {
  const now = new Date();
  if (!s) return now;
  const t = s.toLowerCase().replace(/diedit|edited|baru|new/g, "").trim();
  if (!t) return now;

  const m = t.match(/(\d+)/);
  let num = 1;
  if (m) num = parseInt(m[1], 10);
  else if (t.includes("sebulan") || t.includes("a month")) num = 1;
  else if (t.includes("setahun") || t.includes("a year")) num = 1;

  if (t.includes("hari") || t.includes("day")) return addDays(now, -num);
  if (t.includes("minggu") || t.includes("week")) return addDays(now, -num * 7);
  if (t.includes("bulan") || t.includes("month")) return addMonths(now, -num);
  if (t.includes("tahun") || t.includes("year")) return addMonths(now, -num * 12);
  return now;
}

function sentimenFromRating(r: number): string {
  if (r >= 4) return "POSITIF";
  if (r === 3) return "NETRAL";
  return "NEGATIF";
}

function detectAspek(text: string): string {
  const t = (text || "").toLowerCase();
  if (/(lambat|cepat|antre|antrian|waktu tunggu|lama)/.test(t)) return "Kecepatan";
  if (/(bersih|kotor|toilet|fasilitas|gedung|ruang|parkir|nyaman|adem|sejuk)/.test(t)) return "Fasilitas";
  if (/(harga|tiket|biaya|mahal|murah|terjangkau)/.test(t)) return "Biaya";
  if (/(informasi|info|kejelasan|jelas|bingung)/.test(t)) return "Informasi";
  if (/(ramah|pelayanan|layanan|petugas|staff|staf|sopan|komunikatif)/.test(t)) return "Pelayanan";
  if (/(online|website|server|down|aplikasi|crash|digital)/.test(t)) return "Sistem Digital";
  return "Umum";
}

function isCleanText(text: string): boolean {
  if (!text) return false;
  // Hapus karakter aneh / emoji saja
  const cleaned = text.replace(/[^\w\s]/g, "").trim();
  return cleaned.length >= 3;
}

async function main() {
  const [fileArg, modeArg] = process.argv.slice(2);
  const mode = modeArg || "upsert"; // upsert | reassign

  const filePath = fileArg
    ? path.resolve(fileArg)
    : path.resolve("prisma/data/all_instansi.csv");

  if (!fs.existsSync(filePath)) {
    console.error("❌ File tidak ditemukan:", filePath);
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const { data } = Papa.parse<string[]>(raw, { skipEmptyLines: "greedy" });
  console.log("📄 Total baris CSV:", data.length);
  console.log("🔄 Mode:", mode);

  // Pastikan semua OPD ada
  const opdIdMap = new Map<string, string>();
  for (const o of OPDS) {
    const rec = await prisma.opd.upsert({
      where: { code: o.code },
      update: {},
      create: { code: o.code, name: o.name, category: o.category },
    });
    opdIdMap.set(o.code, rec.id);
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const perOpd: Record<string, number> = {};

  for (const row of data) {
    const [reviewId, pengadu, ratingStr, , waktu, isi] = row;
    if (!reviewId) { skipped++; continue; }

    const bintang = parseInt(ratingStr || "0", 10);
    if (!bintang || bintang < 1 || bintang > 5) { skipped++; continue; }

    // Skip kalau isinya cuma emoji/simbol aneh
    if (!isCleanText(isi)) {
      skipped++;
      continue;
    }

    const opd = detectOpd(isi || "");

    if (mode === "reassign") {
      // Mode reassign: update OPD untuk ulasan yang sudah ada
      const existing = await prisma.ulasan.findUnique({ where: { reviewId } });
      if (existing && existing.opdId !== opdIdMap.get(opd.code)) {
        await prisma.ulasan.update({
          where: { reviewId },
          data: { opdId: opdIdMap.get(opd.code)! },
        });
        updated++;
      } else if (!existing) {
        await prisma.ulasan.create({
          data: {
            reviewId,
            tanggal: parseRelativeTime(waktu || ""),
            sumber: "Google Maps",
            pengadu: pengadu || "Anonim",
            isi: (isi || "").trim(),
            bintang,
            sentimen: sentimenFromRating(bintang),
            aspek: detectAspek(isi || ""),
            akurasi: null,
            status: "PENDING",
            opdId: opdIdMap.get(opd.code)!,
          },
        });
        inserted++;
      }
    } else {
      // Mode upsert: buat baru, skip jika sudah ada
      await prisma.ulasan.upsert({
        where: { reviewId },
        update: {},
        create: {
          reviewId,
          tanggal: parseRelativeTime(waktu || ""),
          sumber: "Google Maps",
          pengadu: pengadu || "Anonim",
          isi: (isi || "").trim(),
          bintang,
          sentimen: sentimenFromRating(bintang),
          aspek: detectAspek(isi || ""),
          akurasi: null,
          status: "PENDING",
          opdId: opdIdMap.get(opd.code)!,
        },
      });
      inserted++;
    }

    perOpd[opd.name] = (perOpd[opd.name] || 0) + 1;
  }

  console.log(`\n✅ Insert: ${inserted} | Update: ${updated} | Skip: ${skipped}`);
  console.log("\n📊 Sebaran per OPD:");
  const entries = Object.entries(perOpd).sort((a, b) => b[1] - a[1]);
  for (const [nama, jumlah] of entries) {
    console.log(`   - ${nama}: ${jumlah} ulasan`);
  }
}

main().finally(() => prisma.$disconnect());