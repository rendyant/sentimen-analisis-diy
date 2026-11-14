function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:8000/api`;
  }
  return "http://127.0.0.1:8000/api";
}

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

export interface OpdRecommendation {
  id: string;
  instansi_id: string;
  instansi_nama: string;
  prioritas: "Tinggi" | "Sedang" | "Rendah" | string;
  masalah_utama: string;
  kategori_masalah: string;
  persen_negatif: number;
  total_keluhan: number;
  total_ulasan: number;
  ringkasan: string[];
  solusi_ai: string;
  dampak: string;
}

export interface RecommendationsResponse {
  total: number;
  insight: string;
  data: OpdRecommendation[];
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

  const res = await fetch(`${getApiBase()}/reviews?${query.toString()}`, { cache: "no-store" });
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
  const res = await fetch(`${getApiBase()}/stats${qs ? `?${qs}` : ""}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal mengambil statistik");
  return res.json();
}

export async function fetchRecommendations(instansi_id?: string): Promise<RecommendationsResponse> {
  const query = new URLSearchParams();
  if (instansi_id) query.append("instansi_id", instansi_id);
  const qs = query.toString();
  const res = await fetch(`${getApiBase()}/recommendations${qs ? `?${qs}` : ""}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal mengambil rekomendasi AI");
  return res.json();
}

export async function generateOpdRecommendations(instansi_id?: string): Promise<RecommendationsResponse> {
  const res = await fetch(`${getApiBase()}/recommendations/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instansi_id: instansi_id || null }),
  });
  if (!res.ok) throw new Error("Gagal menghasilkan rekomendasi AI");
  return res.json();
}

export async function analyzeSingleReview(review_id: string): Promise<{
  review_id: string;
  sentimen: string;
  masalah_utama: string;
  kategori_masalah: string;
  prioritas: string;
  solusi_ai: string;
}> {
  const res = await fetch(`${getApiBase()}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ review_id }),
  });
  if (!res.ok) throw new Error("Gagal menganalisis ulasan dengan AI");
  return res.json();
}

export async function triggerScrape(type: "news" | "maps" | "social"): Promise<{ message: string }> {
  const res = await fetch(`${getApiBase()}/scrape/${type}`, { method: "POST" });
  if (!res.ok) throw new Error("Gagal memulai scraping");
  return res.json();
}

export async function fetchScrapeStatus(): Promise<{ is_running: boolean; message: string; progress: number }> {
  const res = await fetch(`${getApiBase()}/scrape/status`, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal mengambil status scraping");
  return res.json();
}

export interface AIRouterConfig {
  provider: string;
  model: string;
  api_key_masked: string;
  has_api_key: boolean;
  temperature: number;
  thinking_level: string;
  batch_limit: number;
  auto_categorize: boolean;
  system_prompt: string;
  available_models: { id: string; label: string }[];
}

export interface BatchCategoryResult {
  message: string;
  total_reviews_analyzed: number;
  total_categories: number;
  categories: {
    instansi_id: string;
    instansi_nama: string;
    kategori_masalah: string;
    jumlah_ulasan: number;
    prioritas: string;
    masalah_utama: string;
    solusi_ai: string;
    contoh_ulasan: string[];
  }[];
}

export async function fetchAIRouterConfig(): Promise<AIRouterConfig> {
  const res = await fetch(`${getApiBase()}/ai-config`, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal mengambil konfigurasi Main Router AI");
  return res.json();
}

export async function saveAIRouterConfig(payload: {
  provider?: string;
  model?: string;
  api_key?: string;
  temperature?: number;
  thinking_level?: string;
  batch_limit?: number;
  auto_categorize?: boolean;
  system_prompt?: string;
}): Promise<{ message: string; config: AIRouterConfig }> {
  const res = await fetch(`${getApiBase()}/ai-config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Gagal menyimpan konfigurasi Main Router AI");
  return res.json();
}

export async function testAIRouterConfig(): Promise<{
  status: string;
  model: string;
  latency_ms: number;
  sample_output: any;
}> {
  const res = await fetch(`${getApiBase()}/ai-config/test`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Gagal menguji koneksi AI");
  return res.json();
}

export async function analyzeBatchByCategory(params?: {
  instansi_id?: string;
  sentimen_filter?: "negatif" | "semua_keluhan";
  kategori?: string;
}): Promise<BatchCategoryResult> {
  const res = await fetch(`${getApiBase()}/analyze/batch-category`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instansi_id: params?.instansi_id || null,
      sentimen_filter: params?.sentimen_filter || "negatif",
      kategori: params?.kategori || null,
    }),
  });
  if (!res.ok) throw new Error("Gagal menjalankan analisis kolektif per kategori");
  return res.json();
}

export interface DashboardAnalyticsResponse {
  summary: {
    total: number;
    positif: number;
    netral: number;
    negatif: number;
    avg_rating: number;
    csat_percent: number;
  };
  sentiment_trend: {
    bulan: string;
    positif: number;
    netral: number;
    negatif: number;
    positif_count: number;
    netral_count: number;
    negatif_count: number;
  }[];
  daily_trend: {
    tanggal: string;
    positif: number;
    netral: number;
    negatif: number;
  }[];
  platforms: {
    platform: string;
    positif: number;
    netral: number;
    negatif: number;
    total: number;
  }[];
  aspects: {
    name: string;
    rating: number;
    total: number;
    positif: number;
    negatif: number;
    status: string;
    statusColor: string;
    progressColor: string;
    progress: number;
    desc: string;
  }[];
  popular_words: {
    text: string;
    count: number;
    sentimen: "positif" | "netral" | "negatif" | string;
    parts: number[];
  }[];
  negative_reviews: {
    id: string;
    instansi_id: string;
    instansi_nama: string;
    penulis: string;
    sumber: string;
    rating: number;
    tanggal: string;
    teks: string;
    kategori_masalah: string;
    solusi_ai?: string;
  }[];
  spectrum: {
    tipe: string;
    sumber: string;
    isi: string;
    style: string;
    teks: string;
  }[];
}

export async function fetchDashboardAnalytics(params?: {
  instansi_id?: string;
  sumber?: string;
  periode?: string;
}): Promise<DashboardAnalyticsResponse> {
  const query = new URLSearchParams();
  if (params?.instansi_id) query.append("instansi_id", params.instansi_id);
  if (params?.sumber) query.append("sumber", params.sumber);
  if (params?.periode && params.periode !== "all") query.append("periode", params.periode);

  const qs = query.toString();
  const res = await fetch(`${getApiBase()}/dashboard-analytics${qs ? `?${qs}` : ""}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Gagal mengambil analitik dashboard");
  return res.json();
}


