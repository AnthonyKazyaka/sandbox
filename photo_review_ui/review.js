/**
 * Photo Analysis Review - JavaScript Controller
 * 
 * Handles file loading, filtering, sorting, and display of
 * photo analysis results from the Python analyzer.
 */

(function() {
    'use strict';

    // State
    let allPhotos = [];
    let filteredPhotos = [];
    let currentSort = { field: 'path', direction: 'asc' };

    // DOM Elements
    const elements = {
        fileInput: null,
        uploadSection: null,
        mainContent: null,
        resultsBody: null,
        resultsCount: null,
        emptyState: null,
        errorMessage: null,
        errorText: null,
        errorClose: null,
        // Stats
        totalCount: null,
        filteredCount: null,
        personCount: null,
        petCount: null,
        // Filters
        blurFilter: null,
        personFilter: null,
        petFilter: null,
        centerFilter: null,
        resetFilters: null,
        loadNewFile: null,
        // Table
        resultsTable: null
    };

    /**
     * Initialize the application.
     */
    function init() {
        // Cache DOM elements
        cacheElements();
        
        // Bind event listeners
        bindEvents();
    }

    /**
     * Cache DOM element references.
     */
    function cacheElements() {
        elements.fileInput = document.getElementById('fileInput');
        elements.uploadSection = document.getElementById('uploadSection');
        elements.mainContent = document.getElementById('mainContent');
        elements.resultsBody = document.getElementById('resultsBody');
        elements.resultsCount = document.getElementById('resultsCount');
        elements.emptyState = document.getElementById('emptyState');
        elements.errorMessage = document.getElementById('errorMessage');
        elements.errorText = document.getElementById('errorText');
        elements.errorClose = document.getElementById('errorClose');
        
        // Stats
        elements.totalCount = document.getElementById('totalCount');
        elements.filteredCount = document.getElementById('filteredCount');
        elements.personCount = document.getElementById('personCount');
        elements.petCount = document.getElementById('petCount');
        
        // Filters
        elements.blurFilter = document.getElementById('blurFilter');
        elements.personFilter = document.getElementById('personFilter');
        elements.petFilter = document.getElementById('petFilter');
        elements.centerFilter = document.getElementById('centerFilter');
        elements.resetFilters = document.getElementById('resetFilters');
        elements.loadNewFile = document.getElementById('loadNewFile');
        
        // Table
        elements.resultsTable = document.getElementById('resultsTable');
    }

    /**
     * Bind event listeners.
     */
    function bindEvents() {
        // File input
        elements.fileInput.addEventListener('change', handleFileSelect);
        
        // Filters
        elements.blurFilter.addEventListener('change', applyFilters);
        elements.personFilter.addEventListener('change', applyFilters);
        elements.petFilter.addEventListener('change', applyFilters);
        elements.centerFilter.addEventListener('change', applyFilters);
        
        // Buttons
        elements.resetFilters.addEventListener('click', resetFilters);
        elements.loadNewFile.addEventListener('click', showUploadSection);
        elements.errorClose.addEventListener('click', hideError);
        
        // Table header sorting
        const headers = elements.resultsTable.querySelectorAll('th.sortable');
        headers.forEach(header => {
            header.addEventListener('click', () => handleSort(header.dataset.sort));
        });
    }

    /**
     * Handle file selection.
     */
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.name.endsWith('.json')) {
            showError('Please select a JSON file');
            return;
        }

        // Read file
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
     * Load and validate data.
     */
    function loadData(data) {
        // Validate data structure
        if (!Array.isArray(data)) {
            showError('Invalid data format: expected an array of records');
            return;
        }

        if (data.length === 0) {
            showError('No records found in file');
            return;
        }

        // Validate first record has expected fields
        const requiredFields = ['path', 'blur_score', 'blur_category', 'has_person', 'has_pet', 'center_score', 'center_category'];
        const firstRecord = data[0];
        const missingFields = requiredFields.filter(field => !(field in firstRecord));
        
        if (missingFields.length > 0) {
            showError('Invalid data format: missing fields: ' + missingFields.join(', '));
            return;
        }

        // Store data
        allPhotos = data;
        
        // Update stats
        updateStats();
        
        // Apply initial filters and render
        applyFilters();
        
        // Show main content
        elements.uploadSection.style.display = 'none';
        elements.mainContent.style.display = 'block';
        hideError();
    }

    /**
     * Update statistics display.
     */
    function updateStats() {
        const total = allPhotos.length;
        const withPerson = allPhotos.filter(p => p.has_person).length;
        const withPet = allPhotos.filter(p => p.has_pet).length;
        
        elements.totalCount.textContent = total;
        elements.personCount.textContent = withPerson;
        elements.petCount.textContent = withPet;
    }

    /**
     * Apply all filters to the data.
     */
    function applyFilters() {
        const blurValue = elements.blurFilter.value;
        const personValue = elements.personFilter.value;
        const petValue = elements.petFilter.value;
        const centerValue = elements.centerFilter.value;

        filteredPhotos = allPhotos.filter(photo => {
            // Blur filter
            if (blurValue !== 'all' && photo.blur_category !== blurValue) {
                return false;
            }
            
            // Person filter
            if (personValue !== 'all') {
                const hasPerson = personValue === 'yes';
                if (photo.has_person !== hasPerson) {
                    return false;
                }
            }
            
            // Pet filter
            if (petValue !== 'all') {
                const hasPet = petValue === 'yes';
                if (photo.has_pet !== hasPet) {
                    return false;
                }
            }
            
            // Center filter
            if (centerValue !== 'all' && photo.center_category !== centerValue) {
                return false;
            }
            
            return true;
        });

        // Apply current sort
        sortPhotos();
        
        // Render results
        renderResults();
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

            // Handle string comparison
            if (typeof aVal === 'string') {
                return multiplier * aVal.localeCompare(bVal);
            }
            
            // Handle numeric comparison
            return multiplier * (aVal - bVal);
        });

        // Update header indicators
        updateSortIndicators();
    }

    /**
     * Handle sort header click.
     */
    function handleSort(field) {
        if (currentSort.field === field) {
            // Toggle direction
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            // New field, default to ascending
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
        // Update count
        elements.filteredCount.textContent = filteredPhotos.length;
        elements.resultsCount.textContent = `${filteredPhotos.length} of ${allPhotos.length} photos`;

        // Handle empty state
        if (filteredPhotos.length === 0) {
            elements.resultsBody.innerHTML = '';
            elements.emptyState.style.display = 'block';
            return;
        }
        elements.emptyState.style.display = 'none';

        // Build table rows
        const html = filteredPhotos.map(photo => {
            const dimensions = `${photo.width}×${photo.height}`;
            const blurBadge = getBadgeClass(photo.blur_category, 'blur');
            const centerBadge = getBadgeClass(photo.center_category, 'center');
            
            return `
                <tr>
                    <td class="path-cell" title="${escapeHtml(photo.path)}">${escapeHtml(photo.path)}</td>
                    <td class="hide-mobile">${dimensions}</td>
                    <td>${photo.blur_score.toFixed(1)}</td>
                    <td><span class="badge ${blurBadge}">${photo.blur_category}</span></td>
                    <td>${photo.has_person ? '✅' : '❌'}</td>
                    <td>${photo.has_pet ? '✅' : '❌'}</td>
                    <td>${photo.center_score.toFixed(3)}</td>
                    <td class="hide-mobile"><span class="badge ${centerBadge}">${formatCenterCategory(photo.center_category)}</span></td>
                </tr>
            `;
        }).join('');

        elements.resultsBody.innerHTML = html;
    }

    /**
     * Get badge CSS class based on category.
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
     * Format center category for display.
     */
    function formatCenterCategory(category) {
        return category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    /**
     * Escape HTML special characters.
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Reset all filters to default values.
     */
    function resetFilters() {
        elements.blurFilter.value = 'all';
        elements.personFilter.value = 'all';
        elements.petFilter.value = 'all';
        elements.centerFilter.value = 'all';
        applyFilters();
    }

    /**
     * Show upload section and hide main content.
     */
    function showUploadSection() {
        elements.uploadSection.style.display = 'block';
        elements.mainContent.style.display = 'none';
        elements.fileInput.value = '';
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

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
