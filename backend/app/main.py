from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.db.database import init_db
from app.models.registry import model_registry
from app.api import predict, history, system


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle event handler."""
    # Startup tasks
    settings.create_directories()
    init_db()
    model_registry.load_models()
    yield
    # Shutdown tasks if needed


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Automated Surface Defect Detection API for Industrial Manufacturing (MVTec AD & Ceiling Fan Inspection)",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware for cross-origin frontend dashboard integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static file routes for raw uploads and overlay heatmap images
app.mount("/static/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")
app.mount("/static/results", StaticFiles(directory=str(settings.RESULTS_DIR)), name="results")

# Register API endpoints at /api/v1 prefix AND root level for zero-config frontend compatibility
app.include_router(predict.router, prefix=settings.API_V1_STR)
app.include_router(history.router, prefix=settings.API_V1_STR)
app.include_router(system.router, prefix=settings.API_V1_STR)

app.include_router(predict.router)
app.include_router(history.router)
app.include_router(system.router)



@app.get("/", include_in_schema=False)
def root_redirect():
    return {
        "title": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "api_v1": settings.API_V1_STR,
    }
