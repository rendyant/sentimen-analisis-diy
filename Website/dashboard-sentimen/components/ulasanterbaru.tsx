const reviews = [
  {
    tanggal: '12 Ags 2024',
    sumber: 'Google Reviews',
    isi: 'Sistem pendaftaran PPDB online servernya down terus sejak pagi. Tolong segera diperbaiki.',
    sentimen: 'NEGATIF',
    kepercayaan: '94%',
  },
  {
    tanggal: '10 Ags 2024',
    sumber: 'Instagram',
    isi: 'Mohon info jadwal pembagian seragam gratis, minim info di website official.',
    sentimen: 'NEGATIF',
    kepercayaan: '88%',
  },
  {
    tanggal: '09 Ags 2024',
    sumber: 'X (Twitter)',
    isi: 'Gedung sekolah di daerah Gunungkidul ini atapnya sudah mau rubuh, bahaya sekali buat belajar.',
    sentimen: 'NEGATIF',
    kepercayaan: '97%',
  },
];

export default function UlasanTerbaru() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">Ulasan Terbaru Perlu Perhatian (Negatif)</h3>
          <p className="text-xs text-gray-500 mt-1">
            Tindakan cepat diperlukan untuk keluhan prioritas tinggi
          </p>
        </div>
        <button className="text-sm border border-gray-300 px-3 py-1 rounded hover:bg-gray-50 transition">
          Lihat Semua Analisis
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-600 text-xs uppercase">
              <th className="text-left py-3 px-2">Tanggal</th>
              <th className="text-left py-3 px-2">Sumber</th>
              <th className="text-left py-3 px-2">Isi Ulasan</th>
              <th className="text-left py-3 px-2">Sentimen</th>
              <th className="text-right py-3 px-2">Kepercayaan</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-2 text-gray-700">{review.tanggal}</td>
                <td className="py-3 px-2 text-gray-700">{review.sumber}</td>
                <td className="py-3 px-2 text-gray-700">{review.isi}</td>
                <td className="py-3 px-2">
                  <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-semibold">
                    {review.sentimen}
                  </span>
                </td>
                <td className="py-3 px-2 text-right font-semibold text-gray-800">
                  {review.kepercayaan}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}