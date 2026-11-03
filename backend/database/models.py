import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Text, Boolean, DateTime
from database.db import Base


def generate_id():
    return str(uuid.uuid4()).replace("-", "")[:24]


def generate_uuid():
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    OPD = "opd"


class UserStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    REJECTED = "rejected"


class Review(Base):
    __tablename__ = "reviews"

    id = Column(String(24), primary_key=True, default=generate_id)
    instansi_id = Column(String(50), nullable=False, index=True)
    instansi_nama = Column(String(200), nullable=False)
    sumber = Column(String(20), nullable=False, index=True)  # 'maps', 'berita', 'twitter', dll
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


class OPD(Base):
    __tablename__ = "opd"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    name = Column(String(150), unique=True, nullable=False)
    slug = Column(String(150), unique=True, nullable=False)


class UserAccount(Base):
    __tablename__ = "user_accounts"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="opd")
    status = Column(String(20), nullable=False, default="pending")
    opd_id = Column(String(50), nullable=True)
    opd_name = Column(String(150), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    approved_at = Column(DateTime(timezone=True), nullable=True)
    approved_by = Column(String(50), nullable=True)