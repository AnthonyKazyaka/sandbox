/**
 * Google Calendar API Integration
 * Handles authentication and calendar data synchronization
 */

class CalendarAPI {
    constructor(clientId) {
        this.clientId = clientId;
        this.accessToken = null;
        this.tokenClient = null;
        this.gapiInited = false;
        this.gisInited = false;
    }

    /**
     * Initialize Google API libraries
     */
    async init() {
        try {
            // Load Google API libraries
            await this.loadGoogleAPIs();

            // Initialize GAPI client
            await this.initializeGapiClient();

            // Initialize Google Identity Services
            await this.initializeGIS();

            console.log('✅ Calendar API initialized');
            return true;
        } catch (error) {
            console.error('Error initializing Calendar API:', error);
            return false;
        }
    }

    /**
     * Load Google API scripts
     */
    loadGoogleAPIs() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
                resolve();
                return;
            }

            // Load GAPI
            const gapiScript = document.createElement('script');
            gapiScript.src = 'https://apis.google.com/js/api.js';
            gapiScript.onload = () => {
                // Load GIS
                const gisScript = document.createElement('script');
                gisScript.src = 'https://accounts.google.com/gsi/client';
                gisScript.onload = resolve;
                gisScript.onerror = reject;
                document.head.appendChild(gisScript);
            };
            gapiScript.onerror = reject;
            document.head.appendChild(gapiScript);
        });
    }

    /**
     * Initialize GAPI client
     */
    async initializeGapiClient() {
        await new Promise((resolve) => gapi.load('client', resolve));

        await gapi.client.init({
            apiKey: 'YOUR_API_KEY', // Not needed for OAuth, but can be set
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        });

        this.gapiInited = true;
    }

    /**
     * Initialize Google Identity Services
     */
    initializeGIS() {
        return new Promise((resolve) => {
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.clientId,
                scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
                callback: (response) => {
                    if (response.error !== undefined) {
                        throw response;
                    }
                    this.accessToken = response.access_token;
                    console.log('✅ Authenticated with Google Calendar');
                },
            });

            this.gisInited = true;
            resolve();
        });
    }

    /**
     * Authenticate user with Google
     */
    async authenticate() {
        return new Promise((resolve, reject) => {
            if (!this.tokenClient) {
                reject(new Error('Token client not initialized'));
                return;
            }

            this.tokenClient.callback = (response) => {
                if (response.error !== undefined) {
                    reject(response);
                    return;
                }
                this.accessToken = response.access_token;
                resolve(response);
            };

            // Check if we have a valid token
            if (this.accessToken && gapi.client.getToken()) {
                resolve({ access_token: this.accessToken });
            } else {
                this.tokenClient.requestAccessToken({ prompt: 'consent' });
            }
        });
    }

    /**
     * Sign out
     */
    signOut() {
        const token = gapi.client.getToken();
        if (token !== null) {
            google.accounts.oauth2.revoke(token.access_token);
            gapi.client.setToken('');
            this.accessToken = null;
        }
    }

    /**
     * Get list of calendars
     */
    async listCalendars() {
        try {
            const response = await gapi.client.calendar.calendarList.list({
                maxResults: 50,
                showHidden: false,
            });

            return response.result.items.map(calendar => ({
                id: calendar.id,
                name: calendar.summary,
                description: calendar.description,
                primary: calendar.primary || false,
                backgroundColor: calendar.backgroundColor,
                foregroundColor: calendar.foregroundColor,
                selected: calendar.selected,
            }));
        } catch (error) {
            console.error('Error fetching calendars:', error);
            throw error;
        }
    }

    /**
     * Fetch events from calendar
     * @param {string} calendarId - Calendar ID (default: 'primary')
     * @param {Date} timeMin - Start date/time
     * @param {Date} timeMax - End date/time
     * @returns {Array} Events
     */
    async fetchEvents(calendarId = 'primary', timeMin = null, timeMax = null) {
        try {
            // Default to current month if no range specified
            if (!timeMin) {
                timeMin = new Date();
                timeMin.setDate(1);
                timeMin.setHours(0, 0, 0, 0);
            }

            if (!timeMax) {
                timeMax = new Date(timeMin);
                timeMax.setMonth(timeMax.getMonth() + 1);
            }

            const response = await gapi.client.calendar.events.list({
                calendarId: calendarId,
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                showDeleted: false,
                singleEvents: true,
                maxResults: 2500,
                orderBy: 'startTime',
            });

            return response.result.items.map(event => this.parseEvent(event));
        } catch (error) {
            console.error('Error fetching events:', error);
            throw error;
        }
    }

    /**
     * Parse Google Calendar event to our format
     */
    parseEvent(gcalEvent) {
        const start = gcalEvent.start.dateTime
            ? new Date(gcalEvent.start.dateTime)
            : new Date(gcalEvent.start.date);

        const end = gcalEvent.end.dateTime
            ? new Date(gcalEvent.end.dateTime)
            : new Date(gcalEvent.end.date);

        // Try to determine event type from title/description
        const type = this.detectEventType(gcalEvent.summary, gcalEvent.description);

        return {
            id: gcalEvent.id,
            title: gcalEvent.summary || '(No title)',
            type: type,
            start: start,
            end: end,
            location: gcalEvent.location || '',
            description: gcalEvent.description || '',
            client: this.extractClientName(gcalEvent.summary),
            notes: gcalEvent.description || '',
            colorId: gcalEvent.colorId,
            status: gcalEvent.status,
            htmlLink: gcalEvent.htmlLink,
        };
    }

    /**
     * Detect event type from title/description
     */
    detectEventType(title = '', description = '') {
        const text = `${title} ${description}`.toLowerCase();

        if (text.includes('overnight') || text.includes('boarding')) {
            return 'overnight';
        } else if (text.includes('walk') || text.includes('walking')) {
            return 'walk';
        } else if (text.includes('meet') || text.includes('greet') || text.includes('consultation')) {
            return 'meet-greet';
        } else if (text.includes('drop-in') || text.includes('drop in') || text.includes('visit')) {
            return 'dropin';
        }

        return 'other';
    }

    /**
     * Extract client name from title
     * Assumes format like "Bella - Morning Drop-in" or "Max & Cooper - Dog Walk"
     */
    extractClientName(title) {
        if (!title) return '';

        // Try to extract pet name (before dash or hyphen)
        const match = title.match(/^([^-–—]+)/);
        return match ? match[1].trim() : title;
    }

    /**
     * Create a new event
     * @param {string} calendarId - Calendar ID
     * @param {Object} eventData - Event data
     * @returns {Object} Created event
     */
    async createEvent(calendarId = 'primary', eventData) {
        try {
            const event = {
                summary: eventData.title,
                location: eventData.location,
                description: eventData.notes || eventData.description,
                start: {
                    dateTime: eventData.start.toISOString(),
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
                end: {
                    dateTime: eventData.end.toISOString(),
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
            };

            const response = await gapi.client.calendar.events.insert({
                calendarId: calendarId,
                resource: event,
            });

            console.log('✅ Event created:', response.result.htmlLink);
            return this.parseEvent(response.result);
        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    }

    /**
     * Update an existing event
     * @param {string} calendarId - Calendar ID
     * @param {string} eventId - Event ID
     * @param {Object} eventData - Updated event data
     * @returns {Object} Updated event
     */
    async updateEvent(calendarId = 'primary', eventId, eventData) {
        try {
            const event = {
                summary: eventData.title,
                location: eventData.location,
                description: eventData.notes || eventData.description,
                start: {
                    dateTime: eventData.start.toISOString(),
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
                end: {
                    dateTime: eventData.end.toISOString(),
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
            };

            const response = await gapi.client.calendar.events.update({
                calendarId: calendarId,
                eventId: eventId,
                resource: event,
            });

            console.log('✅ Event updated:', response.result.htmlLink);
            return this.parseEvent(response.result);
        } catch (error) {
            console.error('Error updating event:', error);
            throw error;
        }
    }

    /**
     * Delete an event
     * @param {string} calendarId - Calendar ID
     * @param {string} eventId - Event ID
     */
    async deleteEvent(calendarId = 'primary', eventId) {
        try {
            await gapi.client.calendar.events.delete({
                calendarId: calendarId,
                eventId: eventId,
            });

            console.log('✅ Event deleted');
        } catch (error) {
            console.error('Error deleting event:', error);
            throw error;
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.accessToken !== null && gapi.client.getToken() !== null;
    }
}

// Make available globally
window.CalendarAPI = CalendarAPI;
