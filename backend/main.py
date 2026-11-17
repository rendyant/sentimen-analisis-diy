from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database.db import engine, Base
from routers import main_router
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
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Daftarkan Main Router (yang sudah membungkus seluruh endpoint fitur)
app.include_router(main_router)


@app.get("/")
def root():
    return {"message": "Sentimen Analisis DIY API", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)