from pathlib import Path
from PIL import Image


IMAGE_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".bmp"
}


def get_image_files(folder):
    """
    Return all image files from a folder.
    """

    folder = Path(folder)

    if not folder.exists():
        return []

    return sorted([
        file
        for file in folder.rglob("*")
        if file.is_file()
        and file.suffix.lower() in IMAGE_EXTENSIONS
    ])


def count_images(folder):
    """
    Count images inside a folder.
    """

    return len(get_image_files(folder))


def load_image(image_path):
    """
    Load an image as RGB.
    """

    image_path = Path(image_path)

    if not image_path.exists():
        raise FileNotFoundError(
            f"Image not found: {image_path}"
        )

    return Image.open(image_path).convert("RGB")


def get_image_size(image_path):
    """
    Return image width and height.
    """

    image = load_image(image_path)

    return image.size


if __name__ == "__main__":

    print("======================================")
    print("       MEMBER 1 UTILS TEST")
    print("======================================")

    print("Utility functions loaded successfully!")

    print("\nAvailable functions:")
    print("1. get_image_files()")
    print("2. count_images()")
    print("3. load_image()")
    print("4. get_image_size()")

    print("\nUtils test completed successfully!")