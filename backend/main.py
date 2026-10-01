from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database.db import engine, Base
from routers import reviews, analyze, scraper
from scheduler import start_scheduler
import uvicorn


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Jalankan scheduler saat server start
    start_scheduler()
    yield


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sentimen Analisis DIY API",
    description="API untuk agregasi ulasan instansi pemerintah DIY",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reviews.router, prefix="/api", tags=["Reviews"])
app.include_router(analyze.router, prefix="/api", tags=["AI Analysis"])
app.include_router(scraper.router, prefix="/api", tags=["Scraper"])


@app.get("/")
def root():
    return {"message": "Sentimen Analisis DIY API", "docs": "/docs"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)