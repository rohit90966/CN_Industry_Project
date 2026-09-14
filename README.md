# AI-Based Surface Defect Detection

An end-to-end surface inspection system built around the MVTec AD `metal_nut` dataset. The project includes:

- PatchCore training and evaluation tools in `ai/`
- A FastAPI inference service with inspection history in `backend/`
- A React/Vite dashboard in `frontend/`

The API combines classifier and anomaly-localizer results into a `PASS`, `FAIL`, or `REVIEW` verdict and can save defect overlays for later inspection.

## Prerequisites

- Python 3.10 or newer. Python 3.14 is used by the AI project's `pyproject.toml`.
- Node.js 18 or newer and npm
- Git
- A CUDA-capable GPU is recommended for PatchCore training, but the training script falls back to CPU.

## Clone the repository

```powershell
git clone https://github.com/<your-username>/<your-repository>.git
cd <your-repository>
```

Replace the placeholder repository URL and directory with the values for your GitHub repository.

## Download and place the dataset

1. Download the MVTec AD dataset from the [official MVTec AD page](https://www.mvtec.com/company/research/datasets/mvtec-ad).
2. Extract the archive.
3. Copy the `metal_nut` directory into `ai/data/`.

The resulting layout must be:

```text
ai/
└── data/
	└── metal_nut/
		├── train/
		│   └── good/
		├── test/
		│   ├── bent/
		│   ├── color/
		│   ├── flip/
		│   ├── good/
		│   └── scratch/
		└── ground_truth/
			├── bent/
			├── color/
			├── flip/
			└── scratch/
```

Do not add the dataset to Git. Dataset directories are excluded by `.gitignore`.

## Train the anomaly model

Create a virtual environment and install the AI dependencies:

```powershell
cd ai
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Start training and evaluation from the `ai` directory:

```powershell
python train.py
```

The script trains a PatchCore model with a `wide_resnet50_2` backbone, then evaluates it against the configured `metal_nut` test set. Anomalib writes generated results and checkpoints below `ai/results/`.

For standalone prediction with the reusable anomaly-model package:

```powershell
python -m anomaly_model.predict path\to\image.png --output output\prediction.png
```

The repository's backend looks for the default checkpoint at:

```text
ai/results/Patchcore/metal_nut/v2/weights/lightning/model.ckpt
```

If your training run creates the checkpoint at another location, set `LOCALIZER_MODEL_PATH` in `backend/.env` to its path before starting the API. The backend can still start without a checkpoint and uses its fallback localizer.

## Run the backend API

Open a new terminal at the repository root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API is available at `http://127.0.0.1:8000`.

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- Health check: `GET /api/v1/health`
- Prediction: `POST /api/v1/predict`
- History: `GET /api/v1/history`
- Model information: `GET /api/v1/models`

The backend creates runtime files in `backend/uploads/`, `backend/results/`, and its SQLite audit database. These generated files are ignored by Git.

## Run the frontend

Open another terminal at the repository root:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173`. The frontend expects the API at `http://127.0.0.1:8000/api/v1` by default.

To create a production frontend build:

```powershell
npm.cmd run build
npm.cmd run preview
```

## Run tests and checks

Run backend tests from the repository root:

```powershell
cd backend
python -m pytest tests -v
```

Run the frontend lint and production build:

```powershell
cd frontend
npm.cmd run lint
npm.cmd run build
```

## Configuration

Backend settings can be overridden with a `backend/.env` file. Useful values include:

```dotenv
LOCALIZER_MODEL_PATH=D:\path\to\model.ckpt
CONFIDENCE_THRESHOLD=0.75
ANOMALY_SCORE_THRESHOLD=0.65
```

Do not commit `.env` files or model weights. They are excluded by `.gitignore`.

## Project structure

```text
ai/        Dataset, PatchCore training, evaluation, notebooks, and inference code
backend/   FastAPI service, model wrappers, fusion logic, database, and tests
frontend/  React dashboard and Vite configuration
```

More component-specific details are available in [ai/README.md](ai/README.md) and [backend/README.md](backend/README.md).
