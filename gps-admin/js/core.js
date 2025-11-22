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
        if (app) app.style.display = 'grid';
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
                sidebar.classList.toggle('open');
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

        // Setup calendar controls (only once)
        this.setupCalendarControls();
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
     * Render calendar view
     */
    renderCalendar() {
        const container = document.getElementById('calendar-container');
        if (!container) return;

        // Update title
        const title = document.getElementById('calendar-title');
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        title.textContent = `${monthNames[this.state.currentDate.getMonth()]} ${this.state.currentDate.getFullYear()}`;

        // Render based on view mode
        switch (this.state.calendarView) {
            case 'month':
                this.renderMonthView(container);
                break;
            case 'week':
                this.renderWeekView(container);
                break;
            case 'day':
                this.renderDayView(container);
                break;
            case 'list':
                this.renderListView(container);
                break;
        }
    }

    /**
     * Render month calendar view
     */
    renderMonthView(container) {
        const year = this.state.currentDate.getFullYear();
        const month = this.state.currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - startDate.getDay());

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let html = '<div class="calendar-month">';

        // Weekday headers
        html += '<div class="calendar-weekdays">';
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
            html += `<div class="calendar-weekday">${day}</div>`;
        });
        html += '</div>';

        // Days grid
        html += '<div class="calendar-days">';

        const currentDate = new Date(startDate);
        while (currentDate <= lastDay || currentDate.getDay() !== 0) {
            const dateKey = new Date(currentDate);
            dateKey.setHours(0, 0, 0, 0);

            const dayEvents = this.eventProcessor.getEventsForDate(this.state.events, dateKey);
            const metrics = this.calculator.calculateWorkloadMetrics(dayEvents, dateKey, { 
                includeTravel: this.state.settings.includeTravelTime 
            });

            const hours = Utils.formatHours(metrics.totalHours);
            const workHours = Utils.formatHours(metrics.workHours);
            const travelHours = Utils.formatHours(metrics.travelHours);
            const workloadLevel = metrics.level;
            const housesits = metrics.housesits;

            const isToday = dateKey.getTime() === today.getTime();
            const isOtherMonth = currentDate.getMonth() !== month;

            let classes = 'calendar-day';
            if (isToday) classes += ' today';
            if (isOtherMonth) classes += ' other-month';
            if (!isOtherMonth && dayEvents.length > 0) classes += ` ${workloadLevel}`;
            if (housesits.length > 0) classes += ' has-housesit';

            html += `
                <div class="${classes}" data-date="${dateKey.toISOString()}">
                    ${housesits.length > 0 ? '<div class="calendar-day-housesit-bar" title="House sit scheduled"></div>' : ''}
                    <div class="calendar-day-number">${currentDate.getDate()}</div>
                    ${dayEvents.length > 0 ? `
                        <div class="calendar-day-events">${dayEvents.length} event${dayEvents.length !== 1 ? 's' : ''}</div>
                        <div class="calendar-day-hours">${workHours} work${metrics.travelMinutes > 0 ? ` + ${travelHours} travel` : ''}${housesits.length > 0 ? ' <span style="color: #8B5CF6; font-size: 0.65rem; font-weight: 600;">+ housesit</span>' : ''}</div>
                        <div class="calendar-day-total" style="font-weight: 600; color: var(--primary-700);">${hours} total</div>
                    ` : ''}
                </div>
            `;

            currentDate.setDate(currentDate.getDate() + 1);
        }

        html += '</div></div>';
        container.innerHTML = html;

        // Add click handlers to calendar days
        container.querySelectorAll('.calendar-day').forEach(dayElement => {
            dayElement.addEventListener('click', () => {
                const dateStr = dayElement.dataset.date;
                console.log('Day clicked:', dateStr);
                // TODO: Show day details modal
            });
        });
    }

    /**
     * Render week calendar view
     */
    renderWeekView(container) {
        container.innerHTML = '<p class="text-muted">Week view coming soon...</p>';
    }

    /**
     * Render day calendar view
     */
    renderDayView(container) {
        container.innerHTML = '<p class="text-muted">Day view coming soon...</p>';
    }

    /**
     * Render list view
     */
    renderListView(container) {
        container.innerHTML = '<p class="text-muted">List view coming soon...</p>';
    }

    /**
     * Setup calendar navigation controls
     */
    setupCalendarControls() {
        // Calendar view buttons
        document.querySelectorAll('[data-calendar-view]').forEach(button => {
            button.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.calendarView;
                this.state.calendarView = view;
                
                // Update button states
                document.querySelectorAll('[data-calendar-view]').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.currentTarget.classList.add('active');
                
                // Re-render calendar
                this.renderCalendar();
            });
        });

        // Previous month
        const prevBtn = document.getElementById('calendar-prev');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.state.currentDate.setMonth(this.state.currentDate.getMonth() - 1);
                this.renderCalendar();
            });
        }

        // Next month
        const nextBtn = document.getElementById('calendar-next');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.state.currentDate.setMonth(this.state.currentDate.getMonth() + 1);
                this.renderCalendar();
            });
        }

        // Today button
        const todayBtn = document.getElementById('calendar-today');
        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                this.state.currentDate = new Date();
                this.renderCalendar();
            });
        }
    }

    /**
     * Placeholder for analytics view
     */
    renderAnalytics() {
        console.log('Analytics view - to be modularized');
    }

    /**
     * Placeholder for settings view
     */
    renderSettings() {
        console.log('Settings view - to be modularized');
    }
}
