import time
import uuid
from pathlib import Path
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.config import settings
from app.db.models import InspectionLog
from app.models.registry import model_registry
from app.services.fusion import fusion_engine
from app.services.image_processing import decode_image_bytes, generate_defect_overlay


def run_inference_pipeline(
    filename: str,
    image_bytes: bytes,
    db: Session,
    category: str = "fan_blade",
) -> Dict[str, Any]:
    """Execute end-to-end inference pipeline:

    1. Record start time for latency metric
    2. Save raw uploaded image to storage
    3. Decode image to numpy matrix
    4. Run Classification Model & Localization Model concurrently
    5. Run Decision Fusion Engine for final PASS/FAIL/REVIEW verdict
    6. Generate & save visual defect heatmap overlay image
    7. Persist audit log entry to database
    8. Return complete PredictionResponse dictionary
    """
    start_time = time.perf_counter()

    # Save original raw image
    file_ext = Path(filename).suffix or ".jpg"
    unique_id = str(uuid.uuid4())[:8]
    raw_filename = f"{unique_id}_raw{file_ext}"
    overlay_filename = f"{unique_id}_overlay.png"

    raw_filepath = settings.UPLOAD_DIR / raw_filename
    overlay_filepath = settings.RESULTS_DIR / overlay_filename

    with open(raw_filepath, "wb") as f:
        f.write(image_bytes)

    # Preprocess image
    image_np = decode_image_bytes(image_bytes)

    # Model inference calls
    localizer_res = model_registry.localizer.predict(image_np)
    # When the trained PatchCore artifact is available, its calibrated image-level
    # decision is authoritative. The legacy classifier is retained as a fallback.
    classifier_res = localizer_res.get("model_prediction") or model_registry.classifier.predict(image_np)

    # Fusion logic
    fused_res = fusion_engine.fuse(classifier_res, localizer_res)

    # Defect overlay rendering
    heatmap = localizer_res.get("heatmap")
    bounding_boxes = localizer_res.get("bounding_boxes", [])
    generate_defect_overlay(image_np, heatmap, bounding_boxes, overlay_filepath)

    # Calculate inference latency in milliseconds
    elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
    combined_version = model_registry.get_combined_version()

    defect_type = classifier_res.get("defect_type", "None")
    if fused_res["verdict"] == "PASS":
        defect_type = "None"

    # Persist log record in database
    log_entry = InspectionLog(
        filename=filename,
        category=category,
        original_image_path=f"/static/uploads/{raw_filename}",
        overlay_image_path=f"/static/results/{overlay_filename}",
        verdict=fused_res["verdict"],
        label=fused_res["label"],
        confidence=fused_res["confidence"],
        anomaly_score=fused_res["anomaly_score"],
        defect_region=fused_res.get("defect_region"),
        defect_type=defect_type,
        inference_time_ms=elapsed_ms,
        model_version=combined_version,
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)

    return {
        "inspection_id": log_entry.id,
        "filename": filename,
        "category": category,
        "verdict": log_entry.verdict,
        "label": log_entry.label,
        "confidence": log_entry.confidence,
        "anomaly_score": log_entry.anomaly_score,
        "defect_region": log_entry.defect_region,
        "defect_type": defect_type,
        "bounding_boxes": bounding_boxes,
        "original_image_url": log_entry.original_image_path,
        "overlay_image_url": log_entry.overlay_image_path,
        "defect_heatmap_url": log_entry.overlay_image_path,
        "inference_time_ms": elapsed_ms,
        "model_version": combined_version,
        "timestamp": log_entry.created_at,
    }

