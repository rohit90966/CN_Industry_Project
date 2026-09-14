import logging
from pathlib import Path
from typing import Any, Dict
import cv2
import numpy as np
from app.models.base import BaseInferenceModel

logger = logging.getLogger(__name__)

try:
    import torch
    import torchvision.transforms as T
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False


class SurfaceClassifierModel(BaseInferenceModel):
    """Classification model engine for surface defect detection (OK vs DEFECT)."""

    def _load_model(self) -> None:
        self.torch_model = None
        path = Path(self.model_path)

        if TORCH_AVAILABLE and path.is_file():
            try:
                # Load PyTorch checkpoint if file exists
                self.torch_model = torch.load(self.model_path, map_location="cpu")
                if hasattr(self.torch_model, "eval"):
                    self.torch_model.eval()
                self.is_loaded = True
                logger.info(f"Successfully loaded PyTorch classifier from {self.model_path}")
                return
            except Exception as e:
                logger.warning(f"Failed to load PyTorch classifier weights ({e}). Falling back to heuristic engine.")

        # Fallback predictor status
        self.is_loaded = True
        logger.info(f"Initialized classification engine with fallback heuristic mode (Version: {self.version})")

    def predict(self, image_np: np.ndarray) -> Dict[str, Any]:
        """Run classification on input numpy RGB image."""
        if self.torch_model is not None and TORCH_AVAILABLE:
            try:
                transform = T.Compose([
                    T.ToPILImage(),
                    T.Resize((224, 224)),
                    T.ToTensor(),
                    T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
                ])
                tensor_img = transform(image_np).unsqueeze(0)
                with torch.no_grad():
                    output = self.torch_model(tensor_img)
                    probs = torch.softmax(output, dim=1)
                    confidence, predicted_idx = torch.max(probs, 1)

                is_defect = bool(predicted_idx.item() == 1)
                return {
                    "label": "DEFECT" if is_defect else "OK",
                    "confidence": round(float(confidence.item()), 4),
                    "defect_type": "Surface Anomaly" if is_defect else "None",
                }
            except Exception as e:
                logger.error(f"PyTorch prediction error: {e}. Executing heuristic fallback.")

        # Heuristic analysis based on gradient variance and intensity contrast
        gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        edges = cv2.Canny(gray, 100, 200)
        edge_density = float(np.mean(edges > 0))

        # Higher edge density & high laplacian variance indicate potential surface defects/cracks
        is_defect = edge_density > 0.04 or laplacian_var > 800.0
        confidence = min(0.99, max(0.65, float(0.70 + (edge_density * 2.0)))) if is_defect else min(0.98, max(0.75, float(0.95 - (edge_density * 1.5))))

        return {
            "label": "DEFECT" if is_defect else "OK",
            "confidence": round(confidence, 4),
            "defect_type": "Scratch/Crack/Pit" if is_defect else "None",
        }
