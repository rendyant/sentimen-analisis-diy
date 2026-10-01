from google import genai
from google.genai import types
import json
import re
from config import GEMINI_API_KEY

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
    if not GEMINI_API_KEY:
        return {
            "error": "GEMINI_API_KEY belum dikonfigurasi di file .env",
            "masalah_utama": "Tidak dapat dianalisis",
            "kategori_masalah": "-",
            "sentimen": "netral",
            "prioritas": "Rendah",
            "rekomendasi_solusi": ["Isi GEMINI_API_KEY di file backend/.env"],
            "rekomendasi_solusi_text": "Silakan isi GEMINI_API_KEY terlebih dahulu.",
            "pihak_yang_bertanggung_jawab": "-",
            "estimasi_penanganan": "-",
        }

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)

        prompt = f"""Instansi: {instansi_nama}
Sumber: {sumber}
Konten:
\"\"\"{teks}\"\"\"

Analisis dan berikan respons JSON sesuai format."""

        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=[SYSTEM_PROMPT, prompt],
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=1024,
            ),
        )

        text = response.text.strip()

        # Hapus markdown code block jika ada
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if match:
            text = match.group(1)

        return json.loads(text)

    except json.JSONDecodeError:
        return {
            "masalah_utama": "Gagal parse respons AI",
            "kategori_masalah": "-",
            "sentimen": "netral",
            "prioritas": "Sedang",
            "rekomendasi_solusi": ["Error parsing response dari AI"],
            "rekomendasi_solusi_text": "Terjadi error saat parsing respons AI.",
            "pihak_yang_bertanggung_jawab": "-",
            "estimasi_penanganan": "-",
        }
    except Exception as e:
        return {
            "error": str(e),
            "masalah_utama": "Error saat analisis",
            "kategori_masalah": "-",
            "sentimen": "netral",
            "prioritas": "Rendah",
            "rekomendasi_solusi": [f"Error: {str(e)}"],
            "rekomendasi_solusi_text": f"Terjadi error: {str(e)}",
            "pihak_yang_bertanggung_jawab": "-",
            "estimasi_penanganan": "-",
        }