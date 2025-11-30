"""
Shared utility functions for the photo analyzer.

This module provides helper functions for file handling,
progress tracking, and other common operations.
"""

import os
from pathlib import Path
from typing import List, Set, Iterator, Tuple
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Default supported image extensions
DEFAULT_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif'}


def parse_extensions(extensions_str: str) -> Set[str]:
    """
    Parse comma-separated extensions string into a set.
    
    Args:
        extensions_str: Comma-separated extensions (e.g., ".jpg,.png")
        
    Returns:
        Set of lowercase extensions with leading dots.
    """
    extensions = set()
    for ext in extensions_str.split(','):
        ext = ext.strip().lower()
        if ext:
            if not ext.startswith('.'):
                ext = '.' + ext
            extensions.add(ext)
    return extensions


def find_images(
    root_dir: str,
    extensions: Set[str] = None
) -> Iterator[Tuple[str, str]]:
    """
    Recursively find all image files in a directory.
    
    Args:
        root_dir: Root directory to scan.
        extensions: Set of file extensions to include.
        
    Yields:
        Tuples of (absolute_path, relative_path).
    """
    if extensions is None:
        extensions = DEFAULT_EXTENSIONS
    
    root_path = Path(root_dir).resolve()
    
    for root, dirs, files in os.walk(root_path):
        # Skip hidden directories
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        
        for filename in files:
            # Skip hidden files
            if filename.startswith('.'):
                continue
                
            ext = Path(filename).suffix.lower()
            if ext in extensions:
                abs_path = Path(root) / filename
                rel_path = abs_path.relative_to(root_path)
                yield str(abs_path), str(rel_path)


def get_file_stats(file_path: str) -> Tuple[int, int]:
    """
    Get file size and modification time.
    
    Args:
        file_path: Path to the file.
        
    Returns:
        Tuple of (size_bytes, mtime_ns).
    """
    stat = os.stat(file_path)
    return stat.st_size, stat.st_mtime_ns


def format_size(size_bytes: int) -> str:
    """
    Format file size in human-readable format.
    
    Args:
        size_bytes: Size in bytes.
        
    Returns:
        Human-readable size string.
    """
    for unit in ['B', 'KB', 'MB', 'GB']:
        if abs(size_bytes) < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} TB"


def setup_logging(verbose: bool = False) -> None:
    """
    Configure logging for the application.
    
    Args:
        verbose: If True, enable DEBUG level logging.
    """
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
