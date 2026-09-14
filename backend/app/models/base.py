from abc import ABC, abstractmethod
from typing import Any, Dict
import numpy as np


class BaseInferenceModel(ABC):
    """Abstract base class for inference model wrappers."""

    def __init__(self, model_path: str, version: str) -> None:
        self.model_path = model_path
        self.version = version
        self.is_loaded = False
        self._load_model()

    @abstractmethod
    def _load_model(self) -> None:
        """Load model weights or setup fallback mock predictor."""
        pass

    @abstractmethod
    def predict(self, image_np: np.ndarray) -> Dict[str, Any]:
        """Run model inference on preprocessed numpy image."""
        pass
