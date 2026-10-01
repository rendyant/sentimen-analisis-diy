from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from database.db import SessionLocal
from scrapers import scrape_all_news, scrape_all_maps, scrape_all_social
from config import OPDS
import logging

logger = logging.getLogger(__name__)


async def job_scrape_news():
    db = SessionLocal()
    try:
        logger.info("⏰ Auto scraping berita dimulai...")
        await scrape_all_news(db, OPDS)
        logger.info("✅ Auto scraping berita selesai")
    except Exception as e:
        logger.error(f"❌ Error auto scraping berita: {e}")
    finally:
        db.close()


async def job_scrape_maps():
    db = SessionLocal()
    try:
        logger.info("⏰ Auto scraping Maps dimulai...")
        await scrape_all_maps(db, OPDS)
        logger.info("✅ Auto scraping Maps selesai")
    except Exception as e:
        logger.error(f"❌ Error auto scraping Maps: {e}")
    finally:
        db.close()


async def job_scrape_social():
    db = SessionLocal()
    try:
        logger.info("⏰ Auto scraping Twitter dimulai...")
        await scrape_all_social(db, OPDS)
        logger.info("✅ Auto scraping Twitter selesai")
    except Exception as e:
        logger.error(f"❌ Error auto scraping Twitter: {e}")
    finally:
        db.close()


def start_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler()

    # Scraping berita setiap 6 jam
    scheduler.add_job(job_scrape_news, IntervalTrigger(hours=6), id="scrape_news")

    # Scraping Maps setiap 24 jam
    scheduler.add_job(job_scrape_maps, IntervalTrigger(hours=24), id="scrape_maps")

    # Scraping Twitter setiap 12 jam
    scheduler.add_job(job_scrape_social, IntervalTrigger(hours=12), id="scrape_social")

    scheduler.start()
    logger.info("✅ Scheduler aktif — auto scraping berjalan")
    return scheduler