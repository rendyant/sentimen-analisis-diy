from google import genai
from google.genai import types
import asyncio
import json
import re
from config import GEMINI_API_KEY

# Gunakan 1 instance Client global agar koneksi HTTP/TLS tetap terbuka (cepat)
_CLIENT = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

SYSTEM_PROMPT = """Kamu adalah Asisten AI Analis Kebijakan Publik untuk Pemerintah Daerah Istimewa Yogyakarta (Pemda DIY).

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


async def analyze_review(teks: str, instansi_nama: str, sumber: str) -> dict:
    if _CLIENT:
        try:
            prompt = f"""Instansi OPD: {instansi_nama}
Sumber Kanal: {sumber}
Isi Keluhan/Ulasan Warga:
\"\"\"{teks}\"\"\"

Berikan analisis masalah dan rekomendasi solusi untuk OPD tersebut dalam format JSON."""

            response = await asyncio.to_thread(
                _CLIENT.models.generate_content,
                model="gemini-3.5-flash-lite",
                contents=[SYSTEM_PROMPT, prompt],
                config=types.GenerateContentConfig(
                    thinking_config=types.ThinkingConfig(thinking_level="MINIMAL"),
                    temperature=0.3,
                    max_output_tokens=450,
                ),
            )

            text = response.text.strip()
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
            if match:
                text = match.group(1)

            return json.loads(text)
        except Exception as e:
            print(f"[INFO] Fallback analisis lokal: {e}")

    # Fallback cerdas jika jaringan terputus
    t_lower = teks.lower()
    is_neg = any(k in t_lower for k in ["lama", "lambat", "antre", "ribet", "error", "susah", "kecewa", "kurang", "mohon"])
    return {
        "masalah_utama": f"Optimalisasi layanan masyarakat pada {instansi_nama}",
        "kategori_masalah": "Kecepatan Layanan" if "antre" in t_lower or "lama" in t_lower else "Pelayanan Publik",
        "sentimen": "negatif" if is_neg else "netral",
        "prioritas": "Tinggi" if is_neg else "Sedang",
        "rekomendasi_solusi": [
            f"Evaluasi alur pelayanan dan waktu tunggu di {instansi_nama}",
            "Tingkatkan sosialisasi standar prosedur layanan secara digital",
            "Sediakan kanal pengaduan respons cepat bagi masyarakat",
        ],
        "rekomendasi_solusi_text": f"Lakukan evaluasi SOP pelayanan loket pada {instansi_nama}, tambah petugas pada jam sibuk, serta optimalkan antrean dan informasi berbasis digital.",
        "pihak_yang_bertanggung_jawab": f"Bidang Pelayanan Publik {instansi_nama}",
        "estimasi_penanganan": "1-2 minggu",
    }
