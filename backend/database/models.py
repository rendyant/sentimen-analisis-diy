from sqlalchemy import Column, String, Float, Text
from database.db import Base
import uuid


def generate_id():
    return str(uuid.uuid4()).replace("-", "")[:24]


class Review(Base):
    __tablename__ = "reviews"

    id = Column(String(24), primary_key=True, default=generate_id)
    instansi_id = Column(String(50), nullable=False, index=True)
    instansi_nama = Column(String(200), nullable=False)
    sumber = Column(String(20), nullable=False, index=True)  # 'maps', 'berita', 'twitter'
    penulis = Column(String(200), nullable=True)
    teks = Column(Text, nullable=False)
    rating = Column(Float, nullable=True)
    tanggal = Column(String(50), nullable=True)
    url = Column(Text, nullable=True)
    scraped_at = Column(String(50), nullable=True)

    # Hasil analisis AI
    sentimen = Column(String(20), nullable=True)       # 'positif', 'negatif', 'netral'
    masalah_utama = Column(Text, nullable=True)
    kategori_masalah = Column(String(100), nullable=True)
    prioritas = Column(String(20), nullable=True)      # 'Tinggi', 'Sedang', 'Rendah'
    solusi_ai = Column(Text, nullable=True)