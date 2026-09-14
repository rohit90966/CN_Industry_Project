# AI component

This component contains the MVTec AD dataset, PatchCore training and evaluation scripts, reusable anomaly-model package, trained artifacts, and evaluation outputs.

Run commands from this directory:

```powershell
pip install -r requirements.txt
python train.py
python -m anomaly_model.predict path\\to\\image.png --output output\\prediction.png
```

The dataset is expected at `data/metal_nut`. The API reads a PatchCore checkpoint from `results/Patchcore/metal_nut/v2/weights/lightning/model.ckpt` when one is present and otherwise uses its built-in fallback localizer.
