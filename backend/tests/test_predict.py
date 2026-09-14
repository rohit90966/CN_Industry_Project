import io
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def create_dummy_image_bytes(color=(200, 200, 200), size=(100, 100)) -> bytes:
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "version" in data


def test_models_endpoint():
    response = client.get("/api/v1/models")
    assert response.status_code == 200
    data = response.json()
    assert "classifier" in data
    assert "localizer" in data


def test_predict_endpoint_success():
    img_bytes = create_dummy_image_bytes()
    files = {"file": ("test_fan_blade.jpg", img_bytes, "image/jpeg")}

    response = client.post("/api/v1/predict", files=files)
    assert response.status_code == 200

    data = response.json()
    assert "inspection_id" in data
    assert "verdict" in data
    assert data["verdict"] in ["PASS", "FAIL", "REVIEW"]
    assert "label" in data
    assert "confidence" in data
    assert "anomaly_score" in data
    assert "overlay_image_url" in data
    assert "inference_time_ms" in data
    assert "model_version" in data


def test_predict_invalid_file_type():
    files = {"file": ("test.txt", b"invalid text data", "text/plain")}
    response = client.post("/api/v1/predict", files=files)
    assert response.status_code == 400
