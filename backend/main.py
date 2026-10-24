from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database.db import engine, Base
from routers import reviews, analyze, scraper, users
from scheduler import start_scheduler
import uvicorn


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sentimen Analisis DIY API",
    description="API terpadu untuk agregasi ulasan, analisis sentimen AI, dan manajemen OPD Pemda DIY",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Endpoint Scraping & Sentimen (/api/...)
app.include_router(reviews.router, prefix="/api", tags=["Reviews"])
app.include_router(analyze.router, prefix="/api", tags=["AI Analysis"])
app.include_router(scraper.router, prefix="/api", tags=["Scraper"])

# Endpoint Manajemen User, Auth & OPD (/auth/..., /admin/..., /opd)
app.include_router(users.router)


@app.get("/")
def root():
    return {"message": "Sentimen Analisis DIY API", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)