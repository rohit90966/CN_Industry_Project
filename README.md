# AI-Based Automated Surface Defect Detection System

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React%2019-20232A?style=flat&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite%208-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=flat&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![Anomalib](https://img.shields.io/badge/Anomalib-PatchCore-blueviolet)](https://github.com/openvinotoolkit/anomalib)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An end-to-end industrial computer-vision inspection system designed for automated surface defect detection and anomaly localization. Developed originally for the **MVTec AD (`metal_nut`)** benchmark and extensible to industrial manufacturing lines such as ceiling fan blades, motor housings, fasteners, and sheet metals.

The system combines deep unsupervised anomaly localization (**PatchCore**) with supervised classification and heuristic analysis through a **Decision Fusion Engine** to deliver high-confidence **`PASS`**, **`FAIL`**, or **`REVIEW`** quality verdicts along with pixel-level defect heatmaps and bounding boxes.

---

## Table of Contents

- [Quick Start: How to Run the Project](#quick-start-how-to-run-the-project)
  - [Prerequisites](#prerequisites)
  - [1. Backend Service (FastAPI)](#1-backend-service-fastapi)
  - [2. Frontend Dashboard (React + Vite)](#2-frontend-dashboard-react--vite)
  - [3. AI Training & Evaluation (PatchCore)](#3-ai-training--evaluation-patchcore)
- [Project Overview](#project-overview)
- [System Architecture](#system-architecture)
- [Models & AI Methodologies Used](#models--ai-methodologies-used)
  - [1. PatchCore Anomaly Localization Engine](#1-patchcore-anomaly-localization-engine)
  - [2. Modular Custom ResNet-18 Memory Bank](#2-modular-custom-resnet-18-memory-bank)
  - [3. Surface Classification Engine](#3-surface-classification-engine)
  - [4. Multi-Signal Decision Fusion Logic](#4-multi-signal-decision-fusion-logic)
- [Experimental Results & Evaluation](#experimental-results--evaluation)
  - [Quantitative Metrics](#quantitative-metrics)
  - [Per-Class Breakdown](#per-class-breakdown)
  - [Inference Latency](#inference-latency)
- [API Endpoints & Integration](#api-endpoints--integration)
- [Frontend Features & Shortcuts](#frontend-features--shortcuts)
- [Directory Structure](#directory-structure)

---

## Quick Start: How to Run the Project

### Prerequisites

- **Python**: 3.10 to 3.12+ installed
- **Node.js**: v18+ and **npm** installed
- **CUDA Toolkit** (Optional): Recommended for accelerated GPU inference/training; automatically falls back to CPU.

---

### 1. Backend Service (FastAPI)

The backend handles model loading, inference pipelines, image processing, and SQLite audit logging.

```powershell
# Navigate to the backend directory
cd backend

# Create and activate Python virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Upgrade pip and install dependencies
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

# Launch FastAPI development server
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- **API Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

---

### 2. Frontend Dashboard (React + Vite)

The frontend provides an industrial operator console with real-time inspection, comparison sliders, history logs, and analytics.

Open a **separate terminal**:

```powershell
# Navigate to the frontend directory
cd frontend

# Install npm packages
npm install

# Start Vite dev server
npm run dev
```

- **Dashboard UI**: `http://127.0.0.1:5173` (or the local URL printed by Vite).
- The frontend connects automatically to the API at `http://127.0.0.1:8000/api/v1`.

---

### 3. AI Training & Evaluation (PatchCore)

To retrain the PatchCore model or run standalone evaluation scripts on the MVTec AD dataset:

```powershell
# Navigate to the AI directory
cd ai

# Create and activate Python virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install AI dependencies
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

# Train PatchCore on MVTec metal_nut dataset
python train.py

# Run standalone CLI inference on any test image
python -m anomaly_model.predict data\metal_nut\test\scratch\000.png --output output\prediction.png
```

Generated checkpoints and Lightning weights are saved under `ai/results/Patchcore/metal_nut/`.

---

## Project Overview

In industrial manufacturing lines (such as ceiling fans, sheet metals, fasteners, and motors), manual visual quality control is labor-intensive, operator-dependent, and prone to fatigue. Defects like scratches, cracks, misalignments, color anomalies, and surface indentations must be flagged before assembly.

This project delivers:
1. **Unsupervised Anomaly Detection**: Only normal (flawless) samples are needed for training. The model learns the distribution of healthy parts and flags anomalies without requiring millions of labelled defective images.
2. **Defect Localization**: Generates pixel-accurate heatmaps and bounding boxes isolating the defective areas.
3. **Industrial Decision Triaging**: Instead of a naive binary output, the system yields `PASS`, `FAIL`, or `REVIEW` (routing borderline or ambiguous cases to human inspectors).
4. **Full Audit Persistence**: Stores inspection timestamps, inference latency, anomaly scores, raw images, and heatmap overlays in SQLite.

---

## System Architecture

```text
[ Industrial Camera / User Upload ]
                 │
                 ▼
     ┌───────────────────────┐
     │  React + Vite Console │
     │  (Inspection / Logs)  │
     └───────────┬───────────┘
                 │ HTTP Multipart POST
                 ▼
     ┌───────────────────────┐
     │   FastAPI Gateway     │
     │   (/api/v1/predict)   │
     └───────────┬───────────┘
                 │
      ┌──────────┴──────────────────────────┐
      ▼                                     ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│  PatchCore Localizer      │ │  Surface Classifier       │
│  - WideResNet-50-2 / R-18 │ │  - ResNet-50 PyTorch      │
│  - Neighborhood Embeddings│ │  - Edge/Laplacian Fallback│
│  - Coreset Memory Bank    │ └─────────────┬─────────────┘
│  - Heatmap & BBoxes       │               │
└─────────────┬─────────────┘               │
              │                             │
              └──────────────┬──────────────┘
                             ▼
              ┌─────────────────────────────┐
              │   Decision Fusion Engine    │
              │ (PASS / FAIL / REVIEW Logic)│
              └──────────────┬─────────────-┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┌───────────────────────┐         ┌───────────────────────┐
│ SQLite Audit Database │         │ Static Heatmap Engine │
│ (inspection_audit.db) │         │ (OpenCV Jet Overlay)  │
└───────────────────────┘         └───────────────────────┘
```

---

## Models & AI Methodologies Used

### 1. PatchCore Anomaly Localization Engine
- **Framework**: PyTorch & OpenVINO Anomalib
- **Backbone Architecture**: `wide_resnet50_2` pre-trained on ImageNet.
- **Feature Extraction**: Extracts multi-scale patch-level neighborhood representations from intermediate feature hierarchies (`layer2` and `layer3`).
- **Memory Bank & Greedy Coreset Subsampling**: Subsamples 5% (`coreset_sampling_ratio=0.05`) of the memory bank via minimax facility location. This drastically compresses memory footprint while maintaining representative coverage of normal manufacturing variations.
- **Anomaly Scoring & Localization**:
  - Distance metric: $L_2$ nearest-neighbor distance against the coreset memory bank.
  - Heatmap generation: Bilinear upsampling to native resolution ($224 \times 224$) followed by Gaussian smoothing ($\sigma = 4$).
  - Bounding box generation: Adaptive thresholding and morphological filtering, followed by contour polygon approximation (`cv2.findContours`).

### 2. Modular Custom ResNet-18 Memory Bank
- Implemented in `ai/anomaly_model/anomaly_model.py`.
- Truncates a standard `resnet18` backbone after `layer3`.
- Extracts local feature vectors, builds a Scikit-Learn `NearestNeighbors` index ($k=1$), and performs empirical 99th-percentile calibration on validation sets.

### 3. Surface Classification Engine
- **PyTorch Classifier**: Supervised ResNet-50 model trained for defect category identification (`saved_models/classifier.pt`).
- **Heuristic CV Fallback**: If deep model weights are unmounted, the engine activates an OpenCV computer-vision heuristic evaluating:
  - Laplacian variance: $\sigma^2(\nabla^2 I)$ for high-frequency crack/scratch detection.
  - Canny edge density: Relative count of edge pixels over component contours.

### 4. Multi-Signal Decision Fusion Logic
Implemented in `backend/app/services/fusion.py`, the engine combines classifier predictions, localization anomaly scores, and bounding boxes using the following rules:

| Classification Label | Anomaly Score | Bounding Boxes Found | Decision Verdict | Meaning / Action |
|:---|:---|:---:|:---:|:---|
| **`OK`** | $< \text{Threshold}$ | None | **`PASS`** | Component clean and certified for line continuation |
| **`DEFECT`** | $\ge \text{Threshold}$ | Yes | **`FAIL`** | Defect confirmed and localized |
| **`DEFECT`** | High Confidence | Optional | **`FAIL`** | Classifier strongly identifies defect pattern |
| **`OK`** | $\ge \text{Threshold}$ | Yes | **`REVIEW`** | Subtle anomaly detected; flagged for human operator audit |
| *Borderline* | Borderline | Any | **`REVIEW`** | Ambiguity between models; manual inspection required |

---

## Experimental Results & Evaluation

The PatchCore model was trained and rigorously benchmarked on the official **MVTec AD (`metal_nut`)** dataset (220 normal training images, 115 test images across 5 conditions: `bent`, `color`, `flip`, `scratch`, and `good`).

### Quantitative Metrics

| Metric | Score | Performance Level |
|:---|:---:|:---|
| **Accuracy** | **94.78%** | 109 / 115 test images correctly classified |
| **Precision** | **93.94%** | Low false positive rate on clean parts |
| **Recall (Sensitivity)** | **100.00%** | **Zero missed defects** across all anomaly classes |
| **F1-Score** | **96.88%** | Harmonic mean reflecting industrial-grade reliability |
| **ROC-AUC** | **99.76%** | Near-perfect separation of normal vs defective distributions |

### Per-Class Breakdown

```text
              Precision    Recall   F1-Score   Support (Images)
---------------------------------------------------------------
Good (Normal)     1.00      0.73      0.84           22
Defective         0.94      1.00      0.97           93
---------------------------------------------------------------
Accuracy                              0.95          115
Macro Avg         0.97      0.86      0.91          115
Weighted Avg      0.95      0.95      0.94          115
```

### Inference Latency

- **Average Inference Time**: **~188.88 ms** per component on evaluation benchmark.
- **Throughput**: **~5.29 images/sec** (real-time capable for conveyor and assembly line speeds).

---

## API Endpoints & Integration

The backend exposes RESTful endpoints at both `/api/v1` and root level:

| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/v1/predict` (or `/api/v1/inspect`) | Upload an image file (`multipart/form-data`) to execute the inspection pipeline |
| `GET` | `/api/v1/history` | Query past inspection records with filters (`category`, `verdict`, `defect_type`) |
| `GET` | `/api/v1/stats` | Retrieve aggregate metrics (pass/fail rate, average latency, total count) |
| `GET` | `/api/v1/health` | Health check reporting database and model readiness |
| `GET` | `/api/v1/models` | Metadata and status of loaded classification & localization models |
| `GET` | `/static/uploads/{file}` | Access raw uploaded images |
| `GET` | `/static/results/{file}` | Access generated OpenCV Jet heatmap overlay images |

### Sample Prediction Response Payload

```json
{
  "inspection_id": "INSP-842910",
  "filename": "fan_blade_01.png",
  "category": "fan_blade",
  "verdict": "FAIL",
  "reason": "Surface defect detected and localized.",
  "confidence": 0.9652,
  "anomaly_score": 0.8841,
  "defect_type": "Surface Scratch/Crack",
  "defect_region": "top-right region (1 anomaly cluster)",
  "bounding_boxes": [
    { "x": 142, "y": 68, "w": 45, "h": 32 }
  ],
  "raw_image_url": "/static/uploads/842910_raw.png",
  "overlay_image_url": "/static/results/842910_overlay.png",
  "latency_ms": 142.5,
  "model_version": "ResNet50-v1.0+PatchCore-v1.0"
}
```

---

## Frontend Features & Shortcuts

The React 19 dashboard provides four core operational views:

1. **Inspection Console (`F1`)**: Drag-and-drop or upload components, view immediate `PASS`/`FAIL`/`REVIEW` verdicts, compare raw vs heatmap overlays using an interactive slider.
2. **Audit History (`F2`)**: Search and filter past inspections by verdict or defect type; click any row to inspect bounding boxes and model telemetry.
3. **Model Comparison (`F3`)**: Benchmark accuracy, recall, and false-positive rates across PatchCore, ResNet-50, and the Fused Pipeline.
4. **Failure Analysis (`F4`)**: Pareto distribution of defect clusters and root causes across manufacturing runs.

---

## Directory Structure

```text
CN_Project/
├── ai/                              # Anomaly detection & model training
│   ├── anomaly_model/               # Custom modular ResNet-18 PatchCore implementation
│   │   ├── anomaly_model.py         # Feature extractor, memory bank & prediction logic
│   │   ├── config.yaml              # Hyperparameters (percentiles, kernels, weights)
│   │   └── predict.py               # Standalone inference script
│   ├── data/metal_nut/              # MVTec AD dataset (train/test/ground_truth)
│   ├── evaluation_results/          # Evaluation curves (ROC, PR, Confusion Matrix)
│   │   ├── metrics.txt              # Accuracy, Precision, Recall, F1 metrics
│   │   └── classification_report.txt
│   ├── results/Patchcore/           # Trained Lightning checkpoints (.ckpt)
│   ├── train.py                     # Anomalib PatchCore training pipeline
│   └── requirements.txt             # AI training dependencies
│
├── backend/                         # FastAPI production service
│   ├── app/
│   │   ├── api/                     # API routers (predict, history, system)
│   │   ├── db/                      # SQLAlchemy models & SQLite setup
│   │   ├── models/                  # Localizer, classifier & model registry
│   │   ├── services/                # Decision fusion & image processing (heatmaps)
│   │   ├── config.py                # Environment configuration & thresholds
│   │   └── main.py                  # FastAPI application entrypoint
│   ├── inspection_audit.db          # SQLite persistent audit database
│   ├── tests/                       # Backend test suite (pytest)
│   └── requirements.txt             # Backend dependencies
│
├── frontend/                        # React 19 + Vite operator dashboard
│   ├── src/
│   │   ├── components/              # Inspection, History, Comparison, Banner UI
│   │   ├── services/mockApi.js      # API bridge & mock fallback
│   │   ├── App.jsx                  # Main view state & keyboard hotkeys
│   │   └── index.css                # Industrial UI theme tokens
│   └── package.json                 # Node dependencies (Vite, Framer Motion)
│
└── README.md                        # Master project documentation
```

---

## License

This project is licensed under the MIT License - see the LICENSE file for details. Dataset is subject to the MVTec AD license terms.
