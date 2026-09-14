# Industrial Surface Defect Detection API Service

High-performance FastAPI inference microservice designed for real-time automated surface quality inspection (MVTec AD dataset / Ceiling Fan blades, motor housings, and painted components).

## Architecture Highlights
- **Dual-Model Inference Pipeline**: Runs surface classification (ResNet/EfficientNet) and defect anomaly localization (PatchCore/Autoencoder/YOLO) concurrently.
- **Decision Fusion Engine**: Combines confidence scores, anomaly heatmaps, and bounding boxes into a unified decision verdict (`PASS`, `FAIL`, `REVIEW`).
- **Visual Defect Overlay**: Generates heatmaps blended with thermal JET colormaps and defect region bounding boxes.
- **Audit Traceability**: SQLite database via SQLAlchemy logs every inspection event, latency, image path, and verdict.
- **Model Version Tracking**: Configurable model version headers and inference speed logging.

---

## Directory Structure
```
backend/
├── app/
│   ├── api/                  # FastAPI router controllers (/predict, /history, /health, /models)
│   ├── db/                   # Database engine, session manager & SQLAlchemy models
│   ├── models/               # Classifier, Localizer, and ModelRegistry wrappers
│   ├── services/             # Image processing, fusion engine & inference orchestrator
│   ├── config.py             # App settings, environment vars, and thresholds
│   ├── main.py               # Application entrypoint & static mounts
│   └── schemas.py            # Pydantic request/response validation contracts
├── saved_models/             # Directory for placing PyTorch (.pt) / ONNX (.onnx) model checkpoints
├── uploads/                  # Input image storage
├── results/                  # Generated defect heatmap overlay storage
├── tests/                    # Automated test suite (pytest)
├── requirements.txt          # Python dependencies
└── README.md                 # Documentation
```

---

## Quickstart & Installation

### 1. Install Dependencies
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Run API Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- Interactive OpenAPI Swagger UI: `http://localhost:8000/docs`
- ReDoc API Documentation: `http://localhost:8000/redoc`

---

## Key API Endpoints

### 1. `POST /api/v1/predict`
Upload an inspection image and obtain an instant decision verdict.

#### Request (Multipart Form-Data):
- `file`: Image file (`JPEG`, `PNG`, `WEBP`)

#### Response (`200 OK`):
```json
{
  "inspection_id": 42,
  "filename": "fan_blade_sample_01.jpg",
  "verdict": "FAIL",
  "label": "DEFECT",
  "confidence": 0.942,
  "anomaly_score": 0.875,
  "defect_region": "top-left region (2 defect clusters)",
  "bounding_boxes": [
    { "x": 45, "y": 60, "w": 35, "h": 28 }
  ],
  "overlay_image_url": "/static/results/a1b2c3d4_overlay.png",
  "inference_time_ms": 38.45,
  "model_version": "ResNet50-v1.0 + PatchCore-v1.0",
  "timestamp": "2026-09-09T13:50:00.000Z"
}
```

---

### 2. `GET /api/v1/history`
Retrieve past inspection audit logs with filtering and pagination.

#### Query Parameters:
- `verdict` *(optional)*: `PASS`, `FAIL`, `REVIEW`
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

---

### 3. `GET /api/v1/health`
Verify system operational status, database connectivity, and loaded model readiness.

---

### 4. `GET /api/v1/models`
Retrieve active model versioning details, file paths, and decision fusion thresholds.

---

## Model Placement Instructions

To plug in custom trained weights:
1. Copy your trained classification PyTorch weights to `saved_models/classifier.pt`.
2. Copy your trained localization model weights to `saved_models/localizer.pt`.
3. The system automatically detects and loads new weights upon restart. If weights are omitted, the service operates seamlessly using built-in computer vision heuristic predictors.

---

## Running Tests

Execute the full automated test suite:
```bash
pytest tests/ -v
```
