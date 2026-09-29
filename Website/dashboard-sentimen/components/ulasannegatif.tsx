import { AlertTriangle } from 'lucide-react';

const reviews = [
  {
    rating: '1 Bintang',
    place: 'Puskesmas Melati',
    time: '2 jam lalu',
    text: '"Sudah antre dari jam 6 pagi, tapi jam 8 loket belum buka. Petugas beralasan..."',
  },
  {
    rating: '2 Bintang',
    place: 'RSUD Kota',
    time: '1 hari lalu',
    text: '"Toilet di lantai 2 poli penyakit dalam sangat kotor dan bau, mohon CS..."',
  },
];

export default function UlasanNegatif() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-red-600" size={20} />
          <h3 className="font-bold text-gray-800 text-lg">Ulasan Negatif Terbaru</h3>
        </div>
        <button className="text-sm text-red-800 font-medium hover:underline">
          Lihat Semua
        </button>
      </div>

      <div className="space-y-3">
        {reviews.map((review, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded font-semibold">
                  {review.rating}
                </span>
                <span className="font-semibold text-sm text-gray-800">{review.place}</span>
              </div>
              <span className="text-xs text-gray-500">{review.time}</span>
            </div>

            <p className="text-sm text-gray-600 italic mb-3">{review.text}</p>

            <div className="flex justify-end">
              <button className="text-xs border border-gray-300 px-3 py-1 rounded hover:bg-gray-50 transition">
                Tindak Lanjuti
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}