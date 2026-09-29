import { Sparkles, CheckCircle, Lightbulb, ChevronRight, AlertCircle } from 'lucide-react';

export default function AIActionPlans() {
  return (
    <div className="bg-gradient-to-br from-red-900 to-red-950 rounded-xl p-6 text-white shadow-sm h-full">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={16} className="text-yellow-300" />
        <span className="text-xs font-semibold uppercase tracking-wide text-yellow-300">
          AI ACTION PLANS
        </span>
        <span className="ml-auto bg-red-500 text-xs px-2 py-0.5 rounded-full">
          2 Mendesak
        </span>
      </div>

      <h3 className="text-lg font-bold mb-1">Rekomendasi Kebijakan</h3>
      <p className="text-xs text-white/70 mb-4">
        Panduan aksi prioritas berbasis data ulasan warga
      </p>

      <div className="flex gap-2 mb-4">
        <button className="bg-white text-red-900 text-xs px-3 py-1 rounded-full font-medium">Semua (4)</button>
        <button className="bg-white/10 text-xs px-3 py-1 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Tinggi (2)
        </button>
        <button className="bg-white/10 text-xs px-3 py-1 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span> Sedang (2)
        </button>
      </div>

      {/* Card 1 */}
      <div className="bg-white rounded-lg p-4 text-gray-800 space-y-3 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">1</span>
            <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded font-semibold flex items-center gap-1">
              <AlertCircle size={10} /> PRIORITAS TINGGI
            </span>
          </div>
        </div>

        <h4 className="font-bold text-sm">Waktu tunggu farmasi meningkat signifikan</h4>
        
        <p className="text-xs">
          <span className="text-red-600 font-semibold">68% Negatif</span>
          <span className="text-gray-500"> (184 ulasan, +12% tren)</span>
        </p>

        <div className="bg-gray-50 rounded p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
            📋 RINGKASAN
          </p>
          <ul className="text-xs space-y-1 text-gray-600">
            <li className="flex items-start gap-1">
              <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
              Keluhan terfokus pada antrean obat kronis di pagi hari.
            </li>
            <li className="flex items-start gap-1">
              <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
              Audit ketersediaan kursi tunggu & pendingin ruangan (AC)
            </li>
            <li className="flex items-start gap-1">
              <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
              Integrasikan display notifikasi nomor antrean ke smartphone warga
            </li>
          </ul>
        </div>

        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
            <Lightbulb size={12} /> Rekomendasi:
          </p>
          <p className="text-xs text-red-600 mt-1">
            Evaluasi pembagian shift apoteker dan sistem panggil antrean digital.
          </p>
        </div>

        <div className="text-xs text-gray-600 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <span>Dampak: <strong>Estimasi penurunan keluhan -38% & kenaikan indeks kepuasan +0.45 poin</strong></span>
        </div>

        <button className="w-full bg-red-800 text-white text-sm py-2 rounded-lg flex items-center justify-center gap-1 hover:bg-red-900 transition">
          Tindak Lanjuti Keluhan Terkait
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Card 2 */}
      <div className="bg-white rounded-lg p-4 text-gray-800 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center font-bold">2</span>
          <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded font-semibold flex items-center gap-1">
            <AlertCircle size={10} /> PRIORITAS SEDANG
          </span>
        </div>

        <h4 className="font-bold text-sm">Waktu tunggu farmasi meningkat signifikan</h4>
        
        <p className="text-xs">
          <span className="text-yellow-600 font-semibold">68% Sedang</span>
          <span className="text-gray-500"> (184 ulasan, +12% tren)</span>
        </p>

        <div className="bg-gray-50 rounded p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
            📋 RINGKASAN:
          </p>
          <ul className="text-xs space-y-1 text-gray-600">
            <li className="flex items-start gap-1">
              <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
              Keluhan terfokus pada antrean obat kronis di pagi hari.
            </li>
            <li className="flex items-start gap-1">
              <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
              Audit ketersediaan kursi tunggu & pendingin ruangan (AC)
            </li>
            <li className="flex items-start gap-1">
              <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
              Integrasikan display notifikasi nomor antrean ke smartphone warga
            </li>
          </ul>
        </div>

        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
            <Lightbulb size={12} /> Rekomendasi:
          </p>
          <p className="text-xs text-red-600 mt-1">
            Evaluasi pembagian shift apoteker dan sistem panggil antrean digital.
          </p>
        </div>

        <div className="text-xs text-gray-600 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <span>Dampak: <strong>Estimasi penurunan keluhan -38% & kenaikan indeks kepuasan +0.45 poin</strong></span>
        </div>

        <button className="w-full bg-red-800 text-white text-sm py-2 rounded-lg flex items-center justify-center gap-1 hover:bg-red-900 transition">
          Tindak Lanjuti Keluhan Terkait
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}