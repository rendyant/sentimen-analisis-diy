from fastapi import APIRouter
from routers import reviews, analyze, scraper, chat, users

# Main Router sebagai pengumpul seluruh sub-router fitur
main_router = APIRouter()

# Kelompok Endpoint API Sentimen, AI & Scraping (/api/...)
main_router.include_router(reviews.router, prefix="/api", tags=["Reviews"])
main_router.include_router(analyze.router, prefix="/api", tags=["AI Analysis"])
main_router.include_router(scraper.router, prefix="/api", tags=["Scraper"])
main_router.include_router(chat.router, prefix="/api", tags=["AI Chatbot"])

# Kelompok Endpoint Auth, Manajemen User & OPD (/auth/..., /admin/..., /opd)
main_router.include_router(users.router)
