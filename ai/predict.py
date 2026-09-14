import argparse
import os
import time
from pathlib import Path
import numpy as np
import torch
import matplotlib.pyplot as plt
import seaborn as sns

from PIL import Image
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
    roc_curve,
    precision_recall_curve,
    auc
)

from anomalib.models import Patchcore
from anomalib.engine import Engine


# ============================================================
# CONFIGURATION
# ============================================================

AI_DIR = Path(__file__).resolve().parent
TEST_DIR = AI_DIR / "data" / "metal_nut" / "test"
CHECKPOINT = AI_DIR / "results" / "Patchcore" / "metal_nut" / "v2" / "weights" / "lightning" / "model.ckpt"
OUTPUT_DIR = AI_DIR / "evaluation_results"

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


# ============================================================
# CREATE OUTPUT DIRECTORY
# ============================================================

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(os.path.join(OUTPUT_DIR, "anomaly_maps"), exist_ok=True)


# ============================================================
# LOAD PATCHCORE
# ============================================================

print("Using device:", DEVICE)

model = Patchcore(
    backbone="wide_resnet50_2",
    layers=["layer2", "layer3"],
    coreset_sampling_ratio=0.05,
)

engine = Engine(
    accelerator="gpu" if torch.cuda.is_available() else "cpu",
    devices=1,
)


# ============================================================
# TEST CLASSES
# ============================================================

classes = [
    "good",
    "bent",
    "color",
    "flip",
    "scratch"
]


# ============================================================
# COLLECT IMAGE PATHS
# ============================================================

image_paths = []
true_labels = []
defect_types = []

for class_name in classes:

    class_dir = os.path.join(TEST_DIR, class_name)

    if not os.path.exists(class_dir):
        print("WARNING: folder not found:", class_dir)
        continue

    for file in os.listdir(class_dir):

        if file.lower().endswith(
            (".png", ".jpg", ".jpeg", ".bmp")
        ):

            path = os.path.join(class_dir, file)

            image_paths.append(path)

            # good = 0
            # defect = 1
            if class_name == "good":
                true_labels.append(0)
            else:
                true_labels.append(1)

            defect_types.append(class_name)


print("\nTotal test images:", len(image_paths))


# ============================================================
# LOAD CHECKPOINT
# ============================================================

print("\nLoading PatchCore checkpoint...")

model = Patchcore.load_from_checkpoint(
    CHECKPOINT,
    backbone="wide_resnet50_2",
    layers=["layer2", "layer3"],
    coreset_sampling_ratio=0.05,
)

model.eval()

print("Model loaded successfully.")


# ============================================================
# PREDICTION
# ============================================================

predicted_scores = []
predicted_labels = []
inference_times = []

print("\nRunning predictions...\n")


for i, image_path in enumerate(image_paths):

    start_time = time.perf_counter()

    try:

        predictions = engine.predict(
            model=model,
            data_path=image_path
        )

        elapsed = time.perf_counter() - start_time

        inference_times.append(elapsed)

        # ----------------------------------------------------
        # Extract prediction
        # ----------------------------------------------------

        prediction = predictions[0]

        score = prediction.pred_score

        if torch.is_tensor(score):
            score = score.detach().cpu().item()

        predicted_scores.append(float(score))

        # ----------------------------------------------------
        # Extract predicted label
        # ----------------------------------------------------

        label = prediction.pred_label

        if torch.is_tensor(label):
            label = label.detach().cpu().item()

        predicted_labels.append(int(label))

        print(
            f"[{i+1}/{len(image_paths)}] "
            f"{os.path.basename(image_path)} "
            f"Score={score:.6f} "
            f"Label={label}"
        )

    except Exception as e:

        print(
            "ERROR:",
            image_path,
            "\n",
            e
        )


# ============================================================
# CONVERT TO NUMPY
# ============================================================

true_labels = np.array(true_labels[:len(predicted_labels)])

predicted_labels = np.array(predicted_labels)

predicted_scores = np.array(predicted_scores)

inference_times = np.array(inference_times)


# ============================================================
# METRICS
# ============================================================

accuracy = accuracy_score(
    true_labels,
    predicted_labels
)

precision = precision_score(
    true_labels,
    predicted_labels,
    zero_division=0
)

recall = recall_score(
    true_labels,
    predicted_labels,
    zero_division=0
)

f1 = f1_score(
    true_labels,
    predicted_labels,
    zero_division=0
)

roc_auc = roc_auc_score(
    true_labels,
    predicted_scores
)


# ============================================================
# PRINT METRICS
# ============================================================

print("\n")
print("=" * 60)
print("PATCHCORE EVALUATION")
print("=" * 60)

print(f"Accuracy  : {accuracy:.4f}")
print(f"Precision : {precision:.4f}")
print(f"Recall    : {recall:.4f}")
print(f"F1 Score  : {f1:.4f}")
print(f"ROC-AUC   : {roc_auc:.4f}")

print("=" * 60)


# ============================================================
# CLASSIFICATION REPORT
# ============================================================

report = classification_report(
    true_labels,
    predicted_labels,
    target_names=[
        "Good",
        "Defective"
    ],
    zero_division=0
)

print("\nClassification Report:")
print(report)

with open(
    os.path.join(
        OUTPUT_DIR,
        "classification_report.txt"
    ),
    "w"
) as f:

    f.write(report)


# ============================================================
# SAVE METRICS
# ============================================================

with open(
    os.path.join(
        OUTPUT_DIR,
        "metrics.txt"
    ),
    "w"
) as f:

    f.write("PATCHCORE EVALUATION\n")
    f.write("====================\n\n")

    f.write(f"Accuracy  : {accuracy:.4f}\n")
    f.write(f"Precision : {precision:.4f}\n")
    f.write(f"Recall    : {recall:.4f}\n")
    f.write(f"F1 Score  : {f1:.4f}\n")
    f.write(f"ROC-AUC   : {roc_auc:.4f}\n\n")

    f.write(
        f"Average inference time: "
        f"{np.mean(inference_times) * 1000:.2f} ms\n"
    )

    f.write(
        f"Images per second: "
        f"{1 / np.mean(inference_times):.2f}\n"
    )


# ============================================================
# CONFUSION MATRIX
# ============================================================

cm = confusion_matrix(
    true_labels,
    predicted_labels
)

plt.figure(figsize=(7, 6))

sns.heatmap(
    cm,
    annot=True,
    fmt="d",
    cmap="Blues",
    xticklabels=["Good", "Defective"],
    yticklabels=["Good", "Defective"]
)

plt.xlabel("Predicted")
plt.ylabel("Actual")

plt.title("PatchCore Confusion Matrix")

plt.tight_layout()

plt.savefig(
    os.path.join(
        OUTPUT_DIR,
        "confusion_matrix.png"
    ),
    dpi=300
)

plt.close()


# ============================================================
# ROC CURVE
# ============================================================

fpr, tpr, thresholds = roc_curve(
    true_labels,
    predicted_scores
)

roc_auc_value = auc(
    fpr,
    tpr
)

plt.figure(figsize=(7, 6))

plt.plot(
    fpr,
    tpr,
    label=f"PatchCore (AUC = {roc_auc_value:.4f})"
)

plt.plot(
    [0, 1],
    [0, 1],
    linestyle="--"
)

plt.xlabel("False Positive Rate")

plt.ylabel("True Positive Rate")

plt.title("PatchCore ROC Curve")

plt.legend()

plt.grid(True)

plt.tight_layout()

plt.savefig(
    os.path.join(
        OUTPUT_DIR,
        "roc_curve.png"
    ),
    dpi=300
)

plt.close()


# ============================================================
# PRECISION-RECALL CURVE
# ============================================================

precision_values, recall_values, _ = precision_recall_curve(
    true_labels,
    predicted_scores
)

pr_auc = auc(
    recall_values,
    precision_values
)

plt.figure(figsize=(7, 6))

plt.plot(
    recall_values,
    precision_values,
    label=f"PatchCore (AUC = {pr_auc:.4f})"
)

plt.xlabel("Recall")

plt.ylabel("Precision")

plt.title("PatchCore Precision-Recall Curve")

plt.legend()

plt.grid(True)

plt.tight_layout()

plt.savefig(
    os.path.join(
        OUTPUT_DIR,
        "precision_recall_curve.png"
    ),
    dpi=300
)

plt.close()


# ============================================================
# ANOMALY SCORE DISTRIBUTION
# ============================================================

good_scores = predicted_scores[
    true_labels == 0
]

defect_scores = predicted_scores[
    true_labels == 1
]

plt.figure(figsize=(8, 6))

plt.hist(
    good_scores,
    bins=20,
    alpha=0.7,
    label="Good"
)

plt.hist(
    defect_scores,
    bins=20,
    alpha=0.7,
    label="Defective"
)

plt.xlabel("Anomaly Score")

plt.ylabel("Number of Images")

plt.title("PatchCore Anomaly Score Distribution")

plt.legend()

plt.grid(True)

plt.tight_layout()

plt.savefig(
    os.path.join(
        OUTPUT_DIR,
        "anomaly_score_distribution.png"
    ),
    dpi=300
)

plt.close()


# ============================================================
# INFERENCE PERFORMANCE
# ============================================================

avg_time = np.mean(
    inference_times
)

fps = 1 / avg_time

print("\nInference Performance")
print("=====================")

print(
    f"Average time/image : "
    f"{avg_time * 1000:.2f} ms"
)

print(
    f"Images/second      : "
    f"{fps:.2f}"
)


# ============================================================
# FINAL MESSAGE
# ============================================================

print("\n")
print("=" * 60)
print("EVALUATION COMPLETED")
print("=" * 60)

print(
    "Results saved in:",
    OUTPUT_DIR
)
