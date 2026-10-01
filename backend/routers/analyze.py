from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.db import get_db
from database.models import Review
from ai.solver import analyze_review
from pydantic import BaseModel

router = APIRouter()


class AnalyzeRequest(BaseModel):
    review_id: str


@router.post("/analyze")
async def analyze(request: AnalyzeRequest, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == request.review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review tidak ditemukan")

    result = await analyze_review(review.teks, review.instansi_nama, review.sumber)

    # Simpan hasil ke database
    review.solusi_ai = result.get("rekomendasi_solusi_text", "")
    review.masalah_utama = result.get("masalah_utama", "")
    review.kategori_masalah = result.get("kategori_masalah", "")
    review.prioritas = result.get("prioritas", "")
    if not review.sentimen:
        review.sentimen = result.get("sentimen", "netral")

    db.commit()
    db.refresh(review)

    return result