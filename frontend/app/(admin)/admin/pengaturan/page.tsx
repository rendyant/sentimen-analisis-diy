'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  RefreshCw,
  Play,
  Globe,
  MapPin,
  Share2,
  Cpu,
  KeyRound,
  Sliders,
  Sparkles,
  Activity,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  triggerScrape,
  fetchScrapeStatus,
  fetchAIRouterConfig,
  saveAIRouterConfig,
  testAIRouterConfig,
  classifyBatchAI,
  fetchClassifyStatus,
  triggerClassifyAllBackground,
  stopClassifyBackground,
  peekCache,
  clearApiCache,
  AIRouterConfig,
  ClassifyStatusResponse,
} from '@/lib/api';

export default function AdminPengaturan() {
  const [nama, setNama] = useState('Super Admin Pemda DIY');
  const [email, setEmail] = useState('admin@jogjaprov.go.id');
  const [instansi, setInstansi] = useState('Pemerintah Daerah Istimewa Yogyakarta');
  const [saved, setSaved] = useState(false);

  const cachedAi = peekCache<AIRouterConfig>('ai-config');

  // State Main Router AI Control Panel
  const [aiConfig, setAiConfig] = useState<AIRouterConfig>(
    cachedAi || {
      provider: 'Google Gemini AI',
      model: 'gemini-3.5-flash',
      classifier_model: 'gemini-3.5-flash-lite',
      classifier_fallback_models: [
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-flash-lite-latest',
        'gemini-3-flash-preview',
      ],
      classifier_batch_size: 50,
      classifier_allow_local_fallback: true,
      api_key_masked: '',
      has_api_key: false,
      classifier_api_key_masked: '',
      has_classifier_api_key: false,
      temperature: 0.3,
      thinking_level: 'MINIMAL',
      batch_limit: 25,
      auto_categorize: true,
      system_prompt: '',
      available_models: [
        { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash (Balanced Reasoning - Model Utama Kebijakan)' },
        { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro Preview (Deep Policy Analysis)' },
        { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash Preview (Fast Reasoning)' },
        { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite (Cepat & Hemat Kuota)' },
      ],
      available_mass_models: [
        { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite (Primary Mass Classifier)' },
        { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite (Cadangan Cepat #1)' },
        { id: 'gemini-flash-lite-latest', label: 'Gemini Flash Lite Latest (Cadangan #2)' },
        { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash Preview (Cadangan #3)' },
      ],
    }
  );
  const [newApiKey, setNewApiKey] = useState('');
  const [newClassifierApiKey, setNewClassifierApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiClassifying, setAiClassifying] = useState(false);
  const [aiNotice, setAiNotice] = useState<{ ok: boolean; text: string } | null>(null);

  // State Worker Klasifikasi Massal AI (Background)
  const [classifyStatus, setClassifyStatus] = useState<ClassifyStatusResponse | null>(null);

  // State Mesin Scraping
  const [scrapeStatus, setScrapeStatus] = useState<{ is_running: boolean; message: string }>({
    is_running: false,
    message: 'Idle',
  });
  const [scrapeNotice, setScrapeNotice] = useState('');

  async function loadClassifyStatus() {
    try {
      const st = await fetchClassifyStatus();
      setClassifyStatus(st);
    } catch {
      // ignore if offline
    }
  }

  async function loadStatus() {
    try {
      const s = await fetchScrapeStatus();
      setScrapeStatus(s);
    } catch {
      // ignore if offline
    }
  }

  async function loadAIConfig() {
    try {
      const cfg = await fetchAIRouterConfig(true);
      setAiConfig(cfg);
    } catch {
      // ignore if offline
    }
  }

  useEffect(() => {
    loadStatus();
    loadAIConfig();
    loadClassifyStatus();
  }, []);

  useEffect(() => {
    if (!classifyStatus?.is_running) return;
    const timer = setInterval(() => {
      loadClassifyStatus();
      clearApiCache();
    }, 3000);
    return () => clearInterval(timer);
  }, [classifyStatus?.is_running]);

  async function handleSaveAIRouter(e: React.FormEvent) {
    e.preventDefault();
    setAiSaving(true);
    setAiNotice(null);
    try {
      const res = await saveAIRouterConfig({
        provider: aiConfig.provider,
        model: aiConfig.model,
        classifier_model: aiConfig.classifier_model || 'gemini-3.5-flash-lite',
        classifier_batch_size: Number(aiConfig.classifier_batch_size || 50),
        classifier_allow_local_fallback: aiConfig.classifier_allow_local_fallback ?? true,
        api_key: newApiKey.trim() ? newApiKey.trim() : undefined,
        classifier_api_key: newClassifierApiKey.trim() ? newClassifierApiKey.trim() : undefined,
        temperature: Number(aiConfig.temperature),
        thinking_level: aiConfig.thinking_level,
        batch_limit: Number(aiConfig.batch_limit),
        auto_categorize: aiConfig.auto_categorize,
        system_prompt: aiConfig.system_prompt,
      });
      setAiConfig(res.config);
      setNewApiKey('');
      setNewClassifierApiKey('');
      setAiNotice({ ok: true, text: res.message });
    } catch {
      setAiNotice({ ok: false, text: 'Gagal menyimpan konfigurasi Main Router AI. Pastikan backend aktif.' });
    } finally {
      setAiSaving(false);
    }
  }

  async function handleClassifyBatch() {
    setAiClassifying(true);
    setAiNotice(null);
    try {
      const res = await classifyBatchAI({ limit: 250, only_unclassified: true });
      setAiNotice({ ok: true, text: res.message });
      await loadClassifyStatus();
    } catch {
      setAiNotice({ ok: false, text: 'Gagal menjalankan klasifikasi batch AI. Pastikan backend aktif.' });
    } finally {
      setAiClassifying(false);
    }
  }

  async function handleStartBackgroundClassify(limit = 0, upgradeFallbackOnly = false) {
    setAiNotice(null);
    try {
      const res = await triggerClassifyAllBackground({
        limit,
        force_reclassify: false,
        upgrade_fallback_only: upgradeFallbackOnly,
      });
      setAiNotice({ ok: true, text: res.message });
      await loadClassifyStatus();
    } catch (err: any) {
      setAiNotice({
        ok: false,
        text: err?.message || 'Gagal memulai klasifikasi massal AI. Pastikan API Key sudah disimpan.',
      });
    }
  }

  async function handleStopBackgroundClassify() {
    try {
      const res = await stopClassifyBackground();
      setAiNotice({ ok: true, text: res.message });
      await loadClassifyStatus();
    } catch {
      setAiNotice({ ok: false, text: 'Gagal menghentikan worker.' });
    }
  }

  async function handleTestAI() {
    setAiTesting(true);
    setAiNotice(null);
    try {
      const res = await testAIRouterConfig();
      setAiNotice({
        ok: true,
        text: `Koneksi Main Router AI Aktif! Model: ${res.model} | Waktu Respons: ${res.latency_ms} ms | Solusi Teruji: "${res.sample_output?.kategori_masalah || 'OK'}"`,
      });
    } catch (err: any) {
      setAiNotice({ ok: false, text: err?.message || 'Gagal menguji koneksi AI. Periksa API Key atau koneksi backend.' });
    } finally {
      setAiTesting(false);
    }
  }

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
    <div className="p-8 bg-gray-100 min-h-screen space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-red-900 mb-1">
          Main Router & Control Panel Super Admin
        </h1>
        <p className="text-sm text-gray-500">
          Pusat kendali penuh untuk mengatur API Key AI, pemilihan model (Main Router), prompt rekomendasi solusi OPD, serta mesin scraping 24 OPD DIY
        </p>
      </div>

      {/* PANEL UTAMA: MAIN ROUTER AI CONTROL PANEL */}
      <div className="bg-white rounded-xl p-6 border border-red-100 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-900 text-white flex items-center justify-center shadow-sm">
              <Cpu size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-gray-900 text-base">Main Router — Konfigurasi AI & API Control Panel</h2>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    aiConfig.has_api_key
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-amber-100 text-amber-700 border border-amber-200'
                  }`}
                >
                  {aiConfig.has_api_key ? 'API Key Terhubung' : 'Mode Fallback Lokal'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Ubah API Key, ganti model AI, atur kuota analisis kolektif (batch), dan sesuaikan instruksi rekomendasi OPD langsung dari website
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleClassifyBatch}
              disabled={aiClassifying}
              className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-3.5 py-2 rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer"
            >
              <Sparkles size={14} className={aiClassifying ? 'animate-spin' : ''} />
              {aiClassifying ? 'Mengklasifikasi (50/Batch)...' : 'Klasifikasi Sentimen & Bintang AI (50/Batch)'}
            </button>
            <button
              type="button"
              onClick={handleTestAI}
              disabled={aiTesting}
              className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-900 border border-red-200 px-3.5 py-2 rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer"
            >
              <Activity size={14} className={aiTesting ? 'animate-spin' : ''} />
              {aiTesting ? 'Menguji Router AI...' : 'Uji Koneksi Main Router'}
            </button>
          </div>
        </div>

        {aiNotice && (
          <div
            className={`mb-5 rounded-lg px-4 py-3 text-xs font-semibold flex items-center gap-2 border ${
              aiNotice.ok
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <CheckCircle2 size={15} className="shrink-0" />
            <span>{aiNotice.text}</span>
          </div>
        )}

        {/* PANEL PROGRES ANALISIS MASSAL MULTI-MODEL (TERPISAH DARI MODEL UTAMA) */}
        {classifyStatus && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-600" />
                  Pool Multi-Model Analisis Massal (Aktif: {classifyStatus.model})
                </h3>
                <p className="text-[11px] text-amber-900/80 mt-0.5">
                  Sudah Teranalisis: <b>{classifyStatus.ai_analyzed_count.toLocaleString('id-ID')}</b> dari{' '}
                  <b>{classifyStatus.total_reviews.toLocaleString('id-ID')}</b> ulasan
                  {' '}(Cloud AI: <b className="text-green-800">{(classifyStatus.cloud_ai_count ?? 0).toLocaleString('id-ID')}</b> • Fallback Lokal: <b>{(classifyStatus.fallback_count ?? 0).toLocaleString('id-ID')}</b>) •{' '}
                  Belum Dianalisis: <b className="text-red-800">{classifyStatus.unclassified_count.toLocaleString('id-ID')}</b>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {classifyStatus.is_running ? (
                  <button
                    type="button"
                    onClick={handleStopBackgroundClassify}
                    className="bg-red-700 hover:bg-red-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Hentikan Worker
                  </button>
                ) : (
                  <>
                    {(classifyStatus.fallback_count ?? 0) > 0 && (
                      <button
                        type="button"
                        onClick={() => handleStartBackgroundClassify(0, true)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                        title="Tingkatkan data yang sebelumnya terkena fallback lokal menjadi hasil Cloud Gemini"
                      >
                        Upgrade {(classifyStatus.fallback_count ?? 0).toLocaleString('id-ID')} Data Fallback ke Cloud AI
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleStartBackgroundClassify(1000)}
                      disabled={classifyStatus.unclassified_count === 0}
                      className="bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      Analisis 1.000 Data (20 Request)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartBackgroundClassify(0)}
                      disabled={classifyStatus.unclassified_count === 0}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      Analisis Semua Sisa ({classifyStatus.unclassified_count.toLocaleString('id-ID')} Ulasan)
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="w-full h-2 bg-amber-200/70 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-amber-600 transition-all duration-500"
                style={{
                  width: `${
                    classifyStatus.total_reviews > 0
                      ? Math.round((classifyStatus.ai_analyzed_count / classifyStatus.total_reviews) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-amber-900">
              <span>Status Worker: <b>{classifyStatus.message}</b></span>
              <span>
                {classifyStatus.total_reviews > 0
                  ? `${Math.round((classifyStatus.ai_analyzed_count / classifyStatus.total_reviews) * 100)}%`
                  : '0%'}
              </span>
            </div>

            {classifyStatus.model_breakdown && Object.keys(classifyStatus.model_breakdown).length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-amber-200/70 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase text-amber-900/70 mr-1">Distribusi Model:</span>
                {Object.entries(classifyStatus.model_breakdown).map(([mName, mCount]) => (
                  <span
                    key={mName}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      mName === 'local_smart_fallback'
                        ? 'bg-gray-100 text-gray-700 border-gray-300'
                        : 'bg-white text-amber-950 border-amber-300'
                    }`}
                  >
                    {mName}: <b>{mCount.toLocaleString('id-ID')}</b>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSaveAIRouter} className="space-y-5">
          {/* BAGIAN 1: MODEL UTAMA (KHUSUS FITUR UTAMA: SOLUSI & KEBIJAKAN OPD) */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <h4 className="text-xs font-bold text-red-900 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Sparkles size={13} /> 1. Model Utama — Khusus Fitur Utama (Solusi AI Satuan, Analisis Kolektif & Kebijakan OPD)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
                  <Cpu size={13} className="text-red-800" /> Provider AI Router
                </label>
                <select
                  value={aiConfig.provider}
                  onChange={(e) => setAiConfig({ ...aiConfig, provider: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-800 bg-white outline-none focus:border-red-800"
                >
                  <option value="Google Gemini AI">Google Gemini AI (Official Router)</option>
                  <option value="OpenRouter / Custom Gateway">OpenRouter / Multi-Model Gateway</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-1.5">
                  <Sparkles size={13} className="text-red-800" /> Model Utama (Fitur Kebijakan & Solusi)
                </label>
                <select
                  value={aiConfig.model}
                  onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-800 bg-white outline-none focus:border-red-800"
                >
                  {aiConfig.available_models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <KeyRound size={13} className="text-red-800" /> API Key Utama ({aiConfig.api_key_masked || 'Belum diisi'})
                  </span>
                </label>
                <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 bg-white focus-within:border-red-800">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    placeholder="Masukkan API Key utama..."
                    className="w-full text-xs outline-none text-gray-800 bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* BAGIAN 2: POOL MULTI-MODEL KHUSUS ANALISIS MASSAL & SCRAPING (TERPISAH) */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
            <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <Cpu size={13} className="text-amber-700" /> 2. Pool Multi-Model Khusus Analisis Massal & Scraping (Terpisah dari Model Utama)
            </h4>
            <p className="text-[11px] text-amber-900/80 mb-3">
              Rantai Failover Otomatis: <b>{aiConfig.classifier_model || 'gemini-3.5-flash-lite'}</b> → <b>gemini-3.1-flash-lite</b> → <b>gemini-flash-lite-latest</b> → <b>gemini-3-flash-preview</b> → <b>Smart Local Fallback</b> (agar tetap tuntas meski kuota model utama penuh).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                  Model Prioritas #1 untuk Analisis Massal
                </label>
                <select
                  value={aiConfig.classifier_model || 'gemini-3.5-flash-lite'}
                  onChange={(e) => setAiConfig({ ...aiConfig, classifier_model: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-800 bg-white outline-none focus:border-red-800"
                >
                  {(aiConfig.available_mass_models || aiConfig.available_models).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                  API Key Khusus Massal (Opsional • {aiConfig.classifier_api_key_masked || 'Ikut Key Utama'})
                </label>
                <input
                  type="password"
                  value={newClassifierApiKey}
                  onChange={(e) => setNewClassifierApiKey(e.target.value)}
                  placeholder="Kosongkan jika sama dengan API Key utama..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white outline-none focus:border-red-800"
                />
              </div>

              <label className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiConfig.classifier_allow_local_fallback ?? true}
                  onChange={(e) => setAiConfig({ ...aiConfig, classifier_allow_local_fallback: e.target.checked })}
                  className="w-4 h-4 accent-amber-600 cursor-pointer"
                />
                <span className="text-xs font-semibold text-gray-800">
                  Fallback Lokal jika seluruh model cloud limit (Jaminan 100% Selesai)
                </span>
              </label>
            </div>
          </div>

          {/* Baris Parameter Teknis AI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200/70">
            <div>
              <label className="text-xs font-semibold text-gray-700 flex items-center justify-between mb-1">
                <span className="flex items-center gap-1">
                  <Sliders size={12} className="text-red-800" /> Temperature (Kreativitas Solusi)
                </span>
                <span className="font-bold text-red-900">{aiConfig.temperature}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={aiConfig.temperature}
                onChange={(e) => setAiConfig({ ...aiConfig, temperature: parseFloat(e.target.value) })}
                className="w-full accent-red-900 cursor-pointer"
              />
              <p className="text-[11px] text-gray-500 mt-0.5">
                0.2 - 0.4 disarankan agar rekomendasi solusi OPD tetap fokus dan objektif.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Kecepatan Berpikir (Thinking Level)
              </label>
              <select
                value={aiConfig.thinking_level}
                onChange={(e) => setAiConfig({ ...aiConfig, thinking_level: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white outline-none focus:border-red-800"
              >
                <option value="MINIMAL">MINIMAL (Respons Instan ~1 Detik)</option>
                <option value="LOW">LOW (Cepat & Terstruktur)</option>
                <option value="MEDIUM">MEDIUM (Analisis Mendalam)</option>
              </select>
              <p className="text-[11px] text-gray-500 mt-1">
                Mengatur waktu berpikir AI saat merumuskan solusi OPD.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Batas Ulasan per Analisis Kolektif (Batch)
              </label>
              <input
                type="number"
                min={5}
                max={100}
                value={aiConfig.batch_limit}
                onChange={(e) => setAiConfig({ ...aiConfig, batch_limit: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white outline-none focus:border-red-800"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Jumlah ulasan negatif yang dikelompokkan sekaligus dalam 1x analisis kategori.
              </p>
            </div>
          </div>

          {/* System Prompt Editor */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">
              Instruksi Sistem AI (System Prompt Rekomendasi Solusi OPD)
            </label>
            <textarea
              rows={5}
              value={aiConfig.system_prompt}
              onChange={(e) => setAiConfig({ ...aiConfig, system_prompt: e.target.value })}
              className="w-full border border-gray-200 rounded-lg p-3 text-xs font-mono text-gray-800 outline-none focus:border-red-800"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={aiSaving}
              className="bg-red-900 hover:bg-red-950 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {aiSaving ? 'Menyimpan Konfigurasi...' : 'Simpan & Aktifkan Konfigurasi Main Router'}
            </button>
          </div>
        </form>
      </div>

      {/* BARIS BAWAH: PROFIL ADMIN & KONTROL SCRAPING */}
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
              className="bg-red-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-950 transition cursor-pointer"
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
              className="flex items-center gap-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 cursor-pointer"
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
              className="w-full flex items-center justify-between border border-gray-200 rounded-lg p-3.5 hover:border-red-800 hover:bg-red-50/30 transition disabled:opacity-60 cursor-pointer"
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
              className="w-full flex items-center justify-between border border-gray-200 rounded-lg p-3.5 hover:border-red-800 hover:bg-red-50/30 transition disabled:opacity-60 cursor-pointer"
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
              className="w-full flex items-center justify-between border border-gray-200 rounded-lg p-3.5 hover:border-red-800 hover:bg-red-50/30 transition disabled:opacity-60 cursor-pointer"
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
