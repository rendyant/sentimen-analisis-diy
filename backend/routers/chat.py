from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import Optional, List
from pydantic import BaseModel
from database.db import get_db
from database.models import Review
from routers.reviews import ensure_seed_reviews
from ai.solver import chat_with_data

router = APIRouter()


class ChatMessageItem(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    instansi_id: Optional[str] = None
    history: Optional[List[ChatMessageItem]] = None


@router.post("/chat")
async def chat_endpoint(payload: ChatRequest, db: Session = Depends(get_db)):
    ensure_seed_reviews(db)

    # 1. Ambil statistik per OPD dari database
    stats_query = db.query(
        Review.instansi_id,
        func.max(Review.instansi_nama).label("instansi_nama"),
        func.count(Review.id).label("total"),
        func.sum(case((Review.sentimen == "positif", 1), else_=0)).label("positif"),
        func.sum(case((Review.sentimen == "negatif", 1), else_=0)).label("negatif"),
        func.sum(case((Review.sentimen == "netral", 1), else_=0)).label("netral"),
        func.avg(Review.rating).label("avg_rating"),
    )
    if payload.instansi_id:
        stats_query = stats_query.filter(Review.instansi_id == payload.instansi_id)

    stats_rows = stats_query.group_by(Review.instansi_id).all()
    stats_data = [
        {
            "instansi_id": s.instansi_id,
            "instansi_nama": s.instansi_nama,
            "total": s.total,
            "positif": s.positif or 0,
            "negatif": s.negatif or 0,
            "netral": s.netral or 0,
            "avg_rating": round(float(s.avg_rating), 1) if s.avg_rating else 0.0,
        }
        for s in stats_rows
    ]

    # 2. Ambil daftar ulasan dari database
    rev_query = db.query(Review)
    if payload.instansi_id:
        rev_query = rev_query.filter(Review.instansi_id == payload.instansi_id)
    rev_rows = rev_query.order_by(Review.tanggal.desc()).limit(30).all()

    reviews_data = [
        {
            "instansi_id": r.instansi_id,
            "instansi_nama": r.instansi_nama,
            "sumber": r.sumber,
            "penulis": r.penulis or "Anonim",
            "teks": r.teks,
            "rating": r.rating,
            "tanggal": r.tanggal,
            "sentimen": r.sentimen or "netral",
            "masalah_utama": r.masalah_utama,
            "kategori_masalah": r.kategori_masalah,
            "prioritas": r.prioritas,
            "solusi_ai": r.solusi_ai,
        }
        for r in rev_rows
    ]

    history_dicts = (
        [{"role": h.role, "content": h.content} for h in payload.history]
        if payload.history
        else []
    )

    result = await chat_with_data(
        message=payload.message,
        stats=stats_data,
        reviews=reviews_data,
        history=history_dicts,
        opd_filter=payload.instansi_id,
    )
    return result
