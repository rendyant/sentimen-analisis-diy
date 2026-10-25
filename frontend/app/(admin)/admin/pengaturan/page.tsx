'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, Play, Globe, MapPin, Share2 } from 'lucide-react';
import { triggerScrape, fetchScrapeStatus } from '@/lib/api';

export default function AdminPengaturan() {
  const [nama, setNama] = useState('Super Admin Pemda DIY');
  const [email, setEmail] = useState('admin@jogjaprov.go.id');
  const [instansi, setInstansi] = useState('Pemerintah Daerah Istimewa Yogyakarta');
  const [saved, setSaved] = useState(false);

  const [scrapeStatus, setScrapeStatus] = useState<{ is_running: boolean; message: string }>({
    is_running: false,
    message: 'Idle',
  });
  const [scrapeNotice, setScrapeNotice] = useState('');

  async function loadStatus() {
    try {
      const s = await fetchScrapeStatus();
      setScrapeStatus(s);
    } catch {
      // ignore if offline
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function handleScrape(type: 'news' | 'maps' | 'social') {
    setScrapeNotice('');
    try {
      const res = await triggerScrape(type);
      setScrapeNotice(res.message);
      await loadStatus();
    } catch {
      setScrapeNotice('Gagal menghubungi server scraping.');
    }
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-red-900 mb-1">Pengaturan Super Admin & Mesin Scraping</h1>
      <p className="text-sm text-gray-500 mb-6">
        Kelola profil Super Admin serta jalankan penarikan data (scraping) ulasan & berita 24 OPD DIY
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel Profil */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Profil Super Admin</h3>
          {saved && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs font-semibold text-green-700">
              <CheckCircle2 size={14} /> Perubahan profil berhasil disimpan.
            </div>
          )}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-800"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-800"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Instansi</label>
              <input
                type="text"
                value={instansi}
                onChange={(e) => setInstansi(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-800"
              />
            </div>
            <button
              type="submit"
              className="bg-red-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-950 transition"
            >
              Simpan Perubahan
            </button>
          </form>
        </div>

        {/* Panel Kontrol Scraping Backend */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900">Kontrol Mesin Scraping 24 OPD</h3>
              <p className="text-xs text-gray-500">Tarik ulasan & berita terbaru ke database secara langsung</p>
            </div>
            <button
              type="button"
              onClick={loadStatus}
              className="flex items-center gap-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50"
            >
              <RefreshCw size={12} className={scrapeStatus.is_running ? 'animate-spin' : ''} /> Cek Status
            </button>
          </div>

          <div className="mb-4 rounded-lg bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-xs flex items-center justify-between">
            <span className="text-gray-600 font-medium">Status Worker Backend:</span>
            <span className={`font-bold ${scrapeStatus.is_running ? 'text-amber-600' : 'text-green-700'}`}>
              {scrapeStatus.message}
            </span>
          </div>

          {scrapeNotice && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-medium text-red-800">
              {scrapeNotice}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleScrape('news')}
              disabled={scrapeStatus.is_running}
              className="w-full flex items-center justify-between border border-gray-200 rounded-lg p-3.5 hover:border-red-800 hover:bg-red-50/30 transition disabled:opacity-60"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Globe size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">Scrape Portal Berita (Google News)</p>
                  <p className="text-[11px] text-gray-500">Tarik berita terkini untuk 24 OPD DIY</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 bg-red-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                <Play size={11} /> Jalankan
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleScrape('maps')}
              disabled={scrapeStatus.is_running}
              className="w-full flex items-center justify-between border border-gray-200 rounded-lg p-3.5 hover:border-red-800 hover:bg-red-50/30 transition disabled:opacity-60"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">Scrape Ulasan Google Maps</p>
                  <p className="text-[11px] text-gray-500">Tarik rating & ulasan warga pada kantor OPD</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 bg-red-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                <Play size={11} /> Jalankan
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleScrape('social')}
              disabled={scrapeStatus.is_running}
              className="w-full flex items-center justify-between border border-gray-200 rounded-lg p-3.5 hover:border-red-800 hover:bg-red-50/30 transition disabled:opacity-60"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Share2 size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">Scrape Media Sosial (Twitter/X, IG, TikTok)</p>
                  <p className="text-[11px] text-gray-500">Tarik opini & keluhan warganet seputar layanan publik</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 bg-red-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                <Play size={11} /> Jalankan
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}