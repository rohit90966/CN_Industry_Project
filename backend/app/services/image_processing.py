from pathlib import Path
from typing import Dict, List, Tuple
import cv2
import numpy as np
from PIL import Image
import io


def decode_image_bytes(image_bytes: bytes) -> np.ndarray:
    """Convert raw image file bytes into RGB numpy array."""
    pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    return np.array(pil_img)


def generate_defect_overlay(
    image_np: np.ndarray,
    heatmap: np.ndarray,
    bounding_boxes: List[Dict[str, int]],
    output_path: Path,
    alpha: float = 0.4,
) -> Tuple[str, Path]:
    """Generate visual overlay with heatmap and bounding boxes, saving to disk."""
    # Convert RGB input image to BGR for OpenCV processing
    bgr_img = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)

    # Normalize heatmap matrix to 0-255 uint8
    heatmap_uint8 = (np.clip(heatmap, 0.0, 1.0) * 255).astype(np.uint8)

    # Apply JET colormap for thermal defect visualization
    color_map = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)

    # Blend original image with color heatmap
    overlay = cv2.addWeighted(bgr_img, 1.0 - alpha, color_map, alpha, 0)

    # Draw bounding boxes and labels for flagged defect areas
    for bbox in bounding_boxes:
        x, y, w, h = bbox["x"], bbox["y"], bbox["w"], bbox["h"]
        cv2.rectangle(overlay, (x, y), (x + w, y + h), (0, 0, 255), 2)
        cv2.putText(
            overlay,
            "DEFECT REGION",
            (x, max(15, y - 5)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (0, 0, 255),
            1,
            cv2.LINE_AA,
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(output_path), overlay)

    return output_path.name, output_path
