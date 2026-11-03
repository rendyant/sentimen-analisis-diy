from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import Optional
from pydantic import BaseModel
from database.db import get_db
from database.models import Review
from routers.reviews import ensure_seed_reviews
from ai.solver import analyze_review

router = APIRouter()


class AnalyzeRequest(BaseModel):
    review_id: str


class GenerateOpdRequest(BaseModel):
    instansi_id: Optional[str] = None


@router.post("/analyze")
async def analyze(request: AnalyzeRequest, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == request.review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review tidak ditemukan")

    result = await analyze_review(review.teks, review.instansi_nama, review.sumber)

    review.solusi_ai = result.get("rekomendasi_solusi_text", "")
    review.masalah_utama = result.get("masalah_utama", "")
    review.kategori_masalah = result.get("kategori_masalah", "")
    review.prioritas = result.get("prioritas", "Sedang")
    if not review.sentimen or review.sentimen == "netral":
        review.sentimen = result.get("sentimen", review.sentimen or "netral")

    db.commit()
    db.refresh(review)

    return {
        "review_id": review.id,
        "instansi_nama": review.instansi_nama,
        "sentimen": review.sentimen,
        "masalah_utama": review.masalah_utama,
        "kategori_masalah": review.kategori_masalah,
        "prioritas": review.prioritas,
        "solusi_ai": review.solusi_ai,
        "detail": result,
    }


@router.get("/recommendations")
def get_opd_recommendations(
    instansi_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Menghasilkan daftar rekomendasi & solusi AI untuk setiap OPD yang memiliki keluhan/masalah."""
    ensure_seed_reviews(db)

    stats_query = db.query(
        Review.instansi_id,
        func.max(Review.instansi_nama).label("instansi_nama"),
        func.count(Review.id).label("total"),
        func.sum(case((Review.sentimen == "positif", 1), else_=0)).label("positif"),
        func.sum(case((Review.sentimen == "negatif", 1), else_=0)).label("negatif"),
        func.sum(case((Review.sentimen == "netral", 1), else_=0)).label("netral"),
    )
    if instansi_id:
        stats_query = stats_query.filter(Review.instansi_id == instansi_id)

    stats_rows = stats_query.group_by(Review.instansi_id).all()
    stats_map = {s.instansi_id: s for s in stats_rows}

    rev_query = db.query(Review).filter(Review.sentimen.in_(["negatif", "netral"]))
    if instansi_id:
        rev_query = rev_query.filter(Review.instansi_id == instansi_id)

    problem_reviews = rev_query.order_by(
        case((Review.sentimen == "negatif", 0), else_=1),
        Review.tanggal.desc(),
    ).all()

    recommendations = []
    seen_opds = set()

    for r in problem_reviews:
        # Kelompokkan per OPD atau tampilkan semua keluhan utama pada OPD yang difilter
        key = r.id if instansi_id else r.instansi_id
        if key in seen_opds:
            continue
        seen_opds.add(key)

        st = stats_map.get(r.instansi_id)
        total_opd = st.total if st else 1
        neg_opd = (st.negatif or 0) if st else (1 if r.sentimen == "negatif" else 0)
        pct_neg = round((neg_opd / total_opd) * 100) if total_opd > 0 else 50

        prioritas = r.prioritas or ("Tinggi" if r.sentimen == "negatif" else "Sedang")
        if prioritas == "Rendah":
            prioritas = "Sedang"

        masalah = r.masalah_utama or f"Keluhan pelayanan pada {r.instansi_nama}"
        kategori = r.kategori_masalah or "Pelayanan Publik"
        solusi = (
            r.solusi_ai
            or f"Evaluasi alur layanan pada {r.instansi_nama}, tambah petugas pada jam puncak, dan perjelas informasi prosedur layanan kepada masyarakat."
        )

        ringkasan = [
            f"Laporan warga ({r.sumber.upper()}): \"{r.teks}\"",
            f"Fokus perbaikan pada aspek {kategori} di {r.instansi_nama}.",
            "Monitoring berkala tingkat kepuasan dan kecepatan tindak lanjut keluhan.",
        ]

        recommendations.append(
            {
                "id": r.id,
                "instansi_id": r.instansi_id,
                "instansi_nama": r.instansi_nama,
                "prioritas": prioritas,
                "masalah_utama": masalah,
                "kategori_masalah": kategori,
                "persen_negatif": pct_neg,
                "total_keluhan": neg_opd if neg_opd > 0 else 1,
                "total_ulasan": total_opd,
                "ringkasan": ringkasan,
                "solusi_ai": solusi,
                "dampak": (
                    "Estimasi penurunan keluhan -35% & peningkatan indeks kepuasan +0.4 poin"
                    if prioritas == "Tinggi"
                    else "Peningkatan efisiensi & keterbukaan informasi layanan +25%"
                ),
            }
        )

    # Urutkan Prioritas Tinggi lebih dulu
    recommendations.sort(key=lambda x: (0 if x["prioritas"] == "Tinggi" else 1, -x["persen_negatif"]))

    # Buat AI Insight ringkasan eksekutif
    if recommendations:
        top = recommendations[0]
        opd_count = len({item["instansi_id"] for item in recommendations})
        insight_text = (
            f"Berdasarkan hasil analisis AI terhadap {opd_count} OPD yang memiliki catatan keluhan, "
            f"prioritas penanganan tertinggi berada pada {top['instansi_nama']} terkait \"{top['masalah_utama']}\" "
            f"(aspek {top['kategori_masalah']}). "
            f"AI merekomendasikan langkah utama: {top['solusi_ai']}"
        )
    else:
        insight_text = (
            "Seluruh layanan OPD yang dipilih menunjukkan tren sentimen positif yang stabil tanpa keluhan kritis. "
            "Pertahankan standar pelayanan loket dan keterbukaan informasi publik."
        )

    return {
        "total": len(recommendations),
        "insight": insight_text,
        "data": recommendations,
    }


@router.post("/recommendations/generate")
async def generate_opd_recommendations(
    payload: GenerateOpdRequest,
    db: Session = Depends(get_db),
):
    """Jalankan analisis Gemini AI untuk memperbarui rekomendasi solusi pada OPD yang bermasalah."""
    ensure_seed_reviews(db)

    query = db.query(Review).filter(Review.sentimen.in_(["negatif", "netral"]))
    if payload.instansi_id:
        query = query.filter(Review.instansi_id == payload.instansi_id)

    targets = query.order_by(Review.tanggal.desc()).limit(3).all()
    analyzed_count = 0

    for review in targets:
        res = await analyze_review(review.teks, review.instansi_nama, review.sumber)
        review.masalah_utama = res.get("masalah_utama") or review.masalah_utama
        review.kategori_masalah = res.get("kategori_masalah") or review.kategori_masalah
        review.prioritas = res.get("prioritas") or review.prioritas or "Tinggi"
        review.solusi_ai = res.get("rekomendasi_solusi_text") or review.solusi_ai
        analyzed_count += 1

    db.commit()
    return get_opd_recommendations(instansi_id=payload.instansi_id, db=db)
