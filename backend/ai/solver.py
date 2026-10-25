from google import genai
from google.genai import types
import asyncio
import json
import re
from config import GEMINI_API_KEY, OPDS

# Gunakan 1 instance Client global agar koneksi HTTP/TLS tetap terbuka (jauh lebih cepat)
_CLIENT = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

SYSTEM_PROMPT = """Kamu adalah analis kebijakan publik senior untuk instansi pemerintah Daerah Istimewa Yogyakarta.

Analisis ulasan/berita yang diberikan dan berikan respons HANYA dalam format JSON berikut (tanpa teks lain):
{
  "masalah_utama": "ringkasan masalah dalam 1 kalimat",
  "kategori_masalah": "Pelayanan Publik / Infrastruktur / Administrasi / SDM / Kebijakan / Lainnya",
  "sentimen": "positif / negatif / netral",
  "prioritas": "Tinggi / Sedang / Rendah",
  "rekomendasi_solusi": ["solusi 1", "solusi 2", "solusi 3"],
  "rekomendasi_solusi_text": "penjelasan solusi dalam satu paragraf",
  "pihak_yang_bertanggung_jawab": "bidang/unit yang perlu menangani",
  "estimasi_penanganan": "misal: 1-2 minggu / 1-3 bulan"
}"""


async def analyze_review(teks: str, instansi_nama: str, sumber: str) -> dict:
    if not _CLIENT:
        return {
            "masalah_utama": "Evaluasi kualitas dan kecepatan pelayanan publik",
            "kategori_masalah": "Pelayanan Publik",
            "sentimen": "netral",
            "prioritas": "Sedang",
            "rekomendasi_solusi": [
                "Optimalkan waktu tanggap petugas pelayanan loket",
                "Sediakan informasi prosedur secara jelas dan transparan",
            ],
            "rekomendasi_solusi_text": "Perlu peningkatan kecepatan layanan dan kejelasan informasi prosedur bagi masyarakat.",
            "pihak_yang_bertanggung_jawab": "Bidang Pelayanan Publik",
            "estimasi_penanganan": "1-2 minggu",
        }

    try:
        prompt = f"""Instansi: {instansi_nama}
Sumber: {sumber}
Konten:
\"\"\"{teks}\"\"\"

Analisis dan berikan respons JSON sesuai format."""

        response = await asyncio.to_thread(
            _CLIENT.models.generate_content,
            model="gemini-3.5-flash-lite",
            contents=[SYSTEM_PROMPT, prompt],
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_level="MINIMAL"),
                temperature=0.3,
                max_output_tokens=600,
            ),
        )

        text = response.text.strip()
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if match:
            text = match.group(1)

        return json.loads(text)
    except Exception as e:
        return {
            "error": str(e),
            "masalah_utama": "Perlu evaluasi layanan berkala",
            "kategori_masalah": "Pelayanan Publik",
            "sentimen": "netral",
            "prioritas": "Sedang",
            "rekomendasi_solusi": ["Tingkatkan kecepatan respon petugas loket", "Optimalisasi antrean digital"],
            "rekomendasi_solusi_text": "Evaluasi alur pelayanan untuk mempercepat waktu tunggu masyarakat.",
            "pihak_yang_bertanggung_jawab": "Bidang Pelayanan Publik",
            "estimasi_penanganan": "1-2 minggu",
        }


def build_compact_context(stats: list[dict], reviews: list[dict]) -> str:
    """Ringkas data database menjadi teks padat agar proses berpikir AI sangat cepat."""
    stat_lines = [
        f"- {s['instansi_nama']} ({s['instansi_id']}): total={s['total']}, positif={s['positif']}, netral={s['netral']}, negatif={s['negatif']}, rating={s['avg_rating']}"
        for s in stats
    ]
    rev_lines = [
        f"- [{r['instansi_nama']} | {r['sumber']} | {r['sentimen']}] {r['penulis']}: \"{r['teks']}\""
        + (f" (Solusi: {r['solusi_ai']})" if r.get("solusi_ai") else "")
        for r in reviews[:12]
    ]
    return (
        "DATA STATISTIK OPD DIY:\n"
        + ("\n".join(stat_lines) if stat_lines else "Belum ada statistik.")
        + "\n\nULASAN WARGA TERBARU:\n"
        + ("\n".join(rev_lines) if rev_lines else "Belum ada ulasan.")
    )


async def chat_with_data(
    message: str,
    stats: list[dict],
    reviews: list[dict],
    history: list[dict] | None = None,
    opd_filter: str | None = None,
) -> dict:
    """Jawab pertanyaan secara natural menggunakan Gemini 3.5 Flash Lite dengan thinking_level='MINIMAL'."""
    if _CLIENT:
        try:
            compact_context = build_compact_context(stats, reviews)
            history_str = ""
            if history:
                for h in history[-4:]:
                    role_label = "User" if h.get("role") == "user" else "Asisten"
                    history_str += f"{role_label}: {h.get('content', '')}\n"

            opd_line = f"Konteks filter OPD aktif: {opd_filter}\n" if opd_filter else ""
            hist_block = f"Riwayat obrolan:\n{history_str}\n" if history_str else ""

            prompt = f"""Kamu adalah Asisten AI pintar dan ramah untuk Sistem Analisis Sentimen Pelayanan Publik Pemerintah Daerah Istimewa Yogyakarta (Pemda DIY).
- Jawablah secara natural seperti manusia/AI cerdas pada umumnya, hangat, dan bebas (bukan template kaku).
- Buat jawaban yang padat dan langsung ke inti (cukup 1-2 paragraf singkat atau 3-4 poin penting) agar mudah dan cepat dibaca.
- Jika pengguna bertanya tentang data OPD, keluhan warga, atau rating, kaitkan dengan data database di bawah ini. Jika bertanya hal umum/strategi/obrolan biasa, jawab dengan luwes sesuai konteks pertanyaan.

{compact_context}

{opd_line}{hist_block}User: {message}"""

            response = await asyncio.to_thread(
                _CLIENT.models.generate_content,
                model="gemini-3.5-flash-lite",
                contents=prompt,
                config=types.GenerateContentConfig(
                    thinking_config=types.ThinkingConfig(thinking_level="MINIMAL"),
                    temperature=0.5,
                    max_output_tokens=350,
                ),
            )
            if response and response.text:
                return {
                    "reply": response.text.strip(),
                    "source": "gemini-3.5-flash-lite",
                }
        except Exception as e:
            print(f"[INFO] Gemini API error: {e}")

    return {
        "reply": "Maaf, koneksi ke server AI sedang mengalami gangguan. Silakan coba sesaat lagi.",
        "source": "error-fallback",
    }