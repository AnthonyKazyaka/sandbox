/**
 * Event List Export
 * Generates formatted text lists of work calendar events
 */

class EventListExporter {
    constructor(eventProcessor) {
        this.eventProcessor = eventProcessor;
    }

    /**
     * Format service type from event title for display
     * @param {Object} event - Event object
     * @returns {string} Formatted service type
     */
    formatServiceType(event) {
        const title = event.title || '';
        const titleLower = title.toLowerCase();

        // Check for overnight/housesit
        if (this.eventProcessor.isOvernightEvent(event)) {
            return 'Overnight/Housesit';
        }

        // Check for nail trim
        if (titleLower.includes('nail trim') || titleLower.includes('nails')) {
            return 'Nail Trim';
        }

        // Extract duration from title (15, 20, 30, 45, 60 minutes)
        const durationMatch = title.match(/\b(15|20|30|45|60)\b/i);
        if (durationMatch) {
            return `${durationMatch[1]}-min`;
        }

        // Check for meet & greet
        if (this.eventProcessor.workEventPatterns.meetAndGreet.test(title)) {
            return 'Meet & Greet';
        }

        // Default to the event type or 'Visit'
        return event.type === 'walk' ? 'Dog Walk' : 'Visit';
    }

    /**
     * Extract client/pet name from event title
     * @param {string} title - Event title
     * @returns {string} Client/pet name
     */
    extractClientName(title) {
        if (!title) return '';

        // Remove parenthetical notes
        let cleanTitle = title.replace(/\([^)]*\)/g, '').trim();

        // Try to extract name before dash or hyphen
        const dashMatch = cleanTitle.match(/^([^-–—]+)/);
        if (dashMatch) {
            let name = dashMatch[1].trim();

            // Remove service type indicators from the end
            name = name.replace(/\b(15|20|30|45|60)\s*$/i, '').trim();
            name = name.replace(/\b(MG|M&G|HS|Housesit)\s*$/i, '').trim();

            return name;
        }

        return cleanTitle;
    }

    /**
     * Format date for display
     * @param {Date} date - Date object
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const dayName = days[date.getDay()];
        const month = months[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();

        return `${dayName} ${month} ${day}, ${year}`;
    }

    /**
     * Format time for display
     * @param {Date} date - Date object
     * @returns {string} Formatted time string (e.g., "2:30 PM")
     */
    formatTime(date) {
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';

        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12

        const minuteStr = minutes < 10 ? '0' + minutes : minutes;

        return `${hours}:${minuteStr} ${ampm}`;
    }

    /**
     * Generate text list of work events
     * @param {Array} events - Array of all events
     * @param {Object} options - Export options
     * @returns {string} Formatted text list
     */
    generateTextList(events, options = {}) {
        const {
            startDate = null,
            endDate = null,
            includeTime = false,
            groupByDate = true,
            sortOrder = 'asc' // 'asc' or 'desc'
        } = options;

        // Filter for work events only
        let workEvents = events.filter(event => {
            if (!this.eventProcessor.isWorkEvent(event)) {
                return false;
            }

            // Filter by date range if specified
            const eventDate = new Date(event.start);

            if (startDate && eventDate < startDate) {
                return false;
            }

            if (endDate && eventDate > endDate) {
                return false;
            }

            return true;
        });

        // Sort events by start date
        workEvents.sort((a, b) => {
            const dateA = new Date(a.start);
            const dateB = new Date(b.start);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

        if (workEvents.length === 0) {
            return 'No work events found in the selected date range.';
        }

        let output = '';

        // Add summary header
        const totalEvents = workEvents.length;
        const firstEventDate = this.formatDate(new Date(workEvents[0].start));
        const lastEventDate = this.formatDate(new Date(workEvents[workEvents.length - 1].start));

        if (groupByDate) {
            output += `Work Events Summary\n`;
            output += `${firstEventDate} - ${lastEventDate}\n`;
            output += `Total: ${totalEvents} event${totalEvents !== 1 ? 's' : ''}\n`;
            output += `${'='.repeat(50)}\n\n`;
        }

        if (groupByDate) {
            // Group events by date
            const eventsByDate = new Map();

            workEvents.forEach(event => {
                const dateKey = this.formatDate(new Date(event.start));

                if (!eventsByDate.has(dateKey)) {
                    eventsByDate.set(dateKey, []);
                }

                eventsByDate.get(dateKey).push(event);
            });

            // Generate grouped output
            for (const [date, dateEvents] of eventsByDate) {
                const eventCount = dateEvents.length;
                const countLabel = eventCount === 1 ? '1 event' : `${eventCount} events`;
                output += `${date} (${countLabel})\n`;

                dateEvents.forEach(event => {
                    const client = this.extractClientName(event.title);
                    const serviceType = this.formatServiceType(event);
                    const time = includeTime ? ` @ ${this.formatTime(new Date(event.start))}` : '';

                    output += `  • ${client} - ${serviceType}${time}\n`;
                });

                output += '\n';
            }
        } else {
            // Simple list without grouping
            workEvents.forEach(event => {
                const date = this.formatDate(new Date(event.start));
                const client = this.extractClientName(event.title);
                const serviceType = this.formatServiceType(event);
                const time = includeTime ? ` @ ${this.formatTime(new Date(event.start))}` : '';

                output += `${date} | ${client} | ${serviceType}${time}\n`;
            });
        }

        return output.trim();
    }

    /**
     * Generate CSV format of work events
     * @param {Array} events - Array of all events
     * @param {Object} options - Export options
     * @returns {string} CSV formatted string
     */
    generateCSV(events, options = {}) {
        const {
            startDate = null,
            endDate = null
        } = options;

        // Filter for work events only
        let workEvents = events.filter(event => {
            if (!this.eventProcessor.isWorkEvent(event)) {
                return false;
            }

            const eventDate = new Date(event.start);

            if (startDate && eventDate < startDate) {
                return false;
            }

            if (endDate && eventDate > endDate) {
                return false;
            }

            return true;
        });

        // Sort by date
        workEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

        // CSV header
        let csv = 'Date,Time,Client/Pet,Service Type,Duration\n';

        // CSV rows
        workEvents.forEach(event => {
            const date = this.formatDate(new Date(event.start));
            const time = this.formatTime(new Date(event.start));
            const client = this.escapeCSV(this.extractClientName(event.title));
            const serviceType = this.escapeCSV(this.formatServiceType(event));

            // Calculate duration
            const start = new Date(event.start);
            const end = new Date(event.end);
            const durationMinutes = Math.round((end - start) / (1000 * 60));
            const durationHours = Math.floor(durationMinutes / 60);
            const remainingMinutes = durationMinutes % 60;
            const duration = durationHours > 0
                ? `${durationHours}h ${remainingMinutes}m`
                : `${remainingMinutes}m`;

            csv += `${date},${time},${client},${serviceType},${duration}\n`;
        });

        return csv;
    }

    /**
     * Escape CSV field values
     * @param {string} value - Value to escape
     * @returns {string} Escaped value
     */
    escapeCSV(value) {
        if (!value) return '';

        // If value contains comma, quote, or newline, wrap in quotes and escape quotes
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
        }

        return value;
    }

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} Success status
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);

            // Fallback method
            try {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                const success = document.execCommand('copy');
                document.body.removeChild(textarea);
                return success;
            } catch (fallbackError) {
                console.error('Fallback copy failed:', fallbackError);
                return false;
            }
        }
    }

    /**
     * Download text as file
     * @param {string} text - Text content
     * @param {string} filename - Filename
     * @param {string} mimeType - MIME type
     */
    downloadAsFile(text, filename, mimeType = 'text/plain') {
        const blob = new Blob([text], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }
}

// Make available globally
window.EventListExporter = EventListExporter;
