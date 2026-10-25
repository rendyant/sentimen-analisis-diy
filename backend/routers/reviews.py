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


def ensure_seed_reviews(db: Session):
    global _SEEDED
    if _SEEDED:
        return
    try:
        if db.query(Review).count() >= 8:
            _SEEDED = True
            return
        db.query(Review).delete()
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
                kategori_masalah="Pelayanan Loket",
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
                kategori_masalah="Kecepatan Layanan",
                prioritas="Tinggi",
                solusi_ai="Tambahkan loket verifikasi sementara pada jam puncak dan terapkan penjadwalan antrean online.",
            ),
            Review(
                instansi_id="dikpora",
                instansi_nama="Dinas Pendidikan, Pemuda dan Olahraga DIY",
                sumber="berita",
                penulis="Harian Jogja",
                teks="Dikpora DIY siapkan posko pengaduan terpadu untuk kelancaran seleksi penerimaan siswa baru.",
                rating=4.0,
                tanggal=(today - timedelta(days=10)).strftime("%Y-%m-%d"),
                sentimen="positif",
                kategori_masalah="Informasi Publik",
                prioritas="Rendah",
            ),
            Review(
                instansi_id="dinkes",
                instansi_nama="Dinas Kesehatan DIY",
                sumber="berita",
                penulis="Portal Berita Jogja",
                teks="Dinas Kesehatan DIY gencarkan layanan skrining kesehatan gratis dan peningkatan mutu puskesmas.",
                rating=4.5,
                tanggal=(today - timedelta(days=2)).strftime("%Y-%m-%d"),
                sentimen="positif",
                kategori_masalah="Program Kesehatan",
                prioritas="Rendah",
            ),
            Review(
                instansi_id="dinkes",
                instansi_nama="Dinas Kesehatan DIY",
                sumber="maps",
                penulis="Dimas Saputra",
                teks="Waktu tunggu antrean rujukan dan informasi ketersediaan kamar perlu dipercepat.",
                rating=2.0,
                tanggal=(today - timedelta(days=5)).strftime("%Y-%m-%d"),
                sentimen="negatif",
                masalah_utama="Waktu tunggu informasi rujukan lambat",
                kategori_masalah="Kecepatan Layanan",
                prioritas="Tinggi",
                solusi_ai="Integrasikan dashboard ketersediaan tempat tidur real-time antar faskes.",
            ),
            Review(
                instansi_id="dishub",
                instansi_nama="Dinas Perhubungan DIY",
                sumber="maps",
                penulis="Andi Pratama",
                teks="Integrasi rute Trans Jogja sudah cukup baik, namun waktu tunggu di halte tertentu masih perlu diperbaiki.",
                rating=3.0,
                tanggal=(today - timedelta(days=4)).strftime("%Y-%m-%d"),
                sentimen="netral",
                kategori_masalah="Transportasi Publik",
                prioritas="Sedang",
            ),
            Review(
                instansi_id="dpmptsp",
                instansi_nama="Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu DIY",
                sumber="maps",
                penulis="Hendra Wijaya",
                teks="Konsultasi perizinan usaha OSS sangat jelas dan selesai tepat waktu.",
                rating=5.0,
                tanggal=(today - timedelta(days=2)).strftime("%Y-%m-%d"),
                sentimen="positif",
                kategori_masalah="Perizinan",
                prioritas="Rendah",
            ),
            Review(
                instansi_id="dinsos",
                instansi_nama="Dinas Sosial DIY",
                sumber="twitter",
                penulis="@aspirasi_diy",
                teks="Mohon sosialisasi jadwal penyaluran bantuan sosial diperjelas agar warga lansia tidak menunggu lama.",
                rating=2.0,
                tanggal=(today - timedelta(days=15)).strftime("%Y-%m-%d"),
                sentimen="negatif",
                masalah_utama="Sosialisasi jadwal penyaluran belum merata",
                kategori_masalah="Kejelasan Informasi",
                prioritas="Sedang",
                solusi_ai="Sebarkan jadwal penyaluran per kelurahan melalui kanal WhatsApp resmi dan perangkat desa.",
            ),
            Review(
                instansi_id="diskominfo",
                instansi_nama="Dinas Komunikasi dan Informatika DIY",
                sumber="maps",
                penulis="Bagus Prakoso",
                teks="Aplikasi Jogja Istimewa dan layanan WiFi publik sangat membantu masyarakat.",
                rating=4.5,
                tanggal=(today - timedelta(days=20)).strftime("%Y-%m-%d"),
                sentimen="positif",
                kategori_masalah="Layanan Digital",
                prioritas="Rendah",
            ),
        ]
        db.add_all(samples)
        db.commit()
        _SEEDED = True
    except Exception:
        db.rollback()


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
            "avg_rating": round(float(s.avg_rating), 1) if s.avg_rating else 0.0,
        }
        for s in stats
    ]