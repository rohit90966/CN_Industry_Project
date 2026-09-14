from datetime import datetime
from typing import List, Optional, Union
from pydantic import BaseModel, Field



class BoundingBox(BaseModel):
    x: int
    y: int
    w: int
    h: int


class PredictionResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    inspection_id: Union[int, str] = Field(..., description="Unique inspection log identifier")
    filename: str = Field(..., description="Original uploaded filename")
    category: str = Field("fan_blade", description="Component category inspected")
    verdict: str = Field(..., description="Final decision: PASS, FAIL, or REVIEW")
    label: str = Field(..., description="Classification outcome: OK or DEFECT")
    confidence: float = Field(..., description="Classifier confidence score between 0.0 and 1.0")
    anomaly_score: float = Field(..., description="Localization anomaly score between 0.0 and 1.0")
    defect_region: Optional[str] = Field(None, description="Descriptive location or region coordinates")
    defect_type: Optional[str] = Field("None", description="Defect category type if defective")
    bounding_boxes: Optional[List[BoundingBox]] = Field(default=[], description="Detected anomaly bounding boxes")
    original_image_url: str = Field(..., description="URL path to view original uploaded image")
    overlay_image_url: str = Field(..., description="URL path to view defect heatmap overlay image")
    defect_heatmap_url: str = Field(..., description="Alias URL path for defect heatmap overlay image")
    inference_time_ms: float = Field(..., description="Total inference pipeline processing time in milliseconds")
    model_version: str = Field(..., description="Combined model version identifier")
    timestamp: datetime = Field(..., description="ISO 8601 timestamp of inspection")


class InspectionLogSchema(BaseModel):
    model_config = {"protected_namespaces": (), "from_attributes": True}

    id: int
    inspection_id: Union[int, str]
    filename: str
    category: str
    original_image_path: str
    overlay_image_path: str
    original_image_url: str
    overlay_image_url: str
    verdict: str
    label: str
    confidence: float
    anomaly_score: float
    defect_region: Optional[str]
    defect_type: Optional[str]
    threshold: float = 0.025
    inference_time_ms: float
    model_version: str
    created_at: datetime
    timestamp: datetime


class HistoryPaginatedResponse(BaseModel):
    total: int
    total_count: int
    page: int
    limit: int
    logs: List[InspectionLogSchema]
    items: List[InspectionLogSchema]
    pattern_insight: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    service_name: str = "AERO-QC Machine Vision Engine"
    version: str
    database: str
    models_loaded: bool
    active_threshold: float = 0.025
    loaded_models: List[str] = ["ResNet-50-Classifier", "PatchCore-Localizer"]
    timestamp: datetime


class SystemStatsResponse(BaseModel):
    total_inspections: int
    passed_count: int
    failed_count: int
    review_count: int
    pass_rate: float
    fail_rate: float
    avg_inference_ms: float
    classifier_accuracy: float = 94.8
    classifier_latency: float = 14.2
    anomaly_threshold: float = 0.025
    anomaly_fpr: float = 3.8
    anomaly_latency: float = 28.5
    agreement_rate: float = 91.4


class ModelInfoSchema(BaseModel):
    model_config = {"protected_namespaces": ()}

    model_name: str
    version: str
    loaded: bool
    threshold: float
    path: str




class SystemModelsResponse(BaseModel):
    classifier: ModelInfoSchema
    localizer: ModelInfoSchema
    fusion_logic: str
