import feedparser
from email.utils import parsedate_to_datetime
from datetime import datetime
from sqlalchemy.orm import Session
from database.models import Review
from scrapers.utils import clean_html, make_id

async def scrape_instagram(opd: dict, db: Session, max_items: int = 100) -> int:
    query = f"site:instagram.com {opd['nama']}".replace(" ", "+")
    rss_url = f"https://news.google.com/rss/search?q={query}&hl=id&gl=ID&ceid=ID:id"
    added = 0
    try:
        feed = feedparser.parse(rss_url)
        for entry in feed.entries[:max_items]:
            teks = clean_html(f"{entry.get('title', '')}. {entry.get('summary', '')}")
            teks = teks.replace("- Instagram", "").strip()
            if len(teks) < 10: continue

            review_id = make_id(entry.get("link", teks))
            if db.query(Review).filter(Review.id == review_id).first(): continue

            try: tanggal = parsedate_to_datetime(entry.get("published", "")).isoformat()
            except: tanggal = entry.get("published", "")

            db.add(Review(
                id=review_id, instansi_id=opd["id"], instansi_nama=opd["nama"],
                sumber="instagram", penulis=entry.get("source", {}).get("title", "Instagram Post"),
                teks=teks, rating=None, tanggal=tanggal, url=entry.get("link", ""),
                scraped_at=datetime.now().isoformat(),
            ))
            added += 1
        db.commit()
    except Exception as e:
        print(f"❌ Error Instagram {opd['nama']}: {e}")
        db.rollback()
    return added