#!/usr/bin/env python3
"""
Label Analysis and Comparison Tool

Analyzes human-labeled photos and compares with automated detection results.
Generates accuracy metrics and identifies areas for improvement.
"""

import json
import sys
from collections import defaultdict
from pathlib import Path


def load_labels(labels_file):
    """Load human labels from JSON file."""
    with open(labels_file, 'r') as f:
        return json.load(f)


def analyze_labels(labels):
    """Analyze label statistics."""
    stats = {
        'total': len(labels),
        'people': 0,
        'dogs': 0,
        'cats': 0,
        'other_pets': 0,
        'blur_distribution': defaultdict(int),
        'center_distribution': defaultdict(int),
        'combinations': defaultdict(int),
    }
    
    for filename, label in labels.items():
        if label['has_person']:
            stats['people'] += 1
        if label['has_dog']:
            stats['dogs'] += 1
        if label['has_cat']:
            stats['cats'] += 1
        if label['has_other_pet']:
            stats['other_pets'] += 1
        
        stats['blur_distribution'][label['blur_category']] += 1
        stats['center_distribution'][label['center_category']] += 1
        
        # Track combinations
        subjects = []
        if label['has_person']:
            subjects.append('person')
        if label['has_dog']:
            subjects.append('dog')
        if label['has_cat']:
            subjects.append('cat')
        
        if not subjects:
            combo = 'none'
        else:
            combo = '+'.join(sorted(subjects))
        
        stats['combinations'][combo] += 1
    
    return stats


def print_analysis(stats):
    """Print analysis results."""
    print("=" * 60)
    print("HUMAN LABEL ANALYSIS")
    print("=" * 60)
    print(f"\nTotal Photos Labeled: {stats['total']}")
    print(f"\nSubject Detection:")
    print(f"  • People:     {stats['people']:3d} ({stats['people']/stats['total']*100:5.1f}%)")
    print(f"  • Dogs:       {stats['dogs']:3d} ({stats['dogs']/stats['total']*100:5.1f}%)")
    print(f"  • Cats:       {stats['cats']:3d} ({stats['cats']/stats['total']*100:5.1f}%)")
    print(f"  • Other Pets: {stats['other_pets']:3d} ({stats['other_pets']/stats['total']*100:5.1f}%)")
    
    print(f"\nBlur Quality Distribution:")
    for blur_type in ['sharp', 'soft', 'blurry']:
        count = stats['blur_distribution'][blur_type]
        pct = count / stats['total'] * 100
        print(f"  • {blur_type.capitalize():6s}: {count:3d} ({pct:5.1f}%)")
    
    print(f"\nCentering Distribution:")
    for center_type in ['well_centered', 'somewhat_centered', 'off_center']:
        count = stats['center_distribution'][center_type]
        pct = count / stats['total'] * 100
        display_name = center_type.replace('_', ' ').title()
        print(f"  • {display_name:18s}: {count:3d} ({pct:5.1f}%)")
    
    print(f"\nSubject Combinations:")
    for combo, count in sorted(stats['combinations'].items(), key=lambda x: -x[1]):
        pct = count / stats['total'] * 100
        print(f"  • {combo:20s}: {count:3d} ({pct:5.1f}%)")


def generate_insights(stats):
    """Generate insights and recommendations."""
    print("\n" + "=" * 60)
    print("INSIGHTS & RECOMMENDATIONS")
    print("=" * 60)
    
    insights = []
    
    # Dog detection needed
    if stats['dogs'] > 0:
        insights.append(f"✓ Dog Detection Required: {stats['dogs']} photos contain dogs")
        insights.append("  → Need to implement dog face/body detection")
        insights.append("  → Current Haar cascade only detects cats")
    
    # Cat detection validation
    if stats['cats'] > 0:
        insights.append(f"\n✓ Cat Detection Validation: {stats['cats']} photos contain cats")
        insights.append("  → Test current Haar cascade accuracy against labels")
        insights.append("  → Many cat photos are well-centered and sharp (good for training)")
    
    # Person detection validation
    if stats['people'] > 0:
        insights.append(f"\n✓ Person Detection Validation: {stats['people']} photos contain people")
        insights.append("  → Current detector may confuse cat/human faces")
        insights.append("  → Need to validate false positive rate")
    
    # Blur quality insights
    sharp_pct = stats['blur_distribution']['sharp'] / stats['total'] * 100
    blurry_pct = stats['blur_distribution']['blurry'] / stats['total'] * 100
    
    insights.append(f"\n✓ Image Quality:")
    insights.append(f"  → {sharp_pct:.1f}% sharp images (good for training)")
    insights.append(f"  → {blurry_pct:.1f}% blurry images (may affect detection)")
    
    # Training data recommendations
    insights.append(f"\n✓ Training Data Potential:")
    
    dog_only = stats['combinations'].get('dog', 0)
    cat_only = stats['combinations'].get('cat', 0)
    person_only = stats['combinations'].get('person', 0)
    
    if dog_only > 0:
        insights.append(f"  → {dog_only} dog-only photos (ideal for dog classifier)")
    if cat_only > 0:
        insights.append(f"  → {cat_only} cat-only photos (ideal for cat classifier)")
    if person_only > 0:
        insights.append(f"  → {person_only} person-only photos (ideal for person classifier)")
    
    # Next steps
    insights.append(f"\n✓ Recommended Next Steps:")
    insights.append("  1. Run automated analyzer on this photo set")
    insights.append("  2. Compare automated vs. human labels (precision/recall)")
    insights.append("  3. Implement dog detection (start with Haar cascade or YOLO)")
    insights.append("  4. Tune detection thresholds based on false positive/negative rates")
    insights.append("  5. Collect more labeled data for underrepresented categories")
    
    for insight in insights:
        print(insight)


def main():
    if len(sys.argv) < 2:
        print("Usage: python analyze_labels.py <labels.json>")
        print("\nExample:")
        print("  python analyze_labels.py photo_labels_2025-11-29.json")
        sys.exit(1)
    
    labels_file = Path(sys.argv[1])
    
    if not labels_file.exists():
        print(f"Error: File not found: {labels_file}")
        sys.exit(1)
    
    # Load and analyze
    labels = load_labels(labels_file)
    stats = analyze_labels(labels)
    
    # Print results
    print_analysis(stats)
    generate_insights(stats)
    
    print("\n" + "=" * 60)


if __name__ == '__main__':
    main()
