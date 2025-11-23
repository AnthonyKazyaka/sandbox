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
        const calendarClientId = window.GPSConfig?.calendar?.clientId;
        this.calendarApi = window.CalendarAPI && calendarClientId ? new CalendarAPI(calendarClientId) : null;
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

        // Connect calendar button
        const connectBtn = document.getElementById('connect-calendar-btn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => {
                console.log('🔘 Connect calendar button clicked');
                this.handleCalendarConnect();
            });
        }

        // Refresh calendar button
        const refreshBtn = document.getElementById('refresh-calendar-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                console.log('🔘 Refresh calendar button clicked');
                await this.handleCalendarRefresh();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                console.log('🚪 Logout button clicked');
                this.handleLogout();
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
        this.renderer.renderCalendar(this.state);
    }

    /**
     * Render analytics view
     */
    renderAnalytics() {
        this.renderer.renderAnalytics(this.state, this.templatesManager);
    }

    /**
     * Render settings view
     */
    renderSettings() {
        this.renderer.renderSettings(this.state);
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
     * Handle calendar connection - initiate OAuth flow
     */
    async handleCalendarConnect() {
        try {
            // Get Client ID from state or config
            const clientId = this.state.settings?.api?.calendarClientId || 
                           window.GPSConfig?.calendar?.clientId;

            // Validate Client ID is configured
            if (!clientId || clientId === 'YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com') {
                alert(
                    '⚠️ Calendar Client ID not configured.\n\n' +
                    'Please configure your Google OAuth Client ID in Settings before connecting.'
                );
                this.switchView('settings');
                return;
            }

            // Show connecting message
            Utils.showToast('Connecting to Google Calendar...', 'info');

            // Initialize Calendar API if needed
            if (!this.calendarApi || !this.calendarApi.gapiInited) {
                console.log('📦 Initializing Calendar API...');
                this.calendarApi = new CalendarAPI(clientId);
                await this.calendarApi.init();
            }

            // Authenticate user (triggers OAuth flow)
            console.log('🔐 Starting OAuth authentication...');
            await this.calendarApi.authenticate();

            // Mark as authenticated
            this.state.isAuthenticated = true;
            this.state.useMockData = false;

            // Get available calendars
            console.log('📅 Fetching calendar list...');
            const calendars = await this.calendarApi.listCalendars();
            this.state.availableCalendars = calendars;

            // Select primary calendar by default if none selected
            if (!this.state.selectedCalendars || this.state.selectedCalendars.length === 0) {
                this.state.selectedCalendars = ['primary'];
            }

            // Save authentication state
            this.dataManager.saveData(this.state);

            // Load calendar events
            console.log('📡 Loading calendar events...');
            await this.loadCalendarEvents();

            // Update UI
            this.updateConnectButtonState();
            await this.renderCurrentView();
            this.renderer.updateWorkloadIndicator(this.state);

            // Update calendar selection in settings if viewing settings
            if (this.state.currentView === 'settings') {
                this.renderer.renderCalendarSelection(this.state);
            }

            Utils.showToast('✅ Successfully connected to Google Calendar!', 'success');
            console.log('✅ Calendar connection successful');

        } catch (error) {
            console.error('Calendar connection error:', error);
            
            // Handle specific error cases
            let errorMessage = 'Failed to connect to Google Calendar.';
            
            if (error.error === 'popup_closed_by_user') {
                errorMessage = 'Authentication cancelled. Please try again.';
            } else if (error.error === 'access_denied') {
                errorMessage = 'Access denied. Please grant calendar permissions.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            Utils.showToast(errorMessage, 'error');
            
            // Reset authentication state on error
            this.state.isAuthenticated = false;
            this.updateConnectButtonState();
        }
    }

    /**
     * Handle manual calendar refresh
     */
    async handleCalendarRefresh() {
        if (!this.state.isAuthenticated) {
            Utils.showToast('⚠️ Please connect to Google Calendar first', 'warning');
            return;
        }

        try {
            // Show refreshing message
            Utils.showToast('Refreshing calendar events...', 'info');

            // Clear existing cache to force fresh fetch
            this.dataManager.clearEventsCache();

            // Reload events from Google Calendar
            console.log('🔄 Refreshing calendar events...');
            await this.loadCalendarEvents();

            // Update all views
            await this.renderCurrentView();
            this.renderer.updateWorkloadIndicator(this.state);

            // Update refresh button timestamp
            this.updateRefreshButtonState();

            Utils.showToast(`✅ Refreshed ${this.state.events.length} events`, 'success');
            console.log(`✅ Calendar refresh successful (${this.state.events.length} events)`);

        } catch (error) {
            console.error('Calendar refresh error:', error);
            Utils.showToast('Failed to refresh calendar: ' + (error.message || 'Unknown error'), 'error');
        }
    }

    /**
     * Handle logout from Google Calendar
     */
    async handleLogout() {
        if (!this.state.isAuthenticated) {
            alert('You are not currently connected to Google Calendar.');
            return;
        }

        const confirmed = confirm(
            'Are you sure you want to logout from Google Calendar?\n\n' +
            'This will:\n' +
            '• Disconnect your Google account\n' +
            '• Revoke access tokens\n' +
            '• Switch back to mock data\n\n' +
            'Your locally stored calendar events will be preserved unless you clear them separately.'
        );

        if (!confirmed) return;

        try {
            // Sign out from Google Calendar API
            if (this.calendarApi) {
                this.calendarApi.signOut();
            }

            // Clear authentication state
            this.state.isAuthenticated = false;
            this.state.useMockData = true;
            this.state.availableCalendars = [];

            // Save settings
            this.dataManager.saveData(this.state);

            // Update button state
            this.updateConnectButtonState();

            // Reinitialize mock data
            this.initMockData();

            // Re-render views
            await this.renderCurrentView();
            this.renderer.updateWorkloadIndicator(this.state);

            // Update calendar selection in settings if viewing settings
            if (this.state.currentView === 'settings') {
                this.renderer.renderCalendarSelection(this.state);
            }

            alert('✅ Successfully logged out from Google Calendar.\n\nYou are now using mock data.');
            console.log('✅ Logged out from Google Calendar');
        } catch (error) {
            console.error('Logout error:', error);
            alert('Error logging out: ' + (error.message || 'Unknown error'));
        }
    }

    /**
     * Load calendar events from Google Calendar API
     */
    async loadCalendarEvents() {
        if (!this.calendarApi) {
            console.error('❌ Calendar API not initialized');
            throw new Error('Calendar API not initialized');
        }

        if (!this.state.isAuthenticated) {
            console.error('❌ User not authenticated');
            throw new Error('User not authenticated');
        }

        try {
            // Fetch events from all selected calendars
            const allEvents = await this.calendarApi.loadEventsFromCalendars(this.state.selectedCalendars);

            // Update state with fetched events
            this.state.events = allEvents;

            // Mark work events with metadata
            this.eventProcessor.markWorkEvents(this.state.events);

            // Cache the events
            this.dataManager.saveEventsCache(this.state.events, this.state.selectedCalendars);

            return this.state.events;

        } catch (error) {
            console.error('❌ Error loading calendar events:', error);
            throw error;
        }
    }

    /**
     * Update the connect button state based on authentication status
     */
    updateConnectButtonState() {
        const btn = document.getElementById('connect-calendar-btn');
        const refreshBtn = document.getElementById('refresh-calendar-btn');
        if (!btn) return;

        if (this.state.isAuthenticated) {
            btn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Connected
            `;
            btn.classList.add('btn-success');
            btn.classList.remove('btn-primary');

            // Show refresh button
            if (refreshBtn) {
                refreshBtn.style.display = 'block';
                this.updateRefreshButtonState();
            }
        } else {
            btn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Connect Calendar
            `;
            btn.classList.add('btn-primary');
            btn.classList.remove('btn-success');

            // Hide refresh button
            if (refreshBtn) {
                refreshBtn.style.display = 'none';
            }
        }
    }

    /**
     * Update refresh button text based on cache status
     */
    updateRefreshButtonState() {
        const refreshBtnText = document.getElementById('refresh-btn-text');
        if (!refreshBtnText) return;

        const cache = this.dataManager.loadEventsCache();
        if (cache && cache.timestamp) {
            const minutesAgo = Math.round((new Date() - cache.timestamp) / 1000 / 60);
            if (minutesAgo < 1) {
                refreshBtnText.textContent = 'Refresh Events (just now)';
            } else if (minutesAgo === 1) {
                refreshBtnText.textContent = 'Refresh Events (1 min ago)';
            } else if (minutesAgo < 60) {
                refreshBtnText.textContent = `Refresh Events (${minutesAgo} mins ago)`;
            } else {
                const hoursAgo = Math.floor(minutesAgo / 60);
                refreshBtnText.textContent = `Refresh Events (${hoursAgo}h ago)`;
            }
        } else {
            refreshBtnText.textContent = 'Refresh Events';
        }
    }
}
