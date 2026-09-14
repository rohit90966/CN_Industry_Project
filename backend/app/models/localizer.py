import logging
from pathlib import Path
from typing import Any, Dict, List
import cv2
import numpy as np
from app.models.base import BaseInferenceModel

logger = logging.getLogger(__name__)


class AnomalyLocalizerModel(BaseInferenceModel):
    """Localization model engine for defect heatmap and bounding box detection."""

    def _load_model(self) -> None:
        self.torch_model = None
        self.device = "cpu"
        path = Path(self.model_path)

        if path.is_file():
            try:
                import torch
                from anomalib.models import Patchcore

                self.device = "cuda" if torch.cuda.is_available() else "cpu"
                # This is a trusted, locally trained Lightning checkpoint. Patchcore's
                # loader restores both the feature extractor and its memory bank.
                self.torch_model = Patchcore.load_from_checkpoint(
                    str(path), map_location=self.device
                )
                self.torch_model.to(self.device).eval()
                self.is_loaded = True
                logger.info("Loaded PatchCore checkpoint from %s on %s", path, self.device)
                return
            except Exception as e:
                logger.exception("Could not load PatchCore checkpoint (%s). Using fallback localization engine.", e)

        self.is_loaded = True
        logger.info(f"Initialized localization engine (Version: {self.version})")

    def predict(self, image_np: np.ndarray) -> Dict[str, Any]:
        """Compute anomaly map, anomaly score, and bounding boxes for defect regions."""
        if self.torch_model is not None:
            try:
                import torch

                # Anomalib stores the preprocessing pipeline with the checkpoint,
                # preserving the resize and ImageNet normalization used in training.
                tensor = torch.from_numpy(image_np.copy()).permute(2, 0, 1).float() / 255.0
                tensor = tensor.unsqueeze(0).to(self.device)
                tensor = self.torch_model.pre_processor(tensor)
                with torch.inference_mode():
                    raw_prediction = self.torch_model.model(tensor)
                    prediction = self.torch_model.post_processor(raw_prediction)

                score = float(prediction.pred_score.detach().cpu().flatten()[0])
                heatmap = prediction.anomaly_map.detach().cpu().squeeze().numpy().astype(np.float32)
                heatmap = cv2.resize(heatmap, (image_np.shape[1], image_np.shape[0]))

                pred_mask = prediction.pred_mask
                if pred_mask is None:
                    mask = (heatmap >= 0.5).astype(np.uint8) * 255
                else:
                    mask = pred_mask.detach().cpu().squeeze().numpy().astype(np.uint8) * 255
                    mask = cv2.resize(mask, (image_np.shape[1], image_np.shape[0]), interpolation=cv2.INTER_NEAREST)

                contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                bounding_boxes: List[Dict[str, int]] = []
                minimum_area = max(4, int(image_np.shape[0] * image_np.shape[1] * 0.0001))
                for contour in contours:
                    if cv2.contourArea(contour) >= minimum_area:
                        x, y, w, h = cv2.boundingRect(contour)
                        bounding_boxes.append({"x": int(x), "y": int(y), "w": int(w), "h": int(h)})

                is_anomaly = bool(prediction.pred_label.detach().cpu().flatten()[0]) if prediction.pred_label is not None else score >= 0.5
                defect_region_str = None
                if bounding_boxes:
                    box = max(bounding_boxes, key=lambda item: item["w"] * item["h"])
                    horizontal = "left" if box["x"] < image_np.shape[1] / 2 else "right"
                    vertical = "top" if box["y"] < image_np.shape[0] / 2 else "bottom"
                    defect_region_str = f"{vertical}-{horizontal} region ({len(bounding_boxes)} anomaly cluster{'s' if len(bounding_boxes) != 1 else ''})"

                return {
                    "anomaly_score": round(float(np.clip(score, 0.0, 1.0)), 4),
                    "heatmap": np.clip(heatmap, 0.0, 1.0),
                    "bounding_boxes": bounding_boxes,
                    "defect_region": defect_region_str,
                    # Lets the pipeline use the trained PatchCore verdict instead of a heuristic classifier.
                    "model_prediction": {
                        "label": "DEFECT" if is_anomaly else "OK",
                        "confidence": round(float(np.clip(score if is_anomaly else 1.0 - score, 0.0, 1.0)), 4),
                        "defect_type": "PatchCore anomaly" if is_anomaly else "None",
                    },
                }
            except Exception as error:
                logger.exception("PatchCore inference failed (%s). Falling back to classical localization.", error)

        gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        # Adaptive thresholding for defect contrast extraction
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2
        )

        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        bounding_boxes: List[Dict[str, int]] = []
        height, width = gray.shape
        min_area = int((height * width) * 0.0005)
        max_area = int((height * width) * 0.25)

        total_defect_area = 0
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if min_area < area < max_area:
                x, y, w, h = cv2.boundingRect(cnt)
                bounding_boxes.append({"x": int(x), "y": int(y), "w": int(w), "h": int(h)})
                total_defect_area += area

        anomaly_score = min(0.99, float(total_defect_area / (height * width * 0.05)))
        anomaly_score = round(max(0.05, anomaly_score), 4)

        # Build anomaly heatmap matrix (normalized float32 between 0.0 and 1.0)
        heatmap_matrix = cv2.GaussianBlur(thresh.astype(np.float32) / 255.0, (15, 15), 0)

        defect_region_str = None
        if bounding_boxes:
            b = bounding_boxes[0]
            quadrant_x = "left" if b["x"] < width / 2 else "right"
            quadrant_y = "top" if b["y"] < height / 2 else "bottom"
            defect_region_str = f"{quadrant_y}-{quadrant_x} region ({len(bounding_boxes)} defect cluster{'s' if len(bounding_boxes) > 1 else ''})"

        return {
            "anomaly_score": anomaly_score,
            "heatmap": heatmap_matrix,
            "bounding_boxes": bounding_boxes,
            "defect_region": defect_region_str,
        }
