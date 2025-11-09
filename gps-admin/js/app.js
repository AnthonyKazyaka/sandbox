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
     * Render list view (sequential events)
     */
    renderListView(container) {
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

            // Calculate daily totals
            const totalMinutes = dayEvents.reduce((sum, event) => {
                return sum + (event.end - event.start) / (1000 * 60);
            }, 0);

            const hours = (totalMinutes / 60).toFixed(1);
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
                            <span>${hours} hours</span>
                            <span class="workload-badge ${workloadLevel}">${workloadLabel}</span>
                        </div>
                    </div>
                    <div class="calendar-list-events">
            `;

            // Render events for this day
            dayEvents.forEach(event => {
                const startTime = this.formatTime(event.start);
                const endTime = this.formatTime(event.end);
                const duration = Math.round((event.end - event.start) / (1000 * 60));

                html += `
                    <div class="calendar-list-event">
                        <div class="calendar-list-event-time">
                            <div>${startTime}</div>
                            <div class="calendar-list-event-time-range">${duration} min</div>
                        </div>
                        <div class="calendar-list-event-details">
                            <div class="calendar-list-event-title">${event.title}</div>
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
                            <span class="event-type-badge ${event.type}">
                                ${this.getEventTypeIcon(event.type)} ${this.getEventTypeLabel(event.type)}
                            </span>
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
            // Initialize Calendar API if not already done
            if (!this.calendarAPI) {
                this.calendarAPI = new CalendarAPI(clientId);
                const initialized = await this.calendarAPI.init();

                if (!initialized) {
                    throw new Error('Failed to initialize Calendar API');
                }
            }

            // Authenticate user
            console.log('🔐 Starting OAuth authentication...');
            const response = await this.calendarAPI.authenticate();

            if (response) {
                this.state.isAuthenticated = true;
                this.state.useMockData = false;

                alert('✅ Successfully connected to Google Calendar!\n\nLoading your real events...');

                // Fetch real events
                await this.loadCalendarEvents();

                // Re-render views
                this.renderDashboard();
                this.updateWorkloadIndicator();

                // Update button text
                const btn = document.getElementById('connect-calendar-btn');
                if (btn) {
                    btn.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        Connected
                    `;
                    btn.classList.add('btn-success');
                }
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

            // Fetch events
            const events = await this.calendarAPI.fetchEvents('primary', startDate, endDate);

            this.state.events = events;
            console.log(`✅ Loaded ${events.length} events from Google Calendar`);

        } catch (error) {
            console.error('Error loading calendar events:', error);
            alert('Failed to load calendar events.\n\nError: ' + (error.message || 'Unknown error'));
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
