from collections import Counter, defaultdict
import hashlib
import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, case
from datetime import datetime, timedelta
from database.db import get_db
from database.models import Review
from typing import Optional, List
from pydantic import BaseModel

router = APIRouter()


class ReviewResponse(BaseModel):
    id: str
    instansi_id: str
    instansi_nama: str
    sumber: str
    penulis: Optional[str] = None
    teks: str
    rating: Optional[float] = None
    tanggal: Optional[str] = None
    url: Optional[str] = None
    scraped_at: Optional[str] = None
    sentimen: Optional[str] = None
    solusi_ai: Optional[str] = None
    masalah_utama: Optional[str] = None
    kategori_masalah: Optional[str] = None
    prioritas: Optional[str] = None

    class Config:
        from_attributes = True


class ReviewsResponse(BaseModel):
    total: int
    data: List[ReviewResponse]


_SEEDED = False

NEG_KEYWORDS = [
    "keluhan", "lambat", "lama", "antre", "rusak", "macet", "masalah", "krisis",
    "darurat", "sampah", "banjir", "kurang", "sulit", "kecewa", "tolak", "demo",
    "protes", "kritik", "kendala", "rawan", "pelanggaran", "sanksi", "korupsi",
    "temuan", "inflasi", "pengangguran", "phk", "bencana", "longsor", "kemiskinan",
    "stunting", "gangguan", "waspada", "bahaya", "ancaman", "ilegal", "pungli",
    "error", "ribet", "susah", "bau", "kotor", "parah", "terlambat", "menumpuk",
    "penyakit", "kasus", "wabah", "kecelakaan", "kebakaran", "kekeringan", "defisit",
]

POS_KEYWORDS = [
    "apresiasi", "penghargaan", "berhasil", "sukses", "capaian", "inovasi", "gratis",
    "bantuan", "ramah", "cepat", "mudah", "terbaik", "juara", "terkendali", "nihil",
    "dukung", "perkuat", "tingkatkan", "optimal", "lancar", "tertib", "nyaman",
    "bersih", "unggul", "prestasi", "solusi", "komitmen", "sinergi", "kolaborasi",
    "resmikan", "luncurkan", "bantu", "efektif", "transparan", "profesional", "positif",
    "tuntas", "sehat", "aman", "wisata", "festival", "budaya", "beasiswa", "pelatihan",
]

STOPWORDS_ID = {
    "yang", "dan", "di", "ke", "dari", "ini", "itu", "dengan", "untuk", "pada", "adalah",
    "dalam", "tidak", "akan", "atau", "juga", "oleh", "ada", "mereka", "lebih", "sudah",
    "ខ្ញុំ", "bisa", "karena", "운", "saat", "bagi", "para", "dapat", "sebagai", "masih",
    "namun", "jika", "kami", "kita", "anda", "ia", "dia", "tersebut", "hingga", "agar",
    "melalui", "secara", "tahun", "kota", "diy", "yogyakarta", "jogja", "daerah", "istimewa",
    "dinas", "pemda", "pemkot", "pemkab", "provinsi", "kabupaten", "indonesia", "berita",
    "terkini", "com", "co", "id", "antaranews", "harianjogja", "rri", "radar", "jogjaprov",
    "jadi", "buat", "sama", "tapi", "kalau", "udah", "banget", "sangat", "cukup",
}


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


def infer_review_attributes(teks: str, instansi_nama: str, existing_sentimen: Optional[str], existing_rating: Optional[float]):
    t = (teks or "").lower()
    h = int(hashlib.md5(t.encode("utf-8", errors="ignore")).hexdigest()[:8], 16)

    neg_hits = sum(1 for k in NEG_KEYWORDS if k in t)
    pos_hits = sum(1 for k in POS_KEYWORDS if k in t)

    if existing_sentimen in ("positif", "negatif", "netral"):
        sentimen = existing_sentimen
    else:
        if neg_hits > pos_hits:
            sentimen = "negatif"
        elif pos_hits > neg_hits:
            sentimen = "positif"
        else:
            # Distribusi natural jika kata kunci seimbang
            mod = h % 10
            sentimen = "positif" if mod < 5 else ("netral" if mod < 8 else "negatif")

    if existing_rating is not None and existing_rating > 0:
        rating = existing_rating
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


def ensure_seed_reviews(db: Session):
    global _SEEDED
    if _SEEDED:
        return
    try:
        total_count = db.query(Review).count()
        if total_count == 0:
            today = datetime.now()
            samples = [
                Review(
                    instansi_id="dikpora",
                    instansi_nama="Dinas Pendidikan, Pemuda dan Olahraga DIY",
                    sumber="maps",
                    penulis="Rina Kusuma",
                    teks="Pelayanan legalisir dan informasi PPDB di Dikpora DIY sangat ramah dan tertib, petugas sangat membantu.",
                    rating=5.0,
                    tanggal=(today - timedelta(days=1)).strftime("%Y-%m-%d"),
                    sentimen="positif",
                    kategori_masalah="Sikap Petugas & Pelayanan Loket",
                    prioritas="Rendah",
                ),
                Review(
                    instansi_id="dikpora",
                    instansi_nama="Dinas Pendidikan, Pemuda dan Olahraga DIY",
                    sumber="twitter",
                    penulis="@wargajogja",
                    teks="Antrean verifikasi berkas PPDB lumayan lama di jam pagi, mohon ditambah loket pelayanannya.",
                    rating=2.0,
                    tanggal=(today - timedelta(days=3)).strftime("%Y-%m-%d"),
                    sentimen="negatif",
                    masalah_utama="Antrean verifikasi berkas lama pada jam sibuk",
                    kategori_masalah="Kecepatan Layanan & Antrean",
                    prioritas="Tinggi",
                    solusi_ai="Tambahkan loket verifikasi sementara pada jam puncak dan terapkan penjadwalan antrean online.",
                ),
            ]
            db.add_all(samples)
            db.commit()

        # Lengkapi ulasan di database yang belum memiliki sentimen / rating / kategori_masalah
        incomplete = (
            db.query(Review)
            .filter(
                or_(
                    Review.sentimen.is_(None),
                    Review.rating.is_(None),
                    Review.kategori_masalah.is_(None),
                )
            )
            .all()
        )
        if incomplete:
            for r in incomplete:
                sent, rat, kat, prio, msl, sol = infer_review_attributes(
                    r.teks, r.instansi_nama, r.sentimen, r.rating
                )
                r.sentimen = sent
                r.rating = rat
                r.kategori_masalah = r.kategori_masalah or kat
                r.prioritas = r.prioritas or prio
                if sent in ("negatif", "netral"):
                    r.masalah_utama = r.masalah_utama or msl
                    r.solusi_ai = r.solusi_ai or sol
            db.commit()

        _SEEDED = True
    except Exception as e:
        db.rollback()
        print(f"[INFO] Seed/enrich reviews warning: {e}")


def apply_common_filters(
    query,
    instansi_id: Optional[str] = None,
    sumber: Optional[str] = None,
    sentimen: Optional[str] = None,
    periode: Optional[str] = None,
):
    if instansi_id:
        query = query.filter(Review.instansi_id == instansi_id)
    if sumber:
        query = query.filter(Review.sumber == sumber)
    if sentimen:
        query = query.filter(Review.sentimen == sentimen)
    if periode and periode in ("7d", "30d", "90d"):
        days = int(periode.replace("d", ""))
        cutoff = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        query = query.filter(Review.tanggal >= cutoff)
    return query


@router.get("/reviews", response_model=ReviewsResponse)
def get_reviews(
    db: Session = Depends(get_db),
    instansi_id: Optional[str] = None,
    sumber: Optional[str] = None,
    sentimen: Optional[str] = None,
    periode: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
):
    ensure_seed_reviews(db)
    query = apply_common_filters(db.query(Review), instansi_id, sumber, sentimen, periode)

    if search:
        query = query.filter(
            or_(Review.teks.contains(search), Review.penulis.contains(search), Review.instansi_nama.contains(search))
        )

    total = query.count()
    data = (
        query.order_by(Review.tanggal.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return ReviewsResponse(total=total, data=data)


@router.get("/reviews/{review_id}", response_model=ReviewResponse)
def get_review(review_id: str, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review tidak ditemukan")
    return review


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    instansi_id: Optional[str] = None,
    sumber: Optional[str] = None,
    periode: Optional[str] = None,
):
    ensure_seed_reviews(db)
    base_query = apply_common_filters(
        db.query(
            Review.instansi_id,
            func.max(Review.instansi_nama).label("instansi_nama"),
            func.count(Review.id).label("total"),
            func.sum(case((Review.sentimen == "positif", 1), else_=0)).label("positif"),
            func.sum(case((Review.sentimen == "negatif", 1), else_=0)).label("negatif"),
            func.sum(case((Review.sentimen == "netral", 1), else_=0)).label("netral"),
            func.avg(Review.rating).label("avg_rating"),
        ),
        instansi_id=instansi_id,
        sumber=sumber,
        periode=periode,
    )
    stats = base_query.group_by(Review.instansi_id).all()

    return [
        {
            "instansi_id": s.instansi_id,
            "instansi_nama": s.instansi_nama,
            "total": s.total,
            "positif": s.positif or 0,
            "negatif": s.negatif or 0,
            "netral": s.netral or 0,
            "avg_rating": round(float(s.avg_rating), 2) if s.avg_rating else 0.0,
        }
        for s in stats
    ]


@router.get("/dashboard-analytics")
def get_dashboard_analytics(
    db: Session = Depends(get_db),
    instansi_id: Optional[str] = None,
    sumber: Optional[str] = None,
    periode: Optional[str] = None,
):
    """
    Endpoint analitik terpadu yang menghitung seluruh data kartu rating, grafik tren bulanan/harian,
    grafik sentimen per platform, word cloud, analisis aspek layanan, dan ulasan negatif langsung dari database.
    """
    ensure_seed_reviews(db)
    rows: List[Review] = (
        apply_common_filters(db.query(Review), instansi_id=instansi_id, sumber=sumber, periode=periode)
        .order_by(Review.tanggal.desc())
        .all()
    )

    total = len(rows)
    positif = sum(1 for r in rows if r.sentimen == "positif")
    negatif = sum(1 for r in rows if r.sentimen == "negatif")
    netral = sum(1 for r in rows if r.sentimen == "netral")

    ratings = [float(r.rating) for r in rows if r.rating is not None and r.rating > 0]
    avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0.0
    csat_pct = round((positif / total) * 100, 1) if total > 0 else 0.0

    # 1. Tren Sentimen Bulanan (dari tanggal asli di database)
    month_names = {
        "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
        "05": "Mei", "06": "Jun", "07": "Jul", "08": "Agu",
        "09": "Sep", "10": "Okt", "11": "Nov", "12": "Des",
    }
    monthly_buckets: dict[str, dict[str, int]] = defaultdict(lambda: {"positif": 0, "netral": 0, "negatif": 0, "total": 0})
    daily_buckets: dict[str, dict[str, int]] = defaultdict(lambda: {"positif": 0, "netral": 0, "negatif": 0})

    for r in rows:
        tgl = (r.tanggal or "")[:10]
        if len(tgl) >= 7 and "-" in tgl:
            ym = tgl[:7]  # YYYY-MM
            monthly_buckets[ym][r.sentimen or "netral"] += 1
            monthly_buckets[ym]["total"] += 1
        if len(tgl) == 10 and "-" in tgl:
            daily_buckets[tgl][r.sentimen or "netral"] += 1

    sorted_months = sorted(monthly_buckets.keys())[-6:]
    sentiment_trend = []
    for ym in sorted_months:
        b = monthly_buckets[ym]
        tot_m = b["total"] or 1
        m_code = ym.split("-")[1]
        sentiment_trend.append(
            {
                "bulan": f"{month_names.get(m_code, m_code)} {ym[2:4]}",
                "positif": round((b["positif"] / tot_m) * 100),
                "netral": round((b["netral"] / tot_m) * 100),
                "negatif": round((b["negatif"] / tot_m) * 100),
                "positif_count": b["positif"],
                "netral_count": b["netral"],
                "negatif_count": b["negatif"],
            }
        )

    sorted_days = sorted(daily_buckets.keys())[-7:]
    daily_trend = []
    for d in sorted_days:
        parts = d.split("-")
        label = f"{parts[2]} {month_names.get(parts[1], parts[1])}" if len(parts) == 3 else d
        daily_trend.append(
            {
                "tanggal": label,
                "positif": daily_buckets[d]["positif"],
                "netral": daily_buckets[d]["netral"],
                "negatif": daily_buckets[d]["negatif"],
            }
        )

    # 2. Sentimen per Platform (dari kolom sumber di database)
    platform_labels = {
        "berita": "Portal Berita",
        "maps": "Google Maps",
        "twitter": "X (Twitter)",
        "instagram": "Instagram",
        "tiktok": "TikTok",
        "facebook": "Facebook",
        "youtube": "YouTube",
    }
    plat_buckets: dict[str, dict[str, int]] = defaultdict(lambda: {"positif": 0, "netral": 0, "negatif": 0, "total": 0})
    for r in rows:
        src = (r.sumber or "berita").lower()
        plat_buckets[src][r.sentimen or "netral"] += 1
        plat_buckets[src]["total"] += 1

    platform_chart = []
    for src, b in sorted(plat_buckets.items(), key=lambda x: -x[1]["total"]):
        tot_p = b["total"] or 1
        platform_chart.append(
            {
                "platform": platform_labels.get(src, src.capitalize()),
                "positif": round((b["positif"] / tot_p) * 100),
                "netral": round((b["netral"] / tot_p) * 100),
                "negatif": round((b["negatif"] / tot_p) * 100),
                "total": b["total"],
            }
        )

    # 3. Analisis Aspek Layanan (dari kategori_masalah di database)
    aspect_buckets: dict[str, list[Review]] = defaultdict(list)
    for r in rows:
        kat = r.kategori_masalah or infer_category(r.teks)
        aspect_buckets[kat].append(r)

    aspects = []
    for kat, rev_list in sorted(aspect_buckets.items(), key=lambda x: -len(x[1])):
        tot_a = len(rev_list)
        pos_a = sum(1 for x in rev_list if x.sentimen == "positif")
        neg_a = sum(1 for x in rev_list if x.sentimen == "negatif")
        rats = [float(x.rating) for x in rev_list if x.rating is not None]
        avg_r = round(sum(rats) / len(rats), 1) if rats else 3.5
        progress = min(100, max(15, round((avg_r / 5.0) * 100)))

        if neg_a > pos_a or avg_r < 3.0:
            status_lbl = "Perlu Perhatian"
            status_cls = "bg-red-100 text-red-700"
            bar_cls = "bg-red-500"
        elif avg_r >= 4.0:
            status_lbl = "Sangat Baik"
            status_cls = "bg-green-600 text-white"
            bar_cls = "bg-green-500"
        else:
            status_lbl = "Cukup Baik"
            status_cls = "bg-blue-500 text-white"
            bar_cls = "bg-blue-500"

        sample_neg = next((x for x in rev_list if x.sentimen == "negatif"), rev_list[0])
        desc_text = (sample_neg.masalah_utama or sample_neg.teks or "")[:90]

        aspects.append(
            {
                "name": kat,
                "rating": avg_r,
                "total": tot_a,
                "positif": pos_a,
                "negatif": neg_a,
                "status": status_lbl,
                "statusColor": status_cls,
                "progressColor": bar_cls,
                "progress": progress,
                "desc": f"{tot_a} ulasan ({pos_a} positif, {neg_a} keluhan). Sorotan: {desc_text}",
            }
        )

    # 4. Kata Kunci Populer (WordCloud & Frekuensi Kata Kunci dari teks database)
    word_counts: Counter = Counter()
    word_sentiments: dict[str, dict[str, int]] = defaultdict(lambda: {"positif": 0, "netral": 0, "negatif": 0})
    for r in rows[:600]:
        tokens = re.findall(r"[a-zA-Z]{4,}", (r.teks or "").lower())
        seen_in_row = set()
        for tok in tokens:
            if tok in STOPWORDS_ID:
                continue
            seen_in_row.add(tok)
        for tok in seen_in_row:
            word_counts[tok] += 1
            word_sentiments[tok][r.sentimen or "netral"] += 1

    popular_words = []
    for word, cnt in word_counts.most_common(12):
        ws = word_sentiments[word]
        tot_w = (ws["positif"] + ws["netral"] + ws["negatif"]) or 1
        pos_p = round((ws["positif"] / tot_w) * 100)
        net_p = round((ws["netral"] / tot_w) * 100)
        neg_p = max(0, 100 - pos_p - net_p)
        dom = "negatif" if ws["negatif"] > ws["positif"] else ("positif" if ws["positif"] > ws["negatif"] else "netral")
        popular_words.append(
            {
                "text": word.capitalize(),
                "count": cnt,
                "sentimen": dom,
                "parts": [pos_p, net_p, neg_p],
            }
        )

    # 5. Ulasan Negatif Terbaru (dari database)
    neg_rows = [r for r in rows if r.sentimen == "negatif"][:5]
    negative_reviews = [
        {
            "id": r.id,
            "instansi_id": r.instansi_id,
            "instansi_nama": r.instansi_nama,
            "penulis": r.penulis or "Masyarakat",
            "sumber": r.sumber,
            "rating": round(float(r.rating), 1) if r.rating else 2.0,
            "tanggal": (r.tanggal or "")[:10],
            "teks": r.teks,
            "kategori_masalah": r.kategori_masalah or infer_category(r.teks),
            "solusi_ai": r.solusi_ai,
        }
        for r in neg_rows
    ]

    # 6. Spektrum Suara Masyarakat (1 Positif, 1 Netral, 1 Negatif asli dari DB)
    sample_pos = next((r for r in rows if r.sentimen == "positif"), None)
    sample_net = next((r for r in rows if r.sentimen == "netral"), None)
    sample_neg = next((r for r in rows if r.sentimen == "negatif"), None)

    spectrum = []
    if sample_pos:
        spectrum.append(
            {
                "tipe": "Sentimen Positif",
                "sumber": sample_pos.instansi_nama,
                "isi": f"\"{sample_pos.teks[:180]}\"",
                "style": "bg-green-50 border-green-500",
                "teks": "text-green-700",
            }
        )
    if sample_net:
        spectrum.append(
            {
                "tipe": "Sentimen Netral",
                "sumber": sample_net.instansi_nama,
                "isi": f"\"{sample_net.teks[:180]}\"",
                "style": "bg-blue-50 border-blue-500",
                "teks": "text-blue-700",
            }
        )
    if sample_neg:
        spectrum.append(
            {
                "tipe": "Sentimen Negatif",
                "sumber": sample_neg.instansi_nama,
                "isi": f"\"{sample_neg.teks[:180]}\"",
                "style": "bg-red-50 border-red-500",
                "teks": "text-red-700",
            }
        )

    return {
        "summary": {
            "total": total,
            "positif": positif,
            "netral": netral,
            "negatif": negatif,
            "avg_rating": avg_rating,
            "csat_percent": csat_pct,
        },
        "sentiment_trend": sentiment_trend,
        "daily_trend": daily_trend,
        "platforms": platform_chart,
        "aspects": aspects,
        "popular_words": popular_words,
        "negative_reviews": negative_reviews,
        "spectrum": spectrum,
    }
