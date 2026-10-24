const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

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
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ReviewResponse> {
  const query = new URLSearchParams();
  if (params?.instansi_id) query.append("instansi_id", params.instansi_id);
  if (params?.sumber) query.append("sumber", params.sumber);
  if (params?.sentimen) query.append("sentimen", params.sentimen);
  if (params?.search) query.append("search", params.search);
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());

  const res = await fetch(`${API_BASE}/reviews?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal mengambil data review");
  return res.json();
}

export async function fetchStats(): Promise<StatItem[]> {
  const res = await fetch(`${API_BASE}/stats`, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal mengambil statistik");
  return res.json();
}