import logging
from typing import Dict
from app.config import settings
from app.models.classifier import SurfaceClassifierModel
from app.models.localizer import AnomalyLocalizerModel

logger = logging.getLogger(__name__)


class ModelRegistry:
    """Singleton model registry for managing dual-model lifecycles and metadata."""

    def __init__(self) -> None:
        self._classifier: SurfaceClassifierModel = None
        self._localizer: AnomalyLocalizerModel = None
        self.is_initialized: bool = False

    def load_models(self) -> None:
        """Load both classification and localization models into memory."""
        if self.is_initialized:
            return
        logger.info("Initializing dual-model inference engines...")
        self._classifier = SurfaceClassifierModel(
            model_path=settings.CLASSIFIER_MODEL_PATH,
            version=settings.CLASSIFIER_VERSION,
        )
        self._localizer = AnomalyLocalizerModel(
            model_path=settings.LOCALIZER_MODEL_PATH,
            version=settings.LOCALIZER_VERSION,
        )
        self.is_initialized = True
        logger.info("Dual-model inference engines ready.")

    @property
    def classifier(self) -> SurfaceClassifierModel:
        if not self.is_initialized:
            self.load_models()
        return self._classifier

    @property
    def localizer(self) -> AnomalyLocalizerModel:
        if not self.is_initialized:
            self.load_models()
        return self._localizer

    def get_status(self) -> Dict[str, bool]:
        """Return loading status of models."""
        return {
            "classifier_loaded": self.classifier.is_loaded if self._classifier else False,
            "localizer_loaded": self.localizer.is_loaded if self._localizer else False,
            "all_ready": self.is_initialized,
        }

    def get_combined_version(self) -> str:
        """Get combined version identifier for inference speed and model audit logging."""
        c_ver = self.classifier.version if self._classifier else "uninitialized"
        l_ver = self.localizer.version if self._localizer else "uninitialized"
        return f"{c_ver} + {l_ver}"



# Global model registry instance
model_registry = ModelRegistry()
