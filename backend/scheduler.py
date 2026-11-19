from datetime import datetime
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from database.db import SessionLocal
from routers.scraper import _post_scrape_ai_classify
from scrapers import scrape_all_news, scrape_all_maps, scrape_all_social
from config import OPDS

logger = logging.getLogger(__name__)


async def _run_scheduled_job(label: str, scrape_fn):
    started_at = datetime.now().isoformat()
    db = SessionLocal()
    try:
        logger.info(f"⏰ Auto scraping {label} dimulai...")
        await scrape_fn(db, OPDS)
        await _post_scrape_ai_classify(db, started_at)
        logger.info(f"✅ Auto scraping {label} selesai")
    except Exception as e:
        logger.error(f"❌ Error auto scraping {label}: {e}")
    finally:
        db.close()


async def job_scrape_news():
    await _run_scheduled_job("berita", scrape_all_news)


async def job_scrape_maps():
    await _run_scheduled_job("Maps", scrape_all_maps)


async def job_scrape_social():
    await _run_scheduled_job("sosmed", scrape_all_social)


def start_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler()

    # Scraping berita setiap 6 jam
    scheduler.add_job(job_scrape_news, IntervalTrigger(hours=6), id="scrape_news")

    # Scraping Maps setiap 24 jam
    scheduler.add_job(job_scrape_maps, IntervalTrigger(hours=24), id="scrape_maps")

    # Scraping sosmed setiap 12 jam
    scheduler.add_job(job_scrape_social, IntervalTrigger(hours=12), id="scrape_social")

    scheduler.start()
    logger.info("✅ Scheduler aktif — auto scraping berjalan")
    return scheduler
