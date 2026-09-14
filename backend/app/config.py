import os
from pathlib import Path

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
    HAS_PYDANTIC = True
except ImportError:
    try:
        from pydantic import BaseSettings
        SettingsConfigDict = None
        HAS_PYDANTIC = True
    except ImportError:
        HAS_PYDANTIC = False

if HAS_PYDANTIC:
    class Settings(BaseSettings):
        PROJECT_NAME: str = "Surface Defect Detection API"
        VERSION: str = "1.0.0"
        API_V1_STR: str = "/api/v1"

        # Directory Paths
        BASE_DIR: Path = Path(__file__).resolve().parent.parent
        PROJECT_ROOT: Path = BASE_DIR.parent
        AI_DIR: Path = PROJECT_ROOT / "ai"
        UPLOAD_DIR: Path = BASE_DIR / "uploads"
        RESULTS_DIR: Path = BASE_DIR / "results"
        MODELS_DIR: Path = BASE_DIR / "saved_models"

        # Database
        DATABASE_URL: str = f"sqlite:///{BASE_DIR}/inspection_audit.db"

        # Model Settings
        CLASSIFIER_MODEL_PATH: str = str(MODELS_DIR / "classifier.pt")
        # PatchCore checkpoint trained on the MVTec AD metal_nut category.
        # Keep this path configurable through LOCALIZER_MODEL_PATH for deployments.
        LOCALIZER_MODEL_PATH: str = str(
            AI_DIR / "results" / "Patchcore" / "metal_nut" / "v2" / "weights" / "lightning" / "model.ckpt"
        )
        CLASSIFIER_VERSION: str = "ResNet50-v1.0"
        LOCALIZER_VERSION: str = "PatchCore-v1.0"

        # Fusion Thresholds
        CONFIDENCE_THRESHOLD: float = 0.75
        ANOMALY_SCORE_THRESHOLD: float = 0.65

        if SettingsConfigDict is not None:
            model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

        def create_directories(self) -> None:
            """Ensure necessary runtime directories exist."""
            self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
            self.RESULTS_DIR.mkdir(parents=True, exist_ok=True)
            self.MODELS_DIR.mkdir(parents=True, exist_ok=True)
else:
    class Settings:
        PROJECT_NAME: str = os.getenv("PROJECT_NAME", "Surface Defect Detection API")
        VERSION: str = "1.0.0"
        API_V1_STR: str = "/api/v1"

        BASE_DIR: Path = Path(__file__).resolve().parent.parent
        PROJECT_ROOT: Path = BASE_DIR.parent
        AI_DIR: Path = PROJECT_ROOT / "ai"
        UPLOAD_DIR: Path = BASE_DIR / "uploads"
        RESULTS_DIR: Path = BASE_DIR / "results"
        MODELS_DIR: Path = BASE_DIR / "saved_models"

        DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/inspection_audit.db")

        CLASSIFIER_MODEL_PATH: str = str(MODELS_DIR / "classifier.pt")
        LOCALIZER_MODEL_PATH: str = os.getenv(
            "LOCALIZER_MODEL_PATH",
            str(AI_DIR / "results" / "Patchcore" / "metal_nut" / "v2" / "weights" / "lightning" / "model.ckpt"),
        )
        CLASSIFIER_VERSION: str = "ResNet50-v1.0"
        LOCALIZER_VERSION: str = "PatchCore-v1.0"

        CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.75"))
        ANOMALY_SCORE_THRESHOLD: float = float(os.getenv("ANOMALY_SCORE_THRESHOLD", "0.65"))

        def create_directories(self) -> None:
            """Ensure necessary runtime directories exist."""
            self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
            self.RESULTS_DIR.mkdir(parents=True, exist_ok=True)
            self.MODELS_DIR.mkdir(parents=True, exist_ok=True)


    def create_directories(self) -> None:
        """Ensure necessary runtime directories exist."""
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        self.RESULTS_DIR.mkdir(parents=True, exist_ok=True)
        self.MODELS_DIR.mkdir(parents=True, exist_ok=True)


settings = Settings()
settings.create_directories()
