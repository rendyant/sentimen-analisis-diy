import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from config import DATABASE_URL

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQLITE_PATH = os.path.join(BASE_DIR, "reviews.db")

# Coba konek ke DATABASE_URL utama (Supabase/Postgres), fallback cepat ke SQLite lokal jika gagal/offline
try:
    if not DATABASE_URL or DATABASE_URL.startswith("sqlite"):
        raise ValueError("Gunakan SQLite lokal")
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args={"connect_timeout": 10} if "postgresql" in DATABASE_URL else {},
    )
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("[INFO] Berhasil terhubung ke database utama (PostgreSQL/Supabase)")
except Exception as e:
    print(f"[INFO] Menggunakan database SQLite lokal ({SQLITE_PATH})")
    engine = create_engine(f"sqlite:///{SQLITE_PATH}", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_schema_columns():
    """Tambahkan kolom baru secara aman jika tabel reviews sudah ada di Postgres/SQLite."""
    try:
        with engine.begin() as conn:
            dialect = engine.dialect.name
            if dialect == "postgresql":
                conn.execute(text("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS ai_model VARCHAR(100)"))
            else:
                cols = conn.execute(text("PRAGMA table_info(reviews)")).fetchall()
                col_names = {row[1] for row in cols}
                if cols and "ai_model" not in col_names:
                    conn.execute(text("ALTER TABLE reviews ADD COLUMN ai_model VARCHAR(100)"))
    except Exception as e:
        print(f"[INFO] Schema migration note: {e}")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
