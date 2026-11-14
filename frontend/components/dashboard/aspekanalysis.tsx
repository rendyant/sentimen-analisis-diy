'use client';

import Link from 'next/link';

export interface AspectItem {
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
}

export default function AspekAnalysis({
  aspects = [],
  detailHref = '/analisis',
}: {
  aspects?: AspectItem[];
  detailHref?: string;
}) {
  const topAspects = aspects.slice(0, 6);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">Analisis Aspek & Kategori Layanan (Database Live)</h3>
          <p className="text-xs text-gray-500 mt-1">
            Evaluasi dimensi layanan publik berdasarkan pengelompokan kategori ulasan di database
          </p>
        </div>
        <Link href={detailHref} className="text-xs text-red-800 font-semibold hover:underline flex items-center gap-1">
          Detail Analisis →
        </Link>
      </div>

      {topAspects.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-400">
          Belum ada data aspek layanan pada filter ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topAspects.map((aspect, idx) => (
            <div key={`${aspect.name}-${idx}`} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold text-gray-800 text-xs leading-snug">{aspect.name}</h4>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold shrink-0 ${aspect.statusColor}`}>
                  {aspect.status}
                </span>
              </div>

              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-bold text-gray-800">{aspect.rating}</span>
                <span className="text-xs text-gray-500">/ 5.0</span>
                <span className="ml-auto text-[11px] font-semibold text-gray-500">
                  {aspect.total} data
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                <div
                  className={`${aspect.progressColor} h-1.5 rounded-full`}
                  style={{ width: `${aspect.progress}%` }}
                />
              </div>

              <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">{aspect.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
