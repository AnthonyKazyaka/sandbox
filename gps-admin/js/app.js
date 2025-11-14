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
            availableCalendars: [], // List of calendars from Google
            selectedCalendars: ['primary'], // Calendar IDs to sync with
            ignoredEventPatterns: [], // Patterns for events to ignore (title matches)
            isManagingTemplates: false, // Track if in template management mode
            settings: {
                thresholds: {
                    daily: {
                        comfortable: 6,
                        busy: 8,
                        high: 10,
                        burnout: 12
                    },
                    weekly: {
                        comfortable: 35,
                        busy: 45,
                        high: 55,
                        burnout: 65
                    },
                    monthly: {
                        comfortable: 140,
                        busy: 180,
                        high: 220,
                        burnout: 260
                    }
                },
                api: {
                    calendarClientId: '',
                    mapsApiKey: ''
                },
                homeAddress: '',
                includeTravelTime: true // Include travel time in workload calculations
            }
        };

        // Initialize TemplatesManager
        if (window.TemplatesManager) {
            this.templatesManager = new TemplatesManager();
        }

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

        // Don't initialize Calendar API in constructor - wait for user to connect
        // It will be initialized when user clicks "Connect to Google Calendar"

        // Initialize Maps API if available
        if (window.MapsAPI && this.state.settings.api.mapsApiKey) {
            await this.initMapsAPI();
        }

        // Render initial view
        await this.renderDashboard();
        await this.updateWorkloadIndicator();

        // Update connect button state if already authenticated
        this.updateConnectButtonState();

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
     * Initialize Google Maps API
     */
    async initMapsAPI() {
        try {
            if (this.state.settings.api.mapsApiKey) {
                this.mapsAPI = new MapsAPI(this.state.settings.api.mapsApiKey);
                await this.mapsAPI.init();
                console.log('✅ Maps API initialized');
            }
        } catch (error) {
            console.error('Error initializing Maps API:', error);
        }
    }

    /**
     * Calculate travel time between two locations
     * @param {string} origin - Starting location
     * @param {string} destination - Ending location
     * @param {Date} departureTime - Departure time
     * @returns {number} Travel time in minutes, or 0 if can't calculate
     */
    async calculateTravelTime(origin, destination, departureTime = null) {
        if (!this.mapsAPI || !origin || !destination) {
            return 0;
        }

        try {
            const result = await this.mapsAPI.calculateDriveTime(origin, destination, departureTime);
            return result.duration.minutes;
        } catch (error) {
            console.warn('Could not calculate travel time:', error);
            // Fallback: estimate based on typical city driving (30 mph average)
            // Assume 5 miles average between appointments = ~10 minutes
            return 10;
        }
    }

    /**
     * Get starting location for an event (home or previous appointment)
     * @param {Object} event - Current event
     * @param {Array} allEvents - All events sorted by start time
     * @returns {string} Starting location
     */
    getEventStartingLocation(event, allEvents) {
        const homeAddress = this.state.settings.homeAddress;
        if (!homeAddress) {
            return null;
        }

        // Find all events before this one on the same day
        const eventDate = new Date(event.start);
        eventDate.setHours(0, 0, 0, 0);

        const previousEvents = allEvents.filter(e => {
            const eDate = new Date(e.start);
            eDate.setHours(0, 0, 0, 0);
            return eDate.getTime() === eventDate.getTime() && e.start < event.start;
        }).sort((a, b) => a.start - b.start);

        // If there's a previous event with a location, use that as starting point
        if (previousEvents.length > 0) {
            const lastEvent = previousEvents[previousEvents.length - 1];
            if (lastEvent.location) {
                return lastEvent.location;
            }
        }

        // Otherwise, start from home
        return homeAddress;
    }

    /**
     * Calculate total travel time for a specific day
     * @param {Date} targetDate - The date to calculate travel for
     * @returns {number} Total travel time in minutes (or mock estimate if Maps API unavailable)
     */
    async calculateDailyTravelTime(targetDate) {
        // If travel time not enabled, return 0
        if (!this.state.settings.includeTravelTime) {
            return 0;
        }

        const homeAddress = this.state.settings.homeAddress;
        if (!homeAddress) {
            return 0;
        }

        const dateKey = new Date(targetDate);
        dateKey.setHours(0, 0, 0, 0);

        // Get all events for this day that aren't ignored or all-day
        const dayEvents = this.state.events.filter(event => {
            const eventDate = new Date(event.start);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate.getTime() === dateKey.getTime() &&
                   !event.ignored &&
                   !event.isAllDay &&
                   event.location; // Only count events with locations
        }).sort((a, b) => a.start - b.start);

        if (dayEvents.length === 0) {
            return 0;
        }

        // If Maps API is not available, use mock estimates
        if (!this.mapsAPI || !this.mapsAPI.isLoaded) {
            // Estimate: 10 minutes per trip (home to first, between each, last to home)
            const tripCount = dayEvents.length + 1; // +1 for return home
            return tripCount * 10;
        }

        let totalTravelMinutes = 0;

        try {
            // Calculate travel from home to first appointment
            const travelToFirst = await this.calculateTravelTime(
                homeAddress,
                dayEvents[0].location,
                dayEvents[0].start
            );
            totalTravelMinutes += travelToFirst;

            // Calculate travel between consecutive appointments
            for (let i = 0; i < dayEvents.length - 1; i++) {
                const current = dayEvents[i];
                const next = dayEvents[i + 1];

                const travelBetween = await this.calculateTravelTime(
                    current.location,
                    next.location,
                    next.start
                );
                totalTravelMinutes += travelBetween;
            }

            // Calculate travel from last appointment back home
            const lastEvent = dayEvents[dayEvents.length - 1];
            const travelToHome = await this.calculateTravelTime(
                lastEvent.location,
                homeAddress,
                lastEvent.end
            );
            totalTravelMinutes += travelToHome;

        } catch (error) {
            console.error('Error calculating daily travel time:', error);
            // Fallback to estimate
            const tripCount = dayEvents.length + 1;
            return tripCount * 10;
        }

        return totalTravelMinutes;
    }

    /**
     * Initialize mock data for testing
     */
    initMockData() {
        const today = new Date();

        // Generate mock events for 4 weeks of realistic pet sitting appointments
        this.state.events = [
            // ===== WEEK 1: TODAY =====
            // Today - Moderate workload
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

            // Day +1 - Light day
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

            // Day +2 - Overnight starts
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
            {
                id: '8',
                title: 'Luna - Morning Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 9, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 9, 30),
                location: '789 Maple Drive',
                client: 'Davis Family',
                notes: 'Medication'
            },

            // Day +3 - Busy day with ongoing overnight
            {
                id: '9',
                title: 'Max & Cooper - Morning Walk',
                type: 'walk',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 9, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 10, 0),
                location: '456 Elm Avenue',
                client: 'Smith Family',
                notes: '1 hour walk'
            },
            {
                id: '10',
                title: 'Luna - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 12, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 12, 30),
                location: '789 Maple Drive',
                client: 'Davis Family',
                notes: 'Medication'
            },
            {
                id: '11',
                title: 'Milo - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 17, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 17, 30),
                location: '321 Pine Road',
                client: 'Wilson Family',
                notes: 'Evening care'
            },

            // Day +4 - Very busy Friday
            {
                id: '12',
                title: 'Bella - Early Morning Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 7, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 7, 30),
                location: '123 Oak Street',
                client: 'Johnson Family'
            },
            {
                id: '13',
                title: 'Charlie - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 9, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 9, 45),
                location: '555 Cedar Lane',
                client: 'Brown Family'
            },
            {
                id: '14',
                title: 'Max & Cooper - Walk',
                type: 'walk',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 11, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 12, 0),
                location: '456 Elm Avenue',
                client: 'Smith Family'
            },
            {
                id: '15',
                title: 'Luna - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 13, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 14, 0),
                location: '789 Maple Drive',
                client: 'Davis Family'
            },
            {
                id: '16',
                title: 'Daisy - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 15, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 15, 30),
                location: '888 Birch Court',
                client: 'Taylor Family'
            },
            {
                id: '17',
                title: 'Milo - Evening Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 17, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 18, 0),
                location: '321 Pine Road',
                client: 'Wilson Family'
            },
            {
                id: '18',
                title: 'Oscar - Late Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 19, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 19, 30),
                location: '999 Willow Way',
                client: 'Anderson Family'
            },

            // Day +5 - Weekend Saturday - Moderate
            {
                id: '19',
                title: 'Luna - Morning Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 9, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 9, 45),
                location: '789 Maple Drive',
                client: 'Davis Family',
                notes: 'Weekend medication'
            },
            {
                id: '20',
                title: 'Jasper - Meet & Greet',
                type: 'meet-greet',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 11, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 12, 0),
                location: '234 Spruce St',
                client: 'Garcia Family',
                notes: 'New client - senior cat'
            },
            {
                id: '21',
                title: 'Daisy - Evening Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 18, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 18, 30),
                location: '888 Birch Court',
                client: 'Taylor Family'
            },

            // Day +6 - Sunday - Light
            {
                id: '22',
                title: 'Max & Cooper - Long Walk',
                type: 'walk',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6, 10, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6, 11, 30),
                location: '456 Elm Avenue',
                client: 'Smith Family',
                notes: '1.5 hour park walk'
            },

            // ===== WEEK 2 =====
            // Day +7 - Monday - Back to work busy
            {
                id: '23',
                title: 'Bella - Morning Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 8, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 8, 30),
                location: '123 Oak Street',
                client: 'Johnson Family'
            },
            {
                id: '24',
                title: 'Luna - Morning Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 9, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 10, 0),
                location: '789 Maple Drive',
                client: 'Davis Family',
                notes: 'Medication'
            },
            {
                id: '25',
                title: 'Charlie - Midday Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 12, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 13, 15),
                location: '555 Cedar Lane',
                client: 'Brown Family'
            },
            {
                id: '26',
                title: 'Max & Cooper - Afternoon Walk',
                type: 'walk',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 15, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 16, 0),
                location: '456 Elm Avenue',
                client: 'Smith Family'
            },
            {
                id: '27',
                title: 'Milo - Evening Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 17, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 18, 0),
                location: '321 Pine Road',
                client: 'Wilson Family'
            },

            // Day +8 - Tuesday - Overnight starts
            {
                id: '28',
                title: 'Tucker - Overnight Stay',
                type: 'overnight',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 8, 18, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 11, 10, 0),
                location: '777 Poplar Blvd',
                client: 'Martinez Family',
                notes: '3-night stay - business trip'
            },
            {
                id: '29',
                title: 'Bella - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 8, 8, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 8, 8, 30),
                location: '123 Oak Street',
                client: 'Johnson Family'
            },
            {
                id: '30',
                title: 'Luna - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 8, 13, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 8, 13, 45),
                location: '789 Maple Drive',
                client: 'Davis Family',
                notes: 'Medication'
            },

            // Day +9 - Wednesday - HIGH WORKLOAD
            {
                id: '31',
                title: 'Bella - Early Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 9, 7, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 9, 7, 30),
                location: '123 Oak Street',
                client: 'Johnson Family'
            },
            {
                id: '32',
                title: 'Charlie - Morning Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 9, 8, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 9, 9, 15),
                location: '555 Cedar Lane',
                client: 'Brown Family'
            },
            {
                id: '33',
                title: 'Max & Cooper - Walk',
                type: 'walk',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 9, 10, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 9, 11, 0),
                location: '456 Elm Avenue',
                client: 'Smith Family'
            },
            {
                id: '34',
                title: 'Luna - Midday Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 9, 12, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 9, 12, 45),
                location: '789 Maple Drive',
                client: 'Davis Family',
                notes: 'Medication'
            },
            {
                id: '35',
                title: 'Daisy - Afternoon Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 9, 14, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 9, 14, 30),
                location: '888 Birch Court',
                client: 'Taylor Family'
            },
            {
                id: '36',
                title: 'Milo - Evening Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 9, 16, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 9, 17, 0),
                location: '321 Pine Road',
                client: 'Wilson Family'
            },
            {
                id: '37',
                title: 'Oscar - Late Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 9, 18, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 9, 19, 0),
                location: '999 Willow Way',
                client: 'Anderson Family'
            },

            // Day +10 - Thursday - VERY HIGH WORKLOAD (BURNOUT RISK)
            {
                id: '38',
                title: 'Bella - Early Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 6, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 7, 0),
                location: '123 Oak Street',
                client: 'Johnson Family'
            },
            {
                id: '39',
                title: 'Luna - Morning Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 8, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 8, 45),
                location: '789 Maple Drive',
                client: 'Davis Family',
                notes: 'Medication'
            },
            {
                id: '40',
                title: 'Charlie - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 9, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 10, 15),
                location: '555 Cedar Lane',
                client: 'Brown Family'
            },
            {
                id: '41',
                title: 'Max & Cooper - Walk',
                type: 'walk',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 11, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 12, 0),
                location: '456 Elm Avenue',
                client: 'Smith Family'
            },
            {
                id: '42',
                title: 'Jasper - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 13, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 13, 30),
                location: '234 Spruce St',
                client: 'Garcia Family'
            },
            {
                id: '43',
                title: 'Daisy - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 14, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 15, 0),
                location: '888 Birch Court',
                client: 'Taylor Family'
            },
            {
                id: '44',
                title: 'Milo - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 16, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 16, 30),
                location: '321 Pine Road',
                client: 'Wilson Family'
            },
            {
                id: '45',
                title: 'Oscar - Evening Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 17, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 18, 0),
                location: '999 Willow Way',
                client: 'Anderson Family'
            },
            {
                id: '46',
                title: 'Buddy - Late Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 19, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10, 19, 45),
                location: '111 Ash Avenue',
                client: 'Thompson Family',
                notes: 'Emergency visit - owner delayed'
            },

            // Day +11 - Friday - Still busy
            {
                id: '47',
                title: 'Luna - Morning Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 11, 8, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 11, 8, 45),
                location: '789 Maple Drive',
                client: 'Davis Family',
                notes: 'Medication'
            },
            {
                id: '48',
                title: 'Bella - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 11, 10, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 11, 10, 30),
                location: '123 Oak Street',
                client: 'Johnson Family'
            },
            {
                id: '49',
                title: 'Max & Cooper - Walk',
                type: 'walk',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 11, 12, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 11, 13, 0),
                location: '456 Elm Avenue',
                client: 'Smith Family'
            },
            {
                id: '50',
                title: 'Daisy - Afternoon Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 11, 15, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 11, 15, 30),
                location: '888 Birch Court',
                client: 'Taylor Family'
            },
            {
                id: '51',
                title: 'Milo - Evening Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 11, 17, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 11, 18, 0),
                location: '321 Pine Road',
                client: 'Wilson Family'
            },

            // Day +12 - Weekend Saturday
            {
                id: '52',
                title: 'Luna - Weekend Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 12, 10, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 12, 10, 30),
                location: '789 Maple Drive',
                client: 'Davis Family',
                notes: 'Weekend medication'
            },
            {
                id: '53',
                title: 'Charlie - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 12, 14, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 12, 14, 45),
                location: '555 Cedar Lane',
                client: 'Brown Family'
            },

            // Day +13 - Sunday - Light day (rest!)
            {
                id: '54',
                title: 'Max & Cooper - Long Walk',
                type: 'walk',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 13, 10, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 13, 11, 30),
                location: '456 Elm Avenue',
                client: 'Smith Family',
                notes: 'Weekend park walk'
            },

            // ===== WEEK 3 =====
            // Day +14 - Monday - New week starts
            {
                id: '55',
                title: 'Bella - Morning Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14, 8, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14, 8, 30),
                location: '123 Oak Street',
                client: 'Johnson Family'
            },
            {
                id: '56',
                title: 'Luna - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14, 13, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14, 13, 45),
                location: '789 Maple Drive',
                client: 'Davis Family',
                notes: 'Medication'
            },
            {
                id: '57',
                title: 'Milo - Evening Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14, 17, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14, 18, 0),
                location: '321 Pine Road',
                client: 'Wilson Family'
            },

            // Day +15 - Tuesday - Moderate
            {
                id: '58',
                title: 'Max & Cooper - Morning Walk',
                type: 'walk',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15, 9, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15, 10, 0),
                location: '456 Elm Avenue',
                client: 'Smith Family'
            },
            {
                id: '59',
                title: 'Charlie - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15, 11, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15, 12, 15),
                location: '555 Cedar Lane',
                client: 'Brown Family'
            },
            {
                id: '60',
                title: 'Daisy - Afternoon Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15, 15, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15, 15, 30),
                location: '888 Birch Court',
                client: 'Taylor Family'
            },

            // Day +16 - Wednesday - Long overnight starts
            {
                id: '61',
                title: 'Bella & Rocky - Extended Overnight',
                type: 'overnight',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 16, 18, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 21, 10, 0),
                location: '123 Oak Street',
                client: 'Johnson Family',
                notes: '5-night stay - cruise vacation'
            },
            {
                id: '62',
                title: 'Luna - Morning Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 16, 9, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 16, 9, 45),
                location: '789 Maple Drive',
                client: 'Davis Family',
                notes: 'Medication'
            },
            {
                id: '63',
                title: 'Max & Cooper - Walk',
                type: 'walk',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 16, 11, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 16, 12, 0),
                location: '456 Elm Avenue',
                client: 'Smith Family'
            },

            // Day +17 - Thursday - Busy with ongoing overnight
            {
                id: '64',
                title: 'Luna - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 17, 13, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 17, 13, 45),
                location: '789 Maple Drive',
                client: 'Davis Family',
                notes: 'Medication'
            },
            {
                id: '65',
                title: 'Charlie - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 17, 15, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 17, 15, 45),
                location: '555 Cedar Lane',
                client: 'Brown Family'
            },
            {
                id: '66',
                title: 'Milo - Evening Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 17, 17, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 17, 18, 0),
                location: '321 Pine Road',
                client: 'Wilson Family'
            },
            {
                id: '67',
                title: 'Daisy - Late Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 17, 19, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 17, 19, 30),
                location: '888 Birch Court',
                client: 'Taylor Family'
            },

            // Day +18 - Friday
            {
                id: '68',
                title: 'Max & Cooper - Morning Walk',
                type: 'walk',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 18, 9, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 18, 10, 0),
                location: '456 Elm Avenue',
                client: 'Smith Family'
            },
            {
                id: '69',
                title: 'Luna - Midday Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 18, 12, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 18, 13, 15),
                location: '789 Maple Drive',
                client: 'Davis Family',
                notes: 'Medication'
            },
            {
                id: '70',
                title: 'Oscar - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 18, 16, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 18, 16, 30),
                location: '999 Willow Way',
                client: 'Anderson Family'
            },

            // Weekend 19-20 - Ongoing overnight only
            {
                id: '71',
                title: 'Luna - Weekend Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 19, 10, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 19, 10, 30),
                location: '789 Maple Drive',
                client: 'Davis Family',
                notes: 'Weekend medication'
            },

            // ===== WEEK 4 =====
            // Day +21 - Monday - Overnight ends, back to normal
            {
                id: '72',
                title: 'Luna - Morning Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 21, 9, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 21, 9, 45),
                location: '789 Maple Drive',
                client: 'Davis Family',
                notes: 'Medication'
            },
            {
                id: '73',
                title: 'Max & Cooper - Walk',
                type: 'walk',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 21, 11, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 21, 12, 0),
                location: '456 Elm Avenue',
                client: 'Smith Family'
            },
            {
                id: '74',
                title: 'Milo - Evening Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 21, 17, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 21, 18, 0),
                location: '321 Pine Road',
                client: 'Wilson Family'
            },

            // Day +22 - Tuesday
            {
                id: '75',
                title: 'Bella - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 22, 8, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 22, 8, 30),
                location: '123 Oak Street',
                client: 'Johnson Family'
            },
            {
                id: '76',
                title: 'Charlie - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 22, 10, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 22, 11, 15),
                location: '555 Cedar Lane',
                client: 'Brown Family'
            },
            {
                id: '77',
                title: 'Daisy - Afternoon Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 22, 15, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 22, 15, 30),
                location: '888 Birch Court',
                client: 'Taylor Family'
            },

            // Day +23 - Wednesday - New client consultation
            {
                id: '78',
                title: 'Penny - Meet & Greet',
                type: 'meet-greet',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 23, 10, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 23, 11, 0),
                location: '432 Hickory Lane',
                client: 'Roberts Family',
                notes: 'New client - energetic puppy'
            },
            {
                id: '79',
                title: 'Luna - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 23, 13, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 23, 13, 45),
                location: '789 Maple Drive',
                client: 'Davis Family',
                notes: 'Medication'
            },
            {
                id: '80',
                title: 'Max & Cooper - Walk',
                type: 'walk',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 23, 15, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 23, 16, 30),
                location: '456 Elm Avenue',
                client: 'Smith Family'
            },

            // Day +24 - Thursday - Holiday prep busy
            {
                id: '81',
                title: 'Bella - Early Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 24, 7, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 24, 7, 30),
                location: '123 Oak Street',
                client: 'Johnson Family'
            },
            {
                id: '82',
                title: 'Luna - Morning Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 24, 9, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 24, 9, 45),
                location: '789 Maple Drive',
                client: 'Davis Family',
                notes: 'Medication'
            },
            {
                id: '83',
                title: 'Charlie - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 24, 11, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 24, 11, 45),
                location: '555 Cedar Lane',
                client: 'Brown Family'
            },
            {
                id: '84',
                title: 'Max & Cooper - Walk',
                type: 'walk',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 24, 13, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 24, 14, 0),
                location: '456 Elm Avenue',
                client: 'Smith Family'
            },
            {
                id: '85',
                title: 'Milo - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 24, 15, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 24, 16, 0),
                location: '321 Pine Road',
                client: 'Wilson Family'
            },
            {
                id: '86',
                title: 'Daisy - Evening Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 24, 17, 30),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 24, 18, 0),
                location: '888 Birch Court',
                client: 'Taylor Family'
            },
            {
                id: '87',
                title: 'Oscar - Late Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 24, 19, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 24, 19, 30),
                location: '999 Willow Way',
                client: 'Anderson Family'
            },

            // Day +25 - Friday - Light day
            {
                id: '88',
                title: 'Luna - Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 25, 13, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 25, 13, 45),
                location: '789 Maple Drive',
                client: 'Davis Family',
                notes: 'Medication'
            },
            {
                id: '89',
                title: 'Max & Cooper - Walk',
                type: 'walk',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 25, 15, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 25, 16, 0),
                location: '456 Elm Avenue',
                client: 'Smith Family'
            },

            // Day +26 - Weekend Saturday
            {
                id: '90',
                title: 'Charlie - Weekend Drop-in',
                type: 'dropin',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 26, 10, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 26, 10, 45),
                location: '555 Cedar Lane',
                client: 'Brown Family'
            },

            // Day +27 - Sunday - Rest day
            {
                id: '91',
                title: 'Max & Cooper - Long Weekend Walk',
                type: 'walk',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 27, 10, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 27, 11, 30),
                location: '456 Elm Avenue',
                client: 'Smith Family',
                notes: '1.5 hour park walk - weekend special'
            }
        ];

        // Add calendar metadata to mock events
        this.state.events.forEach(event => {
            event.calendarName = 'Genie\'s Pet Sitting Calendar';
            event.calendarId = 'primary';
            event.isAllDay = false;
            event.recurringEventId = null;
            event.ignored = false;
        });

        // Add some sample all-day events for testing
        this.state.events.push(
            {
                id: '92',
                title: 'Your Birthday',
                type: 'other',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 0, 0, 0, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6, 0, 0, 0, 0),
                location: '',
                client: '',
                notes: '',
                calendarName: 'Personal Calendar',
                calendarId: 'personal',
                isAllDay: true,
                recurringEventId: null,
                ignored: false
            },
            {
                id: '93',
                title: 'Annual Vet Conference',
                type: 'other',
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 12, 0, 0, 0, 0),
                end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14, 0, 0, 0, 0),
                location: 'Convention Center',
                client: '',
                notes: 'Professional development - mark as ignored for workload',
                calendarName: 'Personal Calendar',
                calendarId: 'personal',
                isAllDay: true,
                recurringEventId: null,
                ignored: false
            }
        );

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
        // First, load from config file if available
        if (window.GPSConfig) {
            if (window.GPSConfig.calendar?.clientId) {
                this.state.settings.api.calendarClientId = window.GPSConfig.calendar.clientId;
            }
            if (window.GPSConfig.maps?.apiKey) {
                this.state.settings.api.mapsApiKey = window.GPSConfig.maps.apiKey;
            }
            if (window.GPSConfig.app?.useMockData !== undefined) {
                this.state.useMockData = window.GPSConfig.app.useMockData;
            }
            console.log('✅ Loaded configuration from config file');
        }

        // Then, override with localStorage if available
        const saved = localStorage.getItem('gps-admin-settings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.state.settings = { ...this.state.settings, ...settings };

                // Load selected calendars if available
                if (settings.selectedCalendars) {
                    this.state.selectedCalendars = settings.selectedCalendars;
                }

                // Load authentication state
                if (settings.isAuthenticated) {
                    this.state.isAuthenticated = settings.isAuthenticated;
                    this.state.useMockData = false;
                }

                // Load available calendars
                if (settings.availableCalendars) {
                    this.state.availableCalendars = settings.availableCalendars;
                }

                // Load templates
                if (settings.templates) {
                    this.state.templates = settings.templates;
                }

                console.log('✅ Loaded settings from localStorage');
            } catch (e) {
                console.error('Error loading settings:', e);
            }
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        const settingsToSave = {
            ...this.state.settings,
            selectedCalendars: this.state.selectedCalendars,
            isAuthenticated: this.state.isAuthenticated,
            availableCalendars: this.state.availableCalendars,
            templates: this.state.templates
        };
        localStorage.setItem('gps-admin-settings', JSON.stringify(settingsToSave));
    }

    /**
     * Update the connect button state based on authentication status
     */
    updateConnectButtonState() {
        const btn = document.getElementById('connect-calendar-btn');
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
        }
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

        // Dashboard add appointment button
        document.getElementById('add-appointment-btn')?.addEventListener('click', () => {
            this.showAppointmentModal();
        });

        // Settings form handlers
        document.getElementById('save-api-settings')?.addEventListener('click', () => {
            this.saveApiSettings();
        });

        document.getElementById('save-workload-settings')?.addEventListener('click', () => {
            this.saveWorkloadSettings();
        });

        // Account management handlers
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.handleLogout();
        });

        document.getElementById('clear-calendar-data-btn')?.addEventListener('click', () => {
            this.handleClearCalendarData();
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

        // View in List button in day details modal
        document.getElementById('view-in-list-btn')?.addEventListener('click', () => {
            this.viewDateInList();
        });

        // Template management
        document.getElementById('manage-templates-btn')?.addEventListener('click', () => {
            this.toggleManageTemplatesMode();
        });

        document.getElementById('new-template-btn')?.addEventListener('click', () => {
            this.showTemplateModal();
        });

        document.getElementById('save-template')?.addEventListener('click', () => {
            this.saveTemplate();
        });

        // Appointment form handlers
        document.getElementById('appointment-template')?.addEventListener('change', (e) => {
            this.handleTemplateSelection(e.target.value);
        });

        document.getElementById('save-appointment')?.addEventListener('click', () => {
            this.saveAppointment();
        });

        // Analytics time range selector
        document.getElementById('analytics-range')?.addEventListener('change', () => {
            this.renderAnalytics();
        });

        // Analytics comparison toggle
        document.getElementById('analytics-compare-toggle')?.addEventListener('change', () => {
            this.renderAnalytics();
        });
    }

    /**
     * Switch between views
     */
    async switchView(viewName) {
        // Reset manage templates mode when leaving templates view
        if (this.state.currentView === 'templates' && viewName !== 'templates' && this.state.isManagingTemplates) {
            this.state.isManagingTemplates = false;
            const btn = document.getElementById('manage-templates-btn');
            if (btn) {
                btn.classList.remove('btn-danger');
                btn.classList.add('btn-secondary');
                btn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Manage Templates
                `;
            }
        }

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
                await this.renderDashboard();
                break;
            case 'calendar':
                this.renderCalendar();
                break;
            case 'analytics':
                this.renderAnalytics();
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
     * Calculate event duration for a specific day
     * Handles multi-day events and overnight appointments properly
     * @param {Object} event - The event object
     * @param {Date} targetDate - The specific date to calculate duration for
     * @returns {number} Duration in minutes for that specific day
     */
    calculateEventDurationForDay(event, targetDate) {
        // All-day events (like birthdays) don't count toward workload
        if (event.isAllDay) {
            return 0;
        }
        
        // Overnight events are displayed separately, not included in work hours
        const isOvernightType = event.type === 'overnight' || 
                               event.title?.toLowerCase().includes('overnight') ||
                               event.title?.toLowerCase().includes('housesit');
        
        if (isOvernightType) {
            return 0;
        }
        
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        
        // Set target day boundaries (midnight to midnight)
        const dayStart = new Date(targetDate);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(targetDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        // If event doesn't overlap with this day at all, return 0
        if (eventEnd <= dayStart || eventStart > dayEnd) {
            return 0;
        }
        
        // Calculate the actual overlap with the day
        const overlapStart = eventStart > dayStart ? eventStart : dayStart;
        const overlapEnd = eventEnd < dayEnd ? eventEnd : dayEnd;
        const minutes = (overlapEnd - overlapStart) / (1000 * 60);
        
        return Math.max(0, minutes);
    }

    /**
     * Render dashboard view
     */
    async renderDashboard() {
        await this.renderQuickStats();
        this.renderUpcomingAppointments();
        this.renderWeekComparison();
        this.renderWeekOverviewEnhanced();
        this.renderWeeklyInsights();
        this.renderRecommendations();
    }

    /**
     * Render quick stats cards
     */
    async renderQuickStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        const todayEvents = this.state.events.filter(event => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            // Check if event overlaps with today (handles multi-day events)
            return eventEnd > today && eventStart <= todayEnd;
        });

        // Filter out ignored events for workload calculations
        const workEvents = todayEvents.filter(event => !event.ignored && !event.isAllDay);

        const totalMinutes = workEvents.reduce((sum, event) => {
            return sum + this.calculateEventDurationForDay(event, today);
        }, 0);

        // Calculate travel time
        const travelMinutes = await this.calculateDailyTravelTime(today);

        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);

        const driveHours = Math.floor(travelMinutes / 60);
        const driveMinutes = Math.round(travelMinutes % 60);

        // Total workload includes travel time if enabled
        const totalWorkloadMinutes = this.state.settings.includeTravelTime
            ? totalMinutes + travelMinutes
            : totalMinutes;

        // Calculate total hours for display (always includes work + travel for the stat)
        const totalHours = Math.floor((totalMinutes + travelMinutes) / 60);
        const totalMins = Math.round((totalMinutes + travelMinutes) % 60);

        // Update stats
        document.getElementById('stat-today').textContent = todayEvents.length;
        document.getElementById('stat-hours').textContent = `${totalHours}h ${totalMins}m`;
        document.getElementById('stat-drive').textContent = driveHours > 0 ? `${driveHours}h ${driveMinutes}m` : `${driveMinutes}m`;

        // Workload level includes travel time
        const workloadLevel = this.getWorkloadLevel(totalWorkloadMinutes / 60);
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
                const eventStart = new Date(event.start);
                const eventEnd = new Date(event.end);
                
                // Set day boundaries
                const dayStart = new Date(date);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(date);
                dayEnd.setHours(23, 59, 59, 999);
                
                // Check if event overlaps with this day (handles multi-day events)
                return eventEnd > dayStart && eventStart <= dayEnd;
            });

            // Filter out ignored events and all-day events for workload calculations
            const workEvents = dayEvents.filter(event => !event.ignored && !event.isAllDay);

            const totalMinutes = workEvents.reduce((sum, event) => {
                return sum + this.calculateEventDurationForDay(event, date);
            }, 0);

            // Calculate travel time for this day
            let travelMinutes = 0;
            if (workEvents.length > 0) {
                // Travel to first appointment from home
                if (workEvents[0].location) travelMinutes += 15;
                
                // Travel between consecutive appointments
                for (let j = 0; j < workEvents.length - 1; j++) {
                    if (workEvents[j].location && workEvents[j + 1].location) {
                        travelMinutes += 15;
                    }
                }
                
                // Travel home from last appointment
                if (workEvents[workEvents.length - 1].location) travelMinutes += 15;
            }

            const totalWithTravel = totalMinutes + travelMinutes;
            const hours = (totalWithTravel / 60).toFixed(1);
            const workloadLevel = this.getWorkloadLevel(parseFloat(hours));
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

            // Store date for click handler
            const dateStr = date.toISOString();

            html += `
                <div class="week-day ${workloadLevel}" data-date="${dateStr}" style="cursor: pointer;">
                    <div class="week-day-name">${dayNames[i]}</div>
                    <div class="week-day-date">${date.getDate()}</div>
                    <div class="week-day-hours">${hours}h</div>
                </div>
            `;
        }

        weekOverview.innerHTML = html;

        // Add click handlers to week days
        weekOverview.querySelectorAll('.week-day').forEach(dayElement => {
            dayElement.addEventListener('click', () => {
                const dateStr = dayElement.dataset.date;
                this.showDayDetails(new Date(dateStr));
            });
        });
    }

    /**
     * Render weekly insights with metrics
     */
    renderWeeklyInsights() {
        const container = document.getElementById('weekly-insights');
        if (!container) return;

        // Defensive check for events
        if (!this.state || !this.state.events || !Array.isArray(this.state.events)) {
            container.innerHTML = '<p class="text-muted" style="text-align: center; padding: 24px;">No appointments data available</p>';
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate for next 7 days (current week)
        const weekData = [];
        let totalAppointments = 0;
        let totalWorkMinutes = 0;
        let totalTravelMinutes = 0;
        let daysWithAppointments = 0;

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            date.setHours(0, 0, 0, 0);

            const dayEvents = this.state.events.filter(event => {
                const eventStart = new Date(event.start);
                const eventEnd = new Date(event.end);
                
                // Set day boundaries
                const dayStart = new Date(date);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(date);
                dayEnd.setHours(23, 59, 59, 999);
                
                // Check if event overlaps with this day (handles multi-day events)
                return eventEnd > dayStart && eventStart <= dayEnd;
            });

            // Filter work events (excluding ignored and all-day)
            const workEvents = dayEvents.filter(event => !event.ignored && !event.isAllDay);

            const dayMinutes = workEvents.reduce((sum, event) => {
                return sum + this.calculateEventDurationForDay(event, date);
            }, 0);

            // Calculate travel time for this day
            let dayTravelMinutes = 0;
            if (workEvents.length > 0) {
                // Travel to first appointment from home
                if (workEvents[0].location) dayTravelMinutes += 15;
                
                // Travel between consecutive appointments
                for (let j = 0; j < workEvents.length - 1; j++) {
                    if (workEvents[j].location && workEvents[j + 1].location) {
                        dayTravelMinutes += 15;
                    }
                }
                
                // Travel home from last appointment
                if (workEvents[workEvents.length - 1].location) dayTravelMinutes += 15;
            }

            totalAppointments += workEvents.length;
            totalWorkMinutes += dayMinutes;
            totalTravelMinutes += dayTravelMinutes;
            if (workEvents.length > 0) daysWithAppointments++;

            weekData.push({
                date,
                appointments: workEvents.length,
                workMinutes: dayMinutes,
                travelMinutes: dayTravelMinutes
            });
        }

        const workHours = Math.floor(totalWorkMinutes / 60);
        const workMinutes = Math.round(totalWorkMinutes % 60);
        const travelHours = Math.floor(totalTravelMinutes / 60);
        const travelMins = Math.round(totalTravelMinutes % 60);
        
        // Total hours including travel
        const totalCombinedMinutes = totalWorkMinutes + totalTravelMinutes;
        const totalHours = Math.floor(totalCombinedMinutes / 60);
        const totalMinutes = Math.round(totalCombinedMinutes % 60);
        
        const avgHoursPerDay = daysWithAppointments > 0 ? (totalCombinedMinutes / 60 / daysWithAppointments).toFixed(1) : 0;

        // Find busiest day (including travel)
        const busiestDay = weekData.reduce((max, day) => 
            (day.workMinutes + day.travelMinutes) > (max.workMinutes + max.travelMinutes) ? day : max
        , weekData[0]);

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const busiestDayName = dayNames[busiestDay.date.getDay()];
        const busiestHours = ((busiestDay.workMinutes + busiestDay.travelMinutes) / 60).toFixed(1);

        // Workload assessment (including travel time)
        const avgWeeklyHours = totalCombinedMinutes / 60;
        let workloadStatus = '';
        let workloadColor = '';
        if (avgWeeklyHours < 25) {
            workloadStatus = 'Light';
            workloadColor = 'var(--success-500)';
        } else if (avgWeeklyHours < 40) {
            workloadStatus = 'Comfortable';
            workloadColor = 'var(--primary-500)';
        } else if (avgWeeklyHours < 50) {
            workloadStatus = 'Busy';
            workloadColor = 'var(--warning-500)';
        } else {
            workloadStatus = 'High Risk';
            workloadColor = 'var(--danger-500)';
        }

        container.innerHTML = `
            <div class="insights-grid">
                <div class="insight-card">
                    <div class="insight-label">Total Appointments</div>
                    <div class="insight-value">${totalAppointments}</div>
                    <div class="insight-sublabel">${daysWithAppointments} working days</div>
                </div>
                <div class="insight-card">
                    <div class="insight-label">Work Hours</div>
                    <div class="insight-value">${workHours}h ${workMinutes}m</div>
                    <div class="insight-sublabel">Appointment time</div>
                </div>
                <div class="insight-card">
                    <div class="insight-label">Travel Hours</div>
                    <div class="insight-value">${travelHours}h ${travelMins}m</div>
                    <div class="insight-sublabel">To/from/between appointments</div>
                </div>
                <div class="insight-card">
                    <div class="insight-label">Total Hours</div>
                    <div class="insight-value">${totalHours}h ${totalMinutes}m</div>
                    <div class="insight-sublabel">${avgHoursPerDay}h avg per day</div>
                </div>
                <div class="insight-card">
                    <div class="insight-label">Busiest Day</div>
                    <div class="insight-value">${busiestDayName}</div>
                    <div class="insight-sublabel">${busiestHours}h total • ${busiestDay.appointments} appointments</div>
                </div>
                <div class="insight-card">
                    <div class="insight-label">Weekly Workload</div>
                    <div class="insight-value" style="color: ${workloadColor};">${workloadStatus}</div>
                    <div class="insight-sublabel">${avgWeeklyHours.toFixed(1)} / ${this.state.settings.thresholds.weekly.comfortable}h capacity</div>
                    <div class="progress-bar" style="margin-top: 8px;">
                        <div class="progress-fill" style="width: ${Math.min((avgWeeklyHours / this.state.settings.thresholds.weekly.comfortable * 100), 100)}%; background: ${workloadColor};"></div>
                    </div>
                </div>
            </div>
        `;
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
                const eventStart = new Date(event.start);
                const eventEnd = new Date(event.end);
                
                // Set day boundaries
                const dayStart = new Date(date);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(date);
                dayEnd.setHours(23, 59, 59, 999);
                
                // Check if event overlaps with this day (handles multi-day events)
                return eventEnd > dayStart && eventStart <= dayEnd;
            });

            const totalMinutes = dayEvents.reduce((sum, event) => {
                return sum + this.calculateEventDurationForDay(event, date);
            }, 0);

            nextWeek.push({
                date,
                hours: totalMinutes / 60,
                events: dayEvents.length
            });
        }

        let html = '';

        // Check for burnout risk
        const burnoutDays = nextWeek.filter(day => day.hours >= this.state.settings.thresholds.daily.burnout);
        if (burnoutDays.length > 0) {
            html += `
                <div class="recommendation-card danger">
                    <div class="recommendation-icon">⚠️</div>
                    <div class="recommendation-content">
                        <p><strong>Burnout Risk Detected:</strong> You have ${burnoutDays.length} day(s) this week with ${this.state.settings.thresholds.daily.burnout}+ hours. Consider declining new bookings or rescheduling if possible.</p>
                    </div>
                </div>
            `;
        }

        // Check for high workload
        const highWorkloadDays = nextWeek.filter(day =>
            day.hours >= this.state.settings.thresholds.daily.high && day.hours < this.state.settings.thresholds.daily.burnout
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
        const comfortableDays = nextWeek.filter(day => day.hours < this.state.settings.thresholds.daily.comfortable);
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

            const dayEvents = this.state.events.filter(event => {
                const eventStart = new Date(event.start);
                const eventEnd = new Date(event.end);
                
                // Set day boundaries
                const dayStart = new Date(dateKey);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(dateKey);
                dayEnd.setHours(23, 59, 59, 999);
                
                // Check if event overlaps with this day (handles multi-day events)
                return eventEnd > dayStart && eventStart <= dayEnd;
            });

            const workEvents = dayEvents.filter(event => !event.ignored && !event.isAllDay);
            
            // Check for housesits on this day
            const housesits = workEvents.filter(event => 
                event.type === 'overnight' || 
                event.title?.toLowerCase().includes('overnight') ||
                event.title?.toLowerCase().includes('housesit')
            );

            const workMinutes = workEvents.reduce((sum, event) => {
                return sum + this.calculateEventDurationForDay(event, dateKey);
            }, 0);

            // Calculate travel time
            let travelMinutes = 0;
            if (workEvents.length > 0) {
                // Travel to first appointment
                if (workEvents[0].location) travelMinutes += 15;
                
                // Travel between appointments
                for (let i = 0; i < workEvents.length - 1; i++) {
                    if (workEvents[i].location && workEvents[i + 1].location) {
                        travelMinutes += 15;
                    }
                }
                
                // Travel home
                if (workEvents[workEvents.length - 1].location) travelMinutes += 15;
            }

            const totalMinutes = workMinutes + travelMinutes;
            const hours = (totalMinutes / 60).toFixed(1);
            const workHours = (workMinutes / 60).toFixed(1);
            const travelHours = (travelMinutes / 60).toFixed(1);
            const workloadLevel = this.getWorkloadLevel(parseFloat(hours));

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
                        <div class="calendar-day-hours">${workHours}h work${travelMinutes > 0 ? ` + ${travelHours}h travel` : ''}${housesits.length > 0 ? ' <span style="color: #8B5CF6; font-size: 0.65rem; font-weight: 600;">+ housesit</span>' : ''}</div>
                        <div class="calendar-day-total" style="font-weight: 600; color: var(--primary-700);">${hours}h total</div>
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
                this.showDayDetails(new Date(dateStr));
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
     * Render list view (sequential events)
     */
    async renderListView(container) {
        // Get events for the current month
        const year = this.state.currentDate.getFullYear();
        const month = this.state.currentDate.getMonth();

        const monthStart = new Date(year, month, 1);
        monthStart.setHours(0, 0, 0, 0);

        const monthEnd = new Date(year, month + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);

        // Filter events for current month
        const monthEvents = this.state.events.filter(event => {
            const eventDate = new Date(event.start);
            return eventDate >= monthStart && eventDate <= monthEnd;
        });

        // Sort events by start time
        const sortedEvents = [...monthEvents].sort((a, b) => a.start - b.start);

        // Group events by day
        const eventsByDay = {};
        sortedEvents.forEach(event => {
            const dateKey = new Date(event.start);
            dateKey.setHours(0, 0, 0, 0);
            const key = dateKey.toISOString().split('T')[0];

            if (!eventsByDay[key]) {
                eventsByDay[key] = [];
            }
            eventsByDay[key].push(event);
        });

        // Calculate travel times for all consecutive appointments (if Maps API available)
        const travelTimes = new Map();
        const hasMapsApi = this.mapsApi && this.mapsApi.isLoaded;
        
        if (hasMapsApi || true) { // Always calculate, use estimates if no API
            for (const dateKey of Object.keys(eventsByDay)) {
                const dayEvents = eventsByDay[dateKey];
                for (let i = 0; i < dayEvents.length - 1; i++) {
                    const currentEvent = dayEvents[i];
                    const nextEvent = dayEvents[i + 1];
                    
                    if (currentEvent.location && nextEvent.location && !currentEvent.isAllDay && !nextEvent.isAllDay) {
                        if (hasMapsApi) {
                            try {
                                const travelInfo = await this.mapsApi.calculateDriveTime(
                                    currentEvent.location,
                                    nextEvent.location,
                                    new Date(currentEvent.end)
                                );
                                travelTimes.set(currentEvent.id, travelInfo);
                            } catch (error) {
                                console.warn(`Failed to calculate travel time:`, error);
                                // Fallback to estimate
                                travelTimes.set(currentEvent.id, {
                                    duration: { text: '15 mins', minutes: 15 },
                                    estimated: true
                                });
                            }
                        } else {
                            // Use default 15-minute estimate
                            travelTimes.set(currentEvent.id, {
                                duration: { text: '15 mins', minutes: 15 },
                                estimated: true
                            });
                        }
                    }
                }
            }
        }

        // If no events, show empty state
        if (Object.keys(eventsByDay).length === 0) {
            container.innerHTML = `
                <div class="calendar-list-empty">
                    <div class="calendar-list-empty-icon">📅</div>
                    <div class="calendar-list-empty-text">No appointments scheduled for this month</div>
                </div>
            `;
            return;
        }

        // Render list
        let html = '<div class="calendar-list">';

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];

        // Render each day
        Object.keys(eventsByDay).sort().forEach(dateKey => {
            const date = new Date(dateKey + 'T00:00:00');
            const dayEvents = eventsByDay[dateKey];

            const isToday = date.getTime() === today.getTime();

            // Calculate daily totals (excluding ignored and all-day events)
            const workEvents = dayEvents.filter(event => !event.ignored && !event.isAllDay);
            const workMinutes = workEvents.reduce((sum, event) => {
                return sum + (event.end - event.start) / (1000 * 60);
            }, 0);

            // Calculate travel time for the day
            let travelMinutes = 0;
            if (workEvents.length > 0) {
                // Travel to first appointment
                if (workEvents[0].location) travelMinutes += 15;
                
                // Travel between appointments
                for (let i = 0; i < workEvents.length - 1; i++) {
                    if (workEvents[i].location && workEvents[i + 1].location) {
                        travelMinutes += 15;
                    }
                }
                
                // Travel home
                if (workEvents[workEvents.length - 1].location) travelMinutes += 15;
            }

            const totalMinutes = workMinutes + travelMinutes;
            const hours = (totalMinutes / 60).toFixed(1);
            const workHours = (workMinutes / 60).toFixed(1);
            const travelHours = (travelMinutes / 60).toFixed(1);
            const workloadLevel = this.getWorkloadLevel(parseFloat(hours));
            const workloadLabel = this.getWorkloadLabel(workloadLevel);

            html += `
                <div class="calendar-list-day">
                    <div class="calendar-list-day-header ${isToday ? 'today' : ''}">
                        <div>
                            <div class="calendar-list-day-title ${isToday ? 'today' : ''}">
                                ${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}
                                ${isToday ? '<span style="margin-left: 8px; font-size: 0.75rem; background: var(--primary-600); color: white; padding: 2px 8px; border-radius: 4px;">Today</span>' : ''}
                            </div>
                        </div>
                        <div class="calendar-list-day-summary">
                            <span>${dayEvents.length} appointment${dayEvents.length !== 1 ? 's' : ''}</span>
                            <span>${workHours}h work + ${travelHours}h travel = ${hours}h total</span>
                            <span class="workload-badge ${workloadLevel}">${workloadLabel}</span>
                        </div>
                    </div>
                    <div class="calendar-list-events">
            `;

            // Render events for this day
            dayEvents.forEach(event => {
                const startTime = event.isAllDay ? 'All Day' : this.formatTime(event.start);
                const endTime = event.isAllDay ? '' : this.formatTime(event.end);
                const duration = event.isAllDay ? 'All Day' : `${Math.round((event.end - event.start) / (1000 * 60))} min`;

                // Get travel time to next event (if available)
                const travelInfo = travelTimes.get(event.id);

                html += `
                    <div class="calendar-list-event ${event.ignored ? 'event-ignored' : ''}">
                        <div class="calendar-list-event-time">
                            <div>${startTime}</div>
                            <div class="calendar-list-event-time-range">${duration}</div>
                            ${travelInfo ? `
                                <div style="font-size: 0.75rem; color: var(--info-600); margin-top: 4px;">
                                    🚗 ${travelInfo.duration.text}${travelInfo.estimated ? ' (est)' : ''}
                                </div>
                            ` : ''}
                        </div>
                        <div class="calendar-list-event-details">
                            <div class="calendar-list-event-title">
                                ${event.title}
                                ${event.calendarName ? `
                                    <span class="calendar-label" style="margin-left: 8px; font-size: 0.75rem; background: var(--primary-100); color: var(--primary-700); padding: 2px 8px; border-radius: 12px;">
                                        📅 ${event.calendarName}
                                    </span>
                                ` : ''}
                                ${event.ignored ? `
                                    <span style="margin-left: 8px; font-size: 0.75rem; background: var(--gray-200); color: var(--gray-600); padding: 2px 8px; border-radius: 12px;">
                                        Ignored
                                    </span>
                                ` : ''}
                            </div>
                            <div class="calendar-list-event-meta">
                                ${event.location ? `
                                    <span class="calendar-list-event-location">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                            <circle cx="12" cy="10" r="3"></circle>
                                        </svg>
                                        ${event.location}
                                    </span>
                                ` : ''}
                                ${event.client ? `
                                    <span class="calendar-list-event-client">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        ${event.client}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                        <div class="calendar-list-event-type">
                            ${!event.isAllDay ? `
                                <span class="event-type-badge ${event.type}">
                                    ${this.getEventTypeIcon(event.type)} ${this.getEventTypeLabel(event.type)}
                                </span>
                            ` : ''}
                            <button class="btn btn-sm ${event.ignored ? 'btn-outline' : 'btn-secondary'}" onclick="window.gpsApp.toggleEventIgnored('${event.id}')" style="margin-top: 4px;">
                                ${event.ignored ? '✓ Ignored' : 'Ignore'}
                            </button>
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Format time to 12-hour format
     */
    formatTime(date) {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes < 10 ? '0' + minutes : minutes;
        return `${displayHours}:${displayMinutes} ${ampm}`;
    }

    /**
     * Get event type icon
     */
    getEventTypeIcon(type) {
        const icons = {
            'overnight': '🌙',
            'dropin': '🏃',
            'walk': '🦮',
            'meet-greet': '👋',
            'other': '📅'
        };
        return icons[type] || icons['other'];
    }

    /**
     * Get event type label
     */
    getEventTypeLabel(type) {
        const labels = {
            'overnight': 'Overnight',
            'dropin': 'Drop-in',
            'walk': 'Dog Walk',
            'meet-greet': 'Meet & Greet',
            'other': 'Other'
        };
        return labels[type] || 'Other';
    }

    /**
     * Show day details modal
     */
    showDayDetails(date) {
        const dateKey = new Date(date);
        dateKey.setHours(0, 0, 0, 0);

        // Store selected date for "View in List" functionality
        this.selectedDate = new Date(dateKey);

        // Get events for this day
        const dayEvents = this.state.events.filter(event => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            
            // Set day boundaries
            const dayStart = new Date(dateKey);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dateKey);
            dayEnd.setHours(23, 59, 59, 999);
            
            // Check if event overlaps with this day (handles multi-day events)
            return eventEnd > dayStart && eventStart <= dayEnd;
        });

        // Sort events by start time
        const sortedEvents = dayEvents.sort((a, b) => a.start - b.start);

        // Update modal title
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isToday = dateKey.getTime() === today.getTime();

        const titleElement = document.getElementById('day-details-title');
        const subtitleElement = document.getElementById('day-details-subtitle');

        titleElement.textContent = `${dayNames[dateKey.getDay()]}, ${monthNames[dateKey.getMonth()]} ${dateKey.getDate()}`;
        if (isToday) {
            titleElement.textContent += ' (Today)';
        }

        // Calculate totals
        const workEvents = sortedEvents.filter(event => !event.ignored && !event.isAllDay);
        
        // Check for housesits
        const housesits = workEvents.filter(event => 
            event.type === 'overnight' || 
            event.title?.toLowerCase().includes('overnight') ||
            event.title?.toLowerCase().includes('housesit')
        );
        
        const workMinutes = workEvents.reduce((sum, event) => {
            return sum + this.calculateEventDurationForDay(event, dateKey);
        }, 0);
        
        // Calculate travel time
        let travelMinutes = 0;
        if (workEvents.length > 0) {
            // Travel to first appointment
            if (workEvents[0].location) travelMinutes += 15;
            
            // Travel between appointments
            for (let i = 0; i < workEvents.length - 1; i++) {
                if (workEvents[i].location && workEvents[i + 1].location) {
                    travelMinutes += 15;
                }
            }
            
            // Travel home
            if (workEvents[workEvents.length - 1].location) travelMinutes += 15;
        }
        
        const totalMinutes = workMinutes + travelMinutes;
        const workHours = (workMinutes / 60).toFixed(1);
        const travelHours = (travelMinutes / 60).toFixed(1);
        const totalHours = (totalMinutes / 60).toFixed(1);
        const workloadLevel = this.getWorkloadLevel(parseFloat(totalHours));
        const workloadLabel = this.getWorkloadLabel(workloadLevel);

        subtitleElement.innerHTML = `
            <span>${sortedEvents.length} appointment${sortedEvents.length !== 1 ? 's' : ''}</span> •
            <span>${workHours}h work</span> •
            <span>${travelHours}h travel</span> •
            <span>${totalHours}h total</span>
            ${housesits.length > 0 ? ' • <span style="color: #8B5CF6; font-weight: 600;">+ housesit</span>' : ''} •
            <span class="workload-badge ${workloadLevel}">${workloadLabel}</span>
        `;

        // Render events
        this.renderDayDetailsEvents(sortedEvents);

        // Show modal
        const modal = document.getElementById('day-details-modal');
        modal.classList.add('active');
    }

    /**
     * Render events in day details modal
     */
    async renderDayDetailsEvents(events) {
        const container = document.getElementById('day-details-content');

        if (events.length === 0) {
            container.innerHTML = `
                <div class="day-details-empty">
                    <div class="day-details-empty-icon">📅</div>
                    <div>No appointments scheduled for this day</div>
                </div>
            `;
            return;
        }

        // Calculate travel times between consecutive appointments
        const travelTimes = new Map();
        const hasMapsApi = this.mapsApi && this.mapsApi.isLoaded;
        
        for (let i = 0; i < events.length - 1; i++) {
            const currentEvent = events[i];
            const nextEvent = events[i + 1];
            
            if (currentEvent.location && nextEvent.location && !currentEvent.isAllDay && !nextEvent.isAllDay) {
                if (hasMapsApi) {
                    // Use real Google Maps API
                    try {
                        const travelInfo = await this.mapsApi.calculateDriveTime(
                            currentEvent.location,
                            nextEvent.location,
                            new Date(currentEvent.end)
                        );
                        travelTimes.set(currentEvent.id, travelInfo);
                    } catch (error) {
                        console.warn(`Failed to calculate travel time between appointments:`, error);
                        // Fallback to estimated time
                        travelTimes.set(currentEvent.id, {
                            duration: { text: '15 mins', minutes: 15 },
                            distance: { text: 'Est.', miles: '~' },
                            estimated: true
                        });
                    }
                } else {
                    // Use default 15-minute estimate
                    travelTimes.set(currentEvent.id, {
                        duration: { text: '15 mins', minutes: 15 },
                        distance: { text: 'Est.', miles: '~' },
                        estimated: true
                    });
                }
            }
        }

        let html = '<div class="day-details-events">';

        events.forEach((event, index) => {
            const startTime = event.isAllDay ? 'All Day' : this.formatTime(event.start);
            const endTime = event.isAllDay ? '' : this.formatTime(event.end);
            
            // Calculate duration for this specific day (handles multi-day events properly)
            const dateKey = this.selectedDate || new Date(event.start);
            dateKey.setHours(0, 0, 0, 0);
            const durationMinutes = event.isAllDay ? 0 : this.calculateEventDurationForDay(event, dateKey);
            const duration = event.isAllDay ? 'All Day' : `${Math.round(durationMinutes)} min`;

            // Get travel time to this event (if available)
            const travelInfo = travelTimes.get(event.id);

            html += `
                <div class="day-details-event ${event.ignored ? 'event-ignored' : ''}">
                    <div class="day-details-event-header">
                        <div class="day-details-event-title">
                            ${event.title}
                            ${event.calendarName ? `
                                <span class="calendar-label" style="margin-left: 8px; font-size: 0.75rem; background: var(--primary-100); color: var(--primary-700); padding: 2px 8px; border-radius: 12px;">
                                    📅 ${event.calendarName}
                                </span>
                            ` : ''}
                        </div>
                        <div class="day-details-event-time">${startTime}${endTime ? ' - ' + endTime : ''}</div>
                    </div>
                    <div class="day-details-event-meta">
                        ${!event.isAllDay ? `
                            <span class="event-type-badge ${event.type}">
                                ${this.getEventTypeIcon(event.type)} ${this.getEventTypeLabel(event.type)}
                            </span>
                        ` : ''}
                        <span>${duration}</span>
                        ${event.location ? `
                            <span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                ${event.location}
                            </span>
                        ` : ''}
                        ${event.client ? `
                            <span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                ${event.client}
                            </span>
                        ` : ''}
                        <button class="btn btn-sm ${event.ignored ? 'btn-outline' : 'btn-secondary'}" onclick="window.gpsApp.toggleEventIgnored('${event.id}')" style="margin-left: auto;">
                            ${event.ignored ? '✓ Ignored' : 'Ignore from Workload'}
                        </button>
                    </div>
                    ${event.notes ? `
                        <div style="margin-top: var(--spacing-sm); padding-top: var(--spacing-sm); border-top: 1px solid var(--gray-200); font-size: 0.875rem; color: var(--gray-600);">
                            ${event.notes}
                        </div>
                    ` : ''}
                    ${travelInfo ? `
                        <div class="travel-time-info" style="margin-top: var(--spacing-sm); padding: var(--spacing-sm); background: var(--info-50); border-left: 3px solid var(--info-500); border-radius: var(--radius); font-size: 0.875rem;">
                            <div style="display: flex; align-items: center; gap: 8px; color: var(--info-700);">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                                </svg>
                                <strong>Travel to next appointment:</strong> 
                                ${travelInfo.duration.text}${travelInfo.distance.miles !== '~' ? ` (${travelInfo.distance.miles} miles)` : ''}
                                ${travelInfo.estimated ? ' <span style="font-size: 0.75rem; opacity: 0.8;">(estimated)</span>' : ''}
                                ${travelInfo.durationInTraffic && !travelInfo.estimated ? ` • With traffic: ${travelInfo.durationInTraffic.text}` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * View selected date in list view
     */
    viewDateInList() {
        if (!this.selectedDate) return;

        // Set the current date to the selected date's month
        this.state.currentDate = new Date(this.selectedDate);

        // Switch to list view
        this.state.calendarView = 'list';

        // Update view toggle buttons
        document.querySelectorAll('[data-calendar-view]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.calendarView === 'list');
        });

        // Switch to calendar view
        this.switchView('calendar');

        // Close the modal
        const modal = document.getElementById('day-details-modal');
        modal.classList.remove('active');

        // Small delay to ensure DOM is rendered, then scroll to the date
        setTimeout(() => {
            const dateKey = this.selectedDate.toISOString().split('T')[0];
            const dayElements = document.querySelectorAll('.calendar-list-day');

            dayElements.forEach(dayElement => {
                const header = dayElement.querySelector('.calendar-list-day-header');
                if (header && header.textContent.includes(this.selectedDate.getDate())) {
                    dayElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Highlight the day briefly
                    dayElement.style.transition = 'box-shadow 0.3s ease';
                    dayElement.style.boxShadow = '0 0 0 3px var(--primary-300)';
                    setTimeout(() => {
                        dayElement.style.boxShadow = '';
                    }, 2000);
                }
            });
        }, 100);
    }

    /**
     * Navigate calendar
     */
    navigateCalendar(direction) {
        const current = this.state.currentDate;

        switch (this.state.calendarView) {
            case 'month':
            case 'list':
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
        if (!container || !this.templatesManager) return;

        const templates = this.templatesManager.getAllTemplates();

        if (templates.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 48px; color: var(--text-muted);">
                    <p>No templates yet.</p>
                    <p>Click "Create Template" to get started!</p>
                </div>
            `;
            return;
        }

        const isManaging = this.state.isManagingTemplates;
        let html = '';

        templates.forEach(template => {
            const hours = Math.floor(template.duration / 60);
            const minutes = template.duration % 60;
            const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

            const canDelete = !template.isDefault;

            html += `
                <div class="template-card ${isManaging ? 'manage-mode' : ''}" data-template-id="${template.id}">
                    ${isManaging && canDelete ? '<div class="template-delete-overlay"><span class="delete-hint">Click delete button below to remove</span></div>' : ''}
                    <div class="template-header">
                        <div class="template-icon">${template.icon}</div>
                        <div class="template-info">
                            <div class="template-name">${template.name}${template.isDefault ? ' <span style="font-size: 10px; color: var(--text-muted);">(Default)</span>' : ''}</div>
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
                    <div class="template-actions ${isManaging ? 'manage-mode' : ''}">
                        ${!isManaging ? `
                            <button class="btn btn-primary btn-sm" onclick="window.gpsApp.useTemplate('${template.id}')">Use Template</button>
                            <button class="btn btn-secondary btn-sm" onclick="window.gpsApp.showTemplateModal('${template.id}')">Edit</button>
                        ` : ''}
                        ${isManaging && canDelete ? `
                            <button class="btn btn-danger btn-sm" onclick="window.gpsApp.deleteTemplate('${template.id}')" style="width: 100%;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px; vertical-align: middle;">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                                Delete Template
                            </button>
                        ` : ''}
                        ${isManaging && !canDelete ? `
                            <div style="text-align: center; padding: var(--spacing-md); color: var(--gray-500); font-size: 0.875rem;">
                                Default templates cannot be deleted
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    /**
     * Show template modal for creating/editing
     */
    showTemplateModal(templateId = null) {
        if (!this.templatesManager) return;

        const modal = document.getElementById('template-modal');
        const title = document.getElementById('template-modal-title');
        const form = document.getElementById('template-form');

        // Reset form
        form.reset();

        if (templateId) {
            // Edit mode
            const template = this.templatesManager.getTemplateById(templateId);
            if (!template) return;

            // Don't allow editing default templates
            if (template.isDefault) {
                this.showToast('Default templates cannot be edited. Use "Duplicate" to create a customized version.', 'info');
                return;
            }

            title.textContent = 'Edit Template';
            document.getElementById('template-name').value = template.name;
            document.getElementById('template-icon').value = template.icon;
            document.getElementById('template-type').value = template.type;
            document.getElementById('template-hours').value = Math.floor(template.duration / 60);
            document.getElementById('template-minutes').value = template.duration % 60;
            document.getElementById('template-include-travel').checked = template.includeTravel;

            // Store template ID for editing
            modal.dataset.editingId = templateId;
        } else {
            // Create mode
            title.textContent = 'Create Template';
            document.getElementById('template-hours').value = 0;
            document.getElementById('template-minutes').value = 30;
            document.getElementById('template-include-travel').checked = true;
            delete modal.dataset.editingId;
        }

        modal.classList.add('active');
    }

    /**
     * Save template (create or update)
     */
    saveTemplate() {
        if (!this.templatesManager) return;

        const modal = document.getElementById('template-modal');
        const editingId = modal.dataset.editingId;

        // Get form values
        const name = document.getElementById('template-name').value.trim();
        const icon = document.getElementById('template-icon').value.trim();
        const type = document.getElementById('template-type').value;
        const hours = parseInt(document.getElementById('template-hours').value) || 0;
        const minutes = parseInt(document.getElementById('template-minutes').value) || 0;
        const includeTravel = document.getElementById('template-include-travel').checked;

        const duration = (hours * 60) + minutes;

        // Validate using TemplatesManager
        const validation = this.templatesManager.validateTemplate({
            name,
            duration,
            travelBuffer: 0
        });

        if (!validation.valid) {
            alert(validation.errors.join('\n'));
            return;
        }

        try {
            if (editingId) {
                // Update existing template
                this.templatesManager.updateTemplate(editingId, {
                    name,
                    icon: icon || '📋',
                    type,
                    duration,
                    includeTravel
                });
                this.showToast('Template updated!', 'success');
            } else {
                // Create new template
                this.templatesManager.createTemplate({
                    name,
                    icon: icon || '📋',
                    type,
                    duration,
                    includeTravel
                });
                this.showToast('Template created!', 'success');
            }

            // Close modal and re-render
            modal.classList.remove('active');
            this.renderTemplates();

        } catch (error) {
            console.error('Error saving template:', error);
            this.showToast(error.message, 'error');
        }
    }

    /**
     * Delete template
     */
    deleteTemplate(templateId) {
        if (!this.templatesManager) return;

        if (!confirm('Are you sure you want to delete this template?')) {
            return;
        }

        try {
            this.templatesManager.deleteTemplate(templateId);
            this.renderTemplates();
            this.showToast('Template deleted', 'success');
        } catch (error) {
            console.error('Error deleting template:', error);
            this.showToast(error.message, 'error');
        }
    }

    /**
     * Use template to create appointment
     */
    /**
     * Use template to create appointment
     */
    useTemplate(templateId) {
        if (!this.templatesManager) return;

        const template = this.templatesManager.getTemplateById(templateId);
        if (!template) {
            this.showToast('Template not found', 'error');
            return;
        }

        // Open appointment modal with template pre-selected
        this.showAppointmentModal(templateId);
    }

    /**
     * Toggle template management mode
     */
    toggleManageTemplatesMode() {
        this.state.isManagingTemplates = !this.state.isManagingTemplates;
        
        // Update button appearance
        const btn = document.getElementById('manage-templates-btn');
        if (btn) {
            if (this.state.isManagingTemplates) {
                btn.classList.remove('btn-secondary');
                btn.classList.add('btn-danger');
                btn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Done Managing
                `;
            } else {
                btn.classList.remove('btn-danger');
                btn.classList.add('btn-secondary');
                btn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Manage Templates
                `;
            }
        }
        
        // Re-render templates
        this.renderTemplates();
        
        // Show toast
        if (this.state.isManagingTemplates) {
            this.showToast('Management mode enabled. You can now delete templates.', 'info');
        }
    }

    /**
     * Render settings view
     */
    renderSettings() {
        // Check if API credentials are configured in config file
        const hasConfigFileCredentials = window.GPSConfig && 
            (window.GPSConfig.calendar?.clientId || window.GPSConfig.maps?.apiKey);
        
        // Hide/show API Configuration section based on config file
        const apiConfigSection = document.getElementById('api-config-section');
        if (apiConfigSection) {
            if (hasConfigFileCredentials) {
                apiConfigSection.style.display = 'none';
            } else {
                apiConfigSection.style.display = 'block';
            }
        }
        
        // Populate API settings
        document.getElementById('calendar-client-id').value = this.state.settings.api.calendarClientId || '';
        document.getElementById('maps-api-key').value = this.state.settings.api.mapsApiKey || '';
        document.getElementById('home-address').value = this.state.settings.homeAddress || '';
        document.getElementById('include-travel-time').checked = this.state.settings.includeTravelTime !== false;

        // Populate daily workload thresholds
        document.getElementById('threshold-daily-comfortable').value = this.state.settings.thresholds.daily.comfortable;
        document.getElementById('threshold-daily-busy').value = this.state.settings.thresholds.daily.busy;
        document.getElementById('threshold-daily-overload').value = this.state.settings.thresholds.daily.high;
        document.getElementById('threshold-daily-burnout').value = this.state.settings.thresholds.daily.burnout;

        // Populate weekly workload thresholds
        document.getElementById('threshold-weekly-comfortable').value = this.state.settings.thresholds.weekly.comfortable;
        document.getElementById('threshold-weekly-busy').value = this.state.settings.thresholds.weekly.busy;
        document.getElementById('threshold-weekly-overload').value = this.state.settings.thresholds.weekly.high;
        document.getElementById('threshold-weekly-burnout').value = this.state.settings.thresholds.weekly.burnout;

        // Populate monthly workload thresholds
        document.getElementById('threshold-monthly-comfortable').value = this.state.settings.thresholds.monthly.comfortable;
        document.getElementById('threshold-monthly-busy').value = this.state.settings.thresholds.monthly.busy;
        document.getElementById('threshold-monthly-overload').value = this.state.settings.thresholds.monthly.high;
        document.getElementById('threshold-monthly-burnout').value = this.state.settings.thresholds.monthly.burnout;

        // Update threshold preview
        this.updateThresholdPreview();

        // Add input event listeners for live preview update
        const thresholdInputs = [
            'threshold-daily-comfortable', 'threshold-daily-busy', 'threshold-daily-overload', 'threshold-daily-burnout',
            'threshold-weekly-comfortable', 'threshold-weekly-busy', 'threshold-weekly-overload', 'threshold-weekly-burnout',
            'threshold-monthly-comfortable', 'threshold-monthly-busy', 'threshold-monthly-overload', 'threshold-monthly-burnout'
        ];

        thresholdInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                // Remove existing listener if any
                input.removeEventListener('input', this.updateThresholdPreview.bind(this));
                // Add new listener
                input.addEventListener('input', () => this.updateThresholdPreview());
            }
        });

        // Render calendar selection
        this.renderCalendarSelection();
    }

    /**
     * Update threshold preview
     */
    updateThresholdPreview() {
        // Get daily thresholds
        const dailyComfortable = parseFloat(document.getElementById('threshold-daily-comfortable')?.value || 6);
        const dailyBusy = parseFloat(document.getElementById('threshold-daily-busy')?.value || 8);
        const dailyHigh = parseFloat(document.getElementById('threshold-daily-overload')?.value || 10);

        // Update daily preview text
        const previewDailyComfortable = document.getElementById('preview-daily-comfortable');
        const previewDailyBusyStart = document.getElementById('preview-daily-busy-start');
        const previewDailyBusy = document.getElementById('preview-daily-busy');
        const previewDailyHighStart = document.getElementById('preview-daily-high-start');
        const previewDailyHigh = document.getElementById('preview-daily-high');
        const previewDailyBurnoutStart = document.getElementById('preview-daily-burnout-start');

        if (previewDailyComfortable) previewDailyComfortable.textContent = dailyComfortable;
        if (previewDailyBusyStart) previewDailyBusyStart.textContent = dailyComfortable;
        if (previewDailyBusy) previewDailyBusy.textContent = dailyBusy;
        if (previewDailyHighStart) previewDailyHighStart.textContent = dailyBusy;
        if (previewDailyHigh) previewDailyHigh.textContent = dailyHigh;
        if (previewDailyBurnoutStart) previewDailyBurnoutStart.textContent = dailyHigh;

        // Get weekly thresholds
        const weeklyComfortable = parseFloat(document.getElementById('threshold-weekly-comfortable')?.value || 35);
        const weeklyBusy = parseFloat(document.getElementById('threshold-weekly-busy')?.value || 45);
        const weeklyHigh = parseFloat(document.getElementById('threshold-weekly-overload')?.value || 55);

        // Update weekly preview text
        const previewWeeklyComfortable = document.getElementById('preview-weekly-comfortable');
        const previewWeeklyBusyStart = document.getElementById('preview-weekly-busy-start');
        const previewWeeklyBusy = document.getElementById('preview-weekly-busy');
        const previewWeeklyHighStart = document.getElementById('preview-weekly-high-start');
        const previewWeeklyHigh = document.getElementById('preview-weekly-high');
        const previewWeeklyBurnoutStart = document.getElementById('preview-weekly-burnout-start');

        if (previewWeeklyComfortable) previewWeeklyComfortable.textContent = weeklyComfortable;
        if (previewWeeklyBusyStart) previewWeeklyBusyStart.textContent = weeklyComfortable;
        if (previewWeeklyBusy) previewWeeklyBusy.textContent = weeklyBusy;
        if (previewWeeklyHighStart) previewWeeklyHighStart.textContent = weeklyBusy;
        if (previewWeeklyHigh) previewWeeklyHigh.textContent = weeklyHigh;
        if (previewWeeklyBurnoutStart) previewWeeklyBurnoutStart.textContent = weeklyHigh;

        // Get monthly thresholds
        const monthlyComfortable = parseFloat(document.getElementById('threshold-monthly-comfortable')?.value || 140);
        const monthlyBusy = parseFloat(document.getElementById('threshold-monthly-busy')?.value || 180);
        const monthlyHigh = parseFloat(document.getElementById('threshold-monthly-overload')?.value || 220);

        // Update monthly preview text
        const previewMonthlyComfortable = document.getElementById('preview-monthly-comfortable');
        const previewMonthlyBusyStart = document.getElementById('preview-monthly-busy-start');
        const previewMonthlyBusy = document.getElementById('preview-monthly-busy');
        const previewMonthlyHighStart = document.getElementById('preview-monthly-high-start');
        const previewMonthlyHigh = document.getElementById('preview-monthly-high');
        const previewMonthlyBurnoutStart = document.getElementById('preview-monthly-burnout-start');

        if (previewMonthlyComfortable) previewMonthlyComfortable.textContent = monthlyComfortable;
        if (previewMonthlyBusyStart) previewMonthlyBusyStart.textContent = monthlyComfortable;
        if (previewMonthlyBusy) previewMonthlyBusy.textContent = monthlyBusy;
        if (previewMonthlyHighStart) previewMonthlyHighStart.textContent = monthlyBusy;
        if (previewMonthlyHigh) previewMonthlyHigh.textContent = monthlyHigh;
        if (previewMonthlyBurnoutStart) previewMonthlyBurnoutStart.textContent = monthlyHigh;
    }

    /**
     * Render calendar selection UI
     */
    renderCalendarSelection() {
        const calendarList = document.getElementById('calendar-list');
        if (!calendarList) return;

        // If not authenticated, show message
        if (!this.state.isAuthenticated || this.state.availableCalendars.length === 0) {
            calendarList.innerHTML = `
                <p class="text-muted">
                    ${this.state.isAuthenticated 
                        ? 'Loading calendars...' 
                        : 'Connect your Google Calendar to select calendars'}
                </p>
            `;
            return;
        }

        // Render calendar checkboxes
        calendarList.innerHTML = `
            <div class="calendar-selection-list">
                ${this.state.availableCalendars.map(calendar => `
                    <label class="calendar-selection-item">
                        <input 
                            type="checkbox" 
                            value="${calendar.id}"
                            ${this.state.selectedCalendars.includes(calendar.id) ? 'checked' : ''}
                            onchange="window.gpsApp.toggleCalendarSelection('${calendar.id}')"
                        >
                        <div class="calendar-info">
                            <div class="calendar-name">
                                ${calendar.name}
                                ${calendar.primary ? '<span class="badge badge-primary">Primary</span>' : ''}
                            </div>
                            ${calendar.description ? `<div class="calendar-description">${calendar.description}</div>` : ''}
                        </div>
                        <div class="calendar-color" style="background-color: ${calendar.backgroundColor || '#3b82f6'}"></div>
                    </label>
                `).join('')}
            </div>
            <div style="margin-top: 1rem;">
                <button onclick="window.gpsApp.saveCalendarSelection()" class="btn btn-primary">
                    Save Calendar Selection
                </button>
                <button onclick="window.gpsApp.refreshCalendarList()" class="btn btn-secondary">
                    Refresh List
                </button>
            </div>
        `;
    }

    /**
     * Toggle calendar selection
     */
    toggleCalendarSelection(calendarId) {
        const index = this.state.selectedCalendars.indexOf(calendarId);
        if (index > -1) {
            this.state.selectedCalendars.splice(index, 1);
        } else {
            this.state.selectedCalendars.push(calendarId);
        }
    }

    /**
     * Save calendar selection and reload events
     */
    async saveCalendarSelection() {
        if (this.state.selectedCalendars.length === 0) {
            alert('Please select at least one calendar.');
            return;
        }

        this.saveSettings();
        alert('Calendar selection saved! Reloading events...');

        // Reload events from selected calendars
        await this.loadCalendarEvents();
        
        // Re-render views
        this.renderDashboard();
        this.updateWorkloadIndicator();
    }

    /**
     * Refresh calendar list from Google
     */
    async refreshCalendarList() {
        if (!this.calendarAPI || !this.state.isAuthenticated) {
            alert('Please connect to Google Calendar first.');
            return;
        }

        try {
            console.log('🔄 Refreshing calendar list...');
            const calendars = await this.calendarAPI.listCalendars();
            this.state.availableCalendars = calendars;
            console.log(`✅ Found ${calendars.length} calendars`);
            
            this.renderCalendarSelection();
        } catch (error) {
            console.error('Error refreshing calendar list:', error);
            alert('Failed to refresh calendar list.\n\nError: ' + (error.message || 'Unknown error'));
        }
    }

    /**
     * Save API settings
     */
    saveApiSettings() {
        this.state.settings.api.calendarClientId = document.getElementById('calendar-client-id').value;
        this.state.settings.api.mapsApiKey = document.getElementById('maps-api-key').value;
        this.state.settings.homeAddress = document.getElementById('home-address').value;
        this.state.settings.includeTravelTime = document.getElementById('include-travel-time').checked;

        // Initialize Maps API if key was just added
        if (this.state.settings.api.mapsApiKey && !this.mapsAPI) {
            this.initMapsAPI();
        }

        this.saveSettings();
        alert('✅ API settings saved successfully!');
    }

    /**
     * Save workload settings
     */
    async saveWorkloadSettings() {
        // Get daily thresholds
        const dailyComfortable = parseFloat(document.getElementById('threshold-daily-comfortable').value);
        const dailyBusy = parseFloat(document.getElementById('threshold-daily-busy').value);
        const dailyHigh = parseFloat(document.getElementById('threshold-daily-overload').value);
        const dailyBurnout = parseFloat(document.getElementById('threshold-daily-burnout').value);

        // Get weekly thresholds
        const weeklyComfortable = parseFloat(document.getElementById('threshold-weekly-comfortable').value);
        const weeklyBusy = parseFloat(document.getElementById('threshold-weekly-busy').value);
        const weeklyHigh = parseFloat(document.getElementById('threshold-weekly-overload').value);
        const weeklyBurnout = parseFloat(document.getElementById('threshold-weekly-burnout').value);

        // Get monthly thresholds
        const monthlyComfortable = parseFloat(document.getElementById('threshold-monthly-comfortable').value);
        const monthlyBusy = parseFloat(document.getElementById('threshold-monthly-busy').value);
        const monthlyHigh = parseFloat(document.getElementById('threshold-monthly-overload').value);
        const monthlyBurnout = parseFloat(document.getElementById('threshold-monthly-burnout').value);

        // Validate daily thresholds are in increasing order
        if (dailyComfortable >= dailyBusy) {
            alert('⚠️ Validation Error:\n\nDaily Busy threshold must be higher than Daily Comfortable threshold.');
            return;
        }
        if (dailyBusy >= dailyHigh) {
            alert('⚠️ Validation Error:\n\nDaily High Workload threshold must be higher than Daily Busy threshold.');
            return;
        }
        if (dailyHigh >= dailyBurnout) {
            alert('⚠️ Validation Error:\n\nDaily Burnout Risk threshold must be higher than Daily High Workload threshold.');
            return;
        }

        // Validate weekly thresholds are in increasing order
        if (weeklyComfortable >= weeklyBusy) {
            alert('⚠️ Validation Error:\n\nWeekly Busy threshold must be higher than Weekly Comfortable threshold.');
            return;
        }
        if (weeklyBusy >= weeklyHigh) {
            alert('⚠️ Validation Error:\n\nWeekly High Workload threshold must be higher than Weekly Busy threshold.');
            return;
        }
        if (weeklyHigh >= weeklyBurnout) {
            alert('⚠️ Validation Error:\n\nWeekly Burnout Risk threshold must be higher than Weekly High Workload threshold.');
            return;
        }

        // Validate monthly thresholds are in increasing order
        if (monthlyComfortable >= monthlyBusy) {
            alert('⚠️ Validation Error:\n\nMonthly Busy threshold must be higher than Monthly Comfortable threshold.');
            return;
        }
        if (monthlyBusy >= monthlyHigh) {
            alert('⚠️ Validation Error:\n\nMonthly High Workload threshold must be higher than Monthly Busy threshold.');
            return;
        }
        if (monthlyHigh >= monthlyBurnout) {
            alert('⚠️ Validation Error:\n\nMonthly Burnout Risk threshold must be higher than Monthly High Workload threshold.');
            return;
        }

        // Validate reasonable values
        if (dailyComfortable < 1 || dailyBurnout > 24) {
            alert('⚠️ Validation Error:\n\nDaily thresholds must be between 1 and 24 hours.');
            return;
        }
        if (weeklyComfortable < 1 || weeklyBurnout > 168) {
            alert('⚠️ Validation Error:\n\nWeekly thresholds must be between 1 and 168 hours (7 days × 24 hours).');
            return;
        }
        if (monthlyComfortable < 1 || monthlyBurnout > 744) {
            alert('⚠️ Validation Error:\n\nMonthly thresholds must be between 1 and 744 hours (31 days × 24 hours).');
            return;
        }

        // Save validated thresholds
        this.state.settings.thresholds.daily.comfortable = dailyComfortable;
        this.state.settings.thresholds.daily.busy = dailyBusy;
        this.state.settings.thresholds.daily.high = dailyHigh;
        this.state.settings.thresholds.daily.burnout = dailyBurnout;

        this.state.settings.thresholds.weekly.comfortable = weeklyComfortable;
        this.state.settings.thresholds.weekly.busy = weeklyBusy;
        this.state.settings.thresholds.weekly.high = weeklyHigh;
        this.state.settings.thresholds.weekly.burnout = weeklyBurnout;

        this.state.settings.thresholds.monthly.comfortable = monthlyComfortable;
        this.state.settings.thresholds.monthly.busy = monthlyBusy;
        this.state.settings.thresholds.monthly.high = monthlyHigh;
        this.state.settings.thresholds.monthly.burnout = monthlyBurnout;

        this.saveSettings();

        // Update analyzer if it exists
        if (this.workloadAnalyzer) {
            this.workloadAnalyzer.updateThresholds(this.state.settings.thresholds);
        }

        // Re-render views with new thresholds
        await this.renderDashboard();
        await this.updateWorkloadIndicator();

        alert('✅ Workload thresholds saved successfully!\n\nYour dashboard and calendar will now use the new thresholds.');
    }

    /**
     * Get workload level based on hours
     * @param {number} hours - Hours worked
     * @param {string} period - 'daily', 'weekly', or 'monthly'
     */
    getWorkloadLevel(hours, period = 'daily') {
        const thresholds = this.state.settings.thresholds[period];
        const { comfortable, busy, high, burnout } = thresholds;

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
    async updateWorkloadIndicator() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayEvents = this.state.events.filter(event => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            
            // Set day boundaries
            const dayStart = new Date(today);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(today);
            dayEnd.setHours(23, 59, 59, 999);
            
            // Check if event overlaps with this day (handles multi-day events)
            return eventEnd > dayStart && eventStart <= dayEnd;
        });

        // Filter out ignored events and all-day events for workload calculations
        const workEvents = todayEvents.filter(event => !event.ignored && !event.isAllDay);

        const totalMinutes = workEvents.reduce((sum, event) => {
            return sum + this.calculateEventDurationForDay(event, today);
        }, 0);

        // Calculate travel time
        const travelMinutes = await this.calculateDailyTravelTime(today);

        // Total workload includes travel time if enabled
        const totalWorkloadMinutes = this.state.settings.includeTravelTime
            ? totalMinutes + travelMinutes
            : totalMinutes;

        const hours = totalWorkloadMinutes / 60;
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
    async handleCalendarConnect() {
        const clientId = this.state.settings.api.calendarClientId;

        if (!clientId || clientId === '' || clientId === 'YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com') {
            alert('Please configure your Google Calendar OAuth Client ID first.\n\n' +
                  '1. Go to Settings\n' +
                  '2. Enter your OAuth Client ID\n' +
                  '3. Save settings\n\n' +
                  'Or edit config.local.js with your credentials.');
            this.switchView('settings');
            return;
        }

        try {
            // Initialize Calendar API if not already done or not fully initialized
            if (!this.calendarAPI || !this.calendarAPI.gapiInited || !this.calendarAPI.gisInited) {
                console.log('🔧 Initializing Calendar API...');
                this.calendarAPI = new CalendarAPI(clientId);
                const initialized = await this.calendarAPI.init();

                if (!initialized) {
                    throw new Error('Failed to initialize Calendar API - check console for details');
                }
            } else {
                console.log('✅ Calendar API already initialized');
            }

            // Authenticate user
            const response = await this.calendarAPI.authenticate();

            if (response) {
                this.state.isAuthenticated = true;
                this.state.useMockData = false;

                // Fetch available calendars
                console.log('📅 Fetching calendar list...');
                const calendars = await this.calendarAPI.listCalendars();
                this.state.availableCalendars = calendars;
                console.log(`✅ Found ${calendars.length} calendars`);

                alert('✅ Successfully connected to Google Calendar!\n\nLoading your events...');

                // Fetch real events from selected calendars
                await this.loadCalendarEvents();

                // Re-render views
                this.renderDashboard();
                this.updateWorkloadIndicator();

                // Update calendar selection in settings if we're on that view
                if (this.state.currentView === 'settings') {
                    this.renderCalendarSelection();
                }

                // Update button text
                this.updateConnectButtonState();

                // Save settings to persist connection
                this.saveSettings();
            }
        } catch (error) {
            console.error('Calendar connection error:', error);
            alert('Failed to connect to Google Calendar.\n\n' +
                  'Error: ' + (error.message || 'Unknown error') + '\n\n' +
                  'Please check:\n' +
                  '1. Your Client ID is correct\n' +
                  '2. You authorized the app in the OAuth popup\n' +
                  '3. Your browser allows popups from this site');
        }
    }

    /**
     * Load events from Google Calendar
     */
    async loadCalendarEvents() {
        if (!this.calendarAPI || !this.state.isAuthenticated) {
            console.warn('Calendar API not initialized or not authenticated');
            return;
        }

        try {
            console.log('📅 Fetching calendar events...');

            // Get start and end dates for current view
            const now = new Date();
            const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);

            // Fetch events from all selected calendars
            const allEvents = [];
            for (const calendarId of this.state.selectedCalendars) {
                try {
                    // Find calendar name
                    const calendar = this.state.availableCalendars.find(cal => cal.id === calendarId);
                    const calendarName = calendar ? calendar.name : calendarId;

                    console.log(`📅 Fetching from calendar: ${calendarName}`);
                    const events = await this.calendarAPI.fetchEvents(calendarId, startDate, endDate, calendarName);

                    // Load ignored events from localStorage
                    const ignoredEvents = this.getIgnoredEvents();
                    events.forEach(event => {
                        event.ignored = ignoredEvents.includes(event.id) ||
                                       this.isEventIgnoredByPattern(event);
                    });

                    allEvents.push(...events);
                } catch (error) {
                    console.error(`Failed to fetch from calendar ${calendarId}:`, error);
                    // Continue with other calendars even if one fails
                }
            }

            // Sort events by start time
            allEvents.sort((a, b) => a.start - b.start);

            this.state.events = allEvents;
            console.log(`✅ Loaded ${allEvents.length} events from ${this.state.selectedCalendars.length} calendar(s)`);

        } catch (error) {
            console.error('Error loading calendar events:', error);
            alert('Failed to load calendar events.\n\nError: ' + (error.message || 'Unknown error'));
        }
    }

    /**
     * Show appointment modal
     */
    /**
     * Show appointment modal
     * @param {string} templateId - Optional template ID to pre-fill form
     * @param {Date} date - Optional date to pre-fill
     */
    showAppointmentModal(templateId = null, date = null) {
        const modal = document.getElementById('appointment-modal');

        // Populate template dropdown
        this.populateTemplateDropdown();

        // Reset form
        document.getElementById('appointment-form')?.reset();

        // Set default date and time
        const defaultDate = date || new Date();
        document.getElementById('appointment-date').value = defaultDate.toISOString().split('T')[0];
        document.getElementById('appointment-time').value = '09:00';

        // If template ID provided, select it and auto-fill
        if (templateId) {
            document.getElementById('appointment-template').value = templateId;
            this.handleTemplateSelection(templateId);
        }

        modal?.classList.add('active');
    }

    /**
     * Populate template dropdown in appointment modal
     */
    populateTemplateDropdown() {
        const select = document.getElementById('appointment-template');
        if (!select || !this.templatesManager) return;

        // Clear existing options except the first one
        while (select.options.length > 1) {
            select.remove(1);
        }

        // Add templates grouped by type
        const templates = this.templatesManager.getAllTemplates();
        const templatesByType = {};

        templates.forEach(template => {
            if (!templatesByType[template.type]) {
                templatesByType[template.type] = [];
            }
            templatesByType[template.type].push(template);
        });

        // Add options by type
        Object.keys(templatesByType).forEach(type => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = type.charAt(0).toUpperCase() + type.slice(1);

            templatesByType[type].forEach(template => {
                const option = document.createElement('option');
                option.value = template.id;
                option.textContent = `${template.icon} ${template.name}`;
                optgroup.appendChild(option);
            });

            select.appendChild(optgroup);
        });
    }

    /**
     * Handle template selection to auto-fill appointment form
     */
    handleTemplateSelection(templateId) {
        if (!templateId || !this.templatesManager) {
            return;
        }

        const template = this.templatesManager.getTemplateById(templateId);
        if (!template) return;

        // Auto-fill form fields
        const titleInput = document.getElementById('appointment-title');
        if (!titleInput.value) { // Only set if empty
            titleInput.value = template.name;
        }

        // Set duration
        const durationSelect = document.getElementById('appointment-duration');
        const durationValue = template.duration.toString();
        const matchingOption = Array.from(durationSelect.options).find(opt => opt.value === durationValue);

        if (matchingOption) {
            durationSelect.value = durationValue;
        } else {
            // Set to custom if duration not in dropdown
            durationSelect.value = 'custom';
        }

        // Set travel time checkbox
        document.getElementById('appointment-travel').checked = template.includeTravel;

        // Set notes if not already filled
        const notesInput = document.getElementById('appointment-notes');
        if (!notesInput.value && template.defaultNotes) {
            notesInput.value = template.defaultNotes;
        }
    }

    /**
     * Save appointment from modal form
     */
    async saveAppointment() {
        const form = document.getElementById('appointment-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Get form values
        const title = document.getElementById('appointment-title').value.trim();
        const dateStr = document.getElementById('appointment-date').value;
        const timeStr = document.getElementById('appointment-time').value;
        const duration = parseInt(document.getElementById('appointment-duration').value);
        const location = document.getElementById('appointment-location').value.trim();
        const includeTravel = document.getElementById('appointment-travel').checked;
        const notes = document.getElementById('appointment-notes').value.trim();
        const templateId = document.getElementById('appointment-template').value;

        if (!title || !dateStr || !timeStr) {
            alert('Please fill in all required fields');
            return;
        }

        // Parse date and time
        const start = new Date(dateStr + ' ' + timeStr);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + duration);

        // Create event object
        const newEvent = {
            id: `local_${Date.now()}`,
            title: title,
            start: start,
            end: end,
            location: location,
            notes: notes,
            templateId: templateId || null,
            includeTravel: includeTravel,
            isLocal: true, // Mark as locally created (not from Google Calendar)
            ignored: false
        };

        // If template was used, get additional info
        if (templateId && this.templatesManager) {
            const template = this.templatesManager.getTemplateById(templateId);
            if (template) {
                newEvent.type = template.type;
                newEvent.color = template.color;
            }
        }

        // Add to events
        this.state.events.push(newEvent);

        // Save to localStorage
        this.saveSettings();

        // Close modal
        document.getElementById('appointment-modal').classList.remove('active');

        // Re-render current view
        switch (this.state.currentView) {
            case 'dashboard':
                await this.renderDashboard();
                await this.updateWorkloadIndicator();
                break;
            case 'calendar':
                this.renderCalendar();
                break;
        }

        this.showToast(`✅ Appointment "${title}" created!`, 'success');
    }

    /**
     * Get ignored events from localStorage
     */
    getIgnoredEvents() {
        const ignored = localStorage.getItem('gps-admin-ignored-events');
        return ignored ? JSON.parse(ignored) : [];
    }

    /**
     * Save ignored events to localStorage
     */
    saveIgnoredEvents(ignoredEventIds) {
        localStorage.setItem('gps-admin-ignored-events', JSON.stringify(ignoredEventIds));
    }

    /**
     * Check if event should be ignored based on patterns
     */
    isEventIgnoredByPattern(event) {
        if (!this.state.ignoredEventPatterns || this.state.ignoredEventPatterns.length === 0) {
            return false;
        }

        const titleLower = (event.title || '').toLowerCase();
        return this.state.ignoredEventPatterns.some(pattern => {
            const patternLower = pattern.toLowerCase();
            return titleLower.includes(patternLower);
        });
    }

    /**
     * Toggle event ignored status
     */
    toggleEventIgnored(eventId) {
        const ignoredEvents = this.getIgnoredEvents();
        const index = ignoredEvents.indexOf(eventId);

        if (index > -1) {
            ignoredEvents.splice(index, 1);
        } else {
            ignoredEvents.push(eventId);
        }

        this.saveIgnoredEvents(ignoredEvents);

        // Update the event in state
        const event = this.state.events.find(e => e.id === eventId);
        if (event) {
            event.ignored = index === -1; // New state is opposite of what it was
        }

        // Re-render views
        this.renderDashboard();
        this.updateWorkloadIndicator();
        if (this.state.currentView === 'calendar') {
            this.renderCalendar();
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
            if (this.calendarAPI) {
                this.calendarAPI.signOut();
            }

            // Clear authentication state
            this.state.isAuthenticated = false;
            this.state.useMockData = true;
            this.state.availableCalendars = [];

            // Save settings
            this.saveSettings();

            // Update button state
            this.updateConnectButtonState();

            // Reinitialize mock data
            this.initMockData();

            // Re-render views
            await this.renderDashboard();
            await this.updateWorkloadIndicator();

            // Update calendar selection in settings
            if (this.state.currentView === 'settings') {
                this.renderCalendarSelection();
            }

            alert('✅ Successfully logged out from Google Calendar.\n\nYou are now using mock data.');
            console.log('✅ Logged out from Google Calendar');
        } catch (error) {
            console.error('Logout error:', error);
            alert('Error logging out: ' + (error.message || 'Unknown error'));
        }
    }

    /**
     * Handle clearing calendar data
     */
    async handleClearCalendarData() {
        const confirmed = confirm(
            'Are you sure you want to clear all calendar data?\n\n' +
            'This will:\n' +
            '• Clear all locally stored events\n' +
            '• Clear calendar selections\n' +
            '• Reset to mock data\n\n' +
            'This action cannot be undone.'
        );

        if (!confirmed) return;

        try {
            // Clear events
            this.state.events = [];

            // Clear calendar selections
            this.state.selectedCalendars = ['primary'];

            // Reinitialize mock data
            this.initMockData();

            // Save settings
            this.saveSettings();

            // Re-render views
            await this.renderDashboard();
            await this.updateWorkloadIndicator();

            // Update calendar selection in settings
            if (this.state.currentView === 'settings') {
                this.renderCalendarSelection();
            }

            alert('✅ Calendar data has been cleared.\n\nYou are now using mock data.');
            console.log('✅ Cleared calendar data');
        } catch (error) {
            console.error('Clear data error:', error);
            alert('Error clearing data: ' + (error.message || 'Unknown error'));
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Create toast element if it doesn't exist
        let toast = document.getElementById('toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-notification';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }

        // Set message and type
        toast.textContent = message;
        toast.className = `toast toast-${type} show`;

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    /**
     * Render analytics view
     */
    renderAnalytics() {
        const range = document.getElementById('analytics-range')?.value || 'month';
        const compareMode = document.getElementById('analytics-compare-toggle')?.checked || false;

        const result = this.getDateRange(range);
        const startDate = result.startDate;
        const endDate = result.endDate;

        // Filter events within date range
        const events = this.state.events.filter(event => {
            if (event.ignored || event.isAllDay) return false;
            const eventDate = new Date(event.start);
            return eventDate >= startDate && eventDate <= endDate;
        });

        if (events.length === 0) {
            this.renderAnalyticsEmpty();
            this.clearAnalyticsComparison();
            return;
        }

        // Calculate overview stats
        this.renderAnalyticsOverview(events, startDate, endDate, range);

        // Handle comparison mode
        if (compareMode) {
            const prevResult = this.getPreviousPeriodRange(range);
            const prevEvents = this.state.events.filter(event => {
                if (event.ignored || event.isAllDay) return false;
                const eventDate = new Date(event.start);
                return eventDate >= prevResult.startDate && eventDate <= prevResult.endDate;
            });

            const currentDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
            const previousDays = Math.ceil((prevResult.endDate - prevResult.startDate) / (1000 * 60 * 60 * 24));

            const comparison = this.calculatePeriodComparison(events, prevEvents, currentDays, previousDays);
            this.renderAnalyticsComparison(comparison, range);
        } else {
            this.clearAnalyticsComparison();
        }

        // Render charts
        this.renderWorkloadTrendChart(events, startDate, endDate, range);
        this.renderAppointmentTypesChart(events);
        this.renderBusiestDaysChart(events);
        this.renderBusiestTimesChart(events);
        this.renderTemplateUsageChart(events);
        this.renderAnalyticsInsights(events, range);
    }

    /**
     * Get date range based on selection
     */
    getDateRange(range) {
        const now = new Date();
        let startDate, endDate;

        switch (range) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6); // End of week (Saturday)
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59, 999);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        return { startDate, endDate };
    }

    /**
     * Render analytics overview cards
     */
    renderAnalyticsOverview(events, startDate, endDate, range) {
        // Total appointments
        document.getElementById('analytics-total-appointments').textContent = events.length;

        // Total hours
        const totalMinutes = events.reduce((sum, event) => {
            return sum + ((event.end - event.start) / (1000 * 60));
        }, 0);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);
        document.getElementById('analytics-total-hours').textContent = hours + 'h ' + minutes + 'm';

        // Average daily workload
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const avgDaily = totalMinutes / days / 60;
        document.getElementById('analytics-avg-daily').textContent = avgDaily.toFixed(1) + 'h';

        // Busiest day
        const dayWorkload = {};
        events.forEach(event => {
            const dayKey = new Date(event.start).toDateString();
            dayWorkload[dayKey] = (dayWorkload[dayKey] || 0) + ((event.end - event.start) / (1000 * 60 * 60));
        });

        const busiestDay = Object.entries(dayWorkload).reduce((max, entry) => {
            const day = entry[0];
            const hours = entry[1];
            return hours > max.hours ? { day, hours } : max;
        }, { day: 'N/A', hours: 0 });

        const busiestDate = busiestDay.day !== 'N/A' ? new Date(busiestDay.day) : null;
        const busiestDayText = busiestDate
            ? busiestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' (' + busiestDay.hours.toFixed(1) + 'h)'
            : 'N/A';
        document.getElementById('analytics-busiest-day').textContent = busiestDayText;
    }

    /**
     * Render empty state
     */
    renderAnalyticsEmpty() {
        const content = document.getElementById('analytics-content');
        content.innerHTML = '<div class="analytics-empty"><div class="analytics-empty-icon">📊</div><h3>No Data Available</h3><p>No appointments found for the selected time period.</p></div>';
    }

    /**
     * Render workload trend chart
     */
    renderWorkloadTrendChart(events, startDate, endDate, range) {
        const container = document.getElementById('workload-trend-chart');
        if (!container) return;

        // Group by day or week depending on range
        const groupByDay = range === 'week' || range === 'month';
        const dataPoints = [];

        if (groupByDay) {
            // Daily grouping
            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const dayKey = currentDate.toDateString();
                const dayEvents = events.filter(e => new Date(e.start).toDateString() === dayKey);
                const hours = dayEvents.reduce((sum, e) => sum + ((e.end - e.start) / (1000 * 60 * 60)), 0);

                dataPoints.push({
                    label: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    value: hours,
                    shortLabel: currentDate.getDate().toString()
                });

                currentDate.setDate(currentDate.getDate() + 1);
            }
        } else {
            // Weekly grouping for quarter/year
            let weekStart = new Date(startDate);
            let weekNum = 1;
            while (weekStart <= endDate) {
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);

                const weekEvents = events.filter(e => {
                    const eventDate = new Date(e.start);
                    return eventDate >= weekStart && eventDate <= weekEnd;
                });

                const hours = weekEvents.reduce((sum, e) => sum + ((e.end - e.start) / (1000 * 60 * 60)), 0);

                dataPoints.push({
                    label: 'Week ' + weekNum,
                    value: hours,
                    shortLabel: 'W' + weekNum
                });

                weekStart.setDate(weekStart.getDate() + 7);
                weekNum++;
            }
        }

        // Render bar chart with thresholds
        this.renderBarChartWithThresholds(container, dataPoints);
    }

    /**
     * Render bar chart with threshold lines
     */
    renderBarChartWithThresholds(container, data) {
        const thresholds = this.state.settings.thresholds.daily;
        const displayCap = 20; // Cap display at 20h for better scale
        const actualMax = Math.max(...data.map(d => d.value), thresholds.burnout);
        const maxValue = Math.min(actualMax, displayCap);

        // Calculate threshold positions (as percentage from bottom)
        const comfortablePos = (thresholds.comfortable / maxValue * 100);
        const busyPos = (thresholds.busy / maxValue * 100);
        const burnoutPos = (thresholds.high / maxValue * 100);

        const html = '<div class="chart-with-thresholds">' +
            // Background zones for visual clarity
            '<div class="threshold-zone comfortable" style="position: absolute; bottom: 0; left: 0; right: 0; height: ' + comfortablePos + '%;"></div>' +
            '<div class="threshold-zone busy" style="position: absolute; bottom: ' + comfortablePos + '%; left: 0; right: 0; height: ' + (busyPos - comfortablePos) + '%;"></div>' +
            '<div class="threshold-zone overload" style="position: absolute; bottom: ' + busyPos + '%; left: 0; right: 0; height: ' + (100 - busyPos) + '%;"></div>' +
            // Threshold lines
            '<div class="threshold-line comfortable" style="position: absolute; bottom: ' + comfortablePos + '%; left: 0; right: 0;" data-label="' + thresholds.comfortable + 'h comfortable"></div>' +
            '<div class="threshold-line busy" style="position: absolute; bottom: ' + busyPos + '%; left: 0; right: 0;" data-label="' + thresholds.busy + 'h busy"></div>' +
            '<div class="threshold-line overload" style="position: absolute; bottom: ' + burnoutPos + '%; left: 0; right: 0;" data-label="' + thresholds.high + 'h overload"></div>' +
            // Bar chart
            '<div class="bar-chart" style="position: absolute; bottom: 16px; left: 0; right: 0; height: 200px;">' + data.map(item => {
                const displayValue = Math.min(item.value, displayCap);
                const isOverflow = item.value > displayCap;
                const heightPercent = (displayValue / maxValue * 100);
                const valueText = item.value < 1 ? item.value.toFixed(1) : Math.round(item.value);
                
                // Determine bar status based on thresholds
                let barStatus = 'comfortable';
                if (item.value >= thresholds.high || isOverflow) {
                    barStatus = 'overload';
                } else if (item.value >= thresholds.busy) {
                    barStatus = 'busy';
                } else if (item.value >= thresholds.comfortable) {
                    barStatus = 'moderate';
                }
                
                return '<div class="bar-chart-item">' +
                    '<div class="bar animated ' + barStatus + (isOverflow ? ' overflow' : '') + '" style="height: ' + heightPercent + '%;" title="' + item.label + ': ' + item.value.toFixed(1) + 'h">' +
                    '<div class="bar-value">' + valueText + (isOverflow ? '+' : '') + '</div>' +
                    '</div>' +
                    '<div class="bar-label">' + (item.shortLabel || item.label) + '</div>' +
                    '</div>';
            }).join('') + '</div>' +
        '</div>';

        container.innerHTML = html;

        // Trigger animation
        setTimeout(() => {
            const bars = container.querySelectorAll('.bar');
            bars.forEach(bar => bar.style.animationPlayState = 'running');
        }, 50);
    }

    /**
     * Render appointment types chart
     */
    renderAppointmentTypesChart(events) {
        const container = document.getElementById('appointment-types-chart');
        if (!container) return;

        // Count by type
        const typeCounts = {};
        events.forEach(event => {
            const type = event.type || 'Other';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });

        // Convert to array and sort
        const data = Object.entries(typeCounts).map(entry => {
            const type = entry[0];
            const count = entry[1];
            return {
                label: type.charAt(0).toUpperCase() + type.slice(1),
                value: count,
                percentage: (count / events.length * 100).toFixed(1)
            };
        }).sort((a, b) => b.value - a.value);

        this.renderDonutChart(container, data);
    }

    /**
     * Render busiest days chart
     */
    renderBusiestDaysChart(events) {
        const container = document.getElementById('busiest-days-chart');
        if (!container) return;

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayCounts = new Array(7).fill(0);

        events.forEach(event => {
            const day = new Date(event.start).getDay();
            dayCounts[day]++;
        });

        const data = dayNames.map((name, idx) => ({
            label: name,
            value: dayCounts[idx],
            shortLabel: name
        }));

        this.renderBarChart(container, data);
    }

    /**
     * Render busiest times chart
     */
    renderBusiestTimesChart(events) {
        const container = document.getElementById('busiest-times-chart');
        if (!container) return;

        const timeSlots = {
            'Morning': [6, 9],
            'Mid-Morning': [9, 12],
            'Afternoon': [12, 15],
            'Late Afternoon': [15, 18],
            'Evening': [18, 21]
        };

        const data = Object.entries(timeSlots).map(entry => {
            const label = entry[0];
            const times = entry[1];
            const start = times[0];
            const end = times[1];
            const count = events.filter(event => {
                const hour = new Date(event.start).getHours();
                return hour >= start && hour < end;
            }).length;

            return {
                label,
                value: count,
                shortLabel: label // Use full label
            };
        });

        this.renderBarChart(container, data);
    }

    /**
     * Render template usage chart
     */
    renderTemplateUsageChart(events) {
        const container = document.getElementById('template-usage-chart');
        if (!container || !this.templatesManager) return;

        // Count template usage
        const templateCounts = {};
        events.forEach(event => {
            if (event.templateId) {
                const template = this.templatesManager.getTemplateById(event.templateId);
                if (template) {
                    const key = template.name;
                    templateCounts[key] = (templateCounts[key] || 0) + 1;
                }
            }
        });

        if (Object.keys(templateCounts).length === 0) {
            container.innerHTML = '<p class="text-muted" style="text-align: center; padding: 48px;">No template usage data</p>';
            return;
        }

        // Convert to sorted array
        const data = Object.entries(templateCounts)
            .map(entry => {
                const name = entry[0];
                const count = entry[1];
                return {
                    label: name,
                    value: count,
                    percentage: (count / events.length * 100).toFixed(1)
                };
            })
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5

        this.renderDonutChart(container, data);
    }

    /**
     * Render analytics insights for a given period
     * @param {Array} events - Array of event objects to analyze
     * @param {string} range - Time range ('week', 'month', 'quarter', 'year')
     */
    renderAnalyticsInsights(events, range) {
        const container = document.getElementById('analytics-insights');
        if (!container) return;

        // Defensive check for undefined/null events
        if (!events || !Array.isArray(events) || events.length === 0) {
            container.innerHTML = '<p class="text-muted" style="text-align: center; padding: 24px;">No data available for insights</p>';
            return;
        }

        const insights = [];

        // Total workload insight
        const totalHours = events.reduce((sum, e) => sum + ((e.end - e.start) / (1000 * 60 * 60)), 0);
        const avgPerDay = totalHours / (range === 'week' ? 7 : 30);

        if (avgPerDay > 8) {
            insights.push({
                icon: '⚠️',
                title: 'High Workload Alert',
                description: 'You are averaging ' + avgPerDay.toFixed(1) + ' hours per day. Consider reducing your schedule.'
            });
        } else if (avgPerDay < 4) {
            insights.push({
                icon: '📈',
                title: 'Capacity Available',
                description: 'You are averaging ' + avgPerDay.toFixed(1) + ' hours per day. You have room for more appointments.'
            });
        }

        // Busiest day insight
        const dayWorkload = {};
        events.forEach(event => {
            const day = new Date(event.start).toLocaleDateString('en-US', { weekday: 'long' });
            dayWorkload[day] = (dayWorkload[day] || 0) + 1;
        });

        const busiestDay = Object.entries(dayWorkload).reduce((max, entry) => {
            const day = entry[0];
            const count = entry[1];
            return count > max.count ? { day, count } : max;
        }, { day: '', count: 0 });

        if (busiestDay.count > 0) {
            insights.push({
                icon: '📅',
                title: busiestDay.day + 's are your busiest',
                description: 'You have ' + busiestDay.count + ' appointments on average. Plan accordingly!'
            });
        }

        // Template insight
        if (this.templatesManager) {
            const templateEvents = events.filter(e => e.templateId).length;
            const percentage = (templateEvents / events.length * 100).toFixed(0);

            if (percentage < 50) {
                insights.push({
                    icon: '⭐',
                    title: 'Use Templates More',
                    description: 'Only ' + percentage + '% of appointments use templates. Templates save time and ensure consistency!'
                });
            }
        }

        // Render insights
        if (insights.length === 0) {
            container.innerHTML = '<p class="text-muted" style="text-align: center; padding: 24px;">No insights available</p>';
        } else {
            container.innerHTML = insights.map(insight => '<div class="insight-item"><div class="insight-icon">' + insight.icon + '</div><div class="insight-content"><div class="insight-title">' + insight.title + '</div><div class="insight-description">' + insight.description + '</div></div></div>').join('');
        }
    }

    /**
     * Render bar chart
     */
    renderBarChart(container, data) {
        const maxValue = Math.max(...data.map(d => d.value), 1);

        const html = '<div class="bar-chart">' + data.map(item => '<div class="bar-chart-item"><div class="bar animated" style="height: ' + (item.value / maxValue * 100) + '%;" title="' + item.label + ': ' + item.value + '"><div class="bar-value">' + item.value + '</div></div><div class="bar-label">' + (item.shortLabel || item.label) + '</div></div>').join('') + '</div>';

        container.innerHTML = html;

        // Trigger animation after a small delay to ensure DOM is ready
        setTimeout(() => {
            const bars = container.querySelectorAll('.bar');
            bars.forEach(bar => bar.style.animationPlayState = 'running');
        }, 50);
    }

    /**
     * Render donut chart
     */
    renderDonutChart(container, data) {
        const colors = [
            '#3b82f6', // blue
            '#10b981', // green
            '#f59e0b', // amber
            '#ef4444', // red
            '#8b5cf6', // purple
            '#06b6d4', // cyan
            '#f97316', // orange
            '#ec4899'  // pink
        ];

        const html = '<div class="donut-legend">' + data.map((item, idx) => '<div class="donut-legend-item"><div class="donut-legend-color" style="background: ' + colors[idx % colors.length] + '"></div><div class="donut-legend-label">' + item.label + '</div><div class="donut-legend-value">' + item.value + ' (' + item.percentage + '%)</div></div>').join('') + '</div>';

        container.innerHTML = html;
    }

    /**
     * Render upcoming appointments for today
     */
    renderUpcomingAppointments() {
        const container = document.getElementById('upcoming-appointments');
        if (!container) return;

        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        // Get today's appointments, sorted by time
        const todayAppointments = this.state.events
            .filter(event => {
                if (event.ignored || event.isAllDay) return false;
                const eventStart = new Date(event.start);
                return eventStart >= today && eventStart <= todayEnd;
            })
            .sort((a, b) => a.start - b.start)
            .slice(0, 5); // Show next 5 appointments

        if (todayAppointments.length === 0) {
            container.innerHTML = '<div class="upcoming-empty">📅 No appointments scheduled for today<br><small>Enjoy your free day!</small></div>';
            return;
        }

        const html = todayAppointments.map(event => {
            const startTime = new Date(event.start);
            const endTime = new Date(event.end);
            const isPast = now > endTime;
            const duration = Math.round((endTime - startTime) / (1000 * 60));

            return '<div class="appointment-item' + (isPast ? ' past' : '') + '" onclick="window.gpsApp.showEventDetails(\'' + event.id + '\')">' +
                '<div class="appointment-time">' +
                    '<div class="appointment-time-hour">' + startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false }) + '</div>' +
                '</div>' +
                '<div class="appointment-details">' +
                    '<div class="appointment-title">' + event.title + '</div>' +
                    '<div class="appointment-meta">' +
                        '<span class="appointment-meta-item">⏱️ ' + duration + ' min</span>' +
                        (event.location ? '<span class="appointment-meta-item">📍 ' + event.location + '</span>' : '') +
                        (event.client ? '<span class="appointment-meta-item">👤 ' + event.client + '</span>' : '') +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Calculate comparison metrics vs last week
     */
    getWeekComparison() {
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        // This week
        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(today.getDate() - today.getDay());
        const thisWeekEnd = new Date(thisWeekStart);
        thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
        thisWeekEnd.setHours(23, 59, 59, 999);

        // Last week
        const lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(thisWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        lastWeekEnd.setHours(23, 59, 59, 999);

        // Calculate this week hours
        const thisWeekEvents = this.state.events.filter(event => {
            if (event.ignored || event.isAllDay) return false;
            const eventStart = new Date(event.start);
            return eventStart >= thisWeekStart && eventStart <= thisWeekEnd;
        });

        const thisWeekHours = thisWeekEvents.reduce((sum, event) => {
            return sum + ((event.end - event.start) / (1000 * 60 * 60));
        }, 0);

        // Calculate last week hours
        const lastWeekEvents = this.state.events.filter(event => {
            if (event.ignored || event.isAllDay) return false;
            const eventStart = new Date(event.start);
            return eventStart >= lastWeekStart && eventStart <= lastWeekEnd;
        });

        const lastWeekHours = lastWeekEvents.reduce((sum, event) => {
            return sum + ((event.end - event.start) / (1000 * 60 * 60));
        }, 0);

        const diff = thisWeekHours - lastWeekHours;
        const percentChange = lastWeekHours > 0 ? (diff / lastWeekHours * 100) : 0;

        return {
            thisWeek: thisWeekHours,
            lastWeek: lastWeekHours,
            diff: diff,
            percentChange: percentChange,
            trend: diff > 1 ? 'positive' : diff < -1 ? 'negative' : 'neutral'
        };
    }

    /**
     * Render week comparison badge
     */
    renderWeekComparison() {
        const container = document.getElementById('week-comparison');
        if (!container) return;

        const comparison = this.getWeekComparison();
        const arrow = comparison.trend === 'positive' ? '↗️' : comparison.trend === 'negative' ? '↘️' : '→';
        const sign = comparison.diff >= 0 ? '+' : '';

        container.className = 'comparison-badge ' + comparison.trend;
        container.innerHTML = '<span class="trend-arrow">' + arrow + '</span> ' +
                              sign + comparison.diff.toFixed(1) + 'h vs last week';
    }

    /**
     * Enhanced week overview with color coding and workload bars
     */
    renderWeekOverviewEnhanced() {
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
                const eventStart = new Date(event.start);
                const eventEnd = new Date(event.end);

                const dayStart = new Date(date);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(date);
                dayEnd.setHours(23, 59, 59, 999);

                return eventEnd > dayStart && eventStart <= dayEnd;
            });

            // Check for housesits on this day
            const housesits = dayEvents.filter(event => 
                !event.ignored && 
                !event.isAllDay && 
                (event.type === 'overnight' || 
                 event.title?.toLowerCase().includes('overnight') ||
                 event.title?.toLowerCase().includes('housesit'))
            );

            // Work events are everything except housesits (but cap housesit hours)
            const workEvents = dayEvents.filter(event => !event.ignored && !event.isAllDay);

            const dayMinutes = workEvents.reduce((sum, event) => {
                return sum + this.calculateEventDurationForDay(event, date);
            }, 0);

            const hours = dayMinutes / 60;
            const level = this.getWorkloadLevel(hours);
            const isToday = date.toDateString() === today.toDateString();

            // Calculate workload bar percentage (max 12 hours = 100%)
            const maxHours = 12;
            const barPercentage = Math.min((hours / maxHours) * 100, 100);

            html += '<div class="week-day' + (isToday ? ' today' : '') + (housesits.length > 0 ? ' has-housesit' : '') + '" onclick="window.gpsApp.showDayDetails(\'' + date.toISOString() + '\')">';
            
            // Housesit indicator bar at top
            if (housesits.length > 0) {
                html += '  <div class="week-day-housesit-indicator" title="House sit scheduled">';
                html += '    <span class="housesit-icon">🏠</span>';
                html += '  </div>';
            }
            
            html += '  <div class="week-day-header">' + date.toLocaleDateString('en-US', { weekday: 'short' }) + '</div>';
            html += '  <div class="week-day-date">' + date.getDate() + '</div>';

            if (workEvents.length > 0) {
                html += '  <div class="week-day-count">' + workEvents.length + '</div>';
            }

            html += '  <div class="week-day-hours">' + hours.toFixed(1) + 'h';
            if (housesits.length > 0) {
                html += ' <span class="housesit-label">+ housesit</span>';
            }
            html += '</div>';
            html += '  <div class="week-day-level ' + level + '">' + this.getWorkloadLabel(level) + '</div>';
            html += '  <div class="week-day-workload-bar">';
            html += '    <div class="week-day-workload-fill ' + level + '" style="width: ' + barPercentage + '%"></div>';
            html += '  </div>';
            html += '</div>';
        }

        weekOverview.innerHTML = html;
    }

    /**
     * Animate stat value with count-up effect
     */
    animateStatValue(elementId, endValue, duration = 1000) {
        const element = document.getElementById(elementId);
        if (!element) return;

        // Parse numeric value from string like "5h 30m" or "32"
        const numericValue = parseInt(endValue);
        if (isNaN(numericValue)) {
            element.textContent = endValue;
            return;
        }

        const startValue = 0;
        const startTime = Date.now();

        const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out)
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(startValue + (numericValue - startValue) * eased);

            element.textContent = current;
            element.classList.add('counting');

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = endValue;
                element.classList.remove('counting');
            }
        };

        animate();
    }

    /**
     * Show event details modal (stub for appointment click)
     */
    showEventDetails(eventId) {
        const event = this.state.events.find(e => e.id === eventId);
        if (!event) return;

        // For now, just show an alert
        // In full implementation, this would open a detail modal
        const startTime = new Date(event.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const endTime = new Date(event.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        alert('Appointment Details\n\n' +
              event.title + '\n' +
              startTime + ' - ' + endTime + '\n' +
              (event.location ? 'Location: ' + event.location + '\n' : '') +
              (event.client ? 'Client: ' + event.client + '\n' : '') +
              (event.notes ? '\nNotes: ' + event.notes : ''));
    }

    /**
     * Get previous period date range based on current selection
     */
    getPreviousPeriodRange(range) {
        const now = new Date();
        let prevStartDate, prevEndDate;

        switch (range) {
            case 'week':
                const thisWeekStart = new Date(now);
                thisWeekStart.setDate(now.getDate() - now.getDay());
                thisWeekStart.setHours(0, 0, 0, 0);

                prevStartDate = new Date(thisWeekStart);
                prevStartDate.setDate(thisWeekStart.getDate() - 7);
                prevEndDate = new Date(prevStartDate);
                prevEndDate.setDate(prevStartDate.getDate() + 6);
                prevEndDate.setHours(23, 59, 59, 999);
                break;
            case 'month':
                const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                prevStartDate = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
                prevEndDate = new Date(now.getFullYear(), quarter * 3, 0, 23, 59, 59, 999);
                break;
            case 'year':
                prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
                prevEndDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
                break;
            default:
                prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        }

        return { startDate: prevStartDate, endDate: prevEndDate };
    }

    /**
     * Calculate comparison metrics between current and previous period
     */
    calculatePeriodComparison(currentEvents, previousEvents, currentDays, previousDays) {
        // Total appointments
        const currentAppointments = currentEvents.length;
        const previousAppointments = previousEvents.length;
        const appointmentsDiff = currentAppointments - previousAppointments;
        const appointmentsPercent = previousAppointments > 0
            ? (appointmentsDiff / previousAppointments * 100)
            : 0;

        // Total hours
        const currentMinutes = currentEvents.reduce((sum, e) => sum + ((e.end - e.start) / (1000 * 60)), 0);
        const previousMinutes = previousEvents.reduce((sum, e) => sum + ((e.end - e.start) / (1000 * 60)), 0);
        const currentHours = currentMinutes / 60;
        const previousHours = previousMinutes / 60;
        const hoursDiff = currentHours - previousHours;
        const hoursPercent = previousHours > 0 ? (hoursDiff / previousHours * 100) : 0;

        // Average daily
        const currentAvgDaily = currentHours / currentDays;
        const previousAvgDaily = previousHours / previousDays;
        const avgDailyDiff = currentAvgDaily - previousAvgDaily;
        const avgDailyPercent = previousAvgDaily > 0 ? (avgDailyDiff / previousAvgDaily * 100) : 0;

        return {
            appointments: {
                current: currentAppointments,
                previous: previousAppointments,
                diff: appointmentsDiff,
                percent: appointmentsPercent,
                trend: appointmentsDiff > 0 ? 'positive' : appointmentsDiff < 0 ? 'negative' : 'neutral'
            },
            hours: {
                current: currentHours,
                previous: previousHours,
                diff: hoursDiff,
                percent: hoursPercent,
                trend: hoursDiff > 1 ? 'positive' : hoursDiff < -1 ? 'negative' : 'neutral'
            },
            avgDaily: {
                current: currentAvgDaily,
                previous: previousAvgDaily,
                diff: avgDailyDiff,
                percent: avgDailyPercent,
                trend: avgDailyDiff > 0.5 ? 'positive' : avgDailyDiff < -0.5 ? 'negative' : 'neutral'
            }
        };
    }

    /**
     * Render comparison data for analytics stats
     */
    renderAnalyticsComparison(comparison, range) {
        const rangeLabel = range === 'week' ? 'last week' : range === 'month' ? 'last month' : range === 'quarter' ? 'last quarter' : 'last year';

        // Appointments comparison
        const apptEl = document.getElementById('analytics-total-appointments-comparison');
        if (apptEl) {
            const arrow = comparison.appointments.trend === 'positive' ? '↗️' : comparison.appointments.trend === 'negative' ? '↘️' : '→';
            const sign = comparison.appointments.diff >= 0 ? '+' : '';
            apptEl.className = 'stat-comparison ' + comparison.appointments.trend;
            apptEl.innerHTML = arrow + ' ' + sign + comparison.appointments.diff + ' vs ' + rangeLabel;
        }

        // Hours comparison
        const hoursEl = document.getElementById('analytics-total-hours-comparison');
        if (hoursEl) {
            const arrow = comparison.hours.trend === 'positive' ? '↗️' : comparison.hours.trend === 'negative' ? '↘️' : '→';
            const sign = comparison.hours.diff >= 0 ? '+' : '';
            hoursEl.className = 'stat-comparison ' + comparison.hours.trend;
            hoursEl.innerHTML = arrow + ' ' + sign + comparison.hours.diff.toFixed(1) + 'h vs ' + rangeLabel;
        }

        // Avg daily comparison
        const avgEl = document.getElementById('analytics-avg-daily-comparison');
        if (avgEl) {
            const arrow = comparison.avgDaily.trend === 'positive' ? '↗️' : comparison.avgDaily.trend === 'negative' ? '↘️' : '→';
            const sign = comparison.avgDaily.diff >= 0 ? '+' : '';
            avgEl.className = 'stat-comparison ' + comparison.avgDaily.trend;
            avgEl.innerHTML = arrow + ' ' + sign + comparison.avgDaily.diff.toFixed(1) + 'h avg vs ' + rangeLabel;
        }
    }

    /**
     * Clear analytics comparison data
     */
    clearAnalyticsComparison() {
        document.getElementById('analytics-total-appointments-comparison').innerHTML = '';
        document.getElementById('analytics-total-hours-comparison').innerHTML = '';
        document.getElementById('analytics-avg-daily-comparison').innerHTML = '';
        document.getElementById('analytics-busiest-day-comparison').innerHTML = '';
    }
}
