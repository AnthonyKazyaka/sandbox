/**
 * GPS Admin - Event Processing
 * Event detection, filtering, and classification logic
 */

class EventProcessor {
    constructor() {
        // Work event detection patterns
        this.workEventPatterns = {
            meetAndGreet: /\b(MG|M&G|Meet\s*&\s*Greet)\b/i,
            minutesSuffix: /\b(15|20|30|45|60)\b(?:\s*[-–]?\s*(Start|1st|2nd|3rd|Last))?$/i,
            houseSitSuffix: /\b(HS|Housesit)\b(?:\s*[-–]?\s*(Start|1st|2nd|3rd|Last))?$/i
        };

        // Personal event patterns (for exclusion)
        this.personalEventPatterns = {
            offDay: /^\s*✨\s*off\s*✨|^\s*off\s*[-–]/i,
            personalKeywords: /\b(lunch|appointment with|therapy|birthday|anniversary|shower)\b/i,
            medicalPersonal: /\b(doctor|dentist|massage|nails|haircut|tattoo|yoga)\b/i,
            household: /\b(house clean|kroger|grocery)\b/i,
            socialBusiness: /\b(momentum|meeting with|webinar)\b/i
        };
    }

    /**
     * Clean title by removing parenthetical notes that might interfere with pattern matching
     * @param {string} title - Raw event title
     * @returns {string} Cleaned title
     */
    cleanTitle(title) {
        if (!title || typeof title !== 'string') return '';
        // Remove content in parentheses but preserve the rest
        return title.replace(/\([^)]*\)/g, '').trim();
    }

    /**
     * Check if event is definitely personal based on exclusion patterns
     * @param {string} title - Event title
     * @returns {boolean} True if definitely personal
     */
    isDefinitelyPersonal(title) {
        if (!title || typeof title !== 'string') return false;
        
        const trimmedTitle = title.trim();
        
        // Check all personal event patterns
        return Object.values(this.personalEventPatterns).some(pattern => 
            pattern.test(trimmedTitle)
        );
    }

    /**
     * Check if an event is a work event based on title patterns
     * @param {string|Object} titleOrEvent - Event title string or event object
     * @returns {boolean} True if work event, false otherwise
     */
    isWorkEvent(titleOrEvent) {
        // Accept either string title or event object for flexibility
        const title = typeof titleOrEvent === 'string' ? titleOrEvent : titleOrEvent?.title;
        
        if (!title || typeof title !== 'string') return false;

        const trimmedTitle = title.trim();

        // Step 1: Check exclusion list first (most efficient)
        if (this.isDefinitelyPersonal(trimmedTitle)) {
            return false;
        }

        // Step 2: Clean title to handle parenthetical notes
        // Example: "Pixel 30 (forgot to cancel)" -> "Pixel 30"
        const cleanedTitle = this.cleanTitle(trimmedTitle);

        // Step 3: Check work event patterns
        if (this.workEventPatterns.meetAndGreet.test(cleanedTitle)) {
            return true;
        }

        if (this.workEventPatterns.minutesSuffix.test(cleanedTitle)) {
            return true;
        }

        if (this.workEventPatterns.houseSitSuffix.test(cleanedTitle)) {
            return true;
        }

        return false;
    }

    /**
     * Check if an event is an overnight/housesit event
     * @param {Object} event - Event object
     * @returns {boolean} True if overnight event
     */
    isOvernightEvent(event) {
        if (!event || !event.title) return false;
        
        const titleLower = event.title.toLowerCase();
        
        // Check type
        if (event.type === 'overnight') return true;
        
        // Check title patterns
        return titleLower.includes('overnight') ||
               titleLower.includes('housesit') ||
               titleLower.includes('house sit') ||
               /\bhs\b/i.test(event.title) ||
               /housesit/i.test(event.title);
    }

    /**
     * Detect event type from title
     * @param {string} title - Event title
     * @returns {string} Event type
     */
    detectEventType(title) {
        if (!title) return 'other';
        
        const titleLower = title.toLowerCase();
        
        if (this.isOvernightEvent({ title })) return 'overnight';
        if (this.workEventPatterns.meetAndGreet.test(title)) return 'meet-greet';
        if (/\b(15|20|30)\b/i.test(title)) return 'short-visit';
        if (/\b(45|60)\b/i.test(title)) return 'long-visit';
        if (titleLower.includes('walk')) return 'walk';
        
        return 'other';
    }

    /**
     * Get event type icon
     * @param {string} type - Event type
     * @returns {string} Icon emoji
     */
    getEventTypeIcon(type) {
        const icons = {
            'overnight': '🏠',
            'meet-greet': '👋',
            'short-visit': '⏱️',
            'long-visit': '⏰',
            'walk': '🐕',
            'other': '📅'
        };
        return icons[type] || icons.other;
    }

    /**
     * Get event type label
     * @param {string} type - Event type
     * @returns {string} Human-readable label
     */
    getEventTypeLabel(type) {
        const labels = {
            'overnight': 'Overnight',
            'meet-greet': 'Meet & Greet',
            'short-visit': 'Short Visit',
            'long-visit': 'Long Visit',
            'walk': 'Dog Walk',
            'other': 'Appointment'
        };
        return labels[type] || labels.other;
    }

    /**
     * Get events for a specific date
     * @param {Array} allEvents - All events
     * @param {Date} targetDate - Target date
     * @param {Object} options - Filter options
     * @returns {Array} Filtered events
     */
    getEventsForDate(allEvents, targetDate, options = {}) {
        if (!Array.isArray(allEvents) || !targetDate) return [];

        const {
            includeAllDay = true,
            includeIgnored = false,
            workEventsOnly = false
        } = options;

        const { dayStart, dayEnd } = Utils.getDayBoundaries(targetDate);

        return allEvents.filter(event => {
            if (!event) return false;

            // Check if event is on this day
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            
            const isOnDay = (eventStart >= dayStart && eventStart <= dayEnd) ||
                           (eventEnd >= dayStart && eventEnd <= dayEnd) ||
                           (eventStart <= dayStart && eventEnd >= dayEnd);
            
            if (!isOnDay) return false;

            // Apply filters
            if (!includeAllDay && event.isAllDay) return false;
            if (!includeIgnored && event.ignored) return false;
            if (workEventsOnly && !this.isWorkEvent(event)) return false;

            return true;
        });
    }

    /**
     * Calculate event duration for a specific day
     * @param {Object} event - Event object
     * @param {Date} targetDate - Target date
     * @returns {number} Duration in minutes
     */
    calculateEventDurationForDay(event, targetDate) {
        const { dayStart, dayEnd } = Utils.getDayBoundaries(targetDate);
        
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);

        // Clamp event times to the day boundaries
        const effectiveStart = eventStart < dayStart ? dayStart : eventStart;
        const effectiveEnd = eventEnd > dayEnd ? dayEnd : eventEnd;

        // Calculate duration in minutes
        const durationMs = effectiveEnd - effectiveStart;
        return Math.max(0, Math.floor(durationMs / (1000 * 60)));
    }

    /**
     * Filter and prepare events for processing
     * @param {Array} events - Raw events
     * @returns {Array} Processed events
     */
    processEvents(events) {
        if (!Array.isArray(events)) return [];

        return events
            .filter(event => event && event.title) // Remove invalid events
            .map(event => ({
                ...event,
                start: new Date(event.start),
                end: new Date(event.end),
                isWork: this.isWorkEvent(event),
                isOvernight: this.isOvernightEvent(event),
                type: this.detectEventType(event.title)
            }));
    }
}
