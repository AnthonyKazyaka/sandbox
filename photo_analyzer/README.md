# Photo Analyzer

A Python CLI tool for bulk photo analysis with SQLite caching. Analyzes images for blur, person detection, pet detection, and subject centering.

## Features

- **Blur Detection**: Uses Laplacian variance to detect blurry images
- **Person Detection**: Uses Haar cascade for face detection
- **Pet Detection**: Uses Haar cascade for cat face detection
- **Centering Analysis**: Measures how centered detected subjects are
- **SQLite Caching**: Skips unchanged files for efficient re-runs
- **JSON Export**: Export results for use with the review UI

## Requirements

- Python 3.7+
- OpenCV (`opencv-python`)
- Optional: `tqdm` for progress bars

## Installation

### 1. Set up a virtual environment (recommended)

```bash
# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# On Linux/Mac:
source .venv/bin/activate
# On Windows:
# .venv\Scripts\activate
```

### 2. Install dependencies

```bash
# Install all dependencies from requirements.txt
pip install -r requirements.txt

# Or install manually:
pip install opencv-python tqdm
```

## Usage

### Basic Usage

```bash
python analyze_photos.py INPUT_DIR
```

### Full Example

```bash
python analyze_photos.py ~/Photos \
    --db photo_cache.sqlite \
    --summary-json summary.json \
    --extensions .jpg,.jpeg,.png \
    --verbose
```

### Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `INPUT_DIR` | Directory containing images to analyze | Required |
| `--db PATH` | SQLite database file for caching | `photo_cache.sqlite` |
| `--summary-json PATH` | Output JSON file path | None |
| `--extensions EXTS` | Comma-separated extensions | `.jpg,.jpeg,.png,.gif,.bmp,.webp,.tiff,.tif` |
| `--force` | Force re-analysis, ignore cache | False |
| `--verbose`, `-v` | Enable detailed logging | False |

## JSON Output Format

The `--summary-json` option produces a JSON array with the following structure:

```json
[
  {
    "path": "vacation/beach.jpg",
    "size_bytes": 2456789,
    "width": 4032,
    "height": 3024,
    "blur_score": 245.67,
    "blur_category": "sharp",
    "has_person": true,
    "has_pet": false,
    "center_score": 0.12,
    "center_category": "well_centered",
    "analyzed_at": "2024-01-15T10:30:00.000000"
  }
]
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `path` | string | Relative path from input directory |
| `size_bytes` | integer | File size in bytes |
| `width` | integer | Image width in pixels |
| `height` | integer | Image height in pixels |
| `blur_score` | float | Laplacian variance (higher = sharper) |
| `blur_category` | string | "sharp" (≥150), "soft" (50-150), or "blurry" (<50) |
| `has_person` | boolean | Whether a human face was detected |
| `has_pet` | boolean | Whether a cat face was detected |
| `center_score` | float | Distance from center (0.0 = perfectly centered) |
| `center_category` | string | "well_centered" (≤0.15), "somewhat_centered" (≤0.35), or "off_center" |
| `analyzed_at` | string | ISO 8601 timestamp of analysis |

## SQLite Database Schema

The cache database uses a single table:

```sql
CREATE TABLE photo_analysis (
    id INTEGER PRIMARY KEY,
    root TEXT NOT NULL,
    path TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    mtime_ns INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    blur_score REAL NOT NULL,
    blur_category TEXT NOT NULL,
    has_person INTEGER NOT NULL,
    has_pet INTEGER NOT NULL,
    center_score REAL NOT NULL,
    center_category TEXT NOT NULL,
    analyzed_at TEXT NOT NULL
);

CREATE INDEX idx_root_path ON photo_analysis(root, path);
```

## Analysis Details

### Blur Detection

Uses the variance of Laplacian method:
1. Convert image to grayscale
2. Apply Laplacian operator
3. Calculate variance of result

**Thresholds:**
- ≥150: "sharp" - Image is crisp and well-focused
- 50-150: "soft" - Some softness, may be intentional
- <50: "blurry" - Image is noticeably blurry

### Person Detection

Uses OpenCV's `haarcascade_frontalface_default.xml` cascade classifier.

**Limitations:**
- Only detects frontal faces
- May miss profile views
- False positives possible with face-like patterns
- Works best with well-lit, unobstructed faces

### Pet Detection

Uses OpenCV's `haarcascade_frontalcatface_extended.xml` cascade classifier.

**Limitations:**
- Only detects cat faces (not dogs or other pets)
- Requires relatively clear, frontal cat faces
- Performance varies with lighting and angle
- May have false negatives with unusual cat breeds

### Centering Analysis

For images with detected faces/pets:
1. Find the largest detected bounding box
2. Calculate normalized distance from image center
3. Map to categories based on distance thresholds

**Thresholds:**
- ≤0.15: "well_centered" - Subject is near center
- ≤0.35: "somewhat_centered" - Subject is off-center but visible
- >0.35: "off_center" - Subject is near edge

For images without detections, center_score is 0.0.

## Workflow

1. **Run the analyzer** on your photo directory:
   ```bash
   python analyze_photos.py ~/Photos --db cache.sqlite --summary-json summary.json
   ```

2. **The analyzer will:**
   - Scan the directory for image files
   - Check each file against the SQLite cache
   - Analyze new/changed files
   - Update the cache and output JSON

3. **Open the Review UI** (see `photo_review_ui/`):
   - Load `summary.json` in your browser
   - Filter and sort the results
   - Identify photos needing attention

## Performance

The analyzer is designed for efficiency:
- **Caching**: Unchanged files are skipped based on size and modification time
- **Batch processing**: Processes thousands of images efficiently
- **Progress display**: Shows real-time progress with tqdm (if installed)
- **Error resilience**: Continues processing even if individual files fail

## Troubleshooting

### "Cannot load image" errors

- Ensure the file is a valid image format
- Check file permissions
- Verify the file isn't corrupted

### No detections found

- Haar cascades require clear, frontal faces
- Ensure adequate lighting in photos
- Very small faces may not be detected

### Slow performance

- Install tqdm for progress feedback
- Use `--extensions` to limit file types
- Consider processing subdirectories separately

## File Structure

```
photo_analyzer/
├── analyze_photos.py   # Main CLI entry point
├── db.py               # SQLite database helpers
├── analysis.py         # Image analysis logic
├── util.py             # Shared utilities
└── README.md           # This file
```
