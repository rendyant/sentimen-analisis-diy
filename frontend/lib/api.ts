function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:8000/api`;
  }
  return "http://127.0.0.1:8000/api";
}

// ==========================================
// Client-Side Memory Cache (Anti Loading Berulang saat Pindah Menu)
// ==========================================
const _apiCache = new Map<string, any>();
const _inflightRequests = new Map<string, Promise<any>>();

export function peekCache<T>(key: string): T | null {
  return (_apiCache.get(key) as T) ?? null;
}

export function clearApiCache(prefix?: string): void {
  if (!prefix) {
    _apiCache.clear();
    return;
  }
  for (const key of Array.from(_apiCache.keys())) {
    if (key.startsWith(prefix)) {
      _apiCache.delete(key);
    }
  }
}

async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  forceRefresh = false
): Promise<T> {
  if (!forceRefresh && _apiCache.has(key)) {
    return _apiCache.get(key) as T;
  }
  if (!forceRefresh && _inflightRequests.has(key)) {
    return _inflightRequests.get(key) as Promise<T>;
  }

  const promise = fetcher()
    .then((data) => {
      _apiCache.set(key, data);
      return data;
    })
    .finally(() => {
      _inflightRequests.delete(key);
    });

  _inflightRequests.set(key, promise);
  return promise;
}

export const SOURCE_LIST = [
  { id: "", nama: "Semua 7 Saluran (Berita, Maps, Sosmed)" },
  { id: "berita", nama: "Portal Berita (Google News)" },
  { id: "maps", nama: "Google Maps Review" },
  { id: "instagram", nama: "Instagram" },
  { id: "facebook", nama: "Facebook" },
  { id: "tiktok", nama: "TikTok" },
  { id: "youtube", nama: "YouTube" },
  { id: "twitter", nama: "Twitter / X" },
];

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

function buildReviewsQuery(params?: {
  instansi_id?: string;
  sumber?: string;
  sentimen?: string;
  periode?: string;
  search?: string;
  page?: number;
  limit?: number;
}): string {
  const query = new URLSearchParams();
  if (params?.instansi_id) query.append("instansi_id", params.instansi_id);
  if (params?.sumber) query.append("sumber", params.sumber);
  if (params?.sentimen) query.append("sentimen", params.sentimen);
  if (params?.periode && params.periode !== "all") query.append("periode", params.periode);
  if (params?.search) query.append("search", params.search);
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());
  return query.toString();
}

export function reviewsCacheKey(params?: Parameters<typeof buildReviewsQuery>[0]): string {
  return `reviews:${buildReviewsQuery(params)}`;
}

export async function fetchReviews(
  params?: {
    instansi_id?: string;
    sumber?: string;
    sentimen?: string;
    periode?: string;
    search?: string;
    page?: number;
    limit?: number;
  },
  forceRefresh = false
): Promise<ReviewResponse> {
  const qs = buildReviewsQuery(params);
  const key = `reviews:${qs}`;
  return cachedFetch(
    key,
    async () => {
      const res = await fetch(`${getApiBase()}/reviews?${qs}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal mengambil data review");
      return res.json();
    },
    forceRefresh
  );
}

function buildStatsQuery(params?: {
  instansi_id?: string;
  sumber?: string;
  periode?: string;
}): string {
  const query = new URLSearchParams();
  if (params?.instansi_id) query.append("instansi_id", params.instansi_id);
  if (params?.sumber) query.append("sumber", params.sumber);
  if (params?.periode && params.periode !== "all") query.append("periode", params.periode);
  return query.toString();
}

export function statsCacheKey(params?: Parameters<typeof buildStatsQuery>[0]): string {
  return `stats:${buildStatsQuery(params)}`;
}

export async function fetchStats(
  params?: {
    instansi_id?: string;
    sumber?: string;
    periode?: string;
  },
  forceRefresh = false
): Promise<StatItem[]> {
  const qs = buildStatsQuery(params);
  const key = `stats:${qs}`;
  return cachedFetch(
    key,
    async () => {
      const res = await fetch(`${getApiBase()}/stats${qs ? `?${qs}` : ""}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal mengambil statistik");
      return res.json();
    },
    forceRefresh
  );
}

export function recommendationsCacheKey(instansi_id?: string): string {
  return `recommendations:${instansi_id || ""}`;
}

export async function fetchRecommendations(
  instansi_id?: string,
  forceRefresh = false
): Promise<RecommendationsResponse> {
  const query = new URLSearchParams();
  if (instansi_id) query.append("instansi_id", instansi_id);
  const qs = query.toString();
  const key = recommendationsCacheKey(instansi_id);
  return cachedFetch(
    key,
    async () => {
      const res = await fetch(`${getApiBase()}/recommendations${qs ? `?${qs}` : ""}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Gagal mengambil rekomendasi AI");
      return res.json();
    },
    forceRefresh
  );
}

export async function generateOpdRecommendations(instansi_id?: string): Promise<RecommendationsResponse> {
  const res = await fetch(`${getApiBase()}/recommendations/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instansi_id: instansi_id || null }),
  });
  if (!res.ok) throw new Error("Gagal menghasilkan rekomendasi AI");
  const data = await res.json();
  clearApiCache("recommendations:");
  clearApiCache("analytics:");
  clearApiCache("stats:");
  _apiCache.set(recommendationsCacheKey(instansi_id), data);
  return data;
}

export async function analyzeSingleReview(review_id: string): Promise<{
  review_id: string;
  sentimen: string;
  rating?: number;
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
  clearApiCache("reviews:");
  clearApiCache("stats:");
  clearApiCache("analytics:");
  clearApiCache("recommendations:");
  return res.json();
}

export async function classifyBatchAI(params?: {
  instansi_id?: string;
  limit?: number;
  only_unclassified?: boolean;
}): Promise<{
  message: string;
  total_processed: number;
  ai_classified: number;
  batches_used: number;
  model: string;
}> {
  const res = await fetch(`${getApiBase()}/analyze/classify-batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instansi_id: params?.instansi_id || null,
      limit: params?.limit || 250,
      only_unclassified: params?.only_unclassified ?? false,
    }),
  });
  if (!res.ok) throw new Error("Gagal menjalankan klasifikasi AI batch");
  clearApiCache();
  return res.json();
}

export interface ClassifyStatusResponse {
  is_running: boolean;
  stop_requested: boolean;
  message: string;
  processed: number;
  total_target: number;
  ai_classified: number;
  fallback_classified?: number;
  batches_used: number;
  model: string;
  model_usage?: Record<string, number>;
  total_reviews: number;
  ai_analyzed_count: number;
  cloud_ai_count?: number;
  fallback_count?: number;
  unclassified_count: number;
  model_breakdown?: Record<string, number>;
}

export async function fetchClassifyStatus(): Promise<ClassifyStatusResponse> {
  const res = await fetch(`${getApiBase()}/analyze/classify-status`, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal mengambil status klasifikasi AI");
  return res.json();
}

export async function triggerClassifyAllBackground(params?: {
  instansi_id?: string;
  limit?: number;
  force_reclassify?: boolean;
  upgrade_fallback_only?: boolean;
}): Promise<{ started: boolean; message: string }> {
  const res = await fetch(`${getApiBase()}/analyze/classify-all-background`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instansi_id: params?.instansi_id || null,
      limit: params?.limit ?? 0,
      force_reclassify: params?.force_reclassify ?? false,
      upgrade_fallback_only: params?.upgrade_fallback_only ?? false,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Gagal memulai analisis massal AI");
  clearApiCache();
  return data;
}

export async function stopClassifyBackground(): Promise<{ message: string }> {
  const res = await fetch(`${getApiBase()}/analyze/classify-stop`, { method: "POST" });
  if (!res.ok) throw new Error("Gagal menghentikan proses analisis AI");
  return res.json();
}

export async function triggerScrape(type: "news" | "maps" | "social" | "all"): Promise<{ message: string }> {
  const res = await fetch(`${getApiBase()}/scrape/${type}`, { method: "POST" });
  if (!res.ok) throw new Error("Gagal memulai scraping");
  clearApiCache();
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
  classifier_model?: string;
  classifier_fallback_models?: string[];
  classifier_batch_size?: number;
  classifier_allow_local_fallback?: boolean;
  api_key_masked: string;
  has_api_key: boolean;
  classifier_api_key_masked?: string;
  has_classifier_api_key?: boolean;
  temperature: number;
  thinking_level: string;
  batch_limit: number;
  auto_categorize: boolean;
  system_prompt: string;
  available_models: { id: string; label: string }[];
  available_mass_models?: { id: string; label: string }[];
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

export async function fetchAIRouterConfig(forceRefresh = false): Promise<AIRouterConfig> {
  return cachedFetch(
    "ai-config",
    async () => {
      const res = await fetch(`${getApiBase()}/ai-config`, { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal mengambil konfigurasi Main Router AI");
      return res.json();
    },
    forceRefresh
  );
}

export async function saveAIRouterConfig(payload: {
  provider?: string;
  model?: string;
  classifier_model?: string;
  classifier_fallback_models?: string[];
  classifier_batch_size?: number;
  classifier_allow_local_fallback?: boolean;
  api_key?: string;
  classifier_api_key?: string;
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
  const data = await res.json();
  _apiCache.set("ai-config", data.config);
  return data;
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
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Gagal menguji koneksi AI");
  return data;
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
  clearApiCache();
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

function buildAnalyticsQuery(params?: {
  instansi_id?: string;
  sumber?: string;
  periode?: string;
}): string {
  const query = new URLSearchParams();
  if (params?.instansi_id) query.append("instansi_id", params.instansi_id);
  if (params?.sumber) query.append("sumber", params.sumber);
  if (params?.periode && params.periode !== "all") query.append("periode", params.periode);
  return query.toString();
}

export function analyticsCacheKey(params?: Parameters<typeof buildAnalyticsQuery>[0]): string {
  return `analytics:${buildAnalyticsQuery(params)}`;
}

export async function fetchDashboardAnalytics(
  params?: {
    instansi_id?: string;
    sumber?: string;
    periode?: string;
  },
  forceRefresh = false
): Promise<DashboardAnalyticsResponse> {
  const qs = buildAnalyticsQuery(params);
  const key = `analytics:${qs}`;
  return cachedFetch(
    key,
    async () => {
      const res = await fetch(`${getApiBase()}/dashboard-analytics${qs ? `?${qs}` : ""}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Gagal mengambil analitik dashboard");
      return res.json();
    },
    forceRefresh
  );
}
