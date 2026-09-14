import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status

from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas import PredictionResponse
from app.services.inference import run_inference_pipeline

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Inference API"])


@router.post(
    "/predict",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Run surface defect inspection on uploaded image",
)
@router.post(
    "/inspect",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Alias endpoint for surface defect inspection",
)
async def predict_surface_defect(
    file: UploadFile = File(...),
    category: Optional[str] = Form("fan_blade"),
    db: Session = Depends(get_db),
) -> PredictionResponse:
    """Predict endpoint for surface component inspection."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a valid image (JPEG, PNG, WEBP, etc.).",
        )

    try:
        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        result = run_inference_pipeline(
            filename=file.filename or "uploaded_image.jpg",
            image_bytes=contents,
            db=db,
            category=category or "fan_blade",
        )
        return PredictionResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Inference failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference pipeline execution error: {str(e)}",
        )

