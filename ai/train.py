from pathlib import Path

import torch
from anomalib.data import Folder
from anomalib.models import Patchcore
from anomalib.engine import Engine
from torchvision.transforms import v2

transform = v2.Compose([
    v2.Resize((224, 224)),
])

datamodule = Folder(
    name="metal_nut",
    root=Path(__file__).resolve().parent / "data" / "metal_nut",
    normal_dir="train/good",
    abnormal_dir=["test/bent", "test/color", "test/flip", "test/scratch"],
    normal_test_dir="test/good",
    train_batch_size=8,
    eval_batch_size=8,
    num_workers=2,
    augmentations=transform,
)

model = Patchcore(
    backbone="wide_resnet50_2",
    layers=["layer2", "layer3"],
    coreset_sampling_ratio=0.05,
)

engine = Engine(
    accelerator="gpu" if torch.cuda.is_available() else "cpu",
    devices=1,
    max_epochs=1,
)

if __name__ == "__main__":
    engine.fit(model=model, datamodule=datamodule)
    test_results = engine.test(model=model, datamodule=datamodule)
    print(test_results)
