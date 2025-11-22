/**
 * GPS Admin - Core Application
 * Main application controller coordinating all modules
 */

class GPSAdminApp {
    constructor() {
        // Initialize modules
        this.dataManager = new DataManager();
        this.eventProcessor = new EventProcessor();
        this.calculator = new WorkloadCalculator(this.eventProcessor);
        this.renderer = new RenderEngine(this.calculator, this.eventProcessor);

        // Load data
        const savedData = this.dataManager.loadData();
        
        this.state = {
            currentView: 'dashboard',
            calendarView: 'month',
            currentDate: new Date(),
            isAuthenticated: false,
            useMockData: true,
            isManagingTemplates: false,
            ...savedData
        };

        // Initialize APIs if available
        this.calendarApi = window.CalendarAPI ? new CalendarAPI() : null;
        this.mapsApi = window.MapsAPI ? new MapsAPI() : null;
        this.templatesManager = window.TemplatesManager ? new TemplatesManager() : null;

        this.selectedDate = null;
        
        this.initMockData();
    }

    /**
     * Initialize application
     */
    init() {
        this.setupEventListeners();
        this.loadSettings();
        this.switchView('dashboard');
        
        // Hide loading screen
        const loadingScreen = document.getElementById('loading-screen');
        const app = document.getElementById('app');
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (app) app.style.display = 'block';
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('[data-view]').forEach(button => {
            button.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // Menu toggle
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(button => {
            button.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) Utils.hideModal(modal.id);
            });
        });

        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    Utils.hideModal(modal.id);
                }
            });
        });
    }

    /**
     * Switch application view
     * @param {string} view - View name
     */
    switchView(view) {
        this.state.currentView = view;

        // Update navigation
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Hide all views
        document.querySelectorAll('.view').forEach(container => {
            container.classList.remove('active');
        });

        // Show selected view
        const viewContainer = document.getElementById(`view-${view}`);
        if (viewContainer) {
            viewContainer.classList.add('active');
        }

        // Render view content
        this.renderCurrentView();
    }

    /**
     * Render current view
     */
    async renderCurrentView() {
        switch (this.state.currentView) {
            case 'dashboard':
                await this.renderer.renderDashboard(this.state);
                break;
            case 'calendar':
                this.renderCalendar();
                break;
            case 'analytics':
                this.renderAnalytics();
                break;
            case 'settings':
                this.renderSettings();
                break;
        }
    }

    /**
     * Load settings from state
     */
    loadSettings() {
        // Initialize settings if needed
        if (!this.state.settings) {
            this.state.settings = this.dataManager.getDefaultData().settings;
        }
        
        // Set home address for calculator
        if (this.state.settings.homeAddress) {
            this.calculator.setHomeAddress(this.state.settings.homeAddress);
        }
    }

    /**
     * Save settings
     */
    saveSettings() {
        this.dataManager.saveData(this.state);
        Utils.showToast('Settings saved successfully', 'success');
    }

    /**
     * Initialize mock data for testing
     */
    initMockData() {
        if (this.state.useMockData && this.state.events.length === 0) {
            // Add some mock events
            const today = new Date();
            this.state.events = [
                {
                    id: Utils.generateId(),
                    title: 'Fluffy - 30',
                    start: Utils.createDateAtTime(today, 9, 0),
                    end: Utils.createDateAtTime(today, 9, 30),
                    location: '123 Main St',
                    isAllDay: false,
                    ignored: false
                },
                {
                    id: Utils.generateId(),
                    title: 'Max - 45',
                    start: Utils.createDateAtTime(today, 11, 0),
                    end: Utils.createDateAtTime(today, 11, 45),
                    location: '456 Oak Ave',
                    isAllDay: false,
                    ignored: false
                },
                {
                    id: Utils.generateId(),
                    title: 'Bella - Housesit Start',
                    start: Utils.createDateAtTime(today, 18, 0),
                    end: Utils.createDateAtTime(Utils.addDays(today, 1), 18, 0),
                    location: '789 Pine Rd',
                    isAllDay: false,
                    ignored: false
                }
            ];
        }
    }

    /**
     * Placeholder methods for views not yet modularized
     */
    renderCalendar() {
        console.log('Calendar view - to be modularized');
    }

    renderAnalytics() {
        console.log('Analytics view - to be modularized');
    }

    renderSettings() {
        console.log('Settings view - to be modularized');
    }
}
