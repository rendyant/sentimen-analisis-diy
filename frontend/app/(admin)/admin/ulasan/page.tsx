'use client';

import { useState, useEffect } from 'react';
import { Download, Search, Loader2, ExternalLink, Sparkles, Lightbulb, Layers } from 'lucide-react';
import {
  fetchReviews,
  Review,
  OPD_LIST,
  analyzeSingleReview,
  analyzeBatchByCategory,
  BatchCategoryResult,
} from '@/lib/api';

function Bintang({ jumlah }: { jumlah?: number }) {
  if (!jumlah) return <span className="text-gray-400 text-[10px]">-</span>;
  return (
    <span className="text-yellow-400 text-xs tracking-tight">
      {'★'.repeat(jumlah)}
      <span className="text-gray-200">{'★'.repeat(5 - jumlah)}</span>
    </span>
  );
}

const KATEGORI_OPTIONS = [
  { value: '', label: 'Semua Kategori Masalah' },
  { value: 'Kecepatan Layanan & Antrean', label: 'Kecepatan Layanan & Antrean' },
  { value: 'Sistem & Aplikasi Digital', label: 'Sistem & Aplikasi Digital' },
  { value: 'Kejelasan Informasi & Prosedur', label: 'Kejelasan Informasi & Prosedur' },
  { value: 'Sikap Petugas & Pelayanan Loket', label: 'Sikap Petugas & Pelayanan Loket' },
  { value: 'Fasilitas & Sarana Publik', label: 'Fasilitas & Sarana Publik' },
];

export default function AdminUlasan() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const [selectedOpd, setSelectedOpd] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedSentimen, setSelectedSentimen] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  // State Analisis Kolektif per Kategori
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchCategoryResult | null>(null);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await fetchReviews({
        instansi_id: selectedOpd || undefined,
        sumber: selectedSource || undefined,
        sentimen: selectedSentimen || undefined,
        search: search || undefined,
        page,
        limit,
      });
      setReviews(res.data);
      setTotal(res.total);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [selectedOpd, selectedSource, selectedSentimen, search, page]);

  async function handleAnalyzeReview(id: string) {
    setAnalyzingId(id);
    try {
      const res = await analyzeSingleReview(id);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                sentimen: res.sentimen,
                masalah_utama: res.masalah_utama,
                kategori_masalah: res.kategori_masalah,
                prioritas: res.prioritas,
                solusi_ai: res.solusi_ai,
              }
            : r
        )
      );
    } catch (err) {
      console.warn('Gagal menganalisis ulasan:', err);
    } finally {
      setAnalyzingId(null);
    }
  }

  async function handleBatchCategoryAnalyze() {
    setBatchLoading(true);
    try {
      const res = await analyzeBatchByCategory({
        instansi_id: selectedOpd || undefined,
        sentimen_filter: 'semua_keluhan',
        kategori: selectedKategori || undefined,
      });
      setBatchResult(res);
      await loadReviews();
    } catch (err) {
      console.warn('Gagal menjalankan analisis kolektif:', err);
    } finally {
      setBatchLoading(false);
    }
  }

  const displayedReviews = selectedKategori
    ? reviews.filter((r) => (r.kategori_masalah || '').toLowerCase().includes(selectedKategori.split(' ')[0].toLowerCase()))
    : reviews;

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-red-900">Daftar Ulasan & Solusi AI per OPD</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelompokkan ulasan negatif/keluhan berdasarkan kategori masalah lalu analisis sekaligus dengan AI tanpa harus satu per satu
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleBatchCategoryAnalyze}
            disabled={batchLoading}
            className="flex items-center gap-2 bg-red-900 hover:bg-red-950 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-60 cursor-pointer"
          >
            {batchLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Layers size={14} className="text-yellow-300" />
            )}
            {batchLoading
              ? 'Mengelompokkan & Menganalisis...'
              : 'Analisis Kolektif Ulasan Jelek (Per Kategori)'}
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <Download size={14} /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* Hasil Pengelompokan & Analisis Kolektif AI per Kategori */}
      {batchResult && (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-red-800" />
              <h3 className="font-bold text-red-950 text-sm">
                Hasil Analisis Kolektif AI Berdasarkan Kategori Keluhan ({batchResult.total_reviews_analyzed} Ulasan Dikelompokkan ke {batchResult.total_categories} Kategori)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setBatchResult(null)}
              className="text-xs text-gray-400 hover:text-gray-600 font-semibold"
            >
              Tutup
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {batchResult.categories.map((cat, idx) => (
              <div
                key={`${cat.instansi_id}-${cat.kategori_masalah}-${idx}`}
                className="rounded-lg border border-red-100 bg-red-50/40 p-4"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-900 text-white">
                    {cat.kategori_masalah}
                  </span>
                  <span className="text-[11px] font-bold text-red-800">
                    {cat.jumlah_ulasan} Ulasan Digabung • Prioritas {cat.prioritas}
                  </span>
                </div>
                <p className="text-xs font-bold text-gray-900">{cat.instansi_nama}</p>
                <p className="text-xs text-gray-700 mt-1">
                  <b>Inti Masalah:</b> {cat.masalah_utama}
                </p>
                <div className="mt-2 bg-white border border-red-100 rounded-md p-2.5 text-xs text-red-900">
                  <b>Rekomendasi Solusi Terpadu AI:</b> {cat.solusi_ai}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        <h3 className="font-bold text-gray-800 text-sm mb-3">Filter & Pengelompokan Kategori Ulasan</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Instansi OPD</label>
            <select
              value={selectedOpd}
              onChange={(e) => { setSelectedOpd(e.target.value); setPage(1); }}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 outline-none focus:border-red-800 cursor-pointer"
            >
              {OPD_LIST.map((opd) => (
                <option key={opd.id} value={opd.id}>{opd.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Filter Sentimen</label>
            <select
              value={selectedSentimen}
              onChange={(e) => { setSelectedSentimen(e.target.value); setPage(1); }}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 outline-none focus:border-red-800 cursor-pointer"
            >
              <option value="">Semua Sentimen</option>
              <option value="negatif">Khusus Ulasan Jelek (Negatif)</option>
              <option value="netral">Ulasan Netral / Saran</option>
              <option value="positif">Ulasan Positif</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Kategori Masalah</label>
            <select
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 outline-none focus:border-red-800 cursor-pointer"
            >
              {KATEGORI_OPTIONS.map((k) => (
                <option key={k.value} value={k.value}>{k.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Kanal Sumber Data</label>
            <select
              value={selectedSource}
              onChange={(e) => { setSelectedSource(e.target.value); setPage(1); }}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 outline-none focus:border-red-800 cursor-pointer"
            >
              <option value="">Semua Saluran</option>
              <option value="berita">Portal Berita (Google News)</option>
              <option value="maps">Google Maps Review</option>
              <option value="twitter">Media Sosial (Twitter / X)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Pencarian Cepat</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 bg-white">
              <Search size={14} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Cari kata kunci..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="text-xs outline-none w-full text-gray-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Data */}
      <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-white">
        <div className="bg-red-950 px-6 py-3.5 flex justify-between items-center text-white">
          <span className="text-xs font-bold uppercase tracking-wider">
            Total Ditemukan: {displayedReviews.length} dari {total} Ulasan & Berita
          </span>
          {loading && (
            <span className="text-xs flex items-center gap-1 text-red-200 animate-pulse">
              <Loader2 size={12} className="animate-spin" /> Memuat data...
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-red-900/10 text-red-950 font-bold border-b border-gray-200">
                <th className="text-left py-3 px-4 w-44">Sumber / Penulis</th>
                <th className="text-left py-3 px-4 w-48">Instansi OPD</th>
                <th className="text-left py-3 px-4">Isi Ulasan, Kategori & Rekomendasi Solusi AI</th>
                <th className="text-center py-3 px-4 w-24">Rating</th>
                <th className="text-center py-3 px-4 w-28">Sentimen</th>
                <th className="text-center py-3 px-4 w-28">Aksi AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && displayedReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-red-800" />
                    Sedang mengambil data dari database...
                  </td>
                </tr>
              ) : displayedReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Tidak ada ulasan yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                displayedReviews.map((u, i) => (
                  <tr key={u.id || i} className={`hover:bg-red-50/40 transition ${i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}`}>
                    <td className="py-3.5 px-4 align-top">
                      <p className="font-bold text-gray-800 truncate max-w-[160px]">{u.penulis || 'Anonim'}</p>
                      <span className="inline-block mt-0.5 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">
                        {u.sumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-red-900 align-top">
                      {u.instansi_nama}
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      <p className="text-gray-700 leading-relaxed">{u.teks}</p>
                      {u.solusi_ai && (
                        <div className="mt-2 bg-red-50 border border-red-100 rounded-lg p-2.5 text-[11px] text-red-800">
                          <p className="font-bold flex items-center gap-1 text-red-900">
                            <Lightbulb size={12} /> Solusi AI ({u.kategori_masalah || 'Pelayanan Publik'}):
                          </p>
                          <p className="mt-0.5 leading-relaxed">{u.solusi_ai}</p>
                        </div>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1">{u.tanggal ? u.tanggal.substring(0, 10) : '-'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center align-top">
                      <Bintang jumlah={u.rating ? Math.round(u.rating) : undefined} />
                    </td>
                    <td className="py-3.5 px-4 text-center align-top">
                      {u.sentimen ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.sentimen === 'positif' ? 'bg-green-100 text-green-700' :
                          u.sentimen === 'negatif' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          ● {u.sentimen.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">Belum Dianalisis</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center align-top space-y-1.5">
                      <button
                        type="button"
                        disabled={analyzingId === u.id}
                        onClick={() => handleAnalyzeReview(u.id)}
                        className="inline-flex items-center gap-1 text-[10px] bg-red-900 hover:bg-red-950 text-white px-2.5 py-1.5 rounded-md font-semibold transition disabled:opacity-50 cursor-pointer"
                      >
                        {analyzingId === u.id ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <Sparkles size={10} className="text-yellow-300" />
                        )}
                        Solusi AI
                      </button>
                      {u.url && (
                        <div>
                          <a
                            href={u.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            Sumber <ExternalLink size={10} />
                          </a>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-100 text-xs text-gray-500">
          <p>
            Menampilkan halaman <b>{page}</b> dari <b>{totalPages}</b> (Total {total} ulasan)
          </p>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            <span className="px-2 font-bold text-gray-800">{page}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
