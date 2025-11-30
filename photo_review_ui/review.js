/**
 * Photo Analysis Review - JavaScript Controller
 * 
 * Handles file loading, filtering, sorting, selection, preview,
 * and keyboard navigation for photo analysis results.
 */

(function() {
    'use strict';

    // State
    let allPhotos = [];
    let filteredPhotos = [];
    let selectedPaths = new Set();
    let userLabels = {}; // { path: { favorite: bool, delete: bool } }
    let currentSort = { field: 'path', direction: 'asc' };
    let activeRowIndex = -1;
    let photoFiles = {}; // Map of filename -> File object for thumbnails
    let previewPhoto = null;

    // DOM Elements
    const elements = {};

    /**
     * Initialize the application.
     */
    function init() {
        cacheElements();
        bindEvents();
        loadFromLocalStorage();
    }

    /**
     * Cache DOM element references.
     */
    function cacheElements() {
        // Upload section
        elements.fileInput = document.getElementById('fileInput');
        elements.photoDirectoryInput = document.getElementById('photoDirectoryInput');
        elements.directoryStatus = document.getElementById('directoryStatus');
        elements.uploadSection = document.getElementById('uploadSection');
        elements.mainContent = document.getElementById('mainContent');
        
        // Stats
        elements.totalCount = document.getElementById('totalCount');
        elements.filteredCount = document.getElementById('filteredCount');
        elements.selectedCount = document.getElementById('selectedCount');
        elements.personCount = document.getElementById('personCount');
        elements.dogCount = document.getElementById('dogCount');
        elements.catCount = document.getElementById('catCount');
        
        // Filters
        elements.blurFilter = document.getElementById('blurFilter');
        elements.personFilter = document.getElementById('personFilter');
        elements.dogFilter = document.getElementById('dogFilter');
        elements.catFilter = document.getElementById('catFilter');
        elements.centerFilter = document.getElementById('centerFilter');
        elements.labelFilter = document.getElementById('labelFilter');
        elements.resetFilters = document.getElementById('resetFilters');
        elements.loadNewFile = document.getElementById('loadNewFile');
        
        // Batch actions
        elements.selectAll = document.getElementById('selectAll');
        elements.selectNone = document.getElementById('selectNone');
        elements.selectionInfo = document.getElementById('selectionInfo');
        elements.selectAllCheckbox = document.getElementById('selectAllCheckbox');
        elements.batchFavorite = document.getElementById('batchFavorite');
        elements.batchDelete = document.getElementById('batchDelete');
        elements.batchClear = document.getElementById('batchClear');
        elements.exportPaths = document.getElementById('exportPaths');
        elements.exportLabels = document.getElementById('exportLabels');
        
        // Results
        elements.resultsBody = document.getElementById('resultsBody');
        elements.resultsCount = document.getElementById('resultsCount');
        elements.resultsTable = document.getElementById('resultsTable');
        elements.emptyState = document.getElementById('emptyState');
        
        // Preview panel
        elements.previewPanel = document.getElementById('previewPanel');
        elements.previewContent = document.getElementById('previewContent');
        elements.previewDetails = document.getElementById('previewDetails');
        elements.previewFilename = document.getElementById('previewFilename');
        elements.previewMeta = document.getElementById('previewMeta');
        elements.closePreview = document.getElementById('closePreview');
        elements.quickFavorite = document.getElementById('quickFavorite');
        elements.quickDelete = document.getElementById('quickDelete');
        
        // Notifications
        elements.errorMessage = document.getElementById('errorMessage');
        elements.errorText = document.getElementById('errorText');
        elements.errorClose = document.getElementById('errorClose');
        elements.toast = document.getElementById('toast');
        elements.toastText = document.getElementById('toastText');
        
        // Modal
        elements.helpModal = document.getElementById('helpModal');
        elements.helpButton = document.getElementById('helpButton');
        elements.closeHelp = document.getElementById('closeHelp');
    }

    /**
     * Bind event listeners.
     */
    function bindEvents() {
        // File inputs
        elements.fileInput.addEventListener('change', handleFileSelect);
        elements.photoDirectoryInput.addEventListener('change', handlePhotoDirectorySelect);
        
        // Filters
        elements.blurFilter.addEventListener('change', applyFilters);
        elements.personFilter.addEventListener('change', applyFilters);
        elements.dogFilter.addEventListener('change', applyFilters);
        elements.catFilter.addEventListener('change', applyFilters);
        elements.centerFilter.addEventListener('change', applyFilters);
        elements.labelFilter.addEventListener('change', applyFilters);
        
        // Buttons
        elements.resetFilters.addEventListener('click', resetFilters);
        elements.loadNewFile.addEventListener('click', showUploadSection);
        elements.errorClose.addEventListener('click', hideError);
        
        // Batch actions
        elements.selectAll.addEventListener('click', selectAllVisible);
        elements.selectNone.addEventListener('click', selectNone);
        elements.selectAllCheckbox.addEventListener('change', handleSelectAllCheckbox);
        elements.batchFavorite.addEventListener('click', () => batchLabel('favorite'));
        elements.batchDelete.addEventListener('click', () => batchLabel('delete'));
        elements.batchClear.addEventListener('click', () => batchLabel('clear'));
        elements.exportPaths.addEventListener('click', exportSelectedPaths);
        elements.exportLabels.addEventListener('click', exportAllLabels);
        
        // Preview panel
        elements.closePreview.addEventListener('click', closePreview);
        elements.quickFavorite.addEventListener('click', () => togglePreviewLabel('favorite'));
        elements.quickDelete.addEventListener('click', () => togglePreviewLabel('delete'));
        
        // Table header sorting
        const headers = elements.resultsTable.querySelectorAll('th.sortable');
        headers.forEach(header => {
            header.addEventListener('click', () => handleSort(header.dataset.sort));
        });
        
        // Modal
        elements.helpButton.addEventListener('click', showHelp);
        elements.closeHelp.addEventListener('click', hideHelp);
        elements.helpModal.addEventListener('click', (e) => {
            if (e.target === elements.helpModal) hideHelp();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);
        
        // Click outside to close preview on mobile
        document.addEventListener('click', handleDocumentClick);
    }

    /**
     * Handle file selection for JSON data.
     */
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            showError('Please select a JSON file');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                loadData(data);
            } catch (err) {
                showError('Invalid JSON file: ' + err.message);
            }
        };
        reader.onerror = function() {
            showError('Failed to read file');
        };
        reader.readAsText(file);
    }

    /**
     * Handle photo directory selection for thumbnails.
     */
    function handlePhotoDirectorySelect(event) {
        const files = Array.from(event.target.files);
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif'];
        
        photoFiles = {};
        let count = 0;
        
        files.forEach(file => {
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            if (imageExtensions.includes(ext)) {
                // Store by filename for lookup
                photoFiles[file.name] = file;
                // Also store by relative path if available
                if (file.webkitRelativePath) {
                    photoFiles[file.webkitRelativePath] = file;
                    // Store just the path after the first directory
                    const pathParts = file.webkitRelativePath.split('/');
                    if (pathParts.length > 1) {
                        photoFiles[pathParts.slice(1).join('/')] = file;
                    }
                }
                count++;
            }
        });
        
        elements.directoryStatus.textContent = `✓ ${count} photos loaded for thumbnails`;
        
        // Re-render if data is already loaded
        if (allPhotos.length > 0) {
            renderResults();
        }
    }

    /**
     * Load and validate data.
     */
    function loadData(data) {
        if (!Array.isArray(data)) {
            showError('Invalid data format: expected an array of records');
            return;
        }

        if (data.length === 0) {
            showError('No records found in file');
            return;
        }

        // Validate first record - support both old and new formats
        const firstRecord = data[0];
        const requiredFields = ['path', 'blur_score', 'blur_category', 'center_score', 'center_category'];
        const missingFields = requiredFields.filter(field => !(field in firstRecord));
        
        if (missingFields.length > 0) {
            showError('Invalid data format: missing fields: ' + missingFields.join(', '));
            return;
        }

        // Normalize data - support both has_pet (old) and has_dog/has_cat (new) formats
        allPhotos = data.map(photo => ({
            ...photo,
            has_dog: photo.has_dog ?? photo.has_pet ?? false,
            has_cat: photo.has_cat ?? photo.has_pet ?? false,
            has_person: photo.has_person ?? false
        }));
        
        // Reset selection
        selectedPaths.clear();
        activeRowIndex = -1;
        
        updateStats();
        applyFilters();
        
        elements.uploadSection.style.display = 'none';
        elements.mainContent.style.display = 'block';
        hideError();
        
        showToast(`Loaded ${allPhotos.length} photos`);
    }

    /**
     * Update statistics display.
     */
    function updateStats() {
        const total = allPhotos.length;
        const withPerson = allPhotos.filter(p => p.has_person).length;
        const withDog = allPhotos.filter(p => p.has_dog).length;
        const withCat = allPhotos.filter(p => p.has_cat).length;
        
        elements.totalCount.textContent = total;
        elements.personCount.textContent = withPerson;
        elements.dogCount.textContent = withDog;
        elements.catCount.textContent = withCat;
    }

    /**
     * Update selection count display.
     */
    function updateSelectionCount() {
        const count = selectedPaths.size;
        elements.selectedCount.textContent = count;
        elements.selectionInfo.textContent = `${count} selected`;
        
        // Enable/disable batch buttons
        const hasSelection = count > 0;
        elements.batchFavorite.disabled = !hasSelection;
        elements.batchDelete.disabled = !hasSelection;
        elements.batchClear.disabled = !hasSelection;
        elements.exportPaths.disabled = !hasSelection;
        
        // Update select all checkbox state
        const allVisibleSelected = filteredPhotos.length > 0 && 
            filteredPhotos.every(p => selectedPaths.has(p.path));
        elements.selectAllCheckbox.checked = allVisibleSelected;
        elements.selectAllCheckbox.indeterminate = count > 0 && !allVisibleSelected;
    }

    /**
     * Apply all filters to the data.
     */
    function applyFilters() {
        const blurValue = elements.blurFilter.value;
        const personValue = elements.personFilter.value;
        const dogValue = elements.dogFilter.value;
        const catValue = elements.catFilter.value;
        const centerValue = elements.centerFilter.value;
        const labelValue = elements.labelFilter.value;

        filteredPhotos = allPhotos.filter(photo => {
            // Blur filter
            if (blurValue !== 'all' && photo.blur_category !== blurValue) {
                return false;
            }
            
            // Person filter
            if (personValue !== 'all') {
                const hasPerson = personValue === 'yes';
                if (photo.has_person !== hasPerson) return false;
            }
            
            // Dog filter
            if (dogValue !== 'all') {
                const hasDog = dogValue === 'yes';
                if (photo.has_dog !== hasDog) return false;
            }
            
            // Cat filter
            if (catValue !== 'all') {
                const hasCat = catValue === 'yes';
                if (photo.has_cat !== hasCat) return false;
            }
            
            // Center filter
            if (centerValue !== 'all' && photo.center_category !== centerValue) {
                return false;
            }
            
            // Label filter
            if (labelValue !== 'all') {
                const label = userLabels[photo.path];
                if (labelValue === 'favorite' && (!label || !label.favorite)) return false;
                if (labelValue === 'delete' && (!label || !label.delete)) return false;
                if (labelValue === 'unlabeled' && label && (label.favorite || label.delete)) return false;
            }
            
            return true;
        });

        sortPhotos();
        renderResults();
        updateSelectionCount();
    }

    /**
     * Sort photos by current sort criteria.
     */
    function sortPhotos() {
        const { field, direction } = currentSort;
        const multiplier = direction === 'asc' ? 1 : -1;

        filteredPhotos.sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];

            if (typeof aVal === 'string') {
                return multiplier * aVal.localeCompare(bVal);
            }
            
            return multiplier * (aVal - bVal);
        });

        updateSortIndicators();
    }

    /**
     * Handle sort header click.
     */
    function handleSort(field) {
        if (currentSort.field === field) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.field = field;
            currentSort.direction = 'asc';
        }

        sortPhotos();
        renderResults();
    }

    /**
     * Update sort indicators in table headers.
     */
    function updateSortIndicators() {
        const headers = elements.resultsTable.querySelectorAll('th.sortable');
        headers.forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
            if (header.dataset.sort === currentSort.field) {
                header.classList.add('sort-' + currentSort.direction);
            }
        });
    }

    /**
     * Render results table.
     */
    function renderResults() {
        elements.filteredCount.textContent = filteredPhotos.length;
        elements.resultsCount.textContent = `${filteredPhotos.length} of ${allPhotos.length} photos`;

        if (filteredPhotos.length === 0) {
            elements.resultsBody.innerHTML = '';
            elements.emptyState.style.display = 'block';
            return;
        }
        elements.emptyState.style.display = 'none';

        const html = filteredPhotos.map((photo, index) => {
            const isSelected = selectedPaths.has(photo.path);
            const isActive = index === activeRowIndex;
            const label = userLabels[photo.path] || {};
            const filename = photo.path.split('/').pop();
            const sizeStr = photo.width && photo.height ? `${photo.width}×${photo.height}` : '-';
            
            const blurBadge = getBadgeClass(photo.blur_category, 'blur');
            const centerBadge = getBadgeClass(photo.center_category, 'center');
            
            // Determine thumbnail source
            const thumbnailHtml = getThumbnailHtml(photo.path, filename);
            
            return `
                <tr class="${isSelected ? 'selected' : ''} ${isActive ? 'active' : ''}" 
                    data-path="${escapeHtml(photo.path)}" 
                    data-index="${index}">
                    <td class="checkbox-cell">
                        <input type="checkbox" class="row-checkbox" 
                               ${isSelected ? 'checked' : ''} 
                               data-path="${escapeHtml(photo.path)}">
                    </td>
                    <td class="thumbnail-cell">
                        ${thumbnailHtml}
                    </td>
                    <td class="path-cell" title="${escapeHtml(photo.path)}">${escapeHtml(filename)}</td>
                    <td class="hide-mobile">${sizeStr}</td>
                    <td>
                        <span class="badge ${blurBadge}" title="Score: ${photo.blur_score.toFixed(1)}">
                            ${photo.blur_category}
                        </span>
                    </td>
                    <td>${photo.has_person ? '✅' : '❌'}</td>
                    <td>${photo.has_dog ? '🐕' : '❌'}</td>
                    <td>${photo.has_cat ? '🐱' : '❌'}</td>
                    <td class="hide-mobile">
                        <span class="badge ${centerBadge}" title="Score: ${photo.center_score.toFixed(3)}">
                            ${formatCenterCategory(photo.center_category)}
                        </span>
                    </td>
                    <td class="label-cell">
                        <button class="quick-label-btn ${label.favorite ? 'active label-favorite' : ''}" 
                                data-action="favorite" data-path="${escapeHtml(photo.path)}" 
                                title="Toggle favorite">
                            ${label.favorite ? '⭐' : '☆'}
                        </button>
                        <button class="quick-label-btn ${label.delete ? 'active label-delete' : ''}" 
                                data-action="delete" data-path="${escapeHtml(photo.path)}" 
                                title="Mark for deletion">
                            ${label.delete ? '🗑️' : '○'}
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        elements.resultsBody.innerHTML = html;
        
        // Bind row events
        bindRowEvents();
    }

    /**
     * Get thumbnail HTML for a photo.
     */
    function getThumbnailHtml(path, filename) {
        // Try to find the file in our loaded photos
        const file = photoFiles[path] || photoFiles[filename];
        
        if (file) {
            const url = URL.createObjectURL(file);
            return `<img src="${url}" alt="${escapeHtml(filename)}" class="thumbnail" 
                        data-path="${escapeHtml(path)}" 
                        onload="URL.revokeObjectURL(this.src)">`;
        }
        
        return `<div class="thumbnail-placeholder" data-path="${escapeHtml(path)}">📷</div>`;
    }

    /**
     * Bind events to table rows.
     */
    function bindRowEvents() {
        // Row click for preview
        elements.resultsBody.querySelectorAll('tr').forEach(row => {
            row.addEventListener('click', (e) => {
                // Don't trigger if clicking checkbox or label button
                if (e.target.classList.contains('row-checkbox') || 
                    e.target.classList.contains('quick-label-btn')) {
                    return;
                }
                
                const index = parseInt(row.dataset.index);
                setActiveRow(index);
                showPreview(row.dataset.path);
            });
        });
        
        // Checkbox changes
        elements.resultsBody.querySelectorAll('.row-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const path = e.target.dataset.path;
                if (e.target.checked) {
                    selectedPaths.add(path);
                } else {
                    selectedPaths.delete(path);
                }
                updateSelectionCount();
                updateRowSelection(path);
            });
        });
        
        // Quick label buttons
        elements.resultsBody.querySelectorAll('.quick-label-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const path = btn.dataset.path;
                const action = btn.dataset.action;
                toggleLabel(path, action);
            });
        });
        
        // Thumbnail click for preview
        elements.resultsBody.querySelectorAll('.thumbnail, .thumbnail-placeholder').forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                e.stopPropagation();
                const path = thumb.dataset.path;
                const row = thumb.closest('tr');
                const index = parseInt(row.dataset.index);
                setActiveRow(index);
                showPreview(path);
            });
        });
    }

    /**
     * Update row selection visual state.
     */
    function updateRowSelection(path) {
        const row = elements.resultsBody.querySelector(`tr[data-path="${CSS.escape(path)}"]`);
        if (row) {
            row.classList.toggle('selected', selectedPaths.has(path));
        }
    }

    /**
     * Set active row (for keyboard navigation).
     */
    function setActiveRow(index) {
        // Remove previous active
        const prevActive = elements.resultsBody.querySelector('tr.active');
        if (prevActive) prevActive.classList.remove('active');
        
        activeRowIndex = index;
        
        if (index >= 0 && index < filteredPhotos.length) {
            const row = elements.resultsBody.querySelector(`tr[data-index="${index}"]`);
            if (row) {
                row.classList.add('active');
                row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }

    /**
     * Toggle label for a photo.
     */
    function toggleLabel(path, type) {
        if (!userLabels[path]) {
            userLabels[path] = { favorite: false, delete: false };
        }
        
        if (type === 'favorite') {
            userLabels[path].favorite = !userLabels[path].favorite;
            if (userLabels[path].favorite) userLabels[path].delete = false;
        } else if (type === 'delete') {
            userLabels[path].delete = !userLabels[path].delete;
            if (userLabels[path].delete) userLabels[path].favorite = false;
        }
        
        saveToLocalStorage();
        renderResults();
        updatePreviewLabels();
    }

    /**
     * Show preview panel for a photo.
     */
    function showPreview(path) {
        const photo = allPhotos.find(p => p.path === path);
        if (!photo) return;
        
        previewPhoto = photo;
        const filename = path.split('/').pop();
        const file = photoFiles[path] || photoFiles[filename];
        
        if (file) {
            const url = URL.createObjectURL(file);
            elements.previewContent.innerHTML = `
                <img src="${url}" alt="${escapeHtml(filename)}" class="preview-image" 
                     onload="URL.revokeObjectURL(this.src)">
            `;
        } else {
            elements.previewContent.innerHTML = `
                <div class="preview-placeholder">
                    <span>📷</span>
                    <p>No preview available</p>
                    <p class="preview-hint">Load photo directory for thumbnails</p>
                </div>
            `;
        }
        
        elements.previewFilename.textContent = path;
        elements.previewMeta.innerHTML = `
            ${photo.width}×${photo.height} • 
            Blur: ${photo.blur_category} (${photo.blur_score.toFixed(1)}) • 
            Center: ${formatCenterCategory(photo.center_category)}
        `;
        
        elements.previewDetails.style.display = 'block';
        elements.previewPanel.classList.add('visible');
        
        updatePreviewLabels();
    }

    /**
     * Update preview panel label buttons.
     */
    function updatePreviewLabels() {
        if (!previewPhoto) return;
        
        const label = userLabels[previewPhoto.path] || {};
        elements.quickFavorite.textContent = label.favorite ? '⭐ Favorited' : '☆ Favorite';
        elements.quickFavorite.classList.toggle('active', label.favorite);
        elements.quickDelete.textContent = label.delete ? '🗑️ Marked' : '○ Delete';
        elements.quickDelete.classList.toggle('active', label.delete);
    }

    /**
     * Toggle label from preview panel.
     */
    function togglePreviewLabel(type) {
        if (!previewPhoto) return;
        toggleLabel(previewPhoto.path, type);
    }

    /**
     * Close preview panel.
     */
    function closePreview() {
        elements.previewPanel.classList.remove('visible');
        previewPhoto = null;
    }

    /**
     * Handle select all checkbox.
     */
    function handleSelectAllCheckbox(e) {
        if (e.target.checked) {
            selectAllVisible();
        } else {
            selectNone();
        }
    }

    /**
     * Select all visible photos.
     */
    function selectAllVisible() {
        filteredPhotos.forEach(p => selectedPaths.add(p.path));
        updateSelectionCount();
        renderResults();
        showToast(`Selected ${filteredPhotos.length} photos`);
    }

    /**
     * Deselect all photos.
     */
    function selectNone() {
        selectedPaths.clear();
        updateSelectionCount();
        renderResults();
    }

    /**
     * Apply label to all selected photos.
     */
    function batchLabel(type) {
        if (selectedPaths.size === 0) return;
        
        selectedPaths.forEach(path => {
            if (!userLabels[path]) {
                userLabels[path] = { favorite: false, delete: false };
            }
            
            if (type === 'favorite') {
                userLabels[path].favorite = true;
                userLabels[path].delete = false;
            } else if (type === 'delete') {
                userLabels[path].delete = true;
                userLabels[path].favorite = false;
            } else if (type === 'clear') {
                userLabels[path].favorite = false;
                userLabels[path].delete = false;
            }
        });
        
        saveToLocalStorage();
        renderResults();
        showToast(`${type === 'clear' ? 'Cleared' : 'Labeled'} ${selectedPaths.size} photos`);
    }

    /**
     * Export selected photo paths.
     */
    function exportSelectedPaths() {
        if (selectedPaths.size === 0) {
            showToast('No photos selected');
            return;
        }
        
        const paths = Array.from(selectedPaths).join('\n');
        downloadText(paths, `selected_photos_${Date.now()}.txt`);
        showToast(`Exported ${selectedPaths.size} paths`);
    }

    /**
     * Export all user labels as JSON.
     */
    function exportAllLabels() {
        const labelsWithData = Object.entries(userLabels)
            .filter(([_, label]) => label.favorite || label.delete)
            .reduce((acc, [path, label]) => {
                acc[path] = label;
                return acc;
            }, {});
        
        const count = Object.keys(labelsWithData).length;
        if (count === 0) {
            showToast('No labels to export');
            return;
        }
        
        const dataStr = JSON.stringify(labelsWithData, null, 2);
        downloadText(dataStr, `photo_labels_${Date.now()}.json`);
        showToast(`Exported ${count} labels`);
    }

    /**
     * Download text as a file.
     */
    function downloadText(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Handle keyboard shortcuts.
     */
    function handleKeyboardShortcuts(event) {
        // Don't handle if typing in input
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Don't handle if main content not visible
        if (elements.mainContent.style.display === 'none') {
            return;
        }

        const key = event.key.toLowerCase();
        
        // Modal shortcuts
        if (key === 'escape') {
            if (elements.helpModal.style.display !== 'none') {
                hideHelp();
                return;
            }
            if (elements.previewPanel.classList.contains('visible')) {
                closePreview();
                return;
            }
        }
        
        if (key === '?') {
            event.preventDefault();
            showHelp();
            return;
        }
        
        // Navigation
        if (key === 'j' || key === 'arrowdown') {
            event.preventDefault();
            navigateRow(1);
            return;
        }
        
        if (key === 'k' || key === 'arrowup') {
            event.preventDefault();
            navigateRow(-1);
            return;
        }
        
        if (key === 'enter' && activeRowIndex >= 0) {
            event.preventDefault();
            const photo = filteredPhotos[activeRowIndex];
            if (photo) showPreview(photo.path);
            return;
        }
        
        // Selection
        if (key === ' ') {
            event.preventDefault();
            toggleActiveSelection();
            return;
        }
        
        if (event.ctrlKey || event.metaKey) {
            if (key === 'a') {
                event.preventDefault();
                if (event.shiftKey) {
                    selectNone();
                } else {
                    selectAllVisible();
                }
                return;
            }
        }
        
        // Labels
        if (key === 'f' && activeRowIndex >= 0) {
            event.preventDefault();
            const photo = filteredPhotos[activeRowIndex];
            if (photo) toggleLabel(photo.path, 'favorite');
            return;
        }
        
        if (key === 'd' && activeRowIndex >= 0) {
            event.preventDefault();
            const photo = filteredPhotos[activeRowIndex];
            if (photo) toggleLabel(photo.path, 'delete');
            return;
        }
        
        if (key === 'c' && activeRowIndex >= 0 && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            const photo = filteredPhotos[activeRowIndex];
            if (photo) {
                userLabels[photo.path] = { favorite: false, delete: false };
                saveToLocalStorage();
                renderResults();
            }
            return;
        }
        
        // Other
        if (key === 'r' && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            resetFilters();
            return;
        }
        
        if (key === 'e') {
            event.preventDefault();
            exportSelectedPaths();
            return;
        }
    }

    /**
     * Navigate rows with keyboard.
     */
    function navigateRow(direction) {
        const newIndex = activeRowIndex + direction;
        if (newIndex >= 0 && newIndex < filteredPhotos.length) {
            setActiveRow(newIndex);
        } else if (activeRowIndex === -1 && filteredPhotos.length > 0) {
            setActiveRow(0);
        }
    }

    /**
     * Toggle selection for active row.
     */
    function toggleActiveSelection() {
        if (activeRowIndex < 0 || activeRowIndex >= filteredPhotos.length) return;
        
        const photo = filteredPhotos[activeRowIndex];
        if (selectedPaths.has(photo.path)) {
            selectedPaths.delete(photo.path);
        } else {
            selectedPaths.add(photo.path);
        }
        
        updateSelectionCount();
        updateRowSelection(photo.path);
    }

    /**
     * Handle document click for closing preview.
     */
    function handleDocumentClick(e) {
        // Close preview on mobile when clicking outside
        if (window.innerWidth <= 1200) {
            if (!elements.previewPanel.contains(e.target) && 
                !e.target.closest('.results-table')) {
                closePreview();
            }
        }
    }

    /**
     * Get badge CSS class.
     */
    function getBadgeClass(category, type) {
        if (type === 'blur') {
            switch (category) {
                case 'sharp': return 'badge-success';
                case 'soft': return 'badge-warning';
                case 'blurry': return 'badge-danger';
            }
        } else if (type === 'center') {
            switch (category) {
                case 'well_centered': return 'badge-success';
                case 'somewhat_centered': return 'badge-warning';
                case 'off_center': return 'badge-danger';
            }
        }
        return '';
    }

    /**
     * Format center category.
     */
    function formatCenterCategory(category) {
        if (!category) return '-';
        return category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    /**
     * Escape HTML.
     */
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Reset all filters.
     */
    function resetFilters() {
        elements.blurFilter.value = 'all';
        elements.personFilter.value = 'all';
        elements.dogFilter.value = 'all';
        elements.catFilter.value = 'all';
        elements.centerFilter.value = 'all';
        elements.labelFilter.value = 'all';
        applyFilters();
        showToast('Filters reset');
    }

    /**
     * Show upload section.
     */
    function showUploadSection() {
        elements.uploadSection.style.display = 'block';
        elements.mainContent.style.display = 'none';
        elements.fileInput.value = '';
    }

    /**
     * Save labels to localStorage.
     */
    function saveToLocalStorage() {
        try {
            localStorage.setItem('photoReviewLabels', JSON.stringify(userLabels));
        } catch (err) {
            console.error('Failed to save to localStorage:', err);
        }
    }

    /**
     * Load labels from localStorage.
     */
    function loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('photoReviewLabels');
            if (saved) {
                userLabels = JSON.parse(saved);
            }
        } catch (err) {
            console.error('Failed to load from localStorage:', err);
        }
    }

    /**
     * Show help modal.
     */
    function showHelp() {
        elements.helpModal.style.display = 'flex';
    }

    /**
     * Hide help modal.
     */
    function hideHelp() {
        elements.helpModal.style.display = 'none';
    }

    /**
     * Show error message.
     */
    function showError(message) {
        elements.errorText.textContent = message;
        elements.errorMessage.style.display = 'flex';
    }

    /**
     * Hide error message.
     */
    function hideError() {
        elements.errorMessage.style.display = 'none';
    }

    /**
     * Show toast notification.
     */
    function showToast(message) {
        elements.toastText.textContent = message;
        elements.toast.style.display = 'block';
        
        setTimeout(() => {
            elements.toast.style.display = 'none';
        }, 3000);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
