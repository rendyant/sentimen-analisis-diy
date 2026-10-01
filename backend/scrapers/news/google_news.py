import asyncio
from datetime import datetime
from email.utils import parsedate_to_datetime
import feedparser
from sqlalchemy.orm import Session

from database.models import Review
from scrapers.utils import clean_html, make_id


async def scrape_news_for_opd(opd: dict, db: Session, max_results: int = 30) -> int:
    """Scrape berita Google News RSS untuk satu OPD."""
    query = opd["news_query"].replace(" ", "+")
    rss_url = f"https://news.google.com/rss/search?q={query}&hl=id&gl=ID&ceid=ID:id"
    added = 0

    try:
        feed = feedparser.parse(rss_url)

        for entry in feed.entries[:max_results]:
            title = entry.get("title", "")
            summary = entry.get("summary", "")
            teks = clean_html(f"{title}. {summary}")
            if not teks:
                continue

            review_id = make_id(entry.get("link", teks))

            # Skip jika berita sudah ada di database
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
            added += 1

        db.commit()
        print(f"✅ Berita {opd['nama']}: {added} baru")

    except Exception as e:
        print(f"❌ Error berita {opd['nama']}: {e}")
        db.rollback()

    return added


async def scrape_all_news(db: Session, opds: list) -> int:
    """Scrape berita untuk seluruh OPD."""
    total = 0
    for opd in opds:
        total += await scrape_news_for_opd(opd, db)
        await asyncio.sleep(1)
    return total
