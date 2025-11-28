#!/usr/bin/env python3
"""
Photo Analyzer CLI - Bulk image analysis with SQLite caching.

This script analyzes images in a directory, detecting blur levels,
people, pets (cats), and subject centering. Results are cached in
SQLite for efficient re-runs.

Usage:
    python analyze_photos.py INPUT_DIR [options]

Example:
    python analyze_photos.py ~/Photos --db cache.sqlite --summary-json results.json
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Optional

# Import local modules
from db import init_db, get_cached_analysis, upsert_analysis, get_all_analyses_for_root, delete_missing_files
from analysis import analyze_image
from util import find_images, get_file_stats, parse_extensions, setup_logging, DEFAULT_EXTENSIONS

import logging

logger = logging.getLogger(__name__)


def create_parser() -> argparse.ArgumentParser:
    """Create and configure the argument parser."""
    parser = argparse.ArgumentParser(
        description='Analyze photos for blur, people, pets, and centering.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s ~/Photos
      Analyze all images in ~/Photos using default database.
      
  %(prog)s ~/Photos --db photo_cache.sqlite --summary-json summary.json
      Analyze images and output results to JSON.
      
  %(prog)s ~/Photos --extensions .jpg,.jpeg,.png --force
      Re-analyze all JPG, JPEG, and PNG files.
      
  %(prog)s ~/Photos --verbose
      Run with detailed logging output.
"""
    )
    
    parser.add_argument(
        'input_dir',
        metavar='INPUT_DIR',
        help='Directory containing images to analyze'
    )
    
    parser.add_argument(
        '--db',
        default='photo_cache.sqlite',
        help='Path to SQLite database file (default: photo_cache.sqlite)'
    )
    
    parser.add_argument(
        '--summary-json',
        dest='summary_json',
        help='Path to output JSON summary file'
    )
    
    parser.add_argument(
        '--extensions',
        default=','.join(DEFAULT_EXTENSIONS),
        help=f'Comma-separated list of extensions to process (default: {",".join(DEFAULT_EXTENSIONS)})'
    )
    
    parser.add_argument(
        '--force',
        action='store_true',
        help='Force re-analysis of all files, ignoring cache'
    )
    
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Enable verbose output'
    )
    
    return parser


def process_images(
    input_dir: str,
    db_path: str,
    extensions: set,
    force: bool = False,
    verbose: bool = False
) -> Dict[str, Any]:
    """
    Process all images in the input directory.
    
    Args:
        input_dir: Root directory to scan.
        db_path: Path to SQLite database.
        extensions: Set of file extensions to process.
        force: If True, re-analyze all files.
        verbose: If True, enable detailed logging.
        
    Returns:
        Dictionary with processing statistics.
    """
    # Resolve the input directory path
    root_path = str(Path(input_dir).resolve())
    
    # Initialize database
    conn = init_db(db_path)
    
    # Find all image files
    logger.info(f"Scanning {root_path} for images...")
    images = list(find_images(root_path, extensions))
    total_images = len(images)
    
    if total_images == 0:
        logger.warning("No images found!")
        return {
            'total': 0,
            'analyzed': 0,
            'cached': 0,
            'errors': 0,
            'deleted': 0
        }
    
    logger.info(f"Found {total_images} images")
    
    # Track statistics
    stats = {
        'total': total_images,
        'analyzed': 0,
        'cached': 0,
        'errors': 0,
        'deleted': 0
    }
    
    # Track existing paths for cleanup
    existing_paths = set()
    
    # Check if tqdm is available for progress bars
    try:
        from tqdm import tqdm
        progress_iter = tqdm(images, desc="Analyzing", unit="img")
    except ImportError:
        progress_iter = images
        logger.info("Install tqdm for progress bars: pip install tqdm")
    
    # Process each image
    for abs_path, rel_path in progress_iter:
        existing_paths.add(rel_path)
        
        try:
            # Get file stats
            size_bytes, mtime_ns = get_file_stats(abs_path)
            
            # Check cache unless forcing re-analysis
            if not force:
                cached = get_cached_analysis(conn, root_path, rel_path, size_bytes, mtime_ns)
                if cached:
                    stats['cached'] += 1
                    if verbose:
                        logger.debug(f"Using cached: {rel_path}")
                    continue
            
            # Analyze the image
            if verbose:
                logger.debug(f"Analyzing: {rel_path}")
            
            analysis = analyze_image(abs_path)
            
            # Prepare record for database
            record = {
                'root': root_path,
                'path': rel_path,
                'size_bytes': size_bytes,
                'mtime_ns': mtime_ns,
                'width': analysis['width'],
                'height': analysis['height'],
                'blur_score': analysis['blur_score'],
                'blur_category': analysis['blur_category'],
                'has_person': 1 if analysis['has_person'] else 0,
                'has_pet': 1 if analysis['has_pet'] else 0,
                'center_score': analysis['center_score'],
                'center_category': analysis['center_category'],
                'analyzed_at': datetime.now(timezone.utc).isoformat()
            }
            
            # Save to database
            upsert_analysis(conn, record)
            stats['analyzed'] += 1
            
        except Exception as e:
            stats['errors'] += 1
            logger.warning(f"Error processing {rel_path}: {e}")
    
    # Clean up records for deleted files
    deleted = delete_missing_files(conn, root_path, existing_paths)
    stats['deleted'] = deleted
    if deleted > 0:
        logger.info(f"Removed {deleted} records for deleted files")
    
    conn.close()
    return stats


def write_summary_json(db_path: str, root_path: str, output_path: str) -> int:
    """
    Write JSON summary of all analyses for a root directory.
    
    Args:
        db_path: Path to SQLite database.
        root_path: Root directory path.
        output_path: Path to output JSON file.
        
    Returns:
        Number of records written.
    """
    conn = init_db(db_path)
    records = get_all_analyses_for_root(conn, root_path)
    conn.close()
    
    # Convert to JSON-friendly format
    output = []
    for record in records:
        output.append({
            'path': record['path'],
            'size_bytes': record['size_bytes'],
            'width': record['width'],
            'height': record['height'],
            'blur_score': record['blur_score'],
            'blur_category': record['blur_category'],
            'has_person': bool(record['has_person']),
            'has_pet': bool(record['has_pet']),
            'center_score': record['center_score'],
            'center_category': record['center_category'],
            'analyzed_at': record['analyzed_at']
        })
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2)
    
    return len(output)


def main() -> int:
    """Main entry point."""
    parser = create_parser()
    args = parser.parse_args()
    
    # Setup logging
    setup_logging(args.verbose)
    
    # Validate input directory
    input_dir = Path(args.input_dir)
    if not input_dir.exists():
        logger.error(f"Input directory does not exist: {args.input_dir}")
        return 1
    
    if not input_dir.is_dir():
        logger.error(f"Input path is not a directory: {args.input_dir}")
        return 1
    
    # Parse extensions
    extensions = parse_extensions(args.extensions)
    logger.info(f"Processing extensions: {', '.join(sorted(extensions))}")
    
    # Process images
    try:
        stats = process_images(
            str(input_dir),
            args.db,
            extensions,
            force=args.force,
            verbose=args.verbose
        )
    except Exception as e:
        logger.error(f"Processing failed: {e}")
        return 1
    
    # Print summary
    print("\n" + "=" * 50)
    print("Analysis Complete")
    print("=" * 50)
    print(f"  Total images:     {stats['total']}")
    print(f"  Newly analyzed:   {stats['analyzed']}")
    print(f"  From cache:       {stats['cached']}")
    print(f"  Errors:           {stats['errors']}")
    print(f"  Deleted records:  {stats['deleted']}")
    
    # Write JSON summary if requested
    if args.summary_json:
        root_path = str(Path(args.input_dir).resolve())
        count = write_summary_json(args.db, root_path, args.summary_json)
        print(f"\nJSON summary written to: {args.summary_json}")
        print(f"  Records: {count}")
    
    return 0 if stats['errors'] == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
