from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, case
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


@router.get("/reviews", response_model=ReviewsResponse)
def get_reviews(
    db: Session = Depends(get_db),
    instansi_id: Optional[str] = None,
    sumber: Optional[str] = None,
    sentimen: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
):
    query = db.query(Review)

    if instansi_id:
        query = query.filter(Review.instansi_id == instansi_id)
    if sumber:
        query = query.filter(Review.sumber == sumber)
    if sentimen:
        query = query.filter(Review.sentimen == sentimen)
    if search:
        query = query.filter(
            or_(Review.teks.contains(search), Review.penulis.contains(search))
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
def get_stats(db: Session = Depends(get_db)):
    stats = (
        db.query(
            Review.instansi_id,
            Review.instansi_nama,
            func.count(Review.id).label("total"),
            func.sum(case((Review.sentimen == "positif", 1), else_=0)).label("positif"),
            func.sum(case((Review.sentimen == "negatif", 1), else_=0)).label("negatif"),
            func.sum(case((Review.sentimen == "netral", 1), else_=0)).label("netral"),
            func.avg(Review.rating).label("avg_rating"),
        )
        .group_by(Review.instansi_id, Review.instansi_nama)  # ← Tambahkan Review.instansi_nama di sini
        .all()
    )

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