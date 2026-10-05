import asyncio
from sqlalchemy.orm import Session

from scrapers.social.twitter import scrape_twitter
from scrapers.social.instagram import scrape_instagram
from scrapers.social.facebook import scrape_facebook
from scrapers.social.tiktok import scrape_tiktok
from scrapers.social.youtube import scrape_youtube


async def scrape_social_for_opd(opd: dict, db: Session) -> int:
    """Scrape seluruh kanal media sosial untuk satu OPD."""
    total = 0
    total += await scrape_twitter(opd, db)
    total += await scrape_instagram(opd, db)
    total += await scrape_facebook(opd, db)
    total += await scrape_tiktok(opd, db)
    total += await scrape_youtube(opd, db)
    print(f"✅ Total Sosmed (X, IG, FB, TikTok, YT) {opd['nama']}: {total} aspirasi baru")
    return total


async def scrape_all_social(db: Session, opds: list) -> int:
    """Scrape seluruh kanal media sosial untuk seluruh 24 OPD."""
    grand_total = 0
    for opd in opds:
        grand_total += await scrape_social_for_opd(opd, db)
        await asyncio.sleep(0.5)
    return grand_total


__all__ = [
    "scrape_twitter",
    "scrape_instagram",
    "scrape_facebook",
    "scrape_tiktok",
    "scrape_youtube",
    "scrape_social_for_opd",
    "scrape_all_social",
]