from google import genai
from google.genai import types
import asyncio
import json
import os
import re
from config import GEMINI_API_KEY

CONFIG_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ai_router_config.json")

DEFAULT_SYSTEM_PROMPT = """Kamu adalah Asisten AI Analis Kebijakan Publik untuk Pemerintah Daerah Istimewa Yogyakarta (Pemda DIY).

Analisis ulasan/keluhan masyarakat berikut dan berikan rekomendasi solusi konkret untuk OPD terkait.
Berikan respons HANYA dalam format JSON berikut (tanpa teks lain):
{
  "masalah_utama": "ringkasan inti masalah layanan pada OPD dalam 1 kalimat singkat",
  "kategori_masalah": "Kecepatan Layanan / Pelayanan Loket / Infrastruktur / Sistem Digital / Keterbukaan Informasi / Administrasi",
  "sentimen": "positif / negatif / netral",
  "prioritas": "Tinggi / Sedang / Rendah",
  "rekomendasi_solusi": ["langkah solusi 1", "langkah solusi 2", "langkah solusi 3"],
  "rekomendasi_solusi_text": "rekomendasi tindakan dan solusi konkret bagi OPD dalam 1-2 kalimat padat",
  "pihak_yang_bertanggung_jawab": "bidang/unit OPD yang perlu menangani",
  "estimasi_penanganan": "misal: 1-2 minggu / 1 bulan"
}"""

AI_ROUTER_CONFIG = {
    "provider": "Google Gemini AI",
    "model": "gemini-3.5-flash-lite",
    "api_key": GEMINI_API_KEY or "",
    "temperature": 0.3,
    "thinking_level": "MINIMAL",
    "batch_limit": 25,
    "auto_categorize": True,
    "system_prompt": DEFAULT_SYSTEM_PROMPT,
}


def load_ai_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
                for k, v in saved.items():
                    if k in AI_ROUTER_CONFIG and v is not None:
                        if k == "api_key" and not v:
                            continue
                        AI_ROUTER_CONFIG[k] = v
        except Exception as e:
            print(f"[INFO] Gagal memuat ai_router_config.json: {e}")


def save_ai_config():
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(AI_ROUTER_CONFIG, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[INFO] Gagal menyimpan ai_router_config.json: {e}")


load_ai_config()

_CLIENT = genai.Client(api_key=AI_ROUTER_CONFIG["api_key"]) if AI_ROUTER_CONFIG["api_key"] else None


def get_ai_client():
    global _CLIENT
    if _CLIENT is None and AI_ROUTER_CONFIG.get("api_key"):
        _CLIENT = genai.Client(api_key=AI_ROUTER_CONFIG["api_key"])
    return _CLIENT


def update_ai_router_config(new_data: dict) -> dict:
    global _CLIENT
    if "api_key" in new_data and new_data["api_key"] and not new_data["api_key"].startswith("••••"):
        AI_ROUTER_CONFIG["api_key"] = new_data["api_key"].strip()
        _CLIENT = genai.Client(api_key=AI_ROUTER_CONFIG["api_key"])

    for key in ["provider", "model", "temperature", "thinking_level", "batch_limit", "auto_categorize", "system_prompt"]:
        if key in new_data and new_data[key] is not None:
            AI_ROUTER_CONFIG[key] = new_data[key]

    save_ai_config()
    return get_public_ai_config()


def get_public_ai_config() -> dict:
    raw_key = AI_ROUTER_CONFIG.get("api_key") or ""
    masked_key = f"••••••••••••{raw_key[-6:]}" if len(raw_key) > 6 else ("••••••" if raw_key else "")
    return {
        "provider": AI_ROUTER_CONFIG["provider"],
        "model": AI_ROUTER_CONFIG["model"],
        "api_key_masked": masked_key,
        "has_api_key": bool(raw_key),
        "temperature": AI_ROUTER_CONFIG["temperature"],
        "thinking_level": AI_ROUTER_CONFIG["thinking_level"],
        "batch_limit": AI_ROUTER_CONFIG["batch_limit"],
        "auto_categorize": AI_ROUTER_CONFIG["auto_categorize"],
        "system_prompt": AI_ROUTER_CONFIG["system_prompt"],
        "available_models": [
            {"id": "gemini-3.5-flash-lite", "label": "Gemini 3.5 Flash Lite (Cepat & Hemat Kuota - Recommended)"},
            {"id": "gemini-2.5-flash", "label": "Gemini 2.5 Flash (Balanced Reasoning)"},
            {"id": "gemini-2.5-pro", "label": "Gemini 2.5 Pro (Deep Policy Analysis)"},
        ],
    }


def classify_complaint_category(teks: str) -> str:
    """Mengelompokkan ulasan secara instan ke dalam kategori masalah sebelum dianalisis bareng-bareng oleh AI."""
    t = (teks or "").lower()
    if any(k in t for k in ["antre", "lama", "lambat", "nunggu", "jam", "lelet", "waktu tunggu"]):
        return "Kecepatan Layanan & Antrean"
    if any(k in t for k in ["web", "aplikasi", "error", "down", "online", "sistem", "server", "login", "link"]):
        return "Sistem & Aplikasi Digital"
    if any(k in t for k in ["syarat", "info", "jadwal", "berkas", "dokumen", "prosedur", "sosialisasi", "bingung", "tidak jelas"]):
        return "Kejelasan Informasi & Prosedur"
    if any(k in t for k in ["petugas", "ramah", "jutek", "kasar", "sikap", "pelayanan loket", "pegawai", "admin"]):
        return "Sikap Petugas & Pelayanan Loket"
    if any(k in t for k in ["parkir", "ruang", "fasilitas", "kursi", "toilet", "gedung", "halte", "panas"]):
        return "Fasilitas & Sarana Publik"
    return "Pelayanan Publik Umum"


async def analyze_review(teks: str, instansi_nama: str, sumber: str) -> dict:
    client = get_ai_client()
    if client:
        try:
            prompt = f"""Instansi OPD: {instansi_nama}
Sumber Kanal: {sumber}
Isi Keluhan/Ulasan Warga:
\"\"\"{teks}\"\"\"

Berikan analisis masalah dan rekomendasi solusi untuk OPD tersebut dalam format JSON."""

            cfg_kwargs = {
                "temperature": float(AI_ROUTER_CONFIG.get("temperature", 0.3)),
                "max_output_tokens": 450,
            }
            if "3.5" in AI_ROUTER_CONFIG["model"] or "2.5" in AI_ROUTER_CONFIG["model"]:
                cfg_kwargs["thinking_config"] = types.ThinkingConfig(
                    thinking_level=AI_ROUTER_CONFIG.get("thinking_level", "MINIMAL")
                )

            response = await asyncio.to_thread(
                client.models.generate_content,
                model=AI_ROUTER_CONFIG["model"],
                contents=[AI_ROUTER_CONFIG["system_prompt"], prompt],
                config=types.GenerateContentConfig(**cfg_kwargs),
            )

            text = response.text.strip()
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
            if match:
                text = match.group(1)

            return json.loads(text)
        except Exception as e:
            print(f"[INFO] Fallback analisis lokal: {e}")

    t_lower = teks.lower()
    is_neg = any(k in t_lower for k in ["lama", "lambat", "antre", "ribet", "error", "susah", "kecewa", "kurang", "mohon"])
    kat = classify_complaint_category(teks)
    return {
        "masalah_utama": f"Keluhan {kat.lower()} pada {instansi_nama}",
        "kategori_masalah": kat,
        "sentimen": "negatif" if is_neg else "netral",
        "prioritas": "Tinggi" if is_neg else "Sedang",
        "rekomendasi_solusi": [
            f"Evaluasi alur pelayanan dan waktu tunggu di {instansi_nama}",
            "Tingkatkan sosialisasi standar prosedur layanan secara digital",
            "Sediakan kanal pengaduan respons cepat bagi masyarakat",
        ],
        "rekomendasi_solusi_text": f"Lakukan evaluasi SOP pada aspek {kat} di {instansi_nama}, tambah petugas pada jam sibuk, serta optimalkan antrean dan informasi berbasis digital.",
        "pihak_yang_bertanggung_jawab": f"Bidang Pelayanan Publik {instansi_nama}",
        "estimasi_penanganan": "1-2 minggu",
    }


async def analyze_grouped_reviews_batch(
    instansi_nama: str,
    kategori: str,
    reviews_texts: list[str],
) -> dict:
    """
    Menganalisis sekumpulan ulasan negatif/keluhan yang sudah dikategorikan menjadi satu
    sekaligus dalam 1 kali panggilan AI (Batch Analysis per Kategori/OPD).
    """
    joined_reviews = "\n".join([f"{idx + 1}. \"{t}\"" for idx, t in enumerate(reviews_texts[:15])])
    client = get_ai_client()

    if client and reviews_texts:
        try:
            batch_prompt = f"""Instansi OPD: {instansi_nama}
Kategori Keluhan: {kategori}
Total Ulasan Keluhan dalam Kategori Ini: {len(reviews_texts)} ulasan
Daftar Kumpulan Ulasan Negatif/Keluhan Masyarakat:
{joined_reviews}

Analisis seluruh kumpulan keluhan di atas secara kolektif (gabungan), simpulkan akar masalah utamanya, dan berikan 1 rekomendasi solusi kebijakan terpadu untuk {instansi_nama} dalam format JSON."""

            cfg_kwargs = {
                "temperature": float(AI_ROUTER_CONFIG.get("temperature", 0.3)),
                "max_output_tokens": 500,
            }
            if "3.5" in AI_ROUTER_CONFIG["model"] or "2.5" in AI_ROUTER_CONFIG["model"]:
                cfg_kwargs["thinking_config"] = types.ThinkingConfig(
                    thinking_level=AI_ROUTER_CONFIG.get("thinking_level", "MINIMAL")
                )

            response = await asyncio.to_thread(
                client.models.generate_content,
                model=AI_ROUTER_CONFIG["model"],
                contents=[AI_ROUTER_CONFIG["system_prompt"], batch_prompt],
                config=types.GenerateContentConfig(**cfg_kwargs),
            )

            text = response.text.strip()
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
            if match:
                text = match.group(1)

            parsed = json.loads(text)
            parsed["kategori_masalah"] = parsed.get("kategori_masalah") or kategori
            return parsed
        except Exception as e:
            print(f"[INFO] Fallback batch analisis lokal ({instansi_nama} - {kategori}): {e}")

    # Fallback cerdas jika kuota/jaringan terbatas
    solusi_map = {
        "Kecepatan Layanan & Antrean": f"Terapkan sistem booking antrean online pada {instansi_nama}, tambah loket pelayanan pada jam sibuk (08.00-11.00), dan tetapkan SLA waktu tunggu maksimal 15 menit.",
        "Sistem & Aplikasi Digital": f"Lakukan optimasi kapasitas server aplikasi/portal {instansi_nama}, perbaiki bug form pendaftaran, dan sediakan panduan troubleshooting bagi warga.",
        "Kejelasan Informasi & Prosedur": f"Publikasikan checklist persyaratan berkas dan jadwal layanan secara transparan di website, media sosial resmi, dan papan informasi loket {instansi_nama}.",
        "Sikap Petugas & Pelayanan Loket": f"Lakukan briefing peningkatan standar keramahan (hospitality) petugas front-office {instansi_nama} dan sediakan evaluasi kepuasan langsung di loket.",
        "Fasilitas & Sarana Publik": f"Perbaiki kenyamanan ruang tunggu, kapasitas parkir, serta fasilitas ramah lansia/difabel di lingkungan kantor {instansi_nama}.",
    }
    return {
        "masalah_utama": f"Akumulasi {len(reviews_texts)} keluhan masyarakat terkait {kategori} di {instansi_nama}",
        "kategori_masalah": kategori,
        "prioritas": "Tinggi" if len(reviews_texts) >= 2 else "Sedang",
        "rekomendasi_solusi_text": solusi_map.get(
            kategori,
            f"Evaluasi menyeluruh terhadap {len(reviews_texts)} laporan masyarakat pada aspek {kategori} di {instansi_nama} dan percepat tindak lanjut pengaduan.",
        ),
    }
