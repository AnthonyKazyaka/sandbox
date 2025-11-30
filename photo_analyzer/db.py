"""
SQLite database helpers for photo analysis caching.

This module provides functions for creating and interacting with
the SQLite database that caches photo analysis results.
"""

import sqlite3
from typing import List, Optional, Dict, Any
from pathlib import Path


# SQL schema for the photo_analysis table
SCHEMA = """
CREATE TABLE IF NOT EXISTS photo_analysis (
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

CREATE INDEX IF NOT EXISTS idx_root_path ON photo_analysis(root, path);
"""


def init_db(db_path: str) -> sqlite3.Connection:
    """
    Initialize the SQLite database and create schema if needed.
    
    Args:
        db_path: Path to the SQLite database file.
        
    Returns:
        SQLite connection object.
    """
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # Enable dict-like row access
    cursor = conn.cursor()
    cursor.executescript(SCHEMA)
    conn.commit()
    return conn


def get_cached_analysis(
    conn: sqlite3.Connection,
    root: str,
    path: str,
    size_bytes: int,
    mtime_ns: int
) -> Optional[Dict[str, Any]]:
    """
    Retrieve cached analysis for a file if it exists and is unchanged.
    
    Args:
        conn: SQLite connection.
        root: Root directory path.
        path: Relative file path from root.
        size_bytes: Current file size in bytes.
        mtime_ns: Current file modification time in nanoseconds.
        
    Returns:
        Dictionary with cached analysis data, or None if not cached or changed.
    """
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT * FROM photo_analysis 
        WHERE root = ? AND path = ? AND size_bytes = ? AND mtime_ns = ?
        """,
        (root, path, size_bytes, mtime_ns)
    )
    row = cursor.fetchone()
    if row:
        return dict(row)
    return None


def upsert_analysis(conn: sqlite3.Connection, data: Dict[str, Any]) -> None:
    """
    Insert or update an analysis record.
    
    Args:
        conn: SQLite connection.
        data: Dictionary containing all analysis fields.
    """
    cursor = conn.cursor()
    
    # First, try to find existing record
    cursor.execute(
        """
        SELECT id FROM photo_analysis WHERE root = ? AND path = ?
        """,
        (data['root'], data['path'])
    )
    existing = cursor.fetchone()
    
    if existing:
        # Update existing record
        cursor.execute(
            """
            UPDATE photo_analysis SET
                size_bytes = ?,
                mtime_ns = ?,
                width = ?,
                height = ?,
                blur_score = ?,
                blur_category = ?,
                has_person = ?,
                has_pet = ?,
                center_score = ?,
                center_category = ?,
                analyzed_at = ?
            WHERE id = ?
            """,
            (
                data['size_bytes'],
                data['mtime_ns'],
                data['width'],
                data['height'],
                data['blur_score'],
                data['blur_category'],
                data['has_person'],
                data['has_pet'],
                data['center_score'],
                data['center_category'],
                data['analyzed_at'],
                existing['id']
            )
        )
    else:
        # Insert new record
        cursor.execute(
            """
            INSERT INTO photo_analysis (
                root, path, size_bytes, mtime_ns,
                width, height, blur_score, blur_category,
                has_person, has_pet, center_score, center_category,
                analyzed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                data['root'],
                data['path'],
                data['size_bytes'],
                data['mtime_ns'],
                data['width'],
                data['height'],
                data['blur_score'],
                data['blur_category'],
                data['has_person'],
                data['has_pet'],
                data['center_score'],
                data['center_category'],
                data['analyzed_at']
            )
        )
    conn.commit()


def get_all_analyses_for_root(
    conn: sqlite3.Connection,
    root: str
) -> List[Dict[str, Any]]:
    """
    Get all analysis records for a given root directory.
    
    Args:
        conn: SQLite connection.
        root: Root directory path.
        
    Returns:
        List of dictionaries containing analysis data.
    """
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT * FROM photo_analysis WHERE root = ? ORDER BY path
        """,
        (root,)
    )
    return [dict(row) for row in cursor.fetchall()]


def delete_missing_files(
    conn: sqlite3.Connection,
    root: str,
    existing_paths: set
) -> int:
    """
    Delete records for files that no longer exist.
    
    Args:
        conn: SQLite connection.
        root: Root directory path.
        existing_paths: Set of paths that still exist.
        
    Returns:
        Number of records deleted.
    """
    cursor = conn.cursor()
    
    # Get all paths in database for this root
    cursor.execute(
        "SELECT path FROM photo_analysis WHERE root = ?",
        (root,)
    )
    db_paths = {row['path'] for row in cursor.fetchall()}
    
    # Find paths to delete
    paths_to_delete = db_paths - existing_paths
    
    if paths_to_delete:
        placeholders = ','.join('?' * len(paths_to_delete))
        cursor.execute(
            f"DELETE FROM photo_analysis WHERE root = ? AND path IN ({placeholders})",
            [root] + list(paths_to_delete)
        )
        conn.commit()
    
    return len(paths_to_delete)
