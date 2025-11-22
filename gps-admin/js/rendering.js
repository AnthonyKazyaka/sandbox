/**
 * GPS Admin - Rendering Engine
 * Handles all UI rendering and DOM manipulation
 */

class RenderEngine {
    constructor(calculator, eventProcessor) {
        this.calculator = calculator;
        this.eventProcessor = eventProcessor;
    }

    /**
     * Render dashboard view
     * @param {Object} state - Application state
     */
    async renderDashboard(state) {
        await this.renderQuickStats(state);
        this.renderUpcomingAppointments(state);
        this.renderWeekComparison(state);
        this.renderWeekOverviewEnhanced(state);
        this.renderWeeklyInsights(state);
        this.renderRecommendations(state);
    }

    /**
     * Render quick stats cards
     * @param {Object} state - Application state
     */
    async renderQuickStats(state) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayEvents = this.eventProcessor.getEventsForDate(state.events, today);
        const metrics = this.calculator.calculateWorkloadMetrics(todayEvents, today, {
            includeTravel: state.settings.includeTravelTime
        });

        // Calculate travel time
        const travelMinutes = metrics.travelMinutes;

        // Update stats
        document.getElementById('stat-today').textContent = todayEvents.length;
        document.getElementById('stat-hours').textContent = Utils.formatDuration(metrics.workMinutes + travelMinutes);
        document.getElementById('stat-drive').textContent = Utils.formatDuration(travelMinutes);
        document.getElementById('stat-workload').textContent = metrics.label;
    }

    /**
     * Render week overview
     * @param {Object} state - Application state
     */
    renderWeekOverview(state) {
        const weekOverview = document.getElementById('week-overview');
        if (!weekOverview) return;

        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());

        let html = '';

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            date.setHours(0, 0, 0, 0);

            const dayEvents = this.eventProcessor.getEventsForDate(state.events, date);
            const metrics = this.calculator.calculateWorkloadMetrics(dayEvents, date, { includeTravel: true });
            
            const hours = Utils.formatHours(metrics.totalHours);
            const workloadLevel = metrics.level;

            const dateStr = date.toISOString();

            html += `
                <div class="week-day ${workloadLevel}" data-date="${dateStr}" style="cursor: pointer;">
                    <div class="week-day-name">${Utils.DAY_NAMES_SHORT[i]}</div>
                    <div class="week-day-date">${date.getDate()}</div>
                    <div class="week-day-hours">${hours}</div>
                </div>
            `;
        }

        weekOverview.innerHTML = html;

        // Add click handlers
        weekOverview.querySelectorAll('.week-day').forEach(dayElement => {
            dayElement.addEventListener('click', () => {
                const dateStr = dayElement.dataset.date;
                this.showDayDetails(state, new Date(dateStr));
            });
        });
    }

    /**
     * Render week comparison badge
     * @param {Object} state - Application state
     */
    renderWeekComparison(state) {
        const container = document.getElementById('week-comparison');
        if (!container) return;

        const comparison = this.calculator.getWeekComparison(state.events, new Date());
        const arrow = comparison.trend === 'positive' ? '↗️' : comparison.trend === 'negative' ? '↘️' : '→';
        const sign = comparison.diff >= 0 ? '+' : '';

        container.className = 'comparison-badge ' + comparison.trend;
        container.innerHTML = '<span class="trend-arrow">' + arrow + '</span> ' +
                              sign + Utils.formatHours(Math.abs(comparison.diff)) + ' vs last week';
    }

    /**
     * Show day details modal
     * @param {Object} state - Application state
     * @param {Date} date - Date to show
     */
    showDayDetails(state, date) {
        const dateKey = new Date(date);
        dateKey.setHours(0, 0, 0, 0);

        const dayEvents = this.eventProcessor.getEventsForDate(state.events, dateKey);
        const sortedEvents = dayEvents.sort((a, b) => a.start - b.start);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isToday = dateKey.getTime() === today.getTime();

        const titleElement = document.getElementById('day-details-title');
        const subtitleElement = document.getElementById('day-details-subtitle');

        titleElement.textContent = `${Utils.DAY_NAMES_LONG[dateKey.getDay()]}, ${Utils.MONTH_NAMES[dateKey.getMonth()]} ${dateKey.getDate()}`;
        if (isToday) {
            titleElement.textContent += ' (Today)';
        }

        const metrics = this.calculator.calculateWorkloadMetrics(sortedEvents, dateKey, { includeTravel: true });
        
        const workHours = Utils.formatHours(metrics.workHours);
        const travelHours = Utils.formatHours(metrics.travelHours);
        const totalHours = Utils.formatHours(metrics.totalHours);

        subtitleElement.innerHTML = `
            <span>${sortedEvents.length} appointment${sortedEvents.length !== 1 ? 's' : ''}</span> •
            <span>${workHours} work</span> •
            <span>${travelHours} travel</span> •
            <span>${totalHours} total</span>
            ${metrics.housesits.length > 0 ? ' • <span style="color: #8B5CF6; font-weight: 600;">+ housesit</span>' : ''} •
            <span class="workload-badge ${metrics.level}">${metrics.label}</span>
        `;

        this.renderDayDetailsEvents(sortedEvents);
        Utils.showModal('day-details-modal');
    }

    /**
     * Render events in day details modal
     * @param {Array} events - Events to render
     */
    renderDayDetailsEvents(events) {
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

        let html = '<div class="day-details-events">';

        events.forEach(event => {
            const startTime = event.isAllDay ? 'All Day' : Utils.formatTime(event.start);
            const duration = event.isAllDay ? 'All Day' : `${Math.round((event.end - event.start) / (1000 * 60))} min`;
            const icon = this.eventProcessor.getEventTypeIcon(event.type);

            html += `
                <div class="day-details-event ${event.ignored ? 'event-ignored' : ''}">
                    <div class="day-details-event-time">
                        <div>${icon} ${startTime}</div>
                        <div class="day-details-event-duration">${duration}</div>
                    </div>
                    <div class="day-details-event-info">
                        <div class="day-details-event-title">${event.title}</div>
                        ${event.location ? `<div class="day-details-event-location">📍 ${event.location}</div>` : ''}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Render upcoming appointments
     * @param {Object} state - Application state
     */
    renderUpcomingAppointments(state) {
        // Placeholder for upcoming appointments rendering
        // Implementation would go here
    }

    /**
     * Render weekly insights
     * @param {Object} state - Application state
     */
    renderWeeklyInsights(state) {
        // Placeholder for weekly insights rendering
        // Implementation would go here
    }

    /**
     * Render recommendations
     * @param {Object} state - Application state
     */
    renderRecommendations(state) {
        // Placeholder for recommendations rendering
        // Implementation would go here
    }

    /**
     * Render enhanced week overview with workload bars
     * @param {Object} state - Application state
     */
    renderWeekOverviewEnhanced(state) {
        // Placeholder for enhanced week overview
        // Implementation would go here
    }
}
