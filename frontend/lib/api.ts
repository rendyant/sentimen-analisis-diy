const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const OPD_LIST = [
  { id: "", nama: "Semua 24 Instansi Pemda DIY" },
  { id: "dinkes", nama: "Dinas Kesehatan DIY" },
  { id: "dinsos", nama: "Dinas Sosial DIY" },
  { id: "dishub", nama: "Dinas Perhubungan DIY" },
  { id: "dispar", nama: "Dinas Pariwisata DIY" },
  { id: "dikpora", nama: "Dinas Pendidikan, Pemuda dan Olahraga DIY" },
  { id: "pupesdm", nama: "Dinas PUP-ESDM DIY" },
  { id: "dlhk", nama: "Dinas Lingkungan Hidup dan Kehutanan DIY" },
  { id: "diskopukm", nama: "Dinas Koperasi dan UKM DIY" },
  { id: "disperindag", nama: "Dinas Perindustrian dan Perdagangan DIY" },
  { id: "dpmptsp", nama: "Dinas Penanaman Modal dan PTSP DIY" },
  { id: "disnakertrans", nama: "Dinas Tenaga Kerja dan Transmigrasi DIY" },
  { id: "satpolpp", nama: "Satuan Polisi Pamong Praja DIY" },
  { id: "diskominfo", nama: "Dinas Komunikasi dan Informatika DIY" },
  { id: "disbud", nama: "Dinas Kebudayaan DIY" },
  { id: "dispursip", nama: "Dinas Perpustakaan dan Arsip Daerah DIY" },
  { id: "dispertaru", nama: "Dinas Pertanahan dan Tata Ruang DIY" },
  { id: "dispertan", nama: "Dinas Pertanian dan Ketahanan Pangan DIY" },
  { id: "dkp", nama: "Dinas Kelautan dan Perikanan DIY" },
  { id: "dp3ap2", nama: "DP3AP2 DIY" },
  { id: "sekda", nama: "Sekretariat Daerah / Biro-biro" },
  { id: "paniradya", nama: "Paniradya Kaistimewan" },
  { id: "dprd", nama: "Sekretariat DPRD DIY" },
  { id: "inspektorat", nama: "Inspektorat DIY" },
  { id: "badan_daerah", nama: "Badan-badan Daerah DIY" },
];

export interface Review {
  id: string;
  instansi_id: string;
  instansi_nama: string;
  sumber: string;
  penulis?: string;
  teks: string;
  rating?: number;
  tanggal?: string;
  url?: string;
  scraped_at?: string;
  sentimen?: string;
  solusi_ai?: string;
  masalah_utama?: string;
  kategori_masalah?: string;
  prioritas?: string;
}

export interface ReviewResponse {
  total: number;
  data: Review[];
}

export interface StatItem {
  instansi_id: string;
  instansi_nama: string;
  total: number;
  positif: number;
  negatif: number;
  netral: number;
  avg_rating: number;
}

export async function fetchReviews(params?: {
  instansi_id?: string;
  sumber?: string;
  sentimen?: string;
  periode?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ReviewResponse> {
  const query = new URLSearchParams();
  if (params?.instansi_id) query.append("instansi_id", params.instansi_id);
  if (params?.sumber) query.append("sumber", params.sumber);
  if (params?.sentimen) query.append("sentimen", params.sentimen);
  if (params?.periode) query.append("periode", params.periode);
  if (params?.search) query.append("search", params.search);
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());

  const res = await fetch(`${API_BASE}/reviews?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal mengambil data review");
  return res.json();
}

export async function fetchStats(params?: {
  instansi_id?: string;
  sumber?: string;
  periode?: string;
}): Promise<StatItem[]> {
  const query = new URLSearchParams();
  if (params?.instansi_id) query.append("instansi_id", params.instansi_id);
  if (params?.sumber) query.append("sumber", params.sumber);
  if (params?.periode) query.append("periode", params.periode);

  const qs = query.toString();
  const res = await fetch(`${API_BASE}/stats${qs ? `?${qs}` : ""}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal mengambil statistik");
  return res.json();
}

export async function triggerScrape(type: "news" | "maps" | "social"): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/scrape/${type}`, { method: "POST" });
  if (!res.ok) throw new Error("Gagal memulai scraping");
  return res.json();
}

export async function fetchScrapeStatus(): Promise<{ is_running: boolean; message: string; progress: number }> {
  const res = await fetch(`${API_BASE}/scrape/status`, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal mengambil status scraping");
  return res.json();
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function sendChatMessage(params: {
  message: string;
  instansi_id?: string;
  history?: ChatMessage[];
}): Promise<{ reply: string; source: string }> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Gagal menghubungi Asisten AI");
  return res.json();
}