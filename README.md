# AI-Based Surface Defect Detection

The repository is organized into independently runnable components:

```text
backend/   FastAPI inspection API, persistence, generated uploads, and overlays
frontend/  React + Vite inspection dashboard
ai/        MVTec AD dataset, training/evaluation code, model artifacts, and notebooks
```

## Start the application

Open two terminals from the repository root.

```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Open the Vite address shown in the second terminal (normally `http://127.0.0.1:5173`). The frontend uses `http://127.0.0.1:8000/api/v1` by default.

## AI workflows

See [ai/README.md](ai/README.md) for training, evaluation, and standalone inference. The backend automatically resolves its optional PatchCore checkpoint from `ai/results/` after this reorganization.
