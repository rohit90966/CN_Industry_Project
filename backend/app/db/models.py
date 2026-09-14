from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from app.db.database import Base


class InspectionLog(Base):
    __tablename__ = "inspection_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    filename = Column(String(255), nullable=False)
    category = Column(String(100), default="fan_blade", index=True)
    original_image_path = Column(String(512), nullable=False)
    overlay_image_path = Column(String(512), nullable=False)
    verdict = Column(String(20), nullable=False, index=True)  # PASS, FAIL, REVIEW
    label = Column(String(20), nullable=False)  # OK, DEFECT
    confidence = Column(Float, nullable=False)
    anomaly_score = Column(Float, nullable=False)
    defect_region = Column(String(255), nullable=True)
    defect_type = Column(String(100), default="None")
    inference_time_ms = Column(Float, nullable=False)
    model_version = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    def __repr__(self) -> str:
        return f"<InspectionLog(id={self.id}, filename='{self.filename}', verdict='{self.verdict}')>"

