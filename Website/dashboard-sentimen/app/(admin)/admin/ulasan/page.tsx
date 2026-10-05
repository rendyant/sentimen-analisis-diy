'use client';

import { useEffect, useState } from 'react';
import { Search, Download, Star, ExternalLink, Loader2 } from 'lucide-react';
import { fetchReviews, Review } from '@/lib/api';

const opdList = [
  { id: '', nama: 'Semua Instansi (24 OPD)' },
  { id: 'dinkes', nama: 'Dinas Kesehatan DIY' },
  { id: 'dinsos', nama: 'Dinas Sosial DIY' },
  { id: 'dishub', nama: 'Dinas Perhubungan DIY' },
  { id: 'dispar', nama: 'Dinas Pariwisata DIY' },
  { id: 'dikpora', nama: 'Dinas Pendidikan, Pemuda dan Olahraga DIY' },
  { id: 'pupesdm', nama: 'Dinas PUP-ESDM DIY' },
  { id: 'dlhk', nama: 'Dinas Lingkungan Hidup dan Kehutanan DIY' },
  { id: 'diskopukm', nama: 'Dinas Koperasi dan UKM DIY' },
  { id: 'disperindag', nama: 'Dinas Perindustrian dan Perdagangan DIY' },
  { id: 'dpmptsp', nama: 'Dinas Penanaman Modal dan PTSP DIY' },
  { id: 'disnakertrans', nama: 'Dinas Tenaga Kerja dan Transmigrasi DIY' },
  { id: 'satpolpp', nama: 'Satuan Polisi Pamong Praja DIY' },
  { id: 'diskominfo', nama: 'Dinas Komunikasi dan Informatika DIY' },
  { id: 'disbud', nama: 'Dinas Kebudayaan DIY' },
  { id: 'dispursip', nama: 'Dinas Perpustakaan dan Arsip Daerah DIY' },
  { id: 'dispertaru', nama: 'Dinas Pertanahan dan Tata Ruang DIY' },
  { id: 'dispertan', nama: 'Dinas Pertanian dan Ketahanan Pangan DIY' },
  { id: 'dkp', nama: 'Dinas Kelautan dan Perikanan DIY' },
  { id: 'dp3ap2', nama: 'DP3AP2 DIY' },
  { id: 'sekda', nama: 'Sekretariat Daerah / Biro-biro' },
  { id: 'paniradya', nama: 'Paniradya Kaistimewan' },
  { id: 'dprd', nama: 'Sekretariat DPRD DIY' },
  { id: 'inspektorat', nama: 'Inspektorat DIY' },
  { id: 'badan_daerah', nama: 'Badan-badan Daerah DIY' },
];

function Bintang({ jumlah }: { jumlah?: number }) {
  if (!jumlah) return <span className="text-gray-300 text-xs">-</span>;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={13} className={i <= jumlah ? 'fill-orange-400 text-orange-400' : 'text-gray-200'} />
      ))}
    </div>
  );
}

export default function AdminUlasan() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedOpd, setSelectedOpd] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await fetchReviews({
        instansi_id: selectedOpd || undefined,
        sumber: selectedSource || undefined,
        search: search || undefined,
        page,
        limit,
      });
      setReviews(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [selectedOpd, selectedSource, search, page]);

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-red-900">Daftar Ulasan & Berita Aspirasi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Menampilkan data ulasan masyarakat dari berbagai kanal (Google News, Maps, Sosmed)
          </p>
        </div>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-red-800 hover:bg-red-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition"
        >
          <Download size={14} /> Cetak / Unduh Laporan
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        <h3 className="font-bold text-gray-800 text-sm mb-3">Filter Data Terpadu</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Instansi OPD</label>
            <select
              value={selectedOpd}
              onChange={(e) => { setSelectedOpd(e.target.value); setPage(1); }}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 outline-none focus:border-red-800 cursor-pointer"
            >
              {opdList.map((opd) => (
                <option key={opd.id} value={opd.id}>{opd.nama}</option>
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
              <option value="">Semua Saluran (Berita, Maps, Twitter)</option>
              <option value="berita">Portal Berita (Google News RSS)</option>
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
                placeholder="Cari kata kunci masalah..."
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
            Total Ditemukan: {total} Ulasan & Berita
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
                <th className="text-left py-3 px-4">Isi Ulasan & Feedback Masyarakat</th>
                <th className="text-center py-3 px-4 w-24">Rating</th>
                <th className="text-center py-3 px-4 w-28">Sentimen</th>
                <th className="text-center py-3 px-4 w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-red-800" />
                    Sedang mengambil data dari database...
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Tidak ada ulasan yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                reviews.map((u, i) => (
                  <tr key={u.id || i} className={`hover:bg-red-50/40 transition ${i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}`}>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-gray-800 truncate max-w-[160px]">{u.penulis || 'Anonim'}</p>
                      <span className="inline-block mt-0.5 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">
                        {u.sumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-red-900">
                      {u.instansi_nama}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-gray-700 line-clamp-2 leading-relaxed">{u.teks}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{u.tanggal ? u.tanggal.substring(0, 10) : '-'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Bintang jumlah={u.rating ? Math.round(u.rating) : undefined} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
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
                    <td className="py-3.5 px-4 text-center">
                      {u.url ? (
                        <a
                          href={u.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          Sumber <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span className="text-gray-300">-</span>
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