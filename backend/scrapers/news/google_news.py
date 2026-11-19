import asyncio
from datetime import datetime
from urllib.parse import quote_plus
import feedparser
from sqlalchemy.orm import Session

from database.models import Review
from scrapers.utils import (
    analyze_review_fields,
    clean_rss_entry_text,
    is_relevant_to_opd_diy,
    make_id,
    parse_to_ymd,
)


async def scrape_news_for_opd(opd: dict, db: Session, max_results: int = 20) -> int:
    """Scrape berita Google News RSS untuk satu OPD menggunakan multi-keyword & auto-sentimen."""
    queries = opd.get("news_queries") or [opd.get("news_query", opd["nama"])]
    total_added = 0
    seen_ids = set()

    for query in queries:
        formatted_query = quote_plus(query)
        rss_url = f"https://news.google.com/rss/search?q={formatted_query}&hl=id&gl=ID&ceid=ID:id"

        try:
            feed = await asyncio.to_thread(feedparser.parse, rss_url)

            for entry in feed.entries[:max_results]:
                source = entry.get("source", {}).get("title", "Portal Berita DIY")
                teks = clean_rss_entry_text(
                    entry.get("title", ""),
                    entry.get("summary", ""),
                    source,
                )
                if not is_relevant_to_opd_diy(teks, opd):
                    continue

                review_id = make_id(f"berita_{opd['id']}_{teks[:120]}")

                # Skip jika berita sudah ada di batch ini atau di database
                if review_id in seen_ids or db.query(Review.id).filter(Review.id == review_id).first():
                    continue
                seen_ids.add(review_id)

                tanggal = parse_to_ymd(entry.get("published", ""))
                sentimen, rating, kategori, prioritas, masalah, solusi = analyze_review_fields(
                    teks, opd["nama"]
                )

                review = Review(
                    id=review_id,
                    instansi_id=opd["id"],
                    instansi_nama=opd["nama"],
                    sumber="berita",
                    penulis=source,
                    teks=teks,
                    rating=rating,
                    tanggal=tanggal,
                    url=entry.get("link", ""),
                    scraped_at=datetime.now().isoformat(),
                    sentimen=sentimen,
                    kategori_masalah=kategori,
                    prioritas=prioritas,
                    masalah_utama=masalah if sentimen in ("negatif", "netral") else None,
                    solusi_ai=solusi if sentimen in ("negatif", "netral") else None,
                )
                db.add(review)
                total_added += 1

            db.commit()

        except Exception as e:
            print(f"❌ Error query '{query}' untuk {opd['nama']}: {e}")
            db.rollback()

        await asyncio.sleep(0.3)

    print(f"✅ Total berita baru {opd['nama']}: {total_added}")
    return total_added


async def scrape_all_news(db: Session, opds: list) -> int:
    """Scrape berita untuk seluruh OPD."""
    total = 0
    for opd in opds:
        total += await scrape_news_for_opd(opd, db)
        await asyncio.sleep(0.5)
    return total
