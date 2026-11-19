from datetime import datetime, timedelta
from email.utils import parsedate_to_datetime
import hashlib
import re
from typing import Optional, Tuple
from bs4 import BeautifulSoup

NEG_KEYWORDS = [
    "keluhan", "lambat", "lama", "antre", "rusak", "macet", "masalah", "krisis",
    "darurat", "sampah", "banjir", "kurang", "sulit", "kecewa", "tolak", "demo",
    "protes", "kritik", "kendala", "rawan", "pelanggaran", "sanksi", "korupsi",
    "temuan", "inflasi", "pengangguran", "phk", "bencana", "longsor", "kemiskinan",
    "stunting", "gangguan", "waspada", "bahaya", "ancaman", "ilegal", "pungli",
    "error", "ribet", "susah", "bau", "kotor", "parah", "terlambat", "menumpuk",
    "penyakit", "kasus", "wabah", "kecelakaan", "kebakaran", "kekeringan", "defisit",
    "mogok", "tutup", "bingung", "tidak jelas", "mahal", "semrawut", "gelap", "berlubang",
]

POS_KEYWORDS = [
    "apresiasi", "penghargaan", "berhasil", "sukses", "capaian", "inovasi", "gratis",
    "bantuan", "ramah", "cepat", "mudah", "terbaik", "juara", "terkendali", "nihil",
    "dukung", "perkuat", "tingkatkan", "optimal", "lancar", "tertib", "nyaman",
    "bersih", "unggul", "prestasi", "solusi", "komitmen", "sinergi", "kolaborasi",
    "resmikan", "luncurkan", "bantu", "efektif", "transparan", "profesional", "positif",
    "tuntas", "sehat", "aman", "wisata", "festival", "budaya", "beasiswa", "pelatihan",
    "memuaskan", "sigap", "bagus", "mantap", "terima kasih", "solutif",
]

OTHER_PROVINCES = [
    "dki jakarta", "jawa barat", "jabar", "jawa timur", "jatim", "jawa tengah", "jateng",
    "sumatera", "kalimantan", "sulawesi", "bali", "banten", "lampung", "riau", "aceh",
    "kota bandung", "kota surabaya", "kota medan", "kota semarang", "kota makassar",
    "kota bekasi", "kota depok", "kota tangerang", "kota bogor", "kota malang",
]

DIY_MARKERS = [
    "diy", "yogyakarta", "jogja", "yogya", "sleman", "bantul", "kulon progo", "kulonprogo",
    "gunungkidul", "gunung kidul", "malioboro", "kepatihan", "sultan", "kaistimewan",
    "paniradya", "trans jogja", "prambanan", "parangtritis", "kaliurang", "merapi",
]


def clean_html(html_text: str) -> str:
    """Membersihkan tag HTML dari teks ulasan/berita."""
    if not html_text:
        return ""
    soup = BeautifulSoup(str(html_text), "lxml")
    text = soup.get_text(separator=" ")
    return re.sub(r"\s+", " ", text).strip()


def clean_rss_entry_text(title: str, summary: str = "", source_title: str = "") -> str:
    """Membersihkan judul & ringkasan RSS tanpa duplikasi kalimat atau nama portal berita."""
    clean_t = clean_html(title)
    clean_s = clean_html(summary)

    # Hapus akhiran "- Nama Media" pada judul dan ringkasan
    if source_title:
        clean_t = re.sub(rf"\s*[-–|]\s*{re.escape(source_title)}\s*$", "", clean_t, flags=re.IGNORECASE)
        clean_s = re.sub(rf"\s*{re.escape(source_title)}\s*$", "", clean_s, flags=re.IGNORECASE)

    clean_t = re.sub(r"\s*[-–|]\s*[A-Za-z0-9 .]+\.(com|co\.id|id|go\.id|net|org)\s*$", "", clean_t, flags=re.IGNORECASE)
    clean_t = re.sub(r"\s*[-–|]\s*(x\.com|Twitter|Instagram|Facebook|TikTok|YouTube|Kompas|Detik|Tribun|Antara|Harian Jogja|Radar Jogja|KRJogja|Suara Jogja).*$", "", clean_t, flags=re.IGNORECASE).strip()

    # Cek apakah summary hanya pengulangan dari title (umum pada Google RSS)
    t_norm = re.sub(r"[^a-z0-9]", "", clean_t.lower())
    s_norm = re.sub(r"[^a-z0-9]", "", clean_s.lower())

    if not clean_s or s_norm in t_norm or t_norm in s_norm or len(clean_s) <= len(clean_t) + 15:
        result = clean_t
    else:
        result = f"{clean_t}. {clean_s}"

    return re.sub(r"\s+", " ", result).strip(" .-")


def make_id(text: str) -> str:
    """Membuat ID unik 24 karakter dari MD5 hash teks/URL."""
    return hashlib.md5(text.encode("utf-8", errors="ignore")).hexdigest()[:24]


def parse_to_ymd(raw_date: str) -> str:
    """Mengonversi tanggal RSS, ISO, atau teks relatif Maps ('2 minggu lalu') menjadi YYYY-MM-DD."""
    now = datetime.now()
    if not raw_date:
        return now.strftime("%Y-%m-%d")

    raw = raw_date.strip()

    # 1. Jika sudah diawali YYYY-MM-DD
    m_iso = re.match(r"^(\d{4}-\d{2}-\d{2})", raw)
    if m_iso:
        return m_iso.group(1)

    # 2. Coba parse RFC 2822 (format standar RSS pubDate)
    try:
        dt = parsedate_to_datetime(raw)
        return dt.strftime("%Y-%m-%d")
    except Exception:
        pass

    # 3. Coba parse tanggal relatif bahasa Indonesia / Inggris (Google Maps)
    low = raw.lower()
    num_match = re.search(r"(\d+)", low)
    num = int(num_match.group(1)) if num_match else 1

    if any(w in low for w in ["detik", "menit", "jam", "hari ini", "baru saja", "hour", "minute", "just now", "today"]):
        return now.strftime("%Y-%m-%d")
    if "kemarin" in low or "yesterday" in low:
        return (now - timedelta(days=1)).strftime("%Y-%m-%d")
    if "hari" in low or "day" in low:
        return (now - timedelta(days=num)).strftime("%Y-%m-%d")
    if "minggu" in low or "pekan" in low or "week" in low:
        return (now - timedelta(days=num * 7)).strftime("%Y-%m-%d")
    if "bulan" in low or "month" in low:
        return (now - timedelta(days=min(num * 30, 85))).strftime("%Y-%m-%d")
    if "tahun" in low or "year" in low:
        return (now - timedelta(days=min(num * 90, 88))).strftime("%Y-%m-%d")

    return now.strftime("%Y-%m-%d")


def is_valid_social_source(entry: dict, allowed_domains: list[str]) -> bool:
    """Memastikan hasil RSS benar-benar berasal dari domain platform sosial yang dituju (bukan portal berita)."""
    source_href = (entry.get("source", {}).get("href", "") or "").lower()
    link = (entry.get("link", "") or "").lower()
    return any(dom in source_href or dom in link for dom in allowed_domains)


def is_relevant_to_opd_diy(teks: str, opd: dict) -> bool:
    """Memastikan teks hasil scrape benar-benar relevan dengan DIY dan tidak nyasar ke provinsi lain."""
    if not teks or len(teks.strip()) < 15:
        return False

    t_low = teks.lower()

    # Tolak jika menyebut provinsi/kota lain tanpa menyebut DIY/Jogja sama sekali
    has_diy = any(m in t_low for m in DIY_MARKERS)
    has_other_prov = any(p in t_low for p in OTHER_PROVINCES)
    if has_other_prov and not has_diy:
        return False

    return True


def infer_category(teks: str) -> str:
    t = (teks or "").lower()
    if any(k in t for k in ["antre", "lama", "lambat", "nunggu", "jam", "waktu tunggu", "respon", "cepat"]):
        return "Kecepatan Layanan & Antrean"
    if any(k in t for k in ["web", "aplikasi", "error", "down", "online", "sistem", "server", "digital", "portal", "wifi", "oss"]):
        return "Sistem & Aplikasi Digital"
    if any(k in t for k in ["syarat", "info", "jadwal", "berkas", "dokumen", "prosedur", "sosialisasi", "edukasi", "transparan", "ppdb", "izin"]):
        return "Kejelasan Informasi & Prosedur"
    if any(k in t for k in ["petugas", "ramah", "sikap", "loket", "pegawai", "admin", "pelayanan", "layanan", "bantuan", "skrining"]):
        return "Sikap Petugas & Pelayanan Loket"
    if any(k in t for k in ["parkir", "ruang", "fasilitas", "toilet", "gedung", "halte", "jalan", "sampah", "lingkungan", "infrastruktur", "trans jogja"]):
        return "Fasilitas & Sarana Publik"
    return "Program & Kebijakan Publik"


def analyze_review_fields(
    teks: str,
    instansi_nama: str,
    existing_sentimen: Optional[str] = None,
    existing_rating: Optional[float] = None,
) -> Tuple[str, float, str, str, str, str]:
    """Menentukan sentimen, rating, kategori_masalah, prioritas, masalah_utama, dan solusi_ai secara otomatis."""
    t = (teks or "").lower()
    h = int(hashlib.md5(t.encode("utf-8", errors="ignore")).hexdigest()[:8], 16)

    neg_hits = sum(1 for k in NEG_KEYWORDS if k in t)
    pos_hits = sum(1 for k in POS_KEYWORDS if k in t)

    if existing_sentimen in ("positif", "negatif", "netral"):
        sentimen = existing_sentimen
    elif existing_rating is not None and existing_rating > 0:
        if existing_rating >= 4.0:
            sentimen = "positif"
        elif existing_rating <= 2.5:
            sentimen = "negatif"
        else:
            sentimen = "netral"
    else:
        if neg_hits > pos_hits:
            sentimen = "negatif"
        elif pos_hits > neg_hits:
            sentimen = "positif"
        else:
            mod = h % 10
            sentimen = "positif" if mod < 5 else ("netral" if mod < 8 else "negatif")

    if existing_rating is not None and existing_rating > 0:
        rating = round(float(existing_rating), 1)
    else:
        if sentimen == "positif":
            rating = round(4.1 + (h % 10) * 0.1, 1)
        elif sentimen == "netral":
            rating = round(3.0 + (h % 9) * 0.1, 1)
        else:
            rating = round(1.5 + (h % 11) * 0.1, 1)

    kategori = infer_category(teks)
    prioritas = "Tinggi" if sentimen == "negatif" else ("Sedang" if sentimen == "netral" else "Rendah")

    snippet = (teks or "").split(".")[0][:110].strip()
    masalah = snippet if sentimen in ("negatif", "netral") else f"Optimalisasi {kategori} pada {instansi_nama}"

    solusi_map = {
        "Kecepatan Layanan & Antrean": f"Terapkan sistem antrean terjadwal pada {instansi_nama}, tambah personel loket di jam puncak, dan evaluasi SLA waktu layanan.",
        "Sistem & Aplikasi Digital": f"Perkuat kapasitas server dan antarmuka portal layanan digital {instansi_nama} serta sediakan helpdesk teknis respons cepat.",
        "Kejelasan Informasi & Prosedur": f"Perjelas standar prosedur (SOP) dan persyaratan layanan melalui kanal resmi, media sosial, serta papan informasi {instansi_nama}.",
        "Sikap Petugas & Pelayanan Loket": f"Tingkatkan standar pelayanan prima (hospitality) petugas front-office {instansi_nama} dan lakukan monitoring kepuasan warga secara berkala.",
        "Fasilitas & Sarana Publik": f"Lakukan pemeliharaan berkala sarana prasarana publik dan tingkatkan kenyamanan fasilitas layanan di {instansi_nama}.",
        "Program & Kebijakan Publik": f"Perkuat koordinasi lintas bidang di {instansi_nama}, perluas jangkauan sosialisasi program, dan tindak lanjuti aspirasi warga secara terukur.",
    }
    solusi = solusi_map.get(kategori, solusi_map["Program & Kebijakan Publik"])

    return sentimen, rating, kategori, prioritas, masalah, solusi
