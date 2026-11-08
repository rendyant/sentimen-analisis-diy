from collections import defaultdict
import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import Optional
from pydantic import BaseModel
from database.db import get_db
from database.models import Review
from routers.reviews import ensure_seed_reviews
from ai.solver import (
    analyze_review,
    analyze_grouped_reviews_batch,
    classify_complaint_category,
    get_public_ai_config,
    update_ai_router_config,
    AI_ROUTER_CONFIG,
)

router = APIRouter()


class AnalyzeRequest(BaseModel):
    review_id: str


class GenerateOpdRequest(BaseModel):
    instansi_id: Optional[str] = None
    sentimen_filter: Optional[str] = "negatif"  # 'negatif', 'semua_keluhan'
    kategori: Optional[str] = None


class AIRouterConfigPayload(BaseModel):
    provider: Optional[str] = None
    model: Optional[str] = None
    api_key: Optional[str] = None
    temperature: Optional[float] = None
    thinking_level: Optional[str] = None
    batch_limit: Optional[int] = None
    auto_categorize: Optional[bool] = None
    system_prompt: Optional[str] = None


@router.get("/ai-config")
def get_ai_router_settings():
    """Ambil konfigurasi Main Router AI untuk Control Panel Admin di Website."""
    return get_public_ai_config()


@router.put("/ai-config")
def save_ai_router_settings(payload: AIRouterConfigPayload):
    """Ubah API Key, Model AI, System Prompt, dan konfigurasi Main Router langsung dari Website."""
    updated = update_ai_router_config(payload.model_dump(exclude_none=True))
    return {
        "message": "Konfigurasi Main Router AI berhasil disimpan dan diaktifkan.",
        "config": updated,
    }


@router.post("/ai-config/test")
async def test_ai_router_connection():
    """Uji koneksi API Key & kecepatan respons model pada Main Router AI."""
    start = time.perf_counter()
    res = await analyze_review(
        "Antrean verifikasi berkas pelayanan di loket pagi ini cukup padat, mohon ditambah petugas loket.",
        "Dinas Pendidikan, Pemuda dan Olahraga DIY",
        "maps",
    )
    elapsed_ms = round((time.perf_counter() - start) * 1000)
    return {
        "status": "ok",
        "model": AI_ROUTER_CONFIG["model"],
        "latency_ms": elapsed_ms,
        "sample_output": res,
    }


@router.post("/analyze")
async def analyze(request: AnalyzeRequest, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == request.review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review tidak ditemukan")

    result = await analyze_review(review.teks, review.instansi_nama, review.sumber)

    review.solusi_ai = result.get("rekomendasi_solusi_text", "")
    review.masalah_utama = result.get("masalah_utama", "")
    review.kategori_masalah = result.get("kategori_masalah") or classify_complaint_category(review.teks)
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


@router.post("/analyze/batch-category")
async def analyze_reviews_by_category_batch(
    payload: GenerateOpdRequest,
    db: Session = Depends(get_db),
):
    """
    Mengelompokkan ulasan jelek/keluhan berdasarkan OPD & Kategori Masalah menjadi satu,
    lalu menganalisisnya secara kolektif (bareng-bareng) sehingga hemat waktu & kuota API.
    """
    ensure_seed_reviews(db)

    query = db.query(Review)
    if payload.sentimen_filter == "negatif":
        query = query.filter(Review.sentimen == "negatif")
    else:
        query = query.filter(Review.sentimen.in_(["negatif", "netral"]))

    if payload.instansi_id:
        query = query.filter(Review.instansi_id == payload.instansi_id)

    limit_n = int(AI_ROUTER_CONFIG.get("batch_limit") or 25)
    target_reviews = query.order_by(Review.tanggal.desc()).limit(limit_n).all()

    # Kelompokkan ulasan berdasarkan (instansi_id, kategori_masalah)
    grouped: dict[tuple[str, str, str], list[Review]] = defaultdict(list)
    for r in target_reviews:
        kat = classify_complaint_category(r.teks)
        if payload.kategori and payload.kategori != kat:
            continue
        grouped[(r.instansi_id, r.instansi_nama, kat)].append(r)

    categories_result = []
    total_updated = 0

    for (inst_id, inst_nama, kat), rev_list in grouped.items():
        texts = [item.teks for item in rev_list]
        batch_ai = await analyze_grouped_reviews_batch(inst_nama, kat, texts)

        masalah_kolektif = batch_ai.get("masalah_utama") or f"Keluhan {kat} ({len(rev_list)} laporan warga)"
        solusi_kolektif = batch_ai.get("rekomendasi_solusi_text") or ""
        prioritas_kolektif = batch_ai.get("prioritas") or ("Tinggi" if len(rev_list) >= 2 else "Sedang")

        for item in rev_list:
            item.kategori_masalah = kat
            item.masalah_utama = masalah_kolektif
            item.solusi_ai = solusi_kolektif
            item.prioritas = prioritas_kolektif
            total_updated += 1

        categories_result.append(
            {
                "instansi_id": inst_id,
                "instansi_nama": inst_nama,
                "kategori_masalah": kat,
                "jumlah_ulasan": len(rev_list),
                "prioritas": prioritas_kolektif,
                "masalah_utama": masalah_kolektif,
                "solusi_ai": solusi_kolektif,
                "contoh_ulasan": texts[:3],
            }
        )

    db.commit()

    return {
        "message": f"Berhasil mengelompokkan dan menganalisis {total_updated} ulasan dalam {len(categories_result)} kategori masalah sekaligus.",
        "total_reviews_analyzed": total_updated,
        "total_categories": len(categories_result),
        "categories": categories_result,
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

    # Kelompokkan ulasan per (OPD, Kategori Masalah) agar ulasan jelek yang sejenis digabung jadi satu kartu rekomendasi
    grouped_opd: dict[tuple[str, str], list[Review]] = defaultdict(list)
    for r in problem_reviews:
        kat = r.kategori_masalah or classify_complaint_category(r.teks)
        key = (r.instansi_id, kat) if instansi_id else (r.instansi_id, "all")
        grouped_opd[key].append(r)

    recommendations = []

    for (inst_id, _), group_revs in grouped_opd.items():
        r = group_revs[0]
        st = stats_map.get(inst_id)
        total_opd = st.total if st else len(group_revs)
        neg_opd = (st.negatif or 0) if st else sum(1 for x in group_revs if x.sentimen == "negatif")
        pct_neg = round((neg_opd / total_opd) * 100) if total_opd > 0 else 50

        prioritas = r.prioritas or ("Tinggi" if any(x.sentimen == "negatif" for x in group_revs) else "Sedang")
        if prioritas == "Rendah":
            prioritas = "Sedang"

        kategori = r.kategori_masalah or classify_complaint_category(r.teks)
        masalah = r.masalah_utama or f"Keluhan {kategori} pada {r.instansi_nama}"
        solusi = (
            r.solusi_ai
            or f"Evaluasi alur layanan pada {r.instansi_nama}, tambah petugas pada jam puncak, dan perjelas informasi prosedur layanan kepada masyarakat."
        )

        ringkasan = [
            f"Laporan warga ({x.sumber.upper()}): \"{x.teks}\""
            for x in group_revs[:3]
        ]
        if len(ringkasan) == 1:
            ringkasan.append(f"Kategori keluhan utama: {kategori} di {r.instansi_nama}.")

        recommendations.append(
            {
                "id": r.id,
                "instansi_id": r.instansi_id,
                "instansi_nama": r.instansi_nama,
                "prioritas": prioritas,
                "masalah_utama": masalah,
                "kategori_masalah": kategori,
                "persen_negatif": pct_neg,
                "total_keluhan": len(group_revs),
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

    recommendations.sort(key=lambda x: (0 if x["prioritas"] == "Tinggi" else 1, -x["persen_negatif"]))

    if recommendations:
        top = recommendations[0]
        opd_count = len({item["instansi_id"] for item in recommendations})
        insight_text = (
            f"Berdasarkan pengelompokan dan analisis AI terhadap {opd_count} OPD yang memiliki catatan keluhan, "
            f"prioritas penanganan tertinggi berada pada {top['instansi_nama']} terkait \"{top['masalah_utama']}\" "
            f"(kategori {top['kategori_masalah']}). "
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
    """Jalankan analisis kolektif (Batch per Kategori & OPD) lalu kembalikan daftar rekomendasi terbaru."""
    await analyze_reviews_by_category_batch(payload=payload, db=db)
    return get_opd_recommendations(instansi_id=payload.instansi_id, db=db)
