from pathlib import Path
from PIL import Image
import pandas as pd
import matplotlib.pyplot as plt

from config import (
    CATEGORIES,
    DATASET_ROOT
)


# ==========================================================
# SETTINGS
# ==========================================================

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp"}

AI_DIR = Path(__file__).resolve().parent

OUTPUT_EDA = AI_DIR / "outputs" / "EDA"
OUTPUT_SAMPLES = AI_DIR / "outputs" / "samples"

OUTPUT_EDA.mkdir(parents=True, exist_ok=True)
OUTPUT_SAMPLES.mkdir(parents=True, exist_ok=True)


# ==========================================================
# 1. COUNT IMAGES
# ==========================================================

def count_images(folder):

    if not folder.exists():
        return 0

    return sum(
        1
        for file in folder.rglob("*")
        if file.is_file()
        and file.suffix.lower() in IMAGE_EXTENSIONS
    )


# ==========================================================
# 2. GET CATEGORY PATHS
# ==========================================================

def get_category_paths(category):

    category_root = DATASET_ROOT / category

    train_dir = category_root / "train"
    test_dir = category_root / "test"
    ground_truth_dir = category_root / "ground_truth"

    return train_dir, test_dir, ground_truth_dir


# ==========================================================
# 3. TRAIN DATA ANALYSIS
# ==========================================================

def analyze_train(category):

    train_dir, _, _ = get_category_paths(category)

    print(f"\n========== {category.upper()} - TRAIN DATA ==========")

    data = {}

    if not train_dir.exists():
        print("Training folder not found.")
        return data

    for folder in sorted(train_dir.iterdir()):

        if folder.is_dir():

            count = count_images(folder)

            data[folder.name] = count

            print(f"{folder.name:15} : {count} images")

    total = sum(data.values())

    print("--------------------------------")
    print(f"Total Train Images : {total}")

    return data


# ==========================================================
# 4. TEST DATA ANALYSIS
# ==========================================================

def analyze_test(category):

    _, test_dir, _ = get_category_paths(category)

    print(f"\n========== {category.upper()} - TEST DATA ==========")

    data = {}

    if not test_dir.exists():
        print("Test folder not found.")
        return data

    for folder in sorted(test_dir.iterdir()):

        if folder.is_dir():

            count = count_images(folder)

            data[folder.name] = count

            print(f"{folder.name:15} : {count} images")

    total = sum(data.values())

    print("--------------------------------")
    print(f"Total Test Images : {total}")

    return data


# ==========================================================
# 5. GROUND TRUTH ANALYSIS
# ==========================================================

def analyze_ground_truth(category):

    _, _, ground_truth_dir = get_category_paths(category)

    print(
        f"\n========== {category.upper()} - GROUND TRUTH =========="
    )

    data = {}

    if not ground_truth_dir.exists():
        print("Ground truth folder not found.")
        return data

    for folder in sorted(ground_truth_dir.iterdir()):

        if folder.is_dir():

            count = count_images(folder)

            data[folder.name] = count

            print(f"{folder.name:15} : {count} masks")

    total = sum(data.values())

    print("--------------------------------")
    print(f"Total Ground Truth Masks : {total}")

    return data


# ==========================================================
# 6. IMAGE DIMENSIONS
# ==========================================================

def analyze_image_dimensions(category):

    _, test_dir, _ = get_category_paths(category)

    print(
        f"\n========== {category.upper()} - IMAGE DIMENSIONS =========="
    )

    widths = []
    heights = []

    if not test_dir.exists():
        print("Test folder not found.")
        return

    for file in test_dir.rglob("*"):

        if (
            file.is_file()
            and file.suffix.lower() in IMAGE_EXTENSIONS
        ):

            try:

                with Image.open(file) as img:

                    width, height = img.size

                    widths.append(width)
                    heights.append(height)

            except Exception:
                pass

    if not widths:

        print("No images found.")
        return

    print(f"Minimum Width  : {min(widths)}")
    print(f"Maximum Width  : {max(widths)}")
    print(f"Average Width  : {sum(widths) / len(widths):.2f}")

    print(f"Minimum Height : {min(heights)}")
    print(f"Maximum Height : {max(heights)}")
    print(f"Average Height : {sum(heights) / len(heights):.2f}")


# ==========================================================
# 7. CLASS DISTRIBUTION GRAPH
# ==========================================================

def plot_class_distribution(category, test_data):

    if not test_data:
        return

    labels = list(test_data.keys())
    values = list(test_data.values())

    plt.figure(figsize=(9, 6))

    plt.bar(labels, values)

    plt.title(
        f"MVTec AD - {category} Test Data Distribution"
    )

    plt.xlabel("Defect Type")
    plt.ylabel("Number of Images")

    plt.xticks(rotation=30)

    plt.tight_layout()

    output_file = (
        OUTPUT_EDA
        / f"{category}_class_distribution.png"
    )

    plt.savefig(output_file, dpi=300)

    plt.close()

    print(f"Saved: {output_file}")


# ==========================================================
# 8. NORMAL VS DEFECTIVE GRAPH
# ==========================================================

def plot_normal_vs_defective(category, test_data):

    if not test_data:
        return

    good_count = test_data.get("good", 0)

    defective_count = sum(
        count
        for defect, count in test_data.items()
        if defect != "good"
    )

    labels = ["Normal", "Defective"]

    values = [good_count, defective_count]

    plt.figure(figsize=(7, 5))

    plt.bar(labels, values)

    plt.title(
        f"{category} - Normal vs Defective Images"
    )

    plt.xlabel("Class")
    plt.ylabel("Number of Images")

    plt.tight_layout()

    output_file = (
        OUTPUT_EDA
        / f"{category}_normal_vs_defective.png"
    )

    plt.savefig(output_file, dpi=300)

    plt.close()

    print(f"Saved: {output_file}")


# ==========================================================
# 9. SAVE SAMPLE IMAGES
# ==========================================================

def save_sample_images(category):

    print(
        f"\n========== {category.upper()} - SAMPLE IMAGES =========="
    )

    _, test_dir, _ = get_category_paths(category)

    if not test_dir.exists():
        return

    for defect_type in sorted(test_dir.iterdir()):

        if not defect_type.is_dir():
            continue

        image_files = [
            file
            for file in sorted(defect_type.iterdir())
            if file.is_file()
            and file.suffix.lower() in IMAGE_EXTENSIONS
        ]

        if not image_files:
            continue

        image_path = image_files[0]

        try:

            with Image.open(image_path) as image:

                plt.figure(figsize=(5, 5))

                plt.imshow(image)

                plt.title(
                    f"{category} - {defect_type.name}"
                )

                plt.axis("off")

                output_file = (
                    OUTPUT_SAMPLES
                    / f"{category}_{defect_type.name}_sample.png"
                )

                plt.savefig(
                    output_file,
                    dpi=300,
                    bbox_inches="tight"
                )

                plt.close()

                print(f"Saved: {output_file}")

        except Exception as e:

            print(
                f"Could not process {image_path}: {e}"
            )


# ==========================================================
# 10. GROUND TRUTH MASK SAMPLES
# ==========================================================

def save_ground_truth_samples(category):

    print(
        f"\n========== {category.upper()} - GROUND TRUTH SAMPLES =========="
    )

    _, _, ground_truth_dir = get_category_paths(category)

    if not ground_truth_dir.exists():
        return

    for defect_type in sorted(ground_truth_dir.iterdir()):

        if not defect_type.is_dir():
            continue

        mask_files = [
            file
            for file in sorted(defect_type.iterdir())
            if file.is_file()
            and file.suffix.lower() in IMAGE_EXTENSIONS
        ]

        if not mask_files:
            continue

        mask_path = mask_files[0]

        try:

            with Image.open(mask_path) as mask:

                plt.figure(figsize=(5, 5))

                plt.imshow(mask, cmap="gray")

                plt.title(
                    f"{category} - {defect_type.name} Ground Truth"
                )

                plt.axis("off")

                output_file = (
                    OUTPUT_SAMPLES
                    / f"{category}_{defect_type.name}_ground_truth.png"
                )

                plt.savefig(
                    output_file,
                    dpi=300,
                    bbox_inches="tight"
                )

                plt.close()

                print(f"Saved: {output_file}")

        except Exception as e:

            print(
                f"Could not process {mask_path}: {e}"
            )


# ==========================================================
# 11. CREATE DATASET SUMMARY
# ==========================================================

def create_summary(all_results):

    rows = []

    for category, result in all_results.items():

        train_data = result["train"]
        test_data = result["test"]
        ground_truth_data = result["ground_truth"]

        # Train

        for defect_type, count in train_data.items():

            rows.append(
                {
                    "category": category,
                    "split": "train",
                    "defect_type": defect_type,
                    "count": count
                }
            )

        # Test

        for defect_type, count in test_data.items():

            rows.append(
                {
                    "category": category,
                    "split": "test",
                    "defect_type": defect_type,
                    "count": count
                }
            )

        # Ground Truth

        for defect_type, count in ground_truth_data.items():

            rows.append(
                {
                    "category": category,
                    "split": "ground_truth",
                    "defect_type": defect_type,
                    "count": count
                }
            )

    df = pd.DataFrame(rows)

    print("\n========== COMPLETE DATASET SUMMARY ==========")

    print(df.to_string(index=False))

    output_file = (
        OUTPUT_EDA / "dataset_summary_all_categories.csv"
    )

    df.to_csv(output_file, index=False)

    print(f"\nSaved: {output_file}")

    return df


# ==========================================================
# 12. RUN EDA FOR ALL CATEGORIES
# ==========================================================

def run_all_eda():

    print("\n")
    print("==============================================")
    print("      MVTec AD - ALL CATEGORY EDA")
    print("==============================================")

    print(f"Categories: {CATEGORIES}")

    all_results = {}

    for category in CATEGORIES:

        print("\n")
        print("##############################################")
        print(f"           CATEGORY: {category}")
        print("##############################################")

        train_data = analyze_train(category)

        test_data = analyze_test(category)

        ground_truth_data = analyze_ground_truth(category)

        analyze_image_dimensions(category)

        plot_class_distribution(
            category,
            test_data
        )

        plot_normal_vs_defective(
            category,
            test_data
        )

        save_sample_images(category)

        save_ground_truth_samples(category)

        all_results[category] = {
            "train": train_data,
            "test": test_data,
            "ground_truth": ground_truth_data
        }

    create_summary(all_results)

    print("\n")
    print("==============================================")
    print("       ALL CATEGORY EDA COMPLETED!")
    print("==============================================")

    print(f"Processed categories : {len(CATEGORIES)}")

    for category in CATEGORIES:
        print(f"  ✓ {category}")

    print("==============================================")


# ==========================================================
# MAIN PROGRAM
# ==========================================================

if __name__ == "__main__":

    run_all_eda()
