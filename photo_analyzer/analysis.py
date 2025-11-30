"""
Image analysis logic using OpenCV.

This module provides functions for analyzing images including:
- Blur detection using Laplacian variance
- Person detection using Haar cascades
- Pet (cat face) detection using Haar cascades
- Subject centering analysis
"""

import cv2
import numpy as np
import os
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, List
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Blur score thresholds
BLUR_THRESHOLD_SHARP = 150.0
BLUR_THRESHOLD_SOFT = 50.0

# Centering thresholds (normalized distance from center)
CENTER_THRESHOLD_WELL = 0.15
CENTER_THRESHOLD_SOMEWHAT = 0.35

# Minimum detection sizes for Haar cascades
MIN_FACE_SIZE = (30, 30)
MIN_CAT_FACE_SIZE = (40, 40)


def get_haar_cascade_path(cascade_name: str) -> str:
    """
    Get the full path to a Haar cascade file.
    
    Args:
        cascade_name: Name of the cascade file.
        
    Returns:
        Full path to the cascade file.
    """
    return os.path.join(cv2.data.haarcascades, cascade_name)


# Load Haar cascades
_face_cascade: Optional[cv2.CascadeClassifier] = None
_cat_cascade: Optional[cv2.CascadeClassifier] = None


def _load_cascades() -> None:
    """Load Haar cascade classifiers lazily."""
    global _face_cascade, _cat_cascade
    
    if _face_cascade is None:
        _face_cascade = cv2.CascadeClassifier(
            get_haar_cascade_path('haarcascade_frontalface_default.xml')
        )
        if _face_cascade.empty():
            logger.warning("Failed to load face cascade classifier")
    
    if _cat_cascade is None:
        # Try extended cat face cascade first, then regular
        _cat_cascade = cv2.CascadeClassifier(
            get_haar_cascade_path('haarcascade_frontalcatface_extended.xml')
        )
        if _cat_cascade.empty():
            _cat_cascade = cv2.CascadeClassifier(
                get_haar_cascade_path('haarcascade_frontalcatface.xml')
            )
        if _cat_cascade.empty():
            logger.warning("Failed to load cat face cascade classifier")


def calculate_blur_score(gray_image: np.ndarray) -> float:
    """
    Calculate blur score using variance of Laplacian.
    
    Higher values indicate sharper images.
    
    Args:
        gray_image: Grayscale image as numpy array.
        
    Returns:
        Blur score (variance of Laplacian).
    """
    laplacian = cv2.Laplacian(gray_image, cv2.CV_64F)
    return float(laplacian.var())


def categorize_blur(blur_score: float) -> str:
    """
    Categorize blur score into descriptive categories.
    
    Args:
        blur_score: Numeric blur score.
        
    Returns:
        Category string: "sharp", "soft", or "blurry"
    """
    if blur_score >= BLUR_THRESHOLD_SHARP:
        return "sharp"
    elif blur_score >= BLUR_THRESHOLD_SOFT:
        return "soft"
    else:
        return "blurry"


def detect_faces(gray_image: np.ndarray) -> List[Tuple[int, int, int, int]]:
    """
    Detect human faces in a grayscale image.
    
    Args:
        gray_image: Grayscale image as numpy array.
        
    Returns:
        List of face bounding boxes as (x, y, w, h) tuples.
    """
    _load_cascades()
    if _face_cascade is None or _face_cascade.empty():
        return []
    
    faces = _face_cascade.detectMultiScale(
        gray_image,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=MIN_FACE_SIZE
    )
    
    # Convert to list of tuples
    if len(faces) == 0:
        return []
    return [tuple(face) for face in faces]


def detect_cat_faces(gray_image: np.ndarray) -> List[Tuple[int, int, int, int]]:
    """
    Detect cat faces in a grayscale image.
    
    Args:
        gray_image: Grayscale image as numpy array.
        
    Returns:
        List of cat face bounding boxes as (x, y, w, h) tuples.
    """
    _load_cascades()
    if _cat_cascade is None or _cat_cascade.empty():
        return []
    
    cats = _cat_cascade.detectMultiScale(
        gray_image,
        scaleFactor=1.1,
        minNeighbors=3,
        minSize=MIN_CAT_FACE_SIZE
    )
    
    # Convert to list of tuples
    if len(cats) == 0:
        return []
    return [tuple(cat) for cat in cats]


def calculate_center_score(
    bbox: Tuple[int, int, int, int],
    image_width: int,
    image_height: int
) -> float:
    """
    Calculate how centered a bounding box is in the image.
    
    Returns a normalized distance from the image center (0.0 = perfectly centered).
    
    Args:
        bbox: Bounding box as (x, y, w, h).
        image_width: Image width in pixels.
        image_height: Image height in pixels.
        
    Returns:
        Normalized center distance (0.0 to ~1.0).
    """
    x, y, w, h = bbox
    
    # Calculate center of bounding box
    bbox_center_x = x + w / 2
    bbox_center_y = y + h / 2
    
    # Calculate image center
    img_center_x = image_width / 2
    img_center_y = image_height / 2
    
    # Calculate normalized distance
    dx = (bbox_center_x - img_center_x) / image_width
    dy = (bbox_center_y - img_center_y) / image_height
    
    # Euclidean distance normalized
    distance = np.sqrt(dx**2 + dy**2)
    
    return float(distance)


def categorize_centering(center_score: float) -> str:
    """
    Categorize centering score into descriptive categories.
    
    Args:
        center_score: Normalized distance from center.
        
    Returns:
        Category string: "well_centered", "somewhat_centered", or "off_center"
    """
    if center_score <= CENTER_THRESHOLD_WELL:
        return "well_centered"
    elif center_score <= CENTER_THRESHOLD_SOMEWHAT:
        return "somewhat_centered"
    else:
        return "off_center"


def get_largest_detection(
    detections: List[Tuple[int, int, int, int]]
) -> Optional[Tuple[int, int, int, int]]:
    """
    Get the largest detection by area.
    
    Args:
        detections: List of bounding boxes as (x, y, w, h).
        
    Returns:
        Largest bounding box, or None if empty.
    """
    if not detections:
        return None
    
    return max(detections, key=lambda d: d[2] * d[3])


def analyze_image(image_path: str) -> Dict[str, Any]:
    """
    Perform complete analysis on a single image.
    
    Args:
        image_path: Path to the image file.
        
    Returns:
        Dictionary containing all analysis results:
        - width: Image width
        - height: Image height
        - blur_score: Numeric blur score
        - blur_category: "sharp", "soft", or "blurry"
        - has_person: Boolean
        - has_pet: Boolean
        - center_score: Normalized centering score
        - center_category: "well_centered", "somewhat_centered", or "off_center"
        
    Raises:
        ValueError: If image cannot be loaded.
    """
    # Load image in color first to get dimensions
    color_image = cv2.imread(image_path)
    if color_image is None:
        raise ValueError(f"Cannot load image: {image_path}")
    
    height, width = color_image.shape[:2]
    
    # Convert to grayscale for analysis
    gray_image = cv2.cvtColor(color_image, cv2.COLOR_BGR2GRAY)
    
    # Calculate blur score
    blur_score = calculate_blur_score(gray_image)
    blur_category = categorize_blur(blur_score)
    
    # Detect faces and cats
    faces = detect_faces(gray_image)
    cats = detect_cat_faces(gray_image)
    
    has_person = len(faces) > 0
    has_pet = len(cats) > 0
    
    # Calculate centering based on largest detection
    all_detections = faces + cats
    largest = get_largest_detection(all_detections)
    
    if largest:
        center_score = calculate_center_score(largest, width, height)
    else:
        # No detection, use center of image (score = 0)
        center_score = 0.0
    
    center_category = categorize_centering(center_score)
    
    return {
        'width': width,
        'height': height,
        'blur_score': round(blur_score, 2),
        'blur_category': blur_category,
        'has_person': has_person,
        'has_pet': has_pet,
        'center_score': round(center_score, 4),
        'center_category': center_category
    }
