/**
 * GPS Admin - Main Application
 * Smart scheduling and workload management for Genie's Pet Sitting
 */

class GPSAdminApp {
    constructor() {
        this.state = {
            currentView: 'dashboard',
            calendarView: 'month',
            currentDate: new Date(),
            isAuthenticated: false,
            useMockData: true, // Toggle between mock and real data
            events: [],
            templates: [],
            settings: {
                thresholds: {
                    comfortable: 6,
                    busy: 8,
                    high: 10,
                    burnout: 12
                },
                api: {
                    calendarClientId: '',
                    mapsApiKey: ''
                }
            }
        };

        this.initMockData();
        this.loadSettings();
    }

    /**
     * Initialize application
     */
    async init() {
        console.log('🐾 GPS Admin initializing...');

        // Simulate loading
        await this.simulateLoading();

        // Setup event listeners
        this.setupEventListeners();

        // Initialize workload analyzer
        if (window.WorkloadAnalyzer) {
            this.workloadAnalyzer = new WorkloadAnalyzer(this.state.settings.thresholds);
        }

        // Render initial view
        this.renderDashboard();
        this.updateWorkloadIndicator();

        // Hide loading screen
        this.hideLoadingScreen();

        console.log('✅ GPS Admin ready!');
    }

    /**
     * Simulate initial loading
     */
    simulateLoading() {
        return new Promise(resolve => {
            setTimeout(resolve, 1500);
        });
    }

    /**
     * Hide loading screen and show app
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const app = document.getElementById('app');

        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            app.style.display = 'grid';
            setTimeout(() => {
                app.style.opacity = '1';
            }, 50);
        }, 300);
    }

    /**
     * Initialize mock data for testing
     */
    initMockData() {
        const today = new Date();

        // Generate mock events for the current week and next week
        this.state.events = [
            // Today
            {
                id: '1',
                title: 'Bella - Morning Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 30),
                location: '123 Oak Street',
                client: 'Johnson Family',
                notes: 'Feed, water, and playtime'
            },
            {
                id: '2',
                title: 'Max & Cooper - Dog Walk',
                type: 'walk',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30),
                location: '456 Elm Avenue',
                client: 'Smith Family',
                notes: '1 hour walk in the park'
            },
            {
                id: '3',
                title: 'Luna - Midday Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 45),
                location: '789 Maple Drive',
                client: 'Davis Family',
                notes: 'Medication at 1:30pm'
            },
            {
                id: '4',
                title: 'Milo - Evening Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 18, 0),
                location: '321 Pine Road',
                client: 'Wilson Family',
                notes: 'Dinner and potty break'
            },

            // Tomorrow
            {
                id: '5',
                title: 'Charlie - Meet & Greet',
                type: 'meet-greet',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 14, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 15, 0),
                location: '555 Cedar Lane',
                client: 'Brown Family',
                notes: 'New client - anxious rescue dog'
            },
            {
                id: '6',
                title: 'Daisy - Evening Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 18, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 18, 30),
                location: '888 Birch Court',
                client: 'Taylor Family',
                notes: 'Feed and quick walk'
            },

            // Day after tomorrow
            {
                id: '7',
                title: 'Rocky & Bella - Overnight',
                type: 'overnight',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 18, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 10, 0),
                location: '123 Oak Street',
                client: 'Johnson Family',
                notes: 'Overnight care - family vacation'
            },

            // Rest of the week
            {
                id: '8',
                title: 'Max & Cooper - Morning Walk',
                type: 'walk',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 9, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 10, 0),
                location: '456 Elm Avenue',
                client: 'Smith Family',
                notes: '1 hour walk'
            },
            {
                id: '9',
                title: 'Luna - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 12, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 12, 30),
                location: '789 Maple Drive',
                client: 'Davis Family',
                notes: 'Medication'
            },
            {
                id: '10',
                title: 'Milo - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 17, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 17, 30),
                location: '321 Pine Road',
                client: 'Wilson Family',
                notes: 'Evening care'
            },

            // Busy Friday
            {
                id: '11',
                title: 'Bella - Morning Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 7, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 8, 0),
                location: '123 Oak Street',
                client: 'Johnson Family'
            },
            {
                id: '12',
                title: 'Charlie - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 9, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 9, 45),
                location: '555 Cedar Lane',
                client: 'Brown Family'
            },
            {
                id: '13',
                title: 'Max & Cooper - Walk',
                type: 'walk',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 11, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 12, 0),
                location: '456 Elm Avenue',
                client: 'Smith Family'
            },
            {
                id: '14',
                title: 'Luna - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 13, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 14, 0),
                location: '789 Maple Drive',
                client: 'Davis Family'
            },
            {
                id: '15',
                title: 'Daisy - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 15, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 15, 30),
                location: '888 Birch Court',
                client: 'Taylor Family'
            },
            {
                id: '16',
                title: 'Milo - Evening Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 17, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 18, 0),
                location: '321 Pine Road',
                client: 'Wilson Family'
            },
            {
                id: '17',
                title: 'Oscar - Late Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 19, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 19, 30),
                location: '999 Willow Way',
                client: 'Anderson Family'
            }
        ];

        // Initialize default templates
        this.state.templates = [
            {
                id: 't1',
                name: 'Overnight Stay',
                icon: '🌙',
                type: 'overnight',
                duration: 960, // 16 hours
                includeTrave: true,
                defaultNotes: 'Overnight pet sitting - includes evening and morning care'
            },
            {
                id: 't2',
                name: '30-Minute Drop-in',
                icon: '🏃',
                type: 'dropin',
                duration: 30,
                includeTravel: true,
                defaultNotes: 'Quick visit for feeding and potty break'
            },
            {
                id: 't3',
                name: '1-Hour Dog Walk',
                icon: '🦮',
                type: 'walk',
                duration: 60,
                includeTravel: true,
                defaultNotes: '1 hour walk in neighborhood or park'
            },
            {
                id: 't4',
                name: 'Meet & Greet',
                icon: '👋',
                type: 'meet-greet',
                duration: 60,
                includeTravel: false,
                defaultNotes: 'Initial consultation with new client'
            }
        ];
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        const saved = localStorage.getItem('gps-admin-settings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.state.settings = { ...this.state.settings, ...settings };
            } catch (e) {
                console.error('Error loading settings:', e);
            }
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        localStorage.setItem('gps-admin-settings', JSON.stringify(this.state.settings));
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                this.switchView(view);
            });
        });

        // Mobile menu toggle
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.getElementById('sidebar');
        menuToggle?.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // Connect calendar button
        document.getElementById('connect-calendar-btn')?.addEventListener('click', () => {
            this.handleCalendarConnect();
        });

        // Calendar controls
        document.getElementById('calendar-prev')?.addEventListener('click', () => {
            this.navigateCalendar(-1);
        });

        document.getElementById('calendar-next')?.addEventListener('click', () => {
            this.navigateCalendar(1);
        });

        document.getElementById('calendar-today')?.addEventListener('click', () => {
            this.state.currentDate = new Date();
            this.renderCalendar();
        });

        // Calendar view toggle
        document.querySelectorAll('[data-calendar-view]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-calendar-view]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.state.calendarView = e.target.dataset.calendarView;
                this.renderCalendar();
            });
        });

        // New appointment button
        document.getElementById('new-appointment-btn')?.addEventListener('click', () => {
            this.showAppointmentModal();
        });

        // Settings form handlers
        document.getElementById('save-api-settings')?.addEventListener('click', () => {
            this.saveApiSettings();
        });

        document.getElementById('save-workload-settings')?.addEventListener('click', () => {
            this.saveWorkloadSettings();
        });

        // Modal close handlers
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                modal?.classList.remove('active');
            });
        });

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                modal?.classList.remove('active');
            });
        });
    }

    /**
     * Switch between views
     */
    switchView(viewName) {
        // Update state
        this.state.currentView = viewName;

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.toggle('active', view.id === `view-${viewName}`);
        });

        // Render view content
        switch (viewName) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'calendar':
                this.renderCalendar();
                break;
            case 'templates':
                this.renderTemplates();
                break;
            case 'settings':
                this.renderSettings();
                break;
        }
    }

    /**
     * Render dashboard view
     */
    renderDashboard() {
        this.renderQuickStats();
        this.renderWeekOverview();
        this.renderRecommendations();
    }

    /**
     * Render quick stats cards
     */
    renderQuickStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayEvents = this.state.events.filter(event => {
            const eventDate = new Date(event.start);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate.getTime() === today.getTime();
        });

        const totalMinutes = todayEvents.reduce((sum, event) => {
            return sum + (event.end - event.start) / (1000 * 60);
        }, 0);

        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);

        // Mock drive time (would come from Google Maps API)
        const mockDriveMinutes = todayEvents.length * 15;
        const driveHours = Math.floor(mockDriveMinutes / 60);
        const driveMinutes = mockDriveMinutes % 60;

        // Update stats
        document.getElementById('stat-today').textContent = todayEvents.length;
        document.getElementById('stat-hours').textContent = `${hours}h ${minutes}m`;
        document.getElementById('stat-drive').textContent = driveHours > 0 ? `${driveHours}h ${driveMinutes}m` : `${driveMinutes}m`;

        // Workload level
        const workloadLevel = this.getWorkloadLevel(hours + (minutes / 60));
        document.getElementById('stat-workload').textContent = this.getWorkloadLabel(workloadLevel);
    }

    /**
     * Render week overview
     */
    renderWeekOverview() {
        const weekOverview = document.getElementById('week-overview');
        if (!weekOverview) return;

        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Start on Sunday

        let html = '';

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            date.setHours(0, 0, 0, 0);

            const dayEvents = this.state.events.filter(event => {
                const eventDate = new Date(event.start);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate.getTime() === date.getTime();
            });

            const totalMinutes = dayEvents.reduce((sum, event) => {
                return sum + (event.end - event.start) / (1000 * 60);
            }, 0);

            const hours = (totalMinutes / 60).toFixed(1);
            const workloadLevel = this.getWorkloadLevel(parseFloat(hours));
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

            html += `
                <div class="week-day ${workloadLevel}">
                    <div class="week-day-name">${dayNames[i]}</div>
                    <div class="week-day-date">${date.getDate()}</div>
                    <div class="week-day-hours">${hours}h</div>
                </div>
            `;
        }

        weekOverview.innerHTML = html;
    }

    /**
     * Render recommendations
     */
    renderRecommendations() {
        const recommendations = document.getElementById('recommendations');
        if (!recommendations) return;

        const today = new Date();
        const nextWeek = [];

        // Analyze next 7 days
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            date.setHours(0, 0, 0, 0);

            const dayEvents = this.state.events.filter(event => {
                const eventDate = new Date(event.start);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate.getTime() === date.getTime();
            });

            const totalMinutes = dayEvents.reduce((sum, event) => {
                return sum + (event.end - event.start) / (1000 * 60);
            }, 0);

            nextWeek.push({
                date,
                hours: totalMinutes / 60,
                events: dayEvents.length
            });
        }

        let html = '';

        // Check for burnout risk
        const burnoutDays = nextWeek.filter(day => day.hours >= this.state.settings.thresholds.burnout);
        if (burnoutDays.length > 0) {
            html += `
                <div class="recommendation-card danger">
                    <div class="recommendation-icon">⚠️</div>
                    <div class="recommendation-content">
                        <p><strong>Burnout Risk Detected:</strong> You have ${burnoutDays.length} day(s) this week with ${this.state.settings.thresholds.burnout}+ hours. Consider declining new bookings or rescheduling if possible.</p>
                    </div>
                </div>
            `;
        }

        // Check for high workload
        const highWorkloadDays = nextWeek.filter(day =>
            day.hours >= this.state.settings.thresholds.high && day.hours < this.state.settings.thresholds.burnout
        );
        if (highWorkloadDays.length > 0 && burnoutDays.length === 0) {
            html += `
                <div class="recommendation-card warning">
                    <div class="recommendation-icon">📊</div>
                    <div class="recommendation-content">
                        <p><strong>High Workload:</strong> You have ${highWorkloadDays.length} day(s) this week with high workload. Be selective with new bookings.</p>
                    </div>
                </div>
            `;
        }

        // Check for good capacity
        const comfortableDays = nextWeek.filter(day => day.hours < this.state.settings.thresholds.comfortable);
        if (comfortableDays.length >= 4) {
            html += `
                <div class="recommendation-card">
                    <div class="recommendation-icon">✅</div>
                    <div class="recommendation-content">
                        <p><strong>Good Capacity:</strong> You have ${comfortableDays.length} day(s) with comfortable workload this week. Good time to take on new clients!</p>
                    </div>
                </div>
            `;
        }

        // General tip
        html += `
            <div class="recommendation-card">
                <div class="recommendation-icon">💡</div>
                <div class="recommendation-content">
                    <p><strong>Tip:</strong> Use appointment templates to quickly schedule common service types and automatically include travel time.</p>
                </div>
            </div>
        `;

        recommendations.innerHTML = html;
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

            const dayEvents = this.state.events.filter(event => {
                const eventDate = new Date(event.start);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate.getTime() === dateKey.getTime();
            });

            const totalMinutes = dayEvents.reduce((sum, event) => {
                return sum + (event.end - event.start) / (1000 * 60);
            }, 0);

            const hours = (totalMinutes / 60).toFixed(1);
            const workloadLevel = this.getWorkloadLevel(parseFloat(hours));

            const isToday = dateKey.getTime() === today.getTime();
            const isOtherMonth = currentDate.getMonth() !== month;

            let classes = 'calendar-day';
            if (isToday) classes += ' today';
            if (isOtherMonth) classes += ' other-month';
            if (!isOtherMonth && dayEvents.length > 0) classes += ` ${workloadLevel}`;

            html += `
                <div class="${classes}" data-date="${dateKey.toISOString()}">
                    <div class="calendar-day-number">${currentDate.getDate()}</div>
                    ${dayEvents.length > 0 ? `
                        <div class="calendar-day-events">${dayEvents.length} event${dayEvents.length !== 1 ? 's' : ''}</div>
                        <div class="calendar-day-hours">${hours}h</div>
                    ` : ''}
                </div>
            `;

            currentDate.setDate(currentDate.getDate() + 1);
        }

        html += '</div></div>';
        container.innerHTML = html;
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
     * Navigate calendar
     */
    navigateCalendar(direction) {
        const current = this.state.currentDate;

        switch (this.state.calendarView) {
            case 'month':
                current.setMonth(current.getMonth() + direction);
                break;
            case 'week':
                current.setDate(current.getDate() + (7 * direction));
                break;
            case 'day':
                current.setDate(current.getDate() + direction);
                break;
        }

        this.renderCalendar();
    }

    /**
     * Render templates view
     */
    renderTemplates() {
        const container = document.getElementById('templates-list');
        if (!container) return;

        let html = '';

        this.state.templates.forEach(template => {
            const hours = Math.floor(template.duration / 60);
            const minutes = template.duration % 60;
            const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

            html += `
                <div class="template-card" data-template-id="${template.id}">
                    <div class="template-header">
                        <div class="template-icon">${template.icon}</div>
                        <div class="template-info">
                            <div class="template-name">${template.name}</div>
                            <div class="template-duration">${durationText}</div>
                        </div>
                    </div>
                    <div class="template-details">
                        <div class="template-detail">
                            <span class="template-detail-label">Type:</span>
                            <span class="template-detail-value">${template.type}</span>
                        </div>
                        <div class="template-detail">
                            <span class="template-detail-label">Travel Time:</span>
                            <span class="template-detail-value">${template.includeTravel ? 'Included' : 'Not included'}</span>
                        </div>
                    </div>
                    <div class="template-actions">
                        <button class="btn btn-primary btn-sm">Use Template</button>
                        <button class="btn btn-secondary btn-sm">Edit</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    /**
     * Render settings view
     */
    renderSettings() {
        // Populate API settings
        document.getElementById('calendar-client-id').value = this.state.settings.api.calendarClientId || '';
        document.getElementById('maps-api-key').value = this.state.settings.api.mapsApiKey || '';

        // Populate workload thresholds
        document.getElementById('threshold-comfortable').value = this.state.settings.thresholds.comfortable;
        document.getElementById('threshold-busy').value = this.state.settings.thresholds.busy;
        document.getElementById('threshold-overload').value = this.state.settings.thresholds.high;
        document.getElementById('threshold-burnout').value = this.state.settings.thresholds.burnout;
    }

    /**
     * Save API settings
     */
    saveApiSettings() {
        this.state.settings.api.calendarClientId = document.getElementById('calendar-client-id').value;
        this.state.settings.api.mapsApiKey = document.getElementById('maps-api-key').value;
        this.saveSettings();
        alert('API settings saved!');
    }

    /**
     * Save workload settings
     */
    saveWorkloadSettings() {
        this.state.settings.thresholds.comfortable = parseInt(document.getElementById('threshold-comfortable').value);
        this.state.settings.thresholds.busy = parseInt(document.getElementById('threshold-busy').value);
        this.state.settings.thresholds.high = parseInt(document.getElementById('threshold-overload').value);
        this.state.settings.thresholds.burnout = parseInt(document.getElementById('threshold-burnout').value);

        this.saveSettings();

        // Update analyzer if it exists
        if (this.workloadAnalyzer) {
            this.workloadAnalyzer.updateThresholds(this.state.settings.thresholds);
        }

        // Re-render views with new thresholds
        this.renderDashboard();
        this.updateWorkloadIndicator();

        alert('Workload thresholds saved!');
    }

    /**
     * Get workload level based on hours
     */
    getWorkloadLevel(hours) {
        const { comfortable, busy, high, burnout } = this.state.settings.thresholds;

        if (hours >= burnout) return 'burnout';
        if (hours >= high) return 'high';
        if (hours >= busy) return 'busy';
        if (hours >= comfortable) return 'comfortable';
        return 'comfortable';
    }

    /**
     * Get workload label
     */
    getWorkloadLabel(level) {
        const labels = {
            comfortable: 'Comfortable',
            busy: 'Busy',
            high: 'High',
            burnout: 'Burnout Risk'
        };
        return labels[level] || 'Unknown';
    }

    /**
     * Update workload indicator in header
     */
    updateWorkloadIndicator() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayEvents = this.state.events.filter(event => {
            const eventDate = new Date(event.start);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate.getTime() === today.getTime();
        });

        const totalMinutes = todayEvents.reduce((sum, event) => {
            return sum + (event.end - event.start) / (1000 * 60);
        }, 0);

        const hours = totalMinutes / 60;
        const level = this.getWorkloadLevel(hours);

        const indicator = document.getElementById('workload-indicator');
        const dot = indicator?.querySelector('.workload-dot');
        const text = indicator?.querySelector('.workload-text');

        if (dot && text) {
            dot.className = `workload-dot ${level}`;
            text.textContent = this.getWorkloadLabel(level);
        }
    }

    /**
     * Handle calendar connection
     */
    handleCalendarConnect() {
        if (this.state.settings.api.calendarClientId) {
            // Real API connection would go here
            alert('Calendar API integration coming in Phase 1.1!\n\nFor now, you can explore the app with mock data.');
        } else {
            alert('Please configure your Google Calendar API credentials in Settings first.');
            this.switchView('settings');
        }
    }

    /**
     * Show appointment modal
     */
    showAppointmentModal() {
        const modal = document.getElementById('appointment-modal');
        modal?.classList.add('active');
    }
}
