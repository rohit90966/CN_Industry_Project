from pathlib import Path

from PIL import Image
from torch.utils.data import Dataset, DataLoader

from config import (
    CATEGORIES,
    CATEGORY,
    DATASET_ROOT,
    TRAIN_DIR,
    TEST_DIR,
    BATCH_SIZE,
    NUM_WORKERS,
)

from preprocessing import (
    train_transform,
    test_transform,
)


# ==========================================================
# SETTINGS
# ==========================================================

IMAGE_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".bmp"
}


# ==========================================================
# GENERIC MVTec AD DATASET
# ==========================================================

class MVTecDataset(Dataset):
    """
    Generic MVTec AD Dataset Loader.

    Supported categories:
        - metal_nut
        - screw
        - tile

    Labels:
        0 = Good
        1 = Defective
    """

    def __init__(self, root_dir, transform=None):

        self.root_dir = Path(root_dir)
        self.transform = transform

        self.samples = []

        # --------------------------------------------------
        # Check folder
        # --------------------------------------------------

        if not self.root_dir.exists():
            raise FileNotFoundError(
                f"Dataset folder not found: {self.root_dir}"
            )

        # --------------------------------------------------
        # Read good / defective folders
        # --------------------------------------------------

        for folder in sorted(self.root_dir.iterdir()):

            if not folder.is_dir():
                continue

            defect_type = folder.name

            # good = 0
            # defective = 1
            label = 0 if defect_type == "good" else 1

            # --------------------------------------------------
            # Read image files
            # --------------------------------------------------

            for image_path in sorted(folder.iterdir()):

                if (
                    image_path.is_file()
                    and image_path.suffix.lower()
                    in IMAGE_EXTENSIONS
                ):

                    self.samples.append(
                        (
                            image_path,
                            label,
                            defect_type
                        )
                    )

        print(
            f"Loaded {len(self.samples)} images "
            f"from {self.root_dir}"
        )

    # ======================================================
    # NUMBER OF SAMPLES
    # ======================================================

    def __len__(self):

        return len(self.samples)

    # ======================================================
    # GET ONE SAMPLE
    # ======================================================

    def __getitem__(self, index):

        image_path, label, defect_type = self.samples[index]

        # Load image
        image = Image.open(image_path).convert("RGB")

        # Apply preprocessing
        if self.transform is not None:
            image = self.transform(image)

        return (
            image,
            label,
            defect_type,
            str(image_path)
        )


# ==========================================================
# CREATE DATASETS
# ==========================================================

def create_datasets():

    train_dataset = MVTecDataset(
        root_dir=TRAIN_DIR,
        transform=train_transform
    )

    test_dataset = MVTecDataset(
        root_dir=TEST_DIR,
        transform=test_transform
    )

    return train_dataset, test_dataset


# ==========================================================
# CREATE DATALOADERS
# ==========================================================

def create_dataloaders():

    train_dataset, test_dataset = create_datasets()

    train_loader = DataLoader(
        train_dataset,
        batch_size=BATCH_SIZE,
        shuffle=True,
        num_workers=NUM_WORKERS
    )

    test_loader = DataLoader(
        test_dataset,
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=NUM_WORKERS
    )

    return train_loader, test_loader


# ==========================================================
# VERIFY ONE CATEGORY
# ==========================================================

def verify_category(category):

    category_root = DATASET_ROOT / category

    train_dir = category_root / "train"
    test_dir = category_root / "test"

    # Create datasets
    train_dataset = MVTecDataset(
        root_dir=train_dir,
        transform=train_transform
    )

    test_dataset = MVTecDataset(
        root_dir=test_dir,
        transform=test_transform
    )

    # Create DataLoaders
    train_loader = DataLoader(
        train_dataset,
        batch_size=BATCH_SIZE,
        shuffle=True,
        num_workers=NUM_WORKERS
    )

    test_loader = DataLoader(
        test_dataset,
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=NUM_WORKERS
    )

    # Get one batch
    images, labels, defect_types, paths = next(
        iter(train_loader)
    )

    print("\n--------------------------------------")
    print(f"Category          : {category}")
    print(f"Training samples  : {len(train_dataset)}")
    print(f"Testing samples   : {len(test_dataset)}")
    print(f"Training batches  : {len(train_loader)}")
    print(f"Testing batches   : {len(test_loader)}")
    print(f"Image shape       : {images.shape}")
    print(f"Labels shape      : {labels.shape}")
    print(f"Sample labels     : {labels[:5].tolist()}")
    print("--------------------------------------")

    return True


# ==========================================================
# VERIFY ALL CATEGORIES
# ==========================================================

def verify_all_categories():

    print("\n======================================")
    print("   MVTec AD - ALL CATEGORY VERIFY")
    print("======================================")

    print(f"\nCategories: {CATEGORIES}")

    successful = []

    for category in CATEGORIES:

        try:

            verify_category(category)

            successful.append(category)

        except Exception as error:

            print(
                f"\nERROR in {category}:"
            )

            print(error)

    # ------------------------------------------------------
    # Final Result
    # ------------------------------------------------------

    print("\n======================================")
    print("             FINAL RESULT")
    print("======================================")

    print(
        f"Verified categories : "
        f"{len(successful)}/{len(CATEGORIES)}"
    )

    print(
        f"Successful          : "
        f"{successful}"
    )

    if len(successful) == len(CATEGORIES):

        print(
            "\nALL 3 CATEGORIES VERIFIED "
            "SUCCESSFULLY!"
        )

    else:

        print(
            "\nSOME CATEGORIES FAILED "
            "VERIFICATION."
        )

    print("======================================\n")


# ==========================================================
# MAIN TEST
# ==========================================================

if __name__ == "__main__":

    # Verify all three categories
    verify_all_categories()
