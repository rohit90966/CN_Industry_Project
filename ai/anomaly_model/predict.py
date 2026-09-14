"""Run inference with a saved anomaly model artifact.

Example:
    python predict.py path/to/image.png
"""

from __future__ import annotations

import argparse
from pathlib import Path

import cv2

from anomaly_model.anomaly_model import (
    ResNetFeatureExtractor,
    create_neighbor_index,
    get_device,
    load_artifact,
    load_config,
    predict,
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Detect anomalies in one image.")
    parser.add_argument("image", type=Path, help="Image to inspect")
    parser.add_argument(
        "--config",
        type=Path,
        default=Path(__file__).with_name("config.yaml"),
        help="Path to the YAML configuration file",
    )
    parser.add_argument(
        "--category",
        default=None,
        help="Dataset category, for example screw, grid, tile, or metal_nut",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Optional path for the localization overlay",
    )
    args = parser.parse_args()

    config = load_config(args.config, category=args.category)
    artifact_path = config["output_dir"] / "anomaly_model.npz"
    memory_bank, thresholds, metadata = load_artifact(artifact_path)
    device = get_device()

    model = ResNetFeatureExtractor(metadata["backbone_name"]).to(device)
    model.eval()
    neighbor_index = create_neighbor_index(memory_bank, metadata["num_neighbors"])
    prediction = predict(args.image, model, neighbor_index, thresholds, config, device)

    print(f"Image: {args.image}")
    print(f"Anomaly score: {prediction.anomaly_score:.4f}")
    print(f"Detected: {prediction.is_anomalous}")
    print(f"Bounding boxes: {prediction.bounding_boxes}")

    if args.output is not None:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(args.output), prediction.overlay)
        print(f"Overlay saved to: {args.output}")


if __name__ == "__main__":
    main()
