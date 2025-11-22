/**
 * GPS Admin - Data Management
 * Handles data persistence, caching, and state management
 */

class DataManager {
    constructor() {
        this.storageKey = 'gpsAdminData';
        this.cacheExpiry = 15 * 60 * 1000; // 15 minutes in ms
    }

    /**
     * Load data from localStorage
     * @returns {Object} Loaded data or default structure
     */
    loadData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                return data;
            }
        } catch (error) {
            console.error('Failed to load data from localStorage:', error);
        }
        
        return this.getDefaultData();
    }

    /**
     * Save data to localStorage
     * @param {Object} data - Data to save
     * @returns {boolean} Success status
     */
    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to save data to localStorage:', error);
            return false;
        }
    }

    /**
     * Get default data structure
     * @returns {Object} Default data structure
     */
    getDefaultData() {
        return {
            events: [],
            templates: [],
            availableCalendars: [],
            selectedCalendars: ['primary'],
            ignoredEventPatterns: [],
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
                includeTravelTime: true,
                eventCacheExpiry: 15
            },
            lastEventSync: null
        };
    }

    /**
     * Check if cache is expired
     * @param {number} lastSync - Last sync timestamp
     * @param {number} expiryMinutes - Cache expiry in minutes
     * @returns {boolean} True if expired
     */
    isCacheExpired(lastSync, expiryMinutes = 15) {
        if (!lastSync) return true;
        const now = Date.now();
        const expiry = expiryMinutes * 60 * 1000;
        return (now - lastSync) > expiry;
    }

    /**
     * Clear all stored data
     */
    clearData() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('Failed to clear data:', error);
            return false;
        }
    }

    /**
     * Export data as JSON
     * @param {Object} data - Data to export
     * @returns {string} JSON string
     */
    exportData(data) {
        return JSON.stringify(data, null, 2);
    }

    /**
     * Import data from JSON
     * @param {string} jsonString - JSON string to import
     * @returns {Object|null} Parsed data or null on error
     */
    importData(jsonString) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Failed to parse import data:', error);
            return null;
        }
    }

    /**
     * Get events for a specific date range
     * @param {Array} events - All events
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Array} Filtered events
     */
    getEventsInRange(events, startDate, endDate) {
        return events.filter(event => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            return (eventStart >= startDate && eventStart <= endDate) ||
                   (eventEnd >= startDate && eventEnd <= endDate) ||
                   (eventStart <= startDate && eventEnd >= endDate);
        });
    }

    /**
     * Sort events by start time
     * @param {Array} events - Events to sort
     * @returns {Array} Sorted events
     */
    sortEventsByTime(events) {
        return [...events].sort((a, b) => a.start - b.start);
    }
}
