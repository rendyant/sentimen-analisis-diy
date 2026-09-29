'use client';

import { Search, Download, Star, ChevronDown } from 'lucide-react';

const ulasan = [
  { nama: 'Budi Santoso', sumber: 'SAPANI Lapor', opd: 'DISDUKCAPIL', isi: '"Pengurusan KTP-el cepat, petugas ramah dan informatif. Lokasi bersih nyaman serta prokes tertata."', waktu: '12 menit yang lalu', bintang: 5, sentimen: 'Positif', aspek: 'Pelayanan', akurasi: '98.4%', status: 'Selesai', statusStyle: 'bg-green-100 text-green-700' },
  { nama: 'Anisa Rahmawati', sumber: 'Ulasan Google Maps', opd: 'DINAS KESEHATAN', isi: '"Sistem rujukan puskesmas ke RSUD berbelit-belit. Antrean obat sangat panjang dan toilet kotor sekali."', waktu: '45 menit yang lalu', bintang: 2, sentimen: 'Negatif', aspek: 'Fasilitas', akurasi: '95.1%', status: 'Sedang Ditinjau', statusStyle: 'bg-yellow-100 text-yellow-700' },
  { nama: 'Hendra Wijaya', sumber: 'Portal DPMPTSP', opd: 'DPMPTSP', isi: '"Izin usaha praktis lewat online, tidak ada pungli sama sekali. Sangat puas dengan transparansi barunya!"', waktu: '2 jam yang lalu', bintang: 5, sentimen: 'Positif', aspek: 'Sistem Digital', akurasi: '97.6%', status: 'Selesai', statusStyle: 'bg-green-100 text-green-700' },
  { nama: 'Rian Hidayat', sumber: 'SAPANI Lapor', opd: 'DINAS PENDIDIKAN', isi: '"Website pendaftaran sekolah baru PPDB sering crash dan lambat. Sangat membingungkan orang tua wali."', waktu: '3 jam yang lalu', bintang: 1, sentimen: 'Negatif', aspek: 'Sistem Digital', akurasi: '99.2%', status: 'Sedang Ditinjau', statusStyle: 'bg-yellow-100 text-yellow-700' },
  { nama: 'Siti Aminah', sumber: 'Ulasan Google Maps', opd: 'DINAS SOSIAL', isi: '"Petugas dinas sosial sangat sigap membantu menyalurkan bantuan sosial tunai secara tertib dan transparan."', waktu: '1 hari yang lalu', bintang: 5, sentimen: 'Positif', aspek: 'Pelayanan', akurasi: '94.8%', status: 'Selesai', statusStyle: 'bg-green-100 text-green-700' },
  { nama: 'Dedi Prasetyo', sumber: 'Form Kepuasan Mandiri', opd: 'DISDUKCAPIL', isi: '"Antrean perekaman KTP sangat panjang dan menumpuk di luar ruangan, mohon ditambah loket pelayanannya."', waktu: '1 hari yang lalu', bintang: 2, sentimen: 'Negatif', aspek: 'Pelayanan', akurasi: '91.3%', status: 'Sedang Ditinjau', statusStyle: 'bg-yellow-100 text-yellow-700' },
  { nama: 'Ratih Kumala', sumber: 'Ulasan Google Maps', opd: 'DINAS KESEHATAN', isi: '"Pelayanan Puskesmas memadai dan obat lengkap, tapi waktu tunggu dokter agak lama karena keterbatasan staf."', waktu: '2 hari yang lalu', bintang: 3, sentimen: 'Positif', aspek: 'Pelayanan', akurasi: '88.2%', status: 'Selesai', statusStyle: 'bg-green-100 text-green-700' },
  { nama: 'Agung Pramono', sumber: 'Portal DPMPTSP', opd: 'DPMPTSP', isi: '"Proses verifikasi izin mendirikan bangunan lambat, status dokumen tidak diperbarui secara real-time di sistem."', waktu: '3 hari yang lalu', bintang: 2, sentimen: 'Negatif', aspek: 'Pelayanan', akurasi: '93.0%', status: 'Sedang Ditinjau', statusStyle: 'bg-yellow-100 text-yellow-700' },
];

function FilterBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1">
      <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">{label}</p>
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm">
        <span className="text-gray-700">{value}</span>
        <ChevronDown size={14} className="text-gray-400" />
      </div>
    </div>
  );
}

function Bintang({ jumlah }: { jumlah: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={14} className={i <= jumlah ? 'fill-orange-400 text-orange-400' : 'text-gray-300'} />
      ))}
    </div>
  );
}

export default function AdminUlasan() {
  return (
    <div className="p-8 bg-gray-100">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-red-900">Daftar Ulasan Spesifik</h1>
          <p className="text-sm text-gray-500 mt-1">Menampilkan ulasan terbaru berdasarkan filter</p>
        </div>
        <button className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700">
          <Download size={14} /> Unduh Laporan PDF
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-4">Filter Data Utama</h3>
        <div className="flex gap-4">
          <FilterBox label="Periode Waktu" value="Januari 2026 (Bulan Ini)" />
          <FilterBox label="Sumber Data" value="Semua Saluran (Google, SAPANI, Lapor)" />
          <FilterBox label="Instansi OPD" value="Semua Organisasi Perangkat Daerah" />
        </div>
      </div>

      {/* Tabel */}
      <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100">
        <div className="bg-red-950 p-4">
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2.5 w-72">
            <Search size={14} className="text-gray-400" />
            <input placeholder="Cari kata kunci..." className="text-sm outline-none w-full" />
          </div>
        </div>

        <div className="overflow-x-auto bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-red-950 text-white text-xs">
                <th className="text-left py-3 px-4">Pengadu / Sumber</th>
                <th className="text-left py-3 px-4">Instansi OPD</th>
                <th className="text-left py-3 px-4">Isi Ulasan & Feedback Masyarakat</th>
                <th className="text-left py-3 px-4">Bintang</th>
                <th className="text-left py-3 px-4">Sentimen</th>
                <th className="text-left py-3 px-4">Aspek</th>
                <th className="text-left py-3 px-4">Akurasi AI</th>
                <th className="text-left py-3 px-4">Status Tindak Lanjut</th>
                <th className="text-right py-3 px-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {ulasan.map((u, i) => (
                <tr key={i} className={`border-b border-gray-100 ${i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
                  <td className="py-4 px-4">
                    <p className="font-bold text-gray-800">{u.nama}</p>
                    <p className="text-xs text-gray-400">{u.sumber}</p>
                  </td>
                  <td className="py-4 px-4 font-bold text-red-800 text-xs">{u.opd}</td>
                  <td className="py-4 px-4 max-w-md">
                    <p className="text-gray-700">{u.isi}</p>
                    <p className="text-xs text-gray-400 mt-1">{u.waktu}</p>
                  </td>
                  <td className="py-4 px-4"><Bintang jumlah={u.bintang} /></td>
                  <td className="py-4 px-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.sentimen === 'Positif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      ● {u.sentimen}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{u.aspek}</td>
                  <td className="py-4 px-4 font-bold text-gray-700">{u.akurasi}</td>
                  <td className="py-4 px-4"><span className={`text-xs font-semibold px-2.5 py-1 rounded ${u.statusStyle}`}>{u.status}</span></td>
                  <td className="py-4 px-4 text-right">
                    <button className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-50">Lihat</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-100">
          <p className="text-sm text-gray-500">Menampilkan <b>8</b> dari <b>34</b> ulasan masuk</p>
          <div className="flex items-center gap-1">
            <button className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500">Sebelumnya</button>
            <button className="text-sm px-3 py-1.5 rounded-lg bg-gray-900 text-white font-bold">1</button>
            <button className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg">2</button>
            <button className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg">3</button>
            <span className="px-1 text-gray-400">...</span>
            <button className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg">5</button>
            <button className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg text-gray-700">Selanjutnya</button>
          </div>
        </div>
      </div>
    </div>
  );
}