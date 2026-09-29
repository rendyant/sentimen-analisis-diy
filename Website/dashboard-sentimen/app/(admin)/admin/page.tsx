import { Search, Download, Printer, Sparkles, Zap, ArrowUp, ArrowRight, CheckCircle2, Clock, ChevronDown } from 'lucide-react';
import StatsCard from '@/components/statscard';
import RatingCard from '@/components/ratingcard';
import SentimentChart from '@/components/sentimentchart';
import AIInsight from '@/components/aiinsight';

type StatItem = { title: string; value: number; subtitle?: string; change?: string; color: 'gray' | 'positive' | 'neutral' | 'negative' };

const statsData: StatItem[] = [
  { title: 'TOTAL ULASAN OPD', value: 128, change: '+12% vs bulan lalu', color: 'gray' },
  { title: 'SENTIMEN POSITIF', value: 82, subtitle: '64.0% dari total', color: 'positive' },
  { title: 'SENTIMEN NETRAL', value: 24, subtitle: '18.7% dari total', color: 'neutral' },
  { title: 'SENTIMEN NEGATIF', value: 22, subtitle: 'Perlu Perhatian 17.3% total', color: 'negative' },
];

const performaOPD = [
  { nama: 'Dinas Pariwisata', total: '12,450', positif: '82%', negatif: '8%', status: 'Baik', style: 'bg-green-100 text-green-700' },
  { nama: 'Dinas Perhubungan', total: '8,320', positif: '55%', negatif: '35%', status: 'Perhatian', style: 'bg-red-100 text-red-700' },
  { nama: 'Bapenda (Samsat)', total: '15,100', positif: '68%', negatif: '15%', status: 'Stabil', style: 'bg-gray-100 text-gray-600' },
  { nama: 'Dinas Kesehatan', total: '9,875', positif: '75%', negatif: '12%', status: 'Baik', style: 'bg-green-100 text-green-700' },
];

const rekomendasiOPD = [
  { nama: 'Dinas Pendidikan, Pemuda dan Olahraga', masalah: 'Waktu tunggu lama dan antrian panjang', prioritas: 'Tinggi', style: 'bg-red-50 text-red-600' },
  { nama: 'Dinas Kesehatan', masalah: 'Petugas kurang ramah dan komunikasi kurang baik', prioritas: 'Tinggi', style: 'bg-red-50 text-red-600' },
  { nama: 'Dinas Perizinan', masalah: 'Prosedur dianggap rumit dan berbelit', prioritas: 'Sedang', style: 'bg-orange-50 text-orange-600' },
  { nama: 'Dinas Sosial', masalah: 'Informasi layanan kurang jelas dan sulit diakses', prioritas: 'Sedang', style: 'bg-orange-50 text-orange-600' },
  { nama: 'Dinas Perhubungan', masalah: 'Fasilitas ruang tunggu tidak memadai', prioritas: 'Rendah', style: 'bg-green-50 text-green-600' },
];

const kataNegatif = ['lama', 'menunggu', 'lambat', 'ribet', 'berbelit', 'pelayanan', 'susah', 'banyak', 'tidak jelas', 'berkas'];

const rekomendasiTindakan = [
  { judul: 'Optimalkan alur pelayanan', desc: 'Evaluasi dan sederhanakan alur pelayanan agar proses lebih cepat dan efisien.' },
  { judul: 'Penambahan petugas pada jam sibuk', desc: 'Sesuaikan jumlah petugas dengan volume pelayanan pada jam dan hari tertentu.' },
  { judul: 'Sistem antrian digital', desc: 'Terapkan sistem antrian online untuk mengurangi penumpukan dan mempercepat pelayanan.' },
];

function FilterBox({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">{label}</p>
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm w-64">
        <span className="text-gray-700">{value}</span>
        <ChevronDown size={14} className="text-gray-400" />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div className="p-8 bg-gray-100">
      {/* Banner */}
      <div className="bg-gradient-to-r from-red-900 to-red-950 rounded-xl p-6 text-white mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-white text-red-900 text-[10px] font-bold px-3 py-1 rounded-full">SUPER ADMIN</span>
          <span className="text-xs text-white/70">Data diperbarui setiap 24 jam sekali secara otomatis</span>
        </div>
        <h2 className="text-2xl font-bold mb-1">DASHBOARD OPD PROVINSI DIY</h2>
        <p className="text-sm text-white/80">Berdasarkan akumulasi suara publik, survei, dan ekstraksi keluhan masyarakat sepanjang bulan Januari 2026.</p>
      </div>

      {/* Filter + Export */}
      <div className="flex items-end justify-between mb-6">
        <div className="flex gap-4">
          <FilterBox label="Periode Waktu" value="Januari 2026 (Bulan Ini)" />
          <FilterBox label="Sumber Data" value="Semua Saluran (Google, SAPANI, Lapor)" />
          <FilterBox label="Instansi OPD" value="Semua Organisasi Perangkat Daerah" />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-semibold text-gray-800">Ekspor CSV</button>
          <button className="flex items-center gap-2 bg-red-900 text-white px-4 py-2 rounded-lg text-sm font-semibold"><Printer size={14} /> Cetak / Ekspor PDF</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {statsData.map((stat, idx) => (
          <StatsCard key={idx} {...stat} />
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-4 mb-6 items-start">
        {/* Kiri */}
        <div className="col-span-2 space-y-4">
          <RatingCard />
          <SentimentChart />

          {/* Performa OPD */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Performa per Dinas/OPD</h3>
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
                <Search size={14} className="text-gray-400" />
                <input placeholder="Cari OPD..." className="text-sm outline-none w-32" />
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                  <th className="text-left py-3 px-3">Nama OPD</th>
                  <th className="text-right py-3 px-3">Total Ulasan</th>
                  <th className="text-right py-3 px-3">% Positif</th>
                  <th className="text-right py-3 px-3">% Negatif</th>
                  <th className="text-right py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {performaOPD.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-3 px-3 font-medium text-gray-800">{row.nama}</td>
                    <td className="py-3 px-3 text-right">{row.total}</td>
                    <td className="py-3 px-3 text-right font-semibold text-green-600">{row.positif}</td>
                    <td className="py-3 px-3 text-right font-semibold text-red-600">{row.negatif}</td>
                    <td className="py-3 px-3 text-right"><span className={`text-xs font-semibold px-2 py-1 rounded ${row.style}`}>{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-center mt-4">
              <button className="text-sm font-semibold text-red-800 hover:underline">Lihat Semua OPD</button>
            </div>
          </div>

          {/* Rekomendasi OPD Lain */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-red-50 px-6 py-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-red-700 rounded"></span>
              <h3 className="font-bold text-red-900">Rekomendasi OPD Lain</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                  <th className="text-left py-3 px-6">OPD</th>
                  <th className="text-left py-3 px-3">Masalah Utama</th>
                  <th className="text-left py-3 px-3">Prioritas</th>
                  <th className="text-right py-3 px-6">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rekomendasiOPD.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-3 px-6 font-semibold text-gray-800">{row.nama}</td>
                    <td className="py-3 px-3 text-gray-600">{row.masalah}</td>
                    <td className="py-3 px-3"><span className={`text-xs font-semibold px-2 py-1 rounded ${row.style}`}>↑ {row.prioritas}</span></td>
                    <td className="py-3 px-6 text-right">
                      <button className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-red-700 font-semibold hover:bg-red-50">Lihat →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kanan: AI Action Plans */}
        <div className="col-span-1">
          <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <div className="bg-gradient-to-br from-red-900 to-red-950 p-5 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1 bg-white/10 text-yellow-300 text-[10px] font-bold px-2 py-1 rounded-full"><Sparkles size={10} /> AI ACTION PLANS</span>
                <span className="bg-red-500 text-[10px] font-bold px-2 py-1 rounded-full">2 Mendesak</span>
              </div>
              <h3 className="font-bold flex items-center gap-1"><Zap size={14} /> Rekomendasi Kebijakan</h3>
              <p className="text-xs text-white/70 mt-1 mb-3">Panduan aksi prioritas berbasis data ulasan warga</p>
              <div className="flex gap-2">
                <button className="bg-white text-red-900 text-xs font-semibold px-3 py-1 rounded-full">Semua (4)</button>
                <button className="bg-white/10 text-xs px-3 py-1 rounded-full">● Tinggi (2)</button>
                <button className="bg-white/10 text-xs px-3 py-1 rounded-full">● Sedang (2)</button>
              </div>
            </div>

            <div className="bg-white p-5 space-y-4">
              <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg"><ArrowUp size={12} /> Prioritas Tinggi</span>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center text-xl">🏛️</div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Dinas Kependudukan dan Catatan Sipil</h4>
                  <p className="text-xs text-gray-500">Aspek Utama: Waktu Pelayanan</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500">Total Ulasan Terkait</p>
                  <p className="text-lg font-bold text-gray-900">65</p>
                  <p className="text-[10px] text-gray-400">ulasan</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500">Sentimen Negatif</p>
                  <p className="text-lg font-bold text-gray-900">70%</p>
                  <p className="text-[10px] text-gray-400">dari total ulasan</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500">Sumber Utama</p>
                  <p className="text-sm font-bold text-gray-900">Google Maps</p>
                  <p className="text-[10px] text-gray-400">(42 ulasan)</p>
                </div>
              </div>

              <div className="border border-gray-100 rounded-lg p-4">
                <h5 className="font-bold text-gray-900 text-sm mb-3">Kata Negatif yang Sering Muncul</h5>
                <div className="flex flex-wrap gap-2">
                  {kataNegatif.map((k, i) => (
                    <span key={i} className="bg-red-50 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full">{k}</span>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-3">Berdasarkan ulasan negatif pada periode 1-31 Mei 2026</p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h5 className="font-bold text-green-700 text-sm mb-3 flex items-center gap-1">🛡️ Rekomendasi Tindakan</h5>
                <div className="space-y-3">
                  {rekomendasiTindakan.map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-gray-800">{r.judul}</p>
                        <p className="text-[11px] text-gray-500">{r.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="flex items-center gap-1 border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">
                Lihat Ulasan Terkait <ArrowRight size={12} />
              </button>

              <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-1 text-[10px] text-gray-500">
                <Clock size={10} /> Terakhir diperbarui: 16 Mei 2026, 10:30
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-4 text-xs text-gray-600 leading-relaxed">
            Rekomendasi disusun berdasarkan analisis ulasan masyarakat dari berbagai sumber data.<br />
            Data dapat berubah sesuai periode, sumber, dan volume ulasan yang dianalisis.
          </div>
        </div>
      </div>

      <AIInsight />
    </div>
  );
}