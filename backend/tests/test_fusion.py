from app.services.fusion import DecisionFusionEngine


def test_fusion_pass_verdict():
    engine = DecisionFusionEngine(confidence_threshold=0.75, anomaly_threshold=0.65)
    classifier_res = {"label": "OK", "confidence": 0.95}
    localizer_res = {"anomaly_score": 0.12, "bounding_boxes": []}

    res = engine.fuse(classifier_res, localizer_res)
    assert res["verdict"] == "PASS"
    assert res["label"] == "OK"


def test_fusion_fail_verdict():
    engine = DecisionFusionEngine(confidence_threshold=0.75, anomaly_threshold=0.65)
    classifier_res = {"label": "DEFECT", "confidence": 0.92}
    localizer_res = {"anomaly_score": 0.85, "bounding_boxes": [{"x": 10, "y": 10, "w": 20, "h": 20}]}

    res = engine.fuse(classifier_res, localizer_res)
    assert res["verdict"] == "FAIL"
    assert res["label"] == "DEFECT"


def test_fusion_review_verdict():
    engine = DecisionFusionEngine(confidence_threshold=0.75, anomaly_threshold=0.65)
    classifier_res = {"label": "OK", "confidence": 0.60}
    localizer_res = {"anomaly_score": 0.70, "bounding_boxes": [{"x": 5, "y": 5, "w": 10, "h": 10}]}

    res = engine.fuse(classifier_res, localizer_res)
    assert res["verdict"] == "REVIEW"
