'use client';

import Link from 'next/link';
import { AlertTriangle, Lightbulb } from 'lucide-react';

export interface NegativeReviewItem {
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
}

export default function UlasanNegatif({
  reviews = [],
  allHref = '/ulasan',
}: {
  reviews?: NegativeReviewItem[];
  allHref?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-red-600" size={20} />
          <h3 className="font-bold text-gray-800 text-base">Ulasan Negatif Terbaru (DB)</h3>
        </div>
        <Link href={allHref} className="text-xs text-red-800 font-semibold hover:underline">
          Lihat Semua →
        </Link>
      </div>

      {reviews.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-400">
          Tidak ada ulasan negatif untuk filter ini.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.slice(0, 3).map((review, idx) => (
            <div key={review.id || idx} className="border border-gray-200 rounded-lg p-3.5">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-bold shrink-0">
                    ★ {review.rating}
                  </span>
                  <span className="font-bold text-xs text-gray-800 truncate">
                    {review.instansi_nama}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">{review.tanggal}</span>
              </div>

              <p className="text-xs text-gray-600 italic line-clamp-2 mb-2">
                &ldquo;{review.teks}&rdquo;
              </p>

              {review.solusi_ai && (
                <div className="bg-red-50/70 border border-red-100 rounded p-2 text-[11px] text-red-900 mb-2">
                  <span className="font-bold inline-flex items-center gap-1">
                    <Lightbulb size={11} /> Solusi AI:
                  </span>{' '}
                  {review.solusi_ai}
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-gray-500">
                <span>Kategori: <b>{review.kategori_masalah}</b></span>
                <Link
                  href={allHref}
                  className="text-xs border border-gray-300 px-2.5 py-0.5 rounded hover:bg-gray-50 transition font-semibold text-gray-700"
                >
                  Tindak Lanjuti
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
