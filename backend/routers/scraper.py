from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session
from database.db import get_db
from scrapers import scrape_all_news, scrape_all_maps, scrape_all_social
from config import OPDS

router = APIRouter()

scraping_status = {"is_running": False, "message": "Idle", "progress": 0}


@router.post("/scrape/news")
async def scrape_news(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if scraping_status["is_running"]:
        return {"message": "Scraping sedang berjalan, harap tunggu..."}
    background_tasks.add_task(run_news_scraping, db)
    return {"message": "Scraping berita dimulai di background"}


@router.post("/scrape/maps")
async def scrape_maps(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if scraping_status["is_running"]:
        return {"message": "Scraping sedang berjalan, harap tunggu..."}
    background_tasks.add_task(run_maps_scraping, db)
    return {"message": "Scraping Google Maps dimulai di background"}


@router.post("/scrape/social")
async def scrape_social(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if scraping_status["is_running"]:
        return {"message": "Scraping sedang berjalan, harap tunggu..."}
    background_tasks.add_task(run_social_scraping, db)
    return {"message": "Scraping Twitter/X dimulai di background"}


@router.get("/scrape/status")
def get_scraping_status():
    return scraping_status


async def run_news_scraping(db: Session):
    scraping_status["is_running"] = True
    scraping_status["message"] = "Scraping berita..."
    try:
        await scrape_all_news(db, OPDS)
        scraping_status["message"] = "Scraping berita selesai ✅"
    except Exception as e:
        scraping_status["message"] = f"Error: {str(e)}"
    finally:
        scraping_status["is_running"] = False


async def run_maps_scraping(db: Session):
    scraping_status["is_running"] = True
    scraping_status["message"] = "Scraping Google Maps..."
    try:
        await scrape_all_maps(db, OPDS)
        scraping_status["message"] = "Scraping Maps selesai ✅"
    except Exception as e:
        scraping_status["message"] = f"Error: {str(e)}"
    finally:
        scraping_status["is_running"] = False


async def run_social_scraping(db: Session):
    scraping_status["is_running"] = True
    scraping_status["message"] = "Scraping Twitter/X..."
    try:
        await scrape_all_social(db, OPDS)
        scraping_status["message"] = "Scraping Twitter selesai ✅"
    except Exception as e:
        scraping_status["message"] = f"Error: {str(e)}"
    finally:
        scraping_status["is_running"] = False