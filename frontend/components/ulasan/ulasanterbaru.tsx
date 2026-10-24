'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2 } from 'lucide-react';
import { fetchReviews, Review } from '@/lib/api';

export default function UlasanTerbaru() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetchReviews({ limit: 5 });
        setReviews(res.data);
      } catch (err) {
        console.error('Gagal mengambil ulasan terbaru:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-800 text-base">Ulasan & Aspirasi Publik Terbaru</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Data live masuk dari berbagai kanal (Google News, Maps, Twitter)
          </p>
        </div>
        <Link
          href="/admin/ulasan"
          className="text-xs font-semibold text-red-800 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
        >
          Lihat Semua Ulasan →
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 uppercase font-bold bg-gray-50/50">
              <th className="text-left py-2.5 px-3">Tanggal</th>
              <th className="text-left py-2.5 px-3">Sumber & Pengadu</th>
              <th className="text-left py-2.5 px-3">Isi Ulasan & Berita</th>
              <th className="text-center py-2.5 px-3">Sentimen</th>
              <th className="text-center py-2.5 px-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-400">
                  <Loader2 size={16} className="animate-spin mx-auto mb-1 text-red-800" />
                  Memuat ulasan terkini...
                </td>
              </tr>
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-400">
                  Belum ada data ulasan ditemukan.
                </td>
              </tr>
            ) : (
              reviews.map((rev, idx) => (
                <tr key={rev.id || idx} className="hover:bg-red-50/30 transition">
                  <td className="py-3 px-3 text-gray-500 whitespace-nowrap">
                    {rev.tanggal ? rev.tanggal.substring(0, 10) : '-'}
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-bold text-gray-800 truncate max-w-[140px]">{rev.penulis || 'Anonim'}</p>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                      {rev.sumber}
                    </span>
                  </td>
                  <td className="py-3 px-3 max-w-md">
                    <p className="text-gray-700 line-clamp-2 leading-relaxed">{rev.teks}</p>
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    {rev.sentimen ? (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rev.sentimen === 'positif' ? 'bg-green-100 text-green-700' :
                        rev.sentimen === 'negatif' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {rev.sentimen.toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">Belum Dianalisis</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {rev.url ? (
                      <a
                        href={rev.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-medium"
                      >
                        Buka <ExternalLink size={10} />
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
    </div>
  );
}