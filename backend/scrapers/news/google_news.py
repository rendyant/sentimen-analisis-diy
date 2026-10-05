import asyncio
from datetime import datetime
from email.utils import parsedate_to_datetime
import feedparser
from sqlalchemy.orm import Session

from database.models import Review
from scrapers.utils import clean_html, make_id


async def scrape_news_for_opd(opd: dict, db: Session, max_results: int = 20) -> int:
    """Scrape berita Google News RSS untuk satu OPD menggunakan multi-keyword."""
    # Mendukung format multi-keyword (news_queries) maupun single keyword lama (news_query)
    queries = opd.get("news_queries") or [opd.get("news_query", opd["nama"])]
    total_added = 0

    for query in queries:
        formatted_query = query.replace(" ", "+")
        rss_url = f"https://news.google.com/rss/search?q={formatted_query}&hl=id&gl=ID&ceid=ID:id"

        try:
            feed = feedparser.parse(rss_url)

            for entry in feed.entries[:max_results]:
                title = entry.get("title", "")
                summary = entry.get("summary", "")
                teks = clean_html(f"{title}. {summary}")
                if not teks:
                    continue

                review_id = make_id(entry.get("link", teks))

                # Skip jika berita sudah pernah tersimpan di database
                if db.query(Review).filter(Review.id == review_id).first():
                    continue

                source = entry.get("source", {}).get("title", "Unknown")

                try:
                    tanggal = parsedate_to_datetime(entry.get("published", "")).isoformat()
                except Exception:
                    tanggal = entry.get("published", "")

                review = Review(
                    id=review_id,
                    instansi_id=opd["id"],
                    instansi_nama=opd["nama"],
                    sumber="berita",
                    penulis=source,
                    teks=teks,
                    rating=None,
                    tanggal=tanggal,
                    url=entry.get("link", ""),
                    scraped_at=datetime.now().isoformat(),
                )
                db.add(review)
                total_added += 1

            db.commit()

        except Exception as e:
            print(f"❌ Error query '{query}' untuk {opd['nama']}: {e}")
            db.rollback()

        await asyncio.sleep(0.5)

    print(f"✅ Total berita baru {opd['nama']}: {total_added}")
    return total_added


async def scrape_all_news(db: Session, opds: list) -> int:
    """Scrape berita untuk seluruh OPD."""
    total = 0
    for opd in opds:
        total += await scrape_news_for_opd(opd, db)
        await asyncio.sleep(1)
    return total