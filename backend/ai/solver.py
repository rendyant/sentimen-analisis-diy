from google import genai
from google.genai import types
import asyncio
import json
import os
import re
from config import GEMINI_API_KEY

CONFIG_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ai_router_config.json")

DEFAULT_SYSTEM_PROMPT = """Kamu adalah Asisten AI Analis Kebijakan Publik untuk Pemerintah Daerah Istimewa Yogyakarta (Pemda DIY).

Analisis ulasan/keluhan masyarakat berikut, tentukan sentimen (positif/negatif/netral), skor rating kepuasan (bintang 1.0 sampai 5.0), serta rekomendasi solusi konkret untuk OPD terkait.
Berikan respons HANYA dalam format JSON berikut (tanpa teks lain):
{
  "masalah_utama": "ringkasan inti masalah layanan pada OPD dalam 1 kalimat singkat",
  "kategori_masalah": "Kecepatan Layanan & Antrean / Sikap Petugas & Pelayanan Loket / Fasilitas & Sarana Publik / Sistem & Aplikasi Digital / Kejelasan Informasi & Prosedur / Program & Kebijakan Publik",
  "sentimen": "positif / negatif / netral",
  "rating": 4.0,
  "prioritas": "Tinggi / Sedang / Rendah",
  "rekomendasi_solusi": ["langkah solusi 1", "langkah solusi 2", "langkah solusi 3"],
  "rekomendasi_solusi_text": "rekomendasi tindakan dan solusi konkret bagi OPD dalam 1-2 kalimat padat",
  "pihak_yang_bertanggung_jawab": "bidang/unit OPD yang perlu menangani",
  "estimasi_penanganan": "misal: 1-2 minggu / 1 bulan"
}"""

# Pool Model Terpisah Khusus Analisis Massal (tidak mengganggu kuota Model Utama)
DEFAULT_MASS_FALLBACK_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3-flash-preview",
]


def _is_valid_api_key(key: str | None) -> bool:
    if not key:
        return False
    k = key.strip()
    return len(k) > 15 and not k.startswith("isi_nanti") and not k.startswith("your_")


AI_ROUTER_CONFIG = {
    "provider": "Google Gemini AI",
    # Model Utama (khusus fitur utama: Solusi AI Satuan, Analisis Kolektif, Kebijakan OPD)
    "model": "gemini-3.5-flash",
    # Pool Multi-Model Khusus Analisis Massal & Scraping (terpisah dari Model Utama)
    "classifier_model": "gemini-3.5-flash-lite",
    "classifier_fallback_models": list(DEFAULT_MASS_FALLBACK_MODELS),
    "classifier_batch_size": 50,
    "classifier_allow_local_fallback": True,
    "api_key": GEMINI_API_KEY if _is_valid_api_key(GEMINI_API_KEY) else "",
    "classifier_api_key": "",
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
                        if k in ("api_key", "classifier_api_key") and not v:
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

_CLIENT = genai.Client(api_key=AI_ROUTER_CONFIG["api_key"]) if _is_valid_api_key(AI_ROUTER_CONFIG.get("api_key")) else None
_CLASSIFIER_CLIENT = (
    genai.Client(api_key=AI_ROUTER_CONFIG["classifier_api_key"])
    if _is_valid_api_key(AI_ROUTER_CONFIG.get("classifier_api_key"))
    else None
)


def _reload_env_key_if_needed():
    if not _is_valid_api_key(AI_ROUTER_CONFIG.get("api_key")):
        try:
            from dotenv import load_dotenv
            env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
            load_dotenv(env_path, override=True)
            env_key = os.getenv("GEMINI_API_KEY", "")
            if _is_valid_api_key(env_key):
                AI_ROUTER_CONFIG["api_key"] = env_key.strip()
        except Exception:
            pass


def get_ai_client():
    """Client untuk Model Utama (Solusi AI, Analisis Kolektif, Rekomendasi Kebijakan)."""
    global _CLIENT
    _reload_env_key_if_needed()
    key = AI_ROUTER_CONFIG.get("api_key")
    if _CLIENT is None and _is_valid_api_key(key):
        _CLIENT = genai.Client(api_key=key)
    return _CLIENT


def get_classifier_client():
    """Client terpisah untuk Analisis Massal (memakai classifier_api_key jika diisi, atau api_key utama)."""
    global _CLASSIFIER_CLIENT
    ckey = AI_ROUTER_CONFIG.get("classifier_api_key")
    if _is_valid_api_key(ckey):
        if _CLASSIFIER_CLIENT is None:
            _CLASSIFIER_CLIENT = genai.Client(api_key=ckey)
        return _CLASSIFIER_CLIENT
    return get_ai_client()


def get_mass_classifier_models() -> list[str]:
    """Mengembalikan urutan multi-model khusus analisis massal (terpisah dari model utama)."""
    primary = AI_ROUTER_CONFIG.get("classifier_model") or "gemini-3.5-flash-lite"
    extras = AI_ROUTER_CONFIG.get("classifier_fallback_models") or DEFAULT_MASS_FALLBACK_MODELS
    ordered = []
    for m in [primary, *extras, *DEFAULT_MASS_FALLBACK_MODELS]:
        if m and m not in ordered:
            ordered.append(m)
    return ordered


def _get_main_feature_models() -> list[str]:
    """Urutan model utama untuk fitur kebijakan (jika model utama 503 overload, failover aman)."""
    primary = AI_ROUTER_CONFIG.get("model") or "gemini-3.5-flash"
    fallbacks = [primary, "gemini-3.5-flash", "gemini-3-flash-preview", "gemini-3.5-flash-lite"]
    ordered = []
    for m in fallbacks:
        if m and m not in ordered:
            ordered.append(m)
    return ordered


def update_ai_router_config(new_data: dict) -> dict:
    global _CLIENT, _CLASSIFIER_CLIENT
    if "api_key" in new_data and new_data["api_key"] and not new_data["api_key"].startswith("••••"):
        cleaned_key = new_data["api_key"].strip()
        AI_ROUTER_CONFIG["api_key"] = cleaned_key
        _CLIENT = genai.Client(api_key=cleaned_key) if _is_valid_api_key(cleaned_key) else None

    if "classifier_api_key" in new_data and not str(new_data["classifier_api_key"]).startswith("••••"):
        cleaned_ckey = str(new_data["classifier_api_key"]).strip()
        AI_ROUTER_CONFIG["classifier_api_key"] = cleaned_ckey
        _CLASSIFIER_CLIENT = genai.Client(api_key=cleaned_ckey) if _is_valid_api_key(cleaned_ckey) else None

    for key in [
        "provider",
        "model",
        "classifier_model",
        "classifier_fallback_models",
        "classifier_batch_size",
        "classifier_allow_local_fallback",
        "temperature",
        "thinking_level",
        "batch_limit",
        "auto_categorize",
        "system_prompt",
    ]:
        if key in new_data and new_data[key] is not None:
            AI_ROUTER_CONFIG[key] = new_data[key]

    save_ai_config()
    return get_public_ai_config()


def _mask_key(raw: str | None) -> tuple[bool, str]:
    has_valid = _is_valid_api_key(raw)
    if not has_valid or not raw:
        return False, ""
    masked = f"••••••••••••{raw[-6:]}" if len(raw) > 6 else "••••••"
    return True, masked


def get_public_ai_config() -> dict:
    has_valid, masked_key = _mask_key(AI_ROUTER_CONFIG.get("api_key"))
    has_cvalid, masked_ckey = _mask_key(AI_ROUTER_CONFIG.get("classifier_api_key"))
    return {
        "provider": AI_ROUTER_CONFIG["provider"],
        "model": AI_ROUTER_CONFIG["model"],
        "classifier_model": AI_ROUTER_CONFIG.get("classifier_model", "gemini-3.5-flash-lite"),
        "classifier_fallback_models": get_mass_classifier_models(),
        "classifier_batch_size": int(AI_ROUTER_CONFIG.get("classifier_batch_size", 50)),
        "classifier_allow_local_fallback": bool(AI_ROUTER_CONFIG.get("classifier_allow_local_fallback", True)),
        "api_key_masked": masked_key,
        "has_api_key": has_valid,
        "classifier_api_key_masked": masked_ckey,
        "has_classifier_api_key": has_cvalid,
        "temperature": AI_ROUTER_CONFIG["temperature"],
        "thinking_level": AI_ROUTER_CONFIG["thinking_level"],
        "batch_limit": AI_ROUTER_CONFIG["batch_limit"],
        "auto_categorize": AI_ROUTER_CONFIG["auto_categorize"],
        "system_prompt": AI_ROUTER_CONFIG["system_prompt"],
        "available_models": [
            {"id": "gemini-3.5-flash", "label": "Gemini 3.5 Flash (Balanced Reasoning - Model Utama Kebijakan)"},
            {"id": "gemini-3.1-pro-preview", "label": "Gemini 3.1 Pro Preview (Deep Policy Analysis)"},
            {"id": "gemini-3-flash-preview", "label": "Gemini 3 Flash Preview (Fast Reasoning)"},
            {"id": "gemini-3.5-flash-lite", "label": "Gemini 3.5 Flash Lite (Cepat & Hemat Kuota)"},
        ],
        "available_mass_models": [
            {"id": "gemini-3.5-flash-lite", "label": "Gemini 3.5 Flash Lite (Primary Mass Classifier)"},
            {"id": "gemini-3.1-flash-lite", "label": "Gemini 3.1 Flash Lite (Cadangan Cepat #1)"},
            {"id": "gemini-flash-lite-latest", "label": "Gemini Flash Lite Latest (Cadangan #2)"},
            {"id": "gemini-3-flash-preview", "label": "Gemini 3 Flash Preview (Cadangan #3)"},
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


def _extract_json_text(raw: str) -> str:
    text = (raw or "").strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        return match.group(1)
    return text


async def analyze_review(teks: str, instansi_nama: str, sumber: str) -> dict:
    """Model Utama: Analisis mendalam per-ulasan untuk Solusi AI & Kebijakan."""
    client = get_ai_client()
    if client:
        prompt = f"""Instansi OPD: {instansi_nama}
Sumber Kanal: {sumber}
Isi Keluhan/Ulasan Warga:
\"\"\"{teks}\"\"\"

Berikan analisis masalah dan rekomendasi solusi untuk OPD tersebut dalam format JSON."""

        cfg = types.GenerateContentConfig(
            temperature=float(AI_ROUTER_CONFIG.get("temperature", 0.3)),
            max_output_tokens=600,
            response_mime_type="application/json",
        )

        for model_name in _get_main_feature_models():
            try:
                response = await asyncio.to_thread(
                    client.models.generate_content,
                    model=model_name,
                    contents=[AI_ROUTER_CONFIG["system_prompt"], prompt],
                    config=cfg,
                )
                parsed = json.loads(_extract_json_text(response.text))
                sent = str(parsed.get("sentimen", "netral")).strip().lower()
                if sent not in ("positif", "negatif", "netral"):
                    sent = "netral"
                parsed["sentimen"] = sent

                try:
                    rat = round(max(1.0, min(5.0, float(parsed.get("rating")))), 1)
                except (TypeError, ValueError):
                    rat = 4.5 if sent == "positif" else (1.8 if sent == "negatif" else 3.2)
                parsed["rating"] = rat
                parsed["_used_real_ai"] = True
                parsed["_model_used"] = model_name
                return parsed
            except Exception as e:
                print(f"[INFO] Main model {model_name} fallback ke model berikutnya: {e}")

    from scrapers.utils import analyze_review_fields

    sent, rat, kat, prio, msl, sol = analyze_review_fields(teks, instansi_nama)
    return {
        "_used_real_ai": False,
        "_model_used": "local_smart_fallback",
        "masalah_utama": msl,
        "kategori_masalah": kat,
        "sentimen": sent,
        "rating": rat,
        "prioritas": prio,
        "rekomendasi_solusi": [
            f"Evaluasi alur pelayanan pada aspek {kat} di {instansi_nama}",
            sol,
            "Lakukan monitoring berkala tindak lanjut pengaduan masyarakat",
        ],
        "rekomendasi_solusi_text": sol,
        "pihak_yang_bertanggung_jawab": f"Bidang Pelayanan Publik {instansi_nama}",
        "estimasi_penanganan": "1-2 minggu",
    }


async def analyze_grouped_reviews_batch(
    instansi_nama: str,
    kategori: str,
    reviews_texts: list[str],
) -> dict:
    """
    Model Utama: Menganalisis sekumpulan ulasan negatif/keluhan yang sudah dikategorikan
    menjadi satu sekaligus (Batch Analysis per Kategori/OPD).
    """
    joined_reviews = "\n".join([f"{idx + 1}. \"{t}\"" for idx, t in enumerate(reviews_texts[:15])])
    client = get_ai_client()

    if client and reviews_texts:
        batch_prompt = f"""Instansi OPD: {instansi_nama}
Kategori Keluhan: {kategori}
Total Ulasan Keluhan dalam Kategori Ini: {len(reviews_texts)} ulasan
Daftar Kumpulan Ulasan Negatif/Keluhan Masyarakat:
{joined_reviews}

Analisis seluruh kumpulan keluhan di atas secara kolektif (gabungan), simpulkan akar masalah utamanya, dan berikan 1 rekomendasi solusi kebijakan terpadu untuk {instansi_nama} dalam format JSON."""

        cfg = types.GenerateContentConfig(
            temperature=float(AI_ROUTER_CONFIG.get("temperature", 0.3)),
            max_output_tokens=700,
            response_mime_type="application/json",
        )

        for model_name in _get_main_feature_models():
            try:
                response = await asyncio.to_thread(
                    client.models.generate_content,
                    model=model_name,
                    contents=[AI_ROUTER_CONFIG["system_prompt"], batch_prompt],
                    config=cfg,
                )
                parsed = json.loads(_extract_json_text(response.text))
                parsed["kategori_masalah"] = parsed.get("kategori_masalah") or kategori
                parsed["_model_used"] = model_name
                return parsed
            except Exception as e:
                print(f"[INFO] Main batch model {model_name} gagal ({instansi_nama} - {kategori}): {e}")

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


CLASSIFIER_SYSTEM_PROMPT = """Kamu adalah Model AI Classifier cepat untuk analisis sentimen & rating pelayanan publik Pemda DIY.
Tugasmu HANYA mengklasifikasikan sekumpulan ulasan/berita warga secara massal (batch).
Untuk setiap item input, tentukan:
1. "id": sama persis dengan id input
2. "sentimen": "positif", "negatif", atau "netral"
3. "rating": angka desimal bintang 1.0 sampai 5.0 (positif: 4.0-5.0, netral: 2.8-3.9, negatif: 1.0-2.5)
4. "kategori_masalah": pilih 1 dari ("Kecepatan Layanan & Antrean", "Sistem & Aplikasi Digital", "Kejelasan Informasi & Prosedur", "Sikap Petugas & Pelayanan Loket", "Fasilitas & Sarana Publik", "Program & Kebijakan Publik")

Balas HANYA dalam format JSON array valid tanpa teks tambahan:
[{"id": "...", "sentimen": "positif", "rating": 4.5, "kategori_masalah": "..."}]"""


def _parse_batch_json_response(raw_text: str) -> list[dict]:
    cleaned = _extract_json_text(raw_text)
    try:
        data = json.loads(cleaned)
        if isinstance(data, list):
            return data
    except json.JSONDecodeError:
        pass

    recovered = []
    for obj_str in re.findall(r"\{[^{}]+\}", cleaned):
        try:
            recovered.append(json.loads(obj_str))
        except Exception:
            pass
    return recovered


async def classify_reviews_batch_ai(
    items: list[dict],
    start_model_idx: int = 0,
    allow_local_fallback: bool = True,
    cooldown_retries: int = 1,
    on_model_switch=None,
) -> tuple[dict[str, dict], int, str]:
    """
    Pool Multi-Model Khusus Analisis Massal (Terpisah dari Model Utama):
    Mencoba berurutan antar model di MASS_POOL (gemini-3.5-flash-lite -> gemini-3.1-flash-lite ->
    gemini-flash-lite-latest -> gemini-3-flash-preview), menunggu cooldown jika RPM penuh,
    dan jatuh ke Smart Local Fallback jika seluruh cloud model limit sehingga semua data tetap teranalisis.
    """
    from scrapers.utils import analyze_review_fields

    results_map: dict[str, dict] = {}
    if not items:
        return results_map, start_model_idx, "none"

    client = get_classifier_client()
    mass_models = get_mass_classifier_models()
    chosen_model_idx = start_model_idx % len(mass_models)
    used_model_name = "local_smart_fallback"

    if client:
        compact_payload = [
            {
                "id": it["id"],
                "instansi": it.get("instansi_nama", ""),
                "teks": (it.get("teks") or "")[:180],
            }
            for it in items[:50]
        ]
        prompt = (
            f"Klasifikasikan {len(compact_payload)} ulasan pelayanan publik DIY berikut dalam format JSON array ringkas (compact tanpa spasi/baris baru berlebih):\n"
            + json.dumps(compact_payload, ensure_ascii=False)
        )
        cfg = types.GenerateContentConfig(
            temperature=0.1,
            max_output_tokens=8192,
            response_mime_type="application/json",
        )

        # Putar urutan kandidat dimulai dari model terakhir yang sehat
        rotated_indices = [(start_model_idx + i) % len(mass_models) for i in range(len(mass_models))]

        for round_idx in range(cooldown_retries + 1):
            for idx in rotated_indices:
                model_name = mass_models[idx]
                if on_model_switch:
                    on_model_switch(model_name)
                try:
                    response = await asyncio.to_thread(
                        client.models.generate_content,
                        model=model_name,
                        contents=[CLASSIFIER_SYSTEM_PROMPT, prompt],
                        config=cfg,
                    )
                    parsed_list = _parse_batch_json_response(response.text or "")
                    if not parsed_list:
                        raise ValueError("Respons JSON kosong")

                    for row in parsed_list:
                        rid = str(row.get("id", ""))
                        if not rid:
                            continue
                        sent = str(row.get("sentimen", "netral")).strip().lower()
                        if sent not in ("positif", "negatif", "netral"):
                            sent = "netral"
                        try:
                            rat = round(max(1.0, min(5.0, float(row.get("rating", 3.5)))), 1)
                        except (TypeError, ValueError):
                            rat = 4.4 if sent == "positif" else (1.8 if sent == "negatif" else 3.2)
                        kat = str(row.get("kategori_masalah") or "Program & Kebijakan Publik").strip()
                        results_map[rid] = {
                            "sentimen": sent,
                            "rating": rat,
                            "kategori_masalah": kat,
                            "source": model_name,
                        }
                    chosen_model_idx = idx
                    used_model_name = model_name
                    break
                except Exception as e:
                    print(f"[INFO] Mass model {model_name} gagal, failover ke model lain: {str(e)[:140]}")

            if results_map:
                break

            # Jika semua model cloud di putaran ini kena limit RPM/503 sementara, tunggu sebentar lalu coba lagi
            if round_idx < cooldown_retries:
                if on_model_switch:
                    on_model_switch("cooldown-18s")
                await asyncio.sleep(18)

    # Fallback lokal cerdas jika item belum terklasifikasi / seluruh kuota cloud harian habis
    if allow_local_fallback or not client:
        for it in items:
            rid = it["id"]
            if rid not in results_map:
                sent, rat, kat, prio, msl, sol = analyze_review_fields(
                    it.get("teks", ""),
                    it.get("instansi_nama", ""),
                    existing_rating=it.get("existing_rating"),
                )
                results_map[rid] = {
                    "sentimen": sent,
                    "rating": rat,
                    "kategori_masalah": kat,
                    "prioritas": prio,
                    "masalah_utama": msl,
                    "solusi_ai": sol,
                    "source": "local_smart_fallback",
                }

    return results_map, chosen_model_idx, used_model_name


async def classify_db_reviews_in_batches(
    db,
    reviews: list,
    batch_size: int = 50,
    on_progress=None,
    should_stop=None,
    allow_local_fallback: bool = True,
) -> dict:
    """
    Memproses daftar Review SQLAlchemy dalam potongan 50 ulasan per 1 request
    menggunakan Multi-Model Cascade Pool + Cooldown Retry + Local Fallback.
    """
    from scrapers.utils import analyze_review_fields

    updated = 0
    ai_classified = 0
    fallback_classified = 0
    batches = 0
    stopped_reason = None
    model_usage: dict[str, int] = {}
    current_model_idx = 0
    last_used_model = AI_ROUTER_CONFIG.get("classifier_model", "gemini-3.5-flash-lite")
    chunk_size = max(1, min(50, int(batch_size or 50)))

    for start in range(0, len(reviews), chunk_size):
        if should_stop and should_stop():
            stopped_reason = "Dihentikan oleh admin"
            break

        chunk = reviews[start : start + chunk_size]
        payload = [
            {
                "id": r.id,
                "instansi_nama": r.instansi_nama,
                "teks": r.teks,
                "existing_rating": r.rating if r.sumber == "maps" else None,
            }
            for r in chunk
        ]

        def handle_switch(mname: str):
            nonlocal last_used_model
            last_used_model = mname
            if on_progress:
                on_progress(updated, ai_classified, fallback_classified, batches, mname, model_usage)

        res_map, current_model_idx, batch_model = await classify_reviews_batch_ai(
            payload,
            start_model_idx=current_model_idx,
            allow_local_fallback=allow_local_fallback,
            cooldown_retries=1,
            on_model_switch=handle_switch,
        )
        last_used_model = batch_model
        batches += 1

        if not res_map:
            stopped_reason = "Semua model cloud mencapai batas kuota & fallback lokal dimatikan"
            break

        for r in chunk:
            info = res_map.get(r.id)
            if not info:
                continue
            src_model = info.get("source", "local_smart_fallback")
            r.sentimen = info["sentimen"]
            if not (r.sumber == "maps" and r.rating and r.rating > 0):
                r.rating = info["rating"]
            r.kategori_masalah = info["kategori_masalah"]
            r.ai_model = src_model

            _, _, _, prio, msl, sol = analyze_review_fields(
                r.teks, r.instansi_nama, existing_sentimen=r.sentimen, existing_rating=r.rating
            )
            r.prioritas = prio
            if r.sentimen in ("negatif", "netral"):
                r.masalah_utama = r.masalah_utama or msl
                r.solusi_ai = r.solusi_ai or sol
            else:
                r.masalah_utama = None
                r.solusi_ai = None

            updated += 1
            model_usage[src_model] = model_usage.get(src_model, 0) + 1
            if src_model == "local_smart_fallback":
                fallback_classified += 1
            else:
                ai_classified += 1

        db.commit()

        if on_progress:
            on_progress(updated, ai_classified, fallback_classified, batches, last_used_model, model_usage)

        # Jeda antar batch jika menggunakan API cloud agar stabil (lebih cepat bila bukan fallback lokal)
        if start + chunk_size < len(reviews) and get_classifier_client() and batch_model != "local_smart_fallback":
            await asyncio.sleep(3.5)

    return {
        "total_processed": updated,
        "ai_classified": ai_classified,
        "fallback_classified": fallback_classified,
        "batches_used": batches,
        "stopped_reason": stopped_reason,
        "model": last_used_model,
        "model_usage": model_usage,
    }
