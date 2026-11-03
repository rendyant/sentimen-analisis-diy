from fastapi import APIRouter
from routers import reviews, analyze, scraper, users

# Main Router sebagai pengumpul seluruh sub-router fitur
main_router = APIRouter()

# Kelompok Endpoint API Sentimen, Rekomendasi AI & Scraping (/api/...)
main_router.include_router(reviews.router, prefix="/api", tags=["Reviews"])
main_router.include_router(analyze.router, prefix="/api", tags=["AI Recommendations & Analysis"])
main_router.include_router(scraper.router, prefix="/api", tags=["Scraper"])

# Kelompok Endpoint Auth, Manajemen User & OPD (/auth/..., /admin/..., /opd)
main_router.include_router(users.router)
