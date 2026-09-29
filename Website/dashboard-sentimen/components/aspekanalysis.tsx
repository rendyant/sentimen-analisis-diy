import { Plus } from 'lucide-react';

const aspects = [
  {
    name: 'Waktu Antrean',
    rating: 2.1,
    status: 'Isu Utama',
    statusColor: 'bg-red-100 text-red-700',
    progressColor: 'bg-red-500',
    progress: 42,
    desc: 'Keluhan dominan: Lama antrean poli umum.',
  },
  {
    name: 'Sikap Petugas',
    rating: 4.3,
    status: 'Baik',
    statusColor: 'bg-green-600 text-white',
    progressColor: 'bg-green-500',
    progress: 86,
    desc: 'Ulasan memuji keramahan perawat.',
  },
  {
    name: 'Kebersihan Fasilitas',
    rating: 3.5,
    status: 'Netral',
    statusColor: 'bg-blue-500 text-white',
    progressColor: 'bg-blue-500',
    progress: 70,
    desc: 'Beberapa keluhan toilet di jam siang.',
  },
];

export default function AspekAnalysis() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">Analisis Aspek Layanan</h3>
          <p className="text-xs text-gray-500 mt-1">
            Evaluasi spesifik dimensi layanan Puskesmas & RSUD
          </p>
        </div>
        <button className="text-sm text-red-800 font-medium hover:underline flex items-center gap-1">
          Detail Aspek →
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {aspects.map((aspect, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800 text-sm">{aspect.name}</h4>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${aspect.statusColor}`}>
                {aspect.status}
              </span>
            </div>

            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-2xl font-bold text-gray-800">{aspect.rating}</span>
              <span className="text-xs text-gray-500">/ 5.0</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
              <div
                className={`${aspect.progressColor} h-1.5 rounded-full`}
                style={{ width: `${aspect.progress}%` }}
              ></div>
            </div>

            <p className="text-xs text-gray-600">{aspect.desc}</p>
          </div>
        ))}

        {/* Tambah Aspek Baru */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-gray-400 hover:border-red-400 hover:text-red-500 transition cursor-pointer min-h-[140px]">
          <Plus size={24} />
          <p className="text-sm mt-1">Pantau Aspek Baru</p>
        </div>
      </div>
    </div>
  );
}