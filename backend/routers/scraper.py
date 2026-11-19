from datetime import datetime
from fastapi import APIRouter, BackgroundTasks
from database.db import SessionLocal
from database.models import Review
from routers.reviews import ensure_seed_reviews
from ai.solver import classify_db_reviews_in_batches, get_classifier_client, AI_ROUTER_CONFIG
from scrapers import scrape_all_news, scrape_all_maps, scrape_all_social
from config import OPDS

router = APIRouter()

scraping_status = {"is_running": False, "message": "Idle", "progress": 0}


async def _post_scrape_ai_classify(db, started_at: str) -> dict | None:
    """Jalankan Pool Multi-Model Khusus Scraping (50 ulasan/request) pada ulasan yang baru masuk."""
    if not get_classifier_client():
        ensure_seed_reviews(db)
        return None

    new_reviews = (
        db.query(Review)
        .filter(Review.scraped_at >= started_at)
        .order_by(Review.scraped_at.desc())
        .all()
    )
    if not new_reviews:
        return None

    scraping_status["message"] = f"Mengklasifikasi {len(new_reviews)} ulasan baru dengan AI (50/batch)..."
    batch_size = int(AI_ROUTER_CONFIG.get("classifier_batch_size") or 50)
    return await classify_db_reviews_in_batches(db, new_reviews, batch_size=batch_size)


@router.post("/scrape/news")
async def scrape_news(background_tasks: BackgroundTasks):
    if scraping_status["is_running"]:
        return {"message": "Scraping sedang berjalan, harap tunggu..."}
    background_tasks.add_task(run_news_scraping)
    return {"message": "Scraping berita dimulai di background"}


@router.post("/scrape/maps")
async def scrape_maps(background_tasks: BackgroundTasks):
    if scraping_status["is_running"]:
        return {"message": "Scraping sedang berjalan, harap tunggu..."}
    background_tasks.add_task(run_maps_scraping)
    return {"message": "Scraping Google Maps dimulai di background"}


@router.post("/scrape/social")
async def scrape_social(background_tasks: BackgroundTasks):
    if scraping_status["is_running"]:
        return {"message": "Scraping sedang berjalan, harap tunggu..."}
    background_tasks.add_task(run_social_scraping)
    return {"message": "Scraping Media Sosial (X, IG, FB, TikTok, YT) dimulai di background"}


@router.post("/scrape/all")
async def scrape_all(background_tasks: BackgroundTasks):
    if scraping_status["is_running"]:
        return {"message": "Scraping sedang berjalan, harap tunggu..."}
    background_tasks.add_task(run_all_scraping)
    return {"message": "Scraping seluruh kanal (Berita, Sosmed, Maps) dimulai di background"}


@router.get("/scrape/status")
def get_scraping_status():
    return scraping_status


async def run_news_scraping():
    scraping_status["is_running"] = True
    scraping_status["message"] = "Scraping berita 24 OPD..."
    started_at = datetime.now().isoformat()
    db = SessionLocal()
    try:
        added = await scrape_all_news(db, OPDS)
        await _post_scrape_ai_classify(db, started_at)
        scraping_status["message"] = f"Scraping berita selesai ✅ (+{added} ulasan baru)"
    except Exception as e:
        scraping_status["message"] = f"Error: {str(e)}"
    finally:
        db.close()
        scraping_status["is_running"] = False


async def run_maps_scraping():
    scraping_status["is_running"] = True
    scraping_status["message"] = "Scraping Google Maps 24 OPD..."
    started_at = datetime.now().isoformat()
    db = SessionLocal()
    try:
        added = await scrape_all_maps(db, OPDS)
        await _post_scrape_ai_classify(db, started_at)
        scraping_status["message"] = f"Scraping Google Maps selesai ✅ (+{added} ulasan baru)"
    except Exception as e:
        scraping_status["message"] = f"Error: {str(e)}"
    finally:
        db.close()
        scraping_status["is_running"] = False


async def run_social_scraping():
    scraping_status["is_running"] = True
    scraping_status["message"] = "Scraping Sosmed (X, IG, FB, TikTok, YT) 24 OPD..."
    started_at = datetime.now().isoformat()
    db = SessionLocal()
    try:
        added = await scrape_all_social(db, OPDS)
        await _post_scrape_ai_classify(db, started_at)
        scraping_status["message"] = f"Scraping Sosmed selesai ✅ (+{added} ulasan baru)"
    except Exception as e:
        scraping_status["message"] = f"Error: {str(e)}"
    finally:
        db.close()
        scraping_status["is_running"] = False


async def run_all_scraping():
    scraping_status["is_running"] = True
    started_at = datetime.now().isoformat()
    db = SessionLocal()
    try:
        scraping_status["message"] = "1/3 Scraping Berita 24 OPD..."
        n_news = await scrape_all_news(db, OPDS)
        scraping_status["message"] = "2/3 Scraping Sosmed 24 OPD..."
        n_soc = await scrape_all_social(db, OPDS)
        scraping_status["message"] = "3/3 Scraping Google Maps 24 OPD..."
        n_maps = await scrape_all_maps(db, OPDS)
        await _post_scrape_ai_classify(db, started_at)
        total = n_news + n_soc + n_maps
        scraping_status["message"] = f"Seluruh scraping selesai ✅ (+{total} ulasan baru)"
    except Exception as e:
        scraping_status["message"] = f"Error: {str(e)}"
    finally:
        db.close()
        scraping_status["is_running"] = False
