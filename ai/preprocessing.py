from torchvision import transforms

from config import IMAGE_SIZE


# ==========================================================
# TRAIN TRANSFORM
# ==========================================================

train_transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),

    # Data Augmentation - Training only
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomRotation(degrees=10),

    transforms.ToTensor(),

    # ImageNet normalization
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# ==========================================================
# TEST TRANSFORM
# ==========================================================

test_transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),

    transforms.ToTensor(),

    # Same normalization, but NO augmentation
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# ==========================================================
# DISPLAY TRANSFORM INFORMATION
# ==========================================================

if __name__ == "__main__":

    print("======================================")
    print("     PREPROCESSING CONFIGURATION")
    print("======================================")

    print(f"Image Size : {IMAGE_SIZE} x {IMAGE_SIZE}")

    print("\nTraining Transform:")
    print("1. Resize")
    print("2. Random Horizontal Flip")
    print("3. Random Rotation")
    print("4. Convert Image to Tensor")
    print("5. Normalize")

    print("\nTesting Transform:")
    print("1. Resize")
    print("2. Convert Image to Tensor")
    print("3. Normalize")

    print("\nPreprocessing configuration loaded successfully!")
