from typing import Any, Dict
from app.config import settings


class DecisionFusionEngine:
    """Decision Fusion logic uniting classification and localization model signals."""

    def __init__(
        self,
        confidence_threshold: float = settings.CONFIDENCE_THRESHOLD,
        anomaly_threshold: float = settings.ANOMALY_SCORE_THRESHOLD,
    ) -> None:
        self.confidence_threshold = confidence_threshold
        self.anomaly_threshold = anomaly_threshold

    def fuse(
        self,
        classifier_res: Dict[str, Any],
        localizer_res: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Combine dual-model outputs into a definitive PASS/FAIL/REVIEW verdict.

        Rules:
        1. Both agree OK/Low anomaly -> PASS
        2. Both agree DEFECT/High anomaly -> FAIL
        3. Classifier says DEFECT with high confidence -> FAIL (classification wins ambiguity)
        4. Model disagreement or low confidence -> REVIEW (requires operator audit)
        """
        label = classifier_res.get("label", "OK")
        confidence = float(classifier_res.get("confidence", 0.0))
        anomaly_score = float(localizer_res.get("anomaly_score", 0.0))
        has_bboxes = len(localizer_res.get("bounding_boxes", [])) > 0

        # High confidence agreement on clean sample
        if label == "OK" and anomaly_score < self.anomaly_threshold and not has_bboxes:
            verdict = "PASS"
            reason = "Component verified normal by both classification and anomaly engines."

        # High confidence agreement on defective sample
        elif label == "DEFECT" and (anomaly_score >= self.anomaly_threshold or has_bboxes):
            verdict = "FAIL"
            reason = "Surface defect detected and localized."

        # Classifier strongly detects defect, but localizer anomaly map is subtle
        elif label == "DEFECT" and confidence >= self.confidence_threshold:
            verdict = "FAIL"
            reason = "Classifier flagged surface anomaly with high confidence."

        # Localizer detects strong anomaly region, but classifier label was OK
        elif label == "OK" and (anomaly_score >= self.anomaly_threshold or has_bboxes):
            verdict = "REVIEW"
            reason = "Anomaly region localized but classification score was borderline."

        # Ambiguous or borderline confidence
        else:
            verdict = "REVIEW"
            reason = "Borderline confidence. Flagged for human inspector review."

        return {
            "verdict": verdict,
            "reason": reason,
            "label": label,
            "confidence": confidence,
            "anomaly_score": anomaly_score,
            "defect_region": localizer_res.get("defect_region"),
        }


fusion_engine = DecisionFusionEngine()
