import asyncio
from datetime import datetime
from ntscraper import Nitter
from sqlalchemy.orm import Session

from database.models import Review
from scrapers.utils import make_id


async def scrape_twitter_for_opd(opd: dict, db: Session, max_tweets: int = 30) -> int:
    """Scrape tweet / X untuk satu OPD menggunakan Nitter."""
    added = 0
    try:
        scraper = Nitter(log_level=0)
        tweets = scraper.get_tweets(opd["twitter_query"], mode="term", number=max_tweets)

        if not tweets or "tweets" not in tweets:
            return 0

        for tweet in tweets["tweets"]:
            teks = tweet.get("text", "").strip()
            if not teks or len(teks) < 10:
                continue

            tweet_id = make_id(tweet.get("link", teks))

            if db.query(Review).filter(Review.id == tweet_id).first():
                continue

            review = Review(
                id=tweet_id,
                instansi_id=opd["id"],
                instansi_nama=opd["nama"],
                sumber="twitter",
                penulis=tweet.get("user", {}).get("name", "Anonymous"),
                teks=teks,
                rating=None,
                tanggal=tweet.get("date", ""),
                url=tweet.get("link", ""),
                scraped_at=datetime.now().isoformat(),
            )
            db.add(review)
            added += 1

        db.commit()
        print(f"✅ Twitter {opd['nama']}: {added} baru")

    except Exception as e:
        print(f"❌ Error Twitter {opd['nama']}: {e}")
        db.rollback()

    return added


async def scrape_all_social(db: Session, opds: list) -> int:
    """Scrape seluruh media sosial untuk semua OPD."""
    total = 0
    for opd in opds:
        total += await scrape_twitter_for_opd(opd, db)
        await asyncio.sleep(2)
    return total
