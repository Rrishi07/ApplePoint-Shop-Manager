from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .config import settings
from .database import Base, engine
from .routers import auth, backup, dashboard, inventory, repairs, reports, sales

Base.metadata.create_all(bind=engine)

UPLOAD_DIR = Path(settings.upload_dir)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title=f"{settings.app_name} API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.include_router(auth.router)
app.include_router(inventory.router)
app.include_router(repairs.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(sales.router)
app.include_router(backup.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.app_name}
