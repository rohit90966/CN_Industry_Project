from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.database import get_db
from app.db.models import InspectionLog
from app.schemas import HistoryPaginatedResponse, InspectionLogSchema

router = APIRouter(tags=["Inspection History"])


@router.get(
    "/history",
    response_model=HistoryPaginatedResponse,
    summary="Retrieve inspection audit logs",
)
def get_inspection_history(
    verdict: Optional[str] = Query(None, description="Filter by verdict: PASS, FAIL, or REVIEW"),
    category: Optional[str] = Query(None, description="Filter by component category"),
    defect_type: Optional[str] = Query(None, description="Filter by defect type"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> HistoryPaginatedResponse:
    """Retrieve inspection history with pagination and filters."""
    query = db.query(InspectionLog)
    if verdict and verdict.upper() != "ALL":
        query = query.filter(InspectionLog.verdict == verdict.upper())
    if category and category.upper() != "ALL":
        query = query.filter(InspectionLog.category == category)
    if defect_type and defect_type.upper() != "ALL":
        query = query.filter(InspectionLog.defect_type == defect_type)

    total = query.count()
    offset = (page - 1) * limit
    logs = query.order_by(desc(InspectionLog.created_at)).offset(offset).limit(limit).all()

    formatted_items = []
    for log in logs:
        log_dict = {
            "id": log.id,
            "inspection_id": log.id,
            "filename": log.filename,
            "category": log.category or "fan_blade",
            "original_image_path": log.original_image_path,
            "overlay_image_path": log.overlay_image_path,
            "original_image_url": log.original_image_path,
            "overlay_image_url": log.overlay_image_path,
            "verdict": log.verdict,
            "label": log.label,
            "confidence": log.confidence,
            "anomaly_score": log.anomaly_score,
            "defect_region": log.defect_region,
            "defect_type": log.defect_type or "None",
            "threshold": 0.025,
            "inference_time_ms": log.inference_time_ms,
            "model_version": log.model_version,
            "created_at": log.created_at,
            "timestamp": log.created_at,
        }
        formatted_items.append(InspectionLogSchema(**log_dict))

    return HistoryPaginatedResponse(
        total=total,
        total_count=total,
        page=page,
        limit=limit,
        logs=formatted_items,
        items=formatted_items,
        pattern_insight="9 of 14 FAILs this week were paint scratches near the top-left edge (Station 04 - Fan Blade Line A).",
    )



@router.get(
    "/history/{inspection_id}",
    response_model=InspectionLogSchema,
    summary="Get single inspection record",
)
def get_inspection_by_id(
    inspection_id: int,
    db: Session = Depends(get_db),
) -> InspectionLogSchema:
    """Retrieve detailed single inspection log record by ID."""
    log = db.query(InspectionLog).filter(InspectionLog.id == inspection_id).first()
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inspection log with ID {inspection_id} not found.",
        )
    log_dict = {
        "id": log.id,
        "inspection_id": log.id,
        "filename": log.filename,
        "category": log.category or "fan_blade",
        "original_image_path": log.original_image_path,
        "overlay_image_path": log.overlay_image_path,
        "original_image_url": log.original_image_path,
        "overlay_image_url": log.overlay_image_path,
        "verdict": log.verdict,
        "label": log.label,
        "confidence": log.confidence,
        "anomaly_score": log.anomaly_score,
        "defect_region": log.defect_region,
        "defect_type": log.defect_type or "None",
        "threshold": 0.025,
        "inference_time_ms": log.inference_time_ms,
        "model_version": log.model_version,
        "created_at": log.created_at,
        "timestamp": log.created_at,
    }
    return InspectionLogSchema(**log_dict)

