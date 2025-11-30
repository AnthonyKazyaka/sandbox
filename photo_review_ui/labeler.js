/**
 * Photo Labeler - Manual Classification Tool
 * 
 * Allows users to manually label photos with ground truth data
 * for training and validating detection models.
 */

(function() {
    'use strict';

    // State
    let photos = [];
    let labels = {};
    let currentIndex = 0;

    // DOM Elements
    const elements = {
        // Setup
        directoryInput: null,
        labelsInput: null,
        setupSection: null,
        labelingContent: null,
        
        // Progress
        currentIndexEl: null,
        totalPhotos: null,
        progressPercent: null,
        progressFill: null,
        
        // Photo display
        currentPhoto: null,
        photoFilename: null,
        photoDimensions: null,
        
        // Controls
        hasPerson: null,
        hasDog: null,
        hasCat: null,
        hasOtherPet: null,
        blurRadios: null,
        centeringRadios: null,
        notes: null,
        
        // Navigation
        prevButton: null,
        skipButton: null,
        nextButton: null,
        saveLabels: null,
        exportLabels: null,
        
        // Stats
        labeledCount: null,
        unlabeledCount: null,
        personLabelCount: null,
        dogLabelCount: null,
        catLabelCount: null,
        
        // Notifications
        toast: null,
        toastText: null,
        errorMessage: null,
        errorText: null,
        errorClose: null
    };

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
        // Setup
        elements.directoryInput = document.getElementById('directoryInput');
        elements.labelsInput = document.getElementById('labelsInput');
        elements.setupSection = document.getElementById('setupSection');
        elements.labelingContent = document.getElementById('labelingContent');
        
        // Progress
        elements.currentIndexEl = document.getElementById('currentIndex');
        elements.totalPhotos = document.getElementById('totalPhotos');
        elements.progressPercent = document.getElementById('progressPercent');
        elements.progressFill = document.getElementById('progressFill');
        
        // Photo display
        elements.currentPhoto = document.getElementById('currentPhoto');
        elements.photoFilename = document.getElementById('photoFilename');
        elements.photoDimensions = document.getElementById('photoDimensions');
        
        // Controls
        elements.hasPerson = document.getElementById('hasPerson');
        elements.hasDog = document.getElementById('hasDog');
        elements.hasCat = document.getElementById('hasCat');
        elements.hasOtherPet = document.getElementById('hasOtherPet');
        elements.blurRadios = document.querySelectorAll('input[name="blur"]');
        elements.centeringRadios = document.querySelectorAll('input[name="centering"]');
        elements.notes = document.getElementById('notes');
        
        // Navigation
        elements.prevButton = document.getElementById('prevButton');
        elements.skipButton = document.getElementById('skipButton');
        elements.nextButton = document.getElementById('nextButton');
        elements.saveLabels = document.getElementById('saveLabels');
        elements.exportLabels = document.getElementById('exportLabels');
        
        // Stats
        elements.labeledCount = document.getElementById('labeledCount');
        elements.unlabeledCount = document.getElementById('unlabeledCount');
        elements.personLabelCount = document.getElementById('personLabelCount');
        elements.dogLabelCount = document.getElementById('dogLabelCount');
        elements.catLabelCount = document.getElementById('catLabelCount');
        
        // Notifications
        elements.toast = document.getElementById('toast');
        elements.toastText = document.getElementById('toastText');
        elements.errorMessage = document.getElementById('errorMessage');
        elements.errorText = document.getElementById('errorText');
        elements.errorClose = document.getElementById('errorClose');
    }

    /**
     * Bind event listeners.
     */
    function bindEvents() {
        // File inputs
        elements.directoryInput.addEventListener('change', handleDirectorySelect);
        elements.labelsInput.addEventListener('change', handleLabelsLoad);
        
        // Navigation
        elements.prevButton.addEventListener('click', () => navigateTo(currentIndex - 1));
        elements.skipButton.addEventListener('click', () => navigateTo(currentIndex + 1));
        elements.nextButton.addEventListener('click', handleSaveAndNext);
        
        // Actions
        elements.saveLabels.addEventListener('click', saveToLocalStorage);
        elements.exportLabels.addEventListener('click', exportLabelsJSON);
        elements.errorClose.addEventListener('click', hideError);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);
    }

    /**
     * Handle directory selection.
     */
    function handleDirectorySelect(event) {
        const files = Array.from(event.target.files);
        
        // Filter for image files
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif'];
        photos = files.filter(file => {
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            return imageExtensions.includes(ext);
        });

        if (photos.length === 0) {
            showError('No image files found in selected directory');
            return;
        }

        // Sort by name
        photos.sort((a, b) => a.name.localeCompare(b.name));

        // Initialize labels object
        labels = {};
        photos.forEach(photo => {
            if (!labels[photo.name]) {
                labels[photo.name] = createEmptyLabel();
            }
        });

        // Show labeling interface
        elements.setupSection.style.display = 'none';
        elements.labelingContent.style.display = 'block';

        // Load first photo
        currentIndex = 0;
        loadPhoto(currentIndex);
        updateStats();
        
        showToast(`Loaded ${photos.length} photos for labeling`);
    }

    /**
     * Handle loading existing labels JSON.
     */
    function handleLabelsLoad(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const loadedLabels = JSON.parse(e.target.result);
                
                // Merge with existing labels
                Object.assign(labels, loadedLabels);
                
                // Update current photo if already loaded
                if (photos.length > 0) {
                    loadPhoto(currentIndex);
                    updateStats();
                }
                
                showToast(`Loaded ${Object.keys(loadedLabels).length} existing labels`);
            } catch (err) {
                showError('Invalid labels JSON file: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    /**
     * Create empty label object.
     */
    function createEmptyLabel() {
        return {
            has_person: false,
            has_dog: false,
            has_cat: false,
            has_other_pet: false,
            blur_category: null,
            center_category: null,
            notes: '',
            labeled_at: null,
            is_labeled: false
        };
    }

    /**
     * Load photo at given index.
     */
    function loadPhoto(index) {
        if (index < 0 || index >= photos.length) return;

        currentIndex = index;
        const photo = photos[index];
        
        // Display photo
        const url = URL.createObjectURL(photo);
        elements.currentPhoto.src = url;
        elements.currentPhoto.onload = function() {
            elements.photoDimensions.textContent = 
                `${elements.currentPhoto.naturalWidth} × ${elements.currentPhoto.naturalHeight}`;
            URL.revokeObjectURL(url);
        };
        
        elements.photoFilename.textContent = photo.name;
        
        // Load existing labels
        const label = labels[photo.name] || createEmptyLabel();
        
        elements.hasPerson.checked = label.has_person;
        elements.hasDog.checked = label.has_dog;
        elements.hasCat.checked = label.has_cat;
        elements.hasOtherPet.checked = label.has_other_pet;
        
        // Blur radio
        elements.blurRadios.forEach(radio => {
            radio.checked = radio.value === label.blur_category;
        });
        
        // Centering radio
        elements.centeringRadios.forEach(radio => {
            radio.checked = radio.value === label.center_category;
        });
        
        elements.notes.value = label.notes || '';
        
        // Update progress
        updateProgress();
        
        // Update navigation buttons
        elements.prevButton.disabled = index === 0;
    }

    /**
     * Handle save and next button.
     */
    function handleSaveAndNext() {
        saveCurrentLabel();
        navigateTo(currentIndex + 1);
    }

    /**
     * Save current photo's labels.
     */
    function saveCurrentLabel() {
        const photo = photos[currentIndex];
        
        // Get blur selection
        let blurCategory = null;
        elements.blurRadios.forEach(radio => {
            if (radio.checked) blurCategory = radio.value;
        });
        
        // Get centering selection
        let centerCategory = null;
        elements.centeringRadios.forEach(radio => {
            if (radio.checked) centerCategory = radio.value;
        });
        
        // Create label
        labels[photo.name] = {
            has_person: elements.hasPerson.checked,
            has_dog: elements.hasDog.checked,
            has_cat: elements.hasCat.checked,
            has_other_pet: elements.hasOtherPet.checked,
            blur_category: blurCategory,
            center_category: centerCategory,
            notes: elements.notes.value.trim(),
            labeled_at: new Date().toISOString(),
            is_labeled: true
        };
        
        updateStats();
        saveToLocalStorage();
    }

    /**
     * Navigate to specific photo index.
     */
    function navigateTo(index) {
        if (index < 0 || index >= photos.length) {
            showToast('You\'ve reached the end! 🎉');
            return;
        }
        
        loadPhoto(index);
    }

    /**
     * Update progress display.
     */
    function updateProgress() {
        const progress = ((currentIndex + 1) / photos.length) * 100;
        
        elements.currentIndexEl.textContent = currentIndex + 1;
        elements.totalPhotos.textContent = photos.length;
        elements.progressPercent.textContent = Math.round(progress);
        elements.progressFill.style.width = progress + '%';
    }

    /**
     * Update statistics display.
     */
    function updateStats() {
        let labeled = 0;
        let personCount = 0;
        let dogCount = 0;
        let catCount = 0;
        
        Object.values(labels).forEach(label => {
            if (label.is_labeled) labeled++;
            if (label.has_person) personCount++;
            if (label.has_dog) dogCount++;
            if (label.has_cat) catCount++;
        });
        
        elements.labeledCount.textContent = labeled;
        elements.unlabeledCount.textContent = photos.length - labeled;
        elements.personLabelCount.textContent = personCount;
        elements.dogLabelCount.textContent = dogCount;
        elements.catLabelCount.textContent = catCount;
    }

    /**
     * Save labels to localStorage.
     */
    function saveToLocalStorage() {
        try {
            localStorage.setItem('photoLabelerState', JSON.stringify({
                labels: labels,
                currentIndex: currentIndex,
                photoNames: photos.map(p => p.name)
            }));
            showToast('✅ Labels saved locally');
        } catch (err) {
            showError('Failed to save to localStorage: ' + err.message);
        }
    }

    /**
     * Load labels from localStorage.
     */
    function loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('photoLabelerState');
            if (saved) {
                const state = JSON.parse(saved);
                // Note: We can restore labels but not the File objects
                // User will need to reload the directory
                labels = state.labels || {};
            }
        } catch (err) {
            console.error('Failed to load from localStorage:', err);
        }
    }

    /**
     * Export labels as JSON file.
     */
    function exportLabelsJSON() {
        const dataStr = JSON.stringify(labels, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `photo_labels_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('📤 Labels exported successfully');
    }

    /**
     * Handle keyboard shortcuts.
     */
    function handleKeyboardShortcuts(event) {
        // Only handle shortcuts when labeling content is visible
        if (elements.labelingContent.style.display === 'none') return;
        
        switch(event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                if (currentIndex > 0) navigateTo(currentIndex - 1);
                break;
            case 'ArrowRight':
                event.preventDefault();
                navigateTo(currentIndex + 1);
                break;
            case 'Enter':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    handleSaveAndNext();
                }
                break;
            case 's':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    saveToLocalStorage();
                }
                break;
        }
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
