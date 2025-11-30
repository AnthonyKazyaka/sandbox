#!/usr/bin/env python3
"""
Compare Automated Detection vs Human Labels

Runs the photo analyzer on labeled photos and compares automated
detection results with human-verified labels to calculate accuracy metrics.
"""

import json
import sys
from pathlib import Path
from collections import defaultdict

# Import analyzer modules
from analysis import analyze_image


def load_human_labels(labels_file):
    """Load human labels from JSON file."""
    with open(labels_file, 'r') as f:
        return json.load(f)


def run_automated_analysis(photo_dir):
    """Run automated analyzer on photos and return results."""
    photo_dir = Path(photo_dir)
    results = {}
    
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif'}
    image_files = [f for f in photo_dir.iterdir() 
                   if f.suffix.lower() in image_extensions]
    
    print(f"Analyzing {len(image_files)} photos with automated detector...")
    
    for i, image_path in enumerate(image_files, 1):
        try:
            result = analyze_image(str(image_path))
            if result:
                results[image_path.name] = result
                print(f"  [{i}/{len(image_files)}] {image_path.name}")
        except Exception as e:
            print(f"  Error analyzing {image_path.name}: {e}")
    
    return results


def compare_results(human_labels, auto_results):
    """Compare automated vs human labels and calculate metrics."""
    
    # Initialize confusion matrices for each category
    categories = {
        'person': {'tp': 0, 'fp': 0, 'tn': 0, 'fn': 0},
        'cat': {'tp': 0, 'fp': 0, 'tn': 0, 'fn': 0},
        # Note: Can't evaluate dogs since automated analyzer doesn't detect them yet
    }
    
    mismatches = defaultdict(list)
    
    for filename, human_label in human_labels.items():
        if filename not in auto_results:
            print(f"Warning: {filename} not found in automated results")
            continue
        
        auto_result = auto_results[filename]
        
        # Compare person detection
        human_person = human_label['has_person']
        auto_person = auto_result['has_person']
        
        if human_person and auto_person:
            categories['person']['tp'] += 1
        elif not human_person and not auto_person:
            categories['person']['tn'] += 1
        elif not human_person and auto_person:
            categories['person']['fp'] += 1
            mismatches['person_fp'].append(filename)
        else:  # human_person and not auto_person
            categories['person']['fn'] += 1
            mismatches['person_fn'].append(filename)
        
        # Compare cat detection
        human_cat = human_label['has_cat']
        auto_cat = auto_result['has_pet']  # Note: analyzer only detects cats as "pets"
        
        if human_cat and auto_cat:
            categories['cat']['tp'] += 1
        elif not human_cat and not auto_cat:
            categories['cat']['tn'] += 1
        elif not human_cat and auto_cat:
            categories['cat']['fp'] += 1
            mismatches['cat_fp'].append(filename)
        else:  # human_cat and not auto_cat
            categories['cat']['fn'] += 1
            mismatches['cat_fn'].append(filename)
    
    return categories, mismatches


def calculate_metrics(confusion):
    """Calculate precision, recall, F1, and accuracy from confusion matrix."""
    tp = confusion['tp']
    fp = confusion['fp']
    tn = confusion['tn']
    fn = confusion['fn']
    
    total = tp + fp + tn + fn
    
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
    accuracy = (tp + tn) / total if total > 0 else 0
    
    return {
        'precision': precision,
        'recall': recall,
        'f1': f1,
        'accuracy': accuracy,
        'tp': tp,
        'fp': fp,
        'tn': tn,
        'fn': fn,
        'total': total
    }


def print_comparison(categories, mismatches):
    """Print comparison results and metrics."""
    print("\n" + "=" * 70)
    print("AUTOMATED vs HUMAN LABEL COMPARISON")
    print("=" * 70)
    
    for category, confusion in categories.items():
        metrics = calculate_metrics(confusion)
        
        print(f"\n{category.upper()} DETECTION:")
        print(f"  Accuracy:  {metrics['accuracy']*100:5.1f}%")
        print(f"  Precision: {metrics['precision']*100:5.1f}% (of detected, how many were correct)")
        print(f"  Recall:    {metrics['recall']*100:5.1f}% (of actual, how many were detected)")
        print(f"  F1 Score:  {metrics['f1']*100:5.1f}%")
        print(f"\n  Confusion Matrix:")
        print(f"    True Positives:  {metrics['tp']:3d} (correctly detected)")
        print(f"    False Positives: {metrics['fp']:3d} (detected but not present)")
        print(f"    True Negatives:  {metrics['tn']:3d} (correctly not detected)")
        print(f"    False Negatives: {metrics['fn']:3d} (present but not detected)")
    
    # Print mismatches
    print("\n" + "=" * 70)
    print("MISMATCHES REQUIRING ATTENTION")
    print("=" * 70)
    
    if mismatches['person_fp']:
        print(f"\n❌ FALSE POSITIVES - Person detected but NOT present ({len(mismatches['person_fp'])}):")
        for filename in mismatches['person_fp'][:10]:  # Show first 10
            print(f"  • {filename}")
        if len(mismatches['person_fp']) > 10:
            print(f"  ... and {len(mismatches['person_fp']) - 10} more")
    
    if mismatches['person_fn']:
        print(f"\n⚠️  FALSE NEGATIVES - Person present but NOT detected ({len(mismatches['person_fn'])}):")
        for filename in mismatches['person_fn'][:10]:
            print(f"  • {filename}")
        if len(mismatches['person_fn']) > 10:
            print(f"  ... and {len(mismatches['person_fn']) - 10} more")
    
    if mismatches['cat_fp']:
        print(f"\n❌ FALSE POSITIVES - Cat detected but NOT present ({len(mismatches['cat_fp'])}):")
        for filename in mismatches['cat_fp'][:10]:
            print(f"  • {filename}")
        if len(mismatches['cat_fp']) > 10:
            print(f"  ... and {len(mismatches['cat_fp']) - 10} more")
    
    if mismatches['cat_fn']:
        print(f"\n⚠️  FALSE NEGATIVES - Cat present but NOT detected ({len(mismatches['cat_fn'])}):")
        for filename in mismatches['cat_fn'][:10]:
            print(f"  • {filename}")
        if len(mismatches['cat_fn']) > 10:
            print(f"  ... and {len(mismatches['cat_fn']) - 10} more")


def generate_recommendations(categories, human_labels):
    """Generate specific recommendations based on results."""
    print("\n" + "=" * 70)
    print("RECOMMENDATIONS")
    print("=" * 70)
    
    person_metrics = calculate_metrics(categories['person'])
    cat_metrics = calculate_metrics(categories['cat'])
    
    # Dog detection
    dog_count = sum(1 for label in human_labels.values() if label['has_dog'])
    print(f"\n🐕 DOG DETECTION:")
    print(f"  • {dog_count} photos contain dogs ({dog_count/len(human_labels)*100:.1f}%)")
    print(f"  • CRITICAL: No dog detection currently implemented!")
    print(f"  • Action: Add dog detection using:")
    print(f"    - Option 1: OpenCV Haar Cascade (fast, simple)")
    print(f"    - Option 2: YOLO v8 (more accurate, slower)")
    print(f"    - Option 3: TensorFlow Hub pre-trained model")
    
    # Person detection
    print(f"\n👤 PERSON DETECTION:")
    if person_metrics['fp'] > person_metrics['tp']:
        print(f"  • ⚠️  HIGH FALSE POSITIVE RATE: {person_metrics['fp']} false vs {person_metrics['tp']} correct")
        print(f"  • Problem: Likely confusing cat faces with human faces")
        print(f"  • Action: Increase minNeighbors parameter (currently detecting too aggressively)")
        print(f"  • Action: Consider using face recognition model (e.g., dlib, face_recognition)")
    elif person_metrics['fn'] > person_metrics['tp']:
        print(f"  • ⚠️  HIGH MISS RATE: Missing {person_metrics['fn']} of {person_metrics['fn'] + person_metrics['tp']} people")
        print(f"  • Action: Decrease scaleFactor or minNeighbors to be more sensitive")
    else:
        print(f"  • ✓ Reasonable performance: {person_metrics['accuracy']*100:.1f}% accuracy")
        print(f"  • Consider fine-tuning if precision/recall can be improved")
    
    # Cat detection  
    print(f"\n🐱 CAT DETECTION:")
    if cat_metrics['recall'] < 0.7:
        print(f"  • ⚠️  MISSING CATS: Only detecting {cat_metrics['recall']*100:.1f}% of cats")
        print(f"  • Action: Adjust detection parameters to be more sensitive")
        print(f"  • Action: Try alternative cat face cascades")
    elif cat_metrics['precision'] < 0.8:
        print(f"  • ⚠️  FALSE POSITIVES: {(1-cat_metrics['precision'])*100:.1f}% of detections are wrong")
        print(f"  • Action: Increase minNeighbors to reduce false positives")
    else:
        print(f"  • ✓ Good performance: {cat_metrics['f1']*100:.1f}% F1 score")
    
    print(f"\n📊 NEXT STEPS:")
    print(f"  1. Implement dog detection (highest priority)")
    print(f"  2. Tune person detection to reduce cat/human confusion")
    print(f"  3. Validate cat detection accuracy with parameter adjustments")
    print(f"  4. Collect more labeled training data (especially people-only photos)")
    print(f"  5. Consider migrating to deep learning models for better accuracy")


def main():
    if len(sys.argv) < 3:
        print("Usage: python compare_labels.py <labels.json> <photo_directory>")
        print("\nExample:")
        print("  python compare_labels.py photo_labels_2025-11-29.json /path/to/photos")
        sys.exit(1)
    
    labels_file = Path(sys.argv[1])
    photo_dir = Path(sys.argv[2])
    
    if not labels_file.exists():
        print(f"Error: Labels file not found: {labels_file}")
        sys.exit(1)
    
    if not photo_dir.exists() or not photo_dir.is_dir():
        print(f"Error: Photo directory not found: {photo_dir}")
        sys.exit(1)
    
    print("=" * 70)
    print("COMPARING AUTOMATED DETECTION vs HUMAN LABELS")
    print("=" * 70)
    print()
    
    # Load human labels
    print(f"Loading human labels from: {labels_file}")
    human_labels = load_human_labels(labels_file)
    print(f"✓ Loaded {len(human_labels)} human labels")
    print()
    
    # Run automated analysis
    print(f"Running automated analysis on: {photo_dir}")
    auto_results = run_automated_analysis(photo_dir)
    print(f"✓ Analyzed {len(auto_results)} photos")
    
    # Compare results
    categories, mismatches = compare_results(human_labels, auto_results)
    
    # Print results
    print_comparison(categories, mismatches)
    generate_recommendations(categories, human_labels)
    
    print("\n" + "=" * 70)


if __name__ == '__main__':
    main()
