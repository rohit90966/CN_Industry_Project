from fastapi.testclient import TestClient
from app.main import app
from tests.test_predict import create_dummy_image_bytes

client = TestClient(app)


def test_history_logging_and_retrieval():
    # Make a prediction call to populate history
    img_bytes = create_dummy_image_bytes()
    client.post("/api/v1/predict", files={"file": ("history_sample.jpg", img_bytes, "image/jpeg")})

    # Query history
    response = client.get("/api/v1/history?page=1&limit=10")
    assert response.status_code == 200

    data = response.json()
    assert "total" in data
    assert "logs" in data
    assert len(data["logs"]) >= 1

    first_log = data["logs"][0]
    assert "id" in first_log
    assert "verdict" in first_log

    # Test single item query
    item_response = client.get(f"/api/v1/history/{first_log['id']}")
    assert item_response.status_code == 200
    assert item_response.json()["id"] == first_log["id"]
