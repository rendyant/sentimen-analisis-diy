'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, CheckCircle, Lightbulb, ChevronRight, AlertCircle } from 'lucide-react';

const ACTION_PLANS = [
  {
    id: 1,
    priority: 'Tinggi',
    badgeClass: 'bg-red-100 text-red-600',
    numClass: 'bg-red-600',
    title: 'Waktu tunggu layanan loket meningkat pada jam sibuk',
    statLabel: '68% Negatif',
    statColor: 'text-red-600',
    statSub: '(184 ulasan, +12% tren)',
    summary: [
      'Keluhan terfokus pada antrean verifikasi berkas di pagi hari.',
      'Audit ketersediaan kursi tunggu & fasilitas ruang pelayanan.',
      'Integrasikan display notifikasi nomor antrean ke smartphone warga.',
    ],
    recommendation: 'Evaluasi pembagian shift petugas loket dan terapkan sistem antrean digital.',
    impact: 'Estimasi penurunan keluhan -38% & kenaikan indeks kepuasan +0.45 poin',
  },
  {
    id: 2,
    priority: 'Tinggi',
    badgeClass: 'bg-red-100 text-red-600',
    numClass: 'bg-red-600',
    title: 'Respons pengaduan online & kejelasan prosedur berkas',
    statLabel: '54% Negatif',
    statColor: 'text-red-600',
    statSub: '(96 ulasan, +8% tren)',
    summary: [
      'Masyarakat mengeluhkan persyaratan dokumen fisik berulang.',
      'Perlu panduan checklist persyaratan yang seragam di website & loket.',
    ],
    recommendation: 'Sediakan chatbot FAQ otomatis dan SOP checklist tunggal di portal resmi.',
    impact: 'Estimasi waktu verifikasi lebih cepat 40%',
  },
  {
    id: 3,
    priority: 'Sedang',
    badgeClass: 'bg-yellow-100 text-yellow-700',
    numClass: 'bg-yellow-500',
    title: 'Optimalisasi sosialisasi jadwal layanan keliling',
    statLabel: '42% Perlu Perhatian',
    statColor: 'text-yellow-600',
    statSub: '(62 ulasan)',
    summary: [
      'Jadwal layanan jemput bola belum terinformasikan merata ke tingkat kalurahan.',
      'Perlu kolaborasi publikasi melalui media sosial resmi.',
    ],
    recommendation: 'Publikasikan jadwal mingguan secara rutin di Instagram & WhatsApp resmi OPD.',
    impact: 'Peningkatan jangkauan layanan publik +25%',
  },
];

export default function AIActionPlans() {
  const [filter, setFilter] = useState<'Semua' | 'Tinggi' | 'Sedang'>('Semua');

  const filteredPlans = ACTION_PLANS.filter((p) =>
    filter === 'Semua' ? true : p.priority === filter
  );

  const countTinggi = ACTION_PLANS.filter((p) => p.priority === 'Tinggi').length;
  const countSedang = ACTION_PLANS.filter((p) => p.priority === 'Sedang').length;

  return (
    <div className="bg-gradient-to-br from-red-900 to-red-950 rounded-xl p-6 text-white shadow-sm h-full">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={16} className="text-yellow-300" />
        <span className="text-xs font-semibold uppercase tracking-wide text-yellow-300">
          AI ACTION PLANS
        </span>
        <span className="ml-auto bg-red-500 text-xs px-2 py-0.5 rounded-full">
          {countTinggi} Mendesak
        </span>
      </div>

      <h3 className="text-lg font-bold mb-1">Rekomendasi Kebijakan</h3>
      <p className="text-xs text-white/70 mb-4">
        Panduan aksi prioritas berbasis data ulasan warga
      </p>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setFilter('Semua')}
          className={`text-xs px-3 py-1 rounded-full font-medium transition ${
            filter === 'Semua' ? 'bg-white text-red-900' : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          Semua ({ACTION_PLANS.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('Tinggi')}
          className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 transition ${
            filter === 'Tinggi' ? 'bg-white text-red-900 font-medium' : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Tinggi ({countTinggi})
        </button>
        <button
          type="button"
          onClick={() => setFilter('Sedang')}
          className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 transition ${
            filter === 'Sedang' ? 'bg-white text-red-900 font-medium' : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span> Sedang ({countSedang})
        </button>
      </div>

      <div className="space-y-3">
        {filteredPlans.map((plan, index) => (
          <div key={plan.id} className="bg-white rounded-lg p-4 text-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full ${plan.numClass} text-white text-xs flex items-center justify-center font-bold`}>
                  {index + 1}
                </span>
                <span className={`${plan.badgeClass} text-xs px-2 py-0.5 rounded font-semibold flex items-center gap-1`}>
                  <AlertCircle size={10} /> PRIORITAS {plan.priority.toUpperCase()}
                </span>
              </div>
            </div>

            <h4 className="font-bold text-sm">{plan.title}</h4>

            <p className="text-xs">
              <span className={`${plan.statColor} font-semibold`}>{plan.statLabel}</span>
              <span className="text-gray-500"> {plan.statSub}</span>
            </p>

            <div className="bg-gray-50 rounded p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                📋 RINGKASAN
              </p>
              <ul className="text-xs space-y-1 text-gray-600">
                {plan.summary.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
                <Lightbulb size={12} /> Rekomendasi:
              </p>
              <p className="text-xs text-red-600 mt-1">{plan.recommendation}</p>
            </div>

            <div className="text-xs text-gray-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
              <span>
                Dampak: <strong>{plan.impact}</strong>
              </span>
            </div>

            <Link
              href="/ulasan"
              className="w-full bg-red-800 text-white text-sm py-2 rounded-lg flex items-center justify-center gap-1 hover:bg-red-900 transition"
            >
              Tindak Lanjuti Keluhan Terkait
              <ChevronRight size={14} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}