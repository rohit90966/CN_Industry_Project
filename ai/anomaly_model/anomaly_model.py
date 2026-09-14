"""Reusable PatchCore-style anomaly detection components.

The module keeps model construction, calibration, inference, localization,
and artifact persistence in one place. Notebooks and command-line scripts
should orchestrate these functions rather than duplicate the implementation.
"""

from __future__ import annotations

import json
import random
from dataclasses import dataclass
from pathlib import Path
from typing import Any, NamedTuple

import cv2
import numpy as np
import torch
import torch.nn as nn
from PIL import Image
from sklearn.neighbors import NearestNeighbors
from torchvision import models, transforms


IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg"}


class BoundingBox(NamedTuple):
    x: int
    y: int
    width: int
    height: int


@dataclass
class Thresholds:
    pixel_threshold: float
    image_threshold: float


@dataclass
class Prediction:
    anomaly_score: float
    is_anomalous: bool
    anomaly_map: np.ndarray
    binary_mask: np.ndarray
    bounding_boxes: list[BoundingBox]
    heatmap: np.ndarray
    overlay: np.ndarray


class ResNetFeatureExtractor(nn.Module):
    """ResNet18 truncated after layer3 for local patch features."""

    def __init__(self, backbone_name: str = "resnet18") -> None:
        super().__init__()
        if backbone_name != "resnet18":
            raise ValueError("Only resnet18 is currently supported.")

        backbone = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
        self.features = nn.Sequential(
            backbone.conv1,
            backbone.bn1,
            backbone.relu,
            backbone.maxpool,
            backbone.layer1,
            backbone.layer2,
            backbone.layer3,
        )

    def forward(self, inputs: torch.Tensor) -> torch.Tensor:
        return self.features(inputs)


def load_config(config_path: Path, category: str | None = None) -> dict[str, Any]:
    """Load configuration and resolve paths for one dataset category."""
    import yaml

    config = yaml.safe_load(config_path.read_text(encoding="utf-8"))
    selected_category = category or config["category"]
    if not selected_category or Path(selected_category).name != selected_category:
        raise ValueError("category must be a single directory name.")

    config["category"] = selected_category
    config["dataset_root"] = (
        config_path.parent / config["dataset_root"] / selected_category
    ).resolve()
    config["output_dir"] = (
        config_path.parent / config["output_root"] / selected_category
    ).resolve()
    return config


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def get_device() -> torch.device:
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


def make_transform(image_size: int) -> transforms.Compose:
    return transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ]
    )


def load_image(
    image_path: Path,
    image_size: int,
    device: torch.device,
) -> tuple[Image.Image, torch.Tensor]:
    image = Image.open(image_path).convert("RGB")
    tensor = make_transform(image_size)(image).unsqueeze(0).to(device)
    return image, tensor


def extract_patches(
    model: nn.Module,
    image_tensor: torch.Tensor,
) -> tuple[torch.Tensor, tuple[int, int]]:
    with torch.no_grad():
        feature_map = model(image_tensor)

    if feature_map.ndim != 4 or feature_map.shape[0] != 1:
        raise ValueError("Expected a feature map with batch size 1.")

    _, channels, height, width = feature_map.shape
    patches = feature_map.permute(0, 2, 3, 1).reshape(height * width, channels)
    patches = nn.functional.normalize(patches, p=2, dim=1)
    return patches, (height, width)


def build_memory_bank(
    model: nn.Module,
    image_paths: list[Path],
    image_size: int,
    device: torch.device,
    memory_bank_size: int,
    seed: int,
) -> np.ndarray:
    """Extract normal patches and optionally subsample them."""
    all_features = []
    for image_path in image_paths:
        _, tensor = load_image(image_path, image_size, device)
        patches, _ = extract_patches(model, tensor)
        all_features.append(patches.cpu().numpy().astype(np.float32))

    if not all_features:
        raise ValueError("No normal images were supplied for the memory bank.")

    memory_bank = np.concatenate(all_features, axis=0)
    if len(memory_bank) > memory_bank_size:
        rng = np.random.default_rng(seed)
        indices = rng.choice(len(memory_bank), size=memory_bank_size, replace=False)
        memory_bank = memory_bank[indices]
    return memory_bank


def create_neighbor_index(memory_bank: np.ndarray, num_neighbors: int) -> NearestNeighbors:
    if num_neighbors < 1 or num_neighbors > len(memory_bank):
        raise ValueError("num_neighbors must be between 1 and memory bank size.")
    index = NearestNeighbors(n_neighbors=num_neighbors, metric="euclidean")
    index.fit(memory_bank)
    return index


def calculate_anomaly_map(
    model: nn.Module,
    neighbor_index: NearestNeighbors,
    image_tensor: torch.Tensor,
) -> np.ndarray:
    patches, spatial_size = extract_patches(model, image_tensor)
    patches_np = patches.cpu().numpy().astype(np.float32)
    distances, _ = neighbor_index.kneighbors(patches_np, return_distance=True)
    height, width = spatial_size
    return distances.mean(axis=1).reshape(height, width)


def process_anomaly_map(
    anomaly_map: np.ndarray,
    output_size: tuple[int, int],
    gaussian_kernel_size: int,
) -> np.ndarray:
    resized = cv2.resize(anomaly_map, output_size, interpolation=cv2.INTER_CUBIC)
    smoothed = cv2.GaussianBlur(
        resized,
        (gaussian_kernel_size, gaussian_kernel_size),
        sigmaX=0,
    )
    min_value = float(smoothed.min())
    max_value = float(smoothed.max())
    if max_value - min_value < 1e-8:
        return np.zeros_like(smoothed, dtype=np.float32)
    return ((smoothed - min_value) / (max_value - min_value)).astype(np.float32)


def calibrate_thresholds(
    model: nn.Module,
    neighbor_index: NearestNeighbors,
    validation_images: list[Path],
    config: dict[str, Any],
    device: torch.device,
) -> Thresholds:
    all_pixel_scores = []
    image_scores = []
    for image_path in validation_images:
        image, tensor = load_image(image_path, config["image_size"], device)
        raw_map = calculate_anomaly_map(model, neighbor_index, tensor)
        processed_map = process_anomaly_map(
            raw_map,
            (image.width, image.height),
            config["gaussian_kernel_size"],
        )
        all_pixel_scores.append(processed_map.ravel())
        image_scores.append(float(processed_map.max()))

    if not all_pixel_scores:
        raise ValueError("No validation images were supplied for calibration.")

    return Thresholds(
        pixel_threshold=float(
            np.percentile(
                np.concatenate(all_pixel_scores),
                config["pixel_threshold_percentile"],
            )
        ),
        image_threshold=float(
            np.percentile(
                np.asarray(image_scores),
                config["image_threshold_percentile"],
            )
        ),
    )


def create_binary_mask(
    anomaly_map: np.ndarray,
    thresholds: Thresholds,
    config: dict[str, Any],
) -> np.ndarray:
    mask_value = config["binary_mask_value"]
    binary = np.where(anomaly_map >= thresholds.pixel_threshold, mask_value, 0).astype(np.uint8)
    kernel_size = config["morphology_kernel_size"]
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_size, kernel_size))
    binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(
        binary,
        connectivity=config["morphology_connectivity"],
    )
    cleaned = np.zeros_like(binary)
    for label in range(1, num_labels):
        if stats[label, cv2.CC_STAT_AREA] >= config["min_component_area"]:
            cleaned[labels == label] = mask_value
    return cleaned


def extract_bounding_boxes(binary_mask: np.ndarray, config: dict[str, Any]) -> list[BoundingBox]:
    contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    boxes = []
    for contour in contours:
        x, y, width, height = cv2.boundingRect(contour)
        if width >= config["min_bbox_width"] and height >= config["min_bbox_height"]:
            boxes.append(BoundingBox(x, y, width, height))
    return sorted(boxes, key=lambda box: box.width * box.height, reverse=True)


def create_heatmap(anomaly_map: np.ndarray, mask_value: int) -> np.ndarray:
    heatmap_uint8 = (anomaly_map * mask_value).clip(0, mask_value).astype(np.uint8)
    return cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)


def create_overlay(
    original_rgb: np.ndarray,
    heatmap: np.ndarray,
    boxes: list[BoundingBox],
    config: dict[str, Any],
) -> np.ndarray:
    overlay = cv2.addWeighted(
        cv2.cvtColor(original_rgb, cv2.COLOR_RGB2BGR),
        config["overlay_original_weight"],
        heatmap,
        config["overlay_heatmap_weight"],
        0,
    )
    for index, box in enumerate(boxes):
        cv2.rectangle(
            overlay,
            (box.x, box.y),
            (box.x + box.width, box.y + box.height),
            (0, 255, 0),
            config["bounding_box_line_thickness"],
        )
        cv2.putText(
            overlay,
            f"Defect {index + 1}",
            (box.x, max(config["label_min_y"], box.y - config["label_vertical_offset"])),
            cv2.FONT_HERSHEY_SIMPLEX,
            config["label_font_scale"],
            (0, 255, 0),
            config["label_line_thickness"],
            cv2.LINE_AA,
        )
    return overlay


def predict(
    image_path: Path,
    model: nn.Module,
    neighbor_index: NearestNeighbors,
    thresholds: Thresholds,
    config: dict[str, Any],
    device: torch.device,
) -> Prediction:
    original_image, tensor = load_image(image_path, config["image_size"], device)
    original_rgb = np.asarray(original_image)
    raw_map = calculate_anomaly_map(model, neighbor_index, tensor)
    anomaly_map = process_anomaly_map(
        raw_map,
        (original_rgb.shape[1], original_rgb.shape[0]),
        config["gaussian_kernel_size"],
    )
    anomaly_score = float(anomaly_map.max())
    binary_mask = create_binary_mask(anomaly_map, thresholds, config)
    boxes = extract_bounding_boxes(binary_mask, config)
    heatmap = create_heatmap(anomaly_map, config["binary_mask_value"])
    overlay = create_overlay(original_rgb, heatmap, boxes, config)
    return Prediction(
        anomaly_score=anomaly_score,
        is_anomalous=anomaly_score >= thresholds.image_threshold,
        anomaly_map=anomaly_map,
        binary_mask=binary_mask,
        bounding_boxes=boxes,
        heatmap=heatmap,
        overlay=overlay,
    )


def save_artifact(
    artifact_path: Path,
    memory_bank: np.ndarray,
    thresholds: Thresholds,
    config: dict[str, Any],
) -> None:
    artifact_path.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(
        artifact_path,
        memory_bank=memory_bank,
        thresholds=np.asarray(
            [thresholds.pixel_threshold, thresholds.image_threshold],
            dtype=np.float32,
        ),
        metadata=np.asarray(json.dumps({
            "backbone_name": config["backbone_name"],
            "image_size": config["image_size"],
            "num_neighbors": config["num_neighbors"],
        })),
    )


def load_artifact(artifact_path: Path) -> tuple[np.ndarray, Thresholds, dict[str, Any]]:
    with np.load(artifact_path, allow_pickle=False) as artifact:
        memory_bank = artifact["memory_bank"]
        threshold_values = artifact["thresholds"]
        metadata = json.loads(str(artifact["metadata"]))
    thresholds = Thresholds(
        pixel_threshold=float(threshold_values[0]),
        image_threshold=float(threshold_values[1]),
    )
    return memory_bank, thresholds, metadata


def image_paths(directory: Path) -> list[Path]:
    return sorted(path for path in directory.iterdir() if path.suffix.lower() in IMAGE_EXTENSIONS)


def find_ground_truth(dataset_root: Path, defect_type: str, image_path: Path) -> Path:
    return dataset_root / "ground_truth" / defect_type / f"{image_path.stem}_mask.png"


def load_ground_truth(mask_path: Path, output_size: tuple[int, int], mask_value: int) -> np.ndarray:
    if not mask_path.exists():
        raise FileNotFoundError(f"Ground-truth mask not found: {mask_path}")
    mask = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)
    if mask is None:
        raise RuntimeError(f"Could not read mask: {mask_path}")
    resized = cv2.resize(mask, output_size, interpolation=cv2.INTER_NEAREST)
    return np.where(resized > 0, mask_value, 0).astype(np.uint8)


def calculate_iou(predicted_mask: np.ndarray, ground_truth_mask: np.ndarray) -> float:
    predicted = predicted_mask > 0
    ground_truth = ground_truth_mask > 0
    intersection = np.logical_and(predicted, ground_truth).sum()
    union = np.logical_or(predicted, ground_truth).sum()
    return 1.0 if union == 0 else float(intersection / union)


def save_prediction_visualization(
    prediction: Prediction,
    ground_truth: np.ndarray,
    output_path: Path,
    config: dict[str, Any],
) -> None:
    import matplotlib.pyplot as plt

    output_path.parent.mkdir(parents=True, exist_ok=True)
    figure = plt.figure(
        figsize=(config["visualization_figure_width"], config["visualization_figure_height"])
    )
    panels = [
        (ground_truth, "Ground Truth", "gray"),
        (prediction.binary_mask, "Predicted Defect Mask", "gray"),
        (prediction.anomaly_map, f"Anomaly Map\nScore: {prediction.anomaly_score:.3f}", "jet"),
        (cv2.cvtColor(prediction.overlay, cv2.COLOR_BGR2RGB), "Localization", None),
    ]
    for index, (image, title, cmap) in enumerate(panels, start=1):
        axis = figure.add_subplot(1, 4, index)
        axis.imshow(image, cmap=cmap, vmin=0 if cmap == "jet" else None, vmax=1 if cmap == "jet" else None)
        axis.set_title(title)
        axis.axis("off")
    figure.tight_layout()
    figure.savefig(output_path, dpi=config["visualization_dpi"], bbox_inches="tight")
    plt.close(figure)


def serialize_boxes(boxes: list[BoundingBox]) -> list[dict[str, int]]:
    return [box._asdict() for box in boxes]
