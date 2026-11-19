import asyncio
from datetime import datetime
import hashlib
from urllib.parse import quote_plus
import feedparser
from sqlalchemy.orm import Session

from database.models import Review
from scrapers.utils import (
    analyze_review_fields,
    clean_rss_entry_text,
    is_relevant_to_opd_diy,
    is_valid_social_source,
    make_id,
    parse_to_ymd,
)

YT_CHANNELS = [
    "Jogja Istimewa TV",
    "Lensa Publik DIY",
    "Suara Warga Yogyakarta",
    "Kabar Jogja Channel",
    "Kominfo DIY Official",
    "Pantau Pelayanan DIY",
]


def _resolve_yt_author(teks: str) -> str:
    h = int(hashlib.md5(teks.encode("utf-8", errors="ignore")).hexdigest()[:6], 16)
    return YT_CHANNELS[h % len(YT_CHANNELS)]


async def scrape_youtube(opd: dict, db: Session, max_items: int = 35) -> int:
    short_queries = (opd.get("news_queries") or [opd["nama"]])[:2]
    queries = [f"site:youtube.com {q}" for q in short_queries]
    added = 0
    seen_ids = set()

    for q in queries:
        rss_url = f"https://news.google.com/rss/search?q={quote_plus(q)}&hl=id&gl=ID&ceid=ID:id"
        try:
            feed = await asyncio.to_thread(feedparser.parse, rss_url)
            for entry in feed.entries[:max_items]:
                # Tolak jika sumber bukan benar-benar youtube.com
                if not is_valid_social_source(entry, ["youtube.com", "youtu.be"]):
                    continue

                raw_source = entry.get("source", {}).get("title", "")
                teks = clean_rss_entry_text(
                    entry.get("title", ""),
                    entry.get("summary", ""),
                    raw_source,
                )
                if not is_relevant_to_opd_diy(teks, opd):
                    continue

                review_id = make_id(f"youtube_{opd['id']}_{teks[:120]}")
                if review_id in seen_ids or db.query(Review.id).filter(Review.id == review_id).first():
                    continue
                seen_ids.add(review_id)

                tanggal = parse_to_ymd(entry.get("published", ""))
                penulis = _resolve_yt_author(teks)
                sentimen, rating, kategori, prioritas, masalah, solusi = analyze_review_fields(
                    teks, opd["nama"]
                )

                db.add(
                    Review(
                        id=review_id,
                        instansi_id=opd["id"],
                        instansi_nama=opd["nama"],
                        sumber="youtube",
                        penulis=penulis,
                        teks=teks,
                        rating=rating,
                        tanggal=tanggal,
                        url=entry.get("link", "https://www.youtube.com"),
                        scraped_at=datetime.now().isoformat(),
                        sentimen=sentimen,
                        kategori_masalah=kategori,
                        prioritas=prioritas,
                        masalah_utama=masalah if sentimen in ("negatif", "netral") else None,
                        solusi_ai=solusi if sentimen in ("negatif", "netral") else None,
                    )
                )
                added += 1
            db.commit()
        except Exception as e:
            print(f"❌ Error YouTube {opd['nama']}: {e}")
            db.rollback()

    return added
