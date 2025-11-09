/**
 * Workload Analyzer
 * Analyzes calendar events to identify burnout risks and provide recommendations
 */

class WorkloadAnalyzer {
    constructor(thresholds = {}) {
        this.thresholds = {
            comfortable: 6,
            busy: 8,
            high: 10,
            burnout: 12,
            ...thresholds
        };
    }

    /**
     * Update thresholds
     */
    updateThresholds(newThresholds) {
        this.thresholds = { ...this.thresholds, ...newThresholds };
    }

    /**
     * Analyze a single day's workload
     * @param {Array} events - Events for the day
     * @param {Date} date - The date being analyzed
     * @returns {Object} Analysis results
     */
    analyzeDay(events, date) {
        // Calculate total working time
        const totalMinutes = events.reduce((sum, event) => {
            const duration = (event.end - event.start) / (1000 * 60);
            return sum + duration;
        }, 0);

        const totalHours = totalMinutes / 60;

        // Calculate appointment density (appointments per hour)
        const workingHours = this.calculateWorkingHours(events);
        const density = workingHours > 0 ? events.length / workingHours : 0;

        // Calculate average break time between appointments
        const avgBreakTime = this.calculateAverageBreakTime(events);

        // Calculate travel time (mock for now)
        const estimatedTravelTime = this.estimateTravelTime(events);

        // Determine workload level
        const level = this.getWorkloadLevel(totalHours);

        // Calculate risk score (0-100)
        const riskScore = this.calculateRiskScore({
            totalHours,
            density,
            avgBreakTime,
            travelTime: estimatedTravelTime
        });

        // Generate recommendations
        const recommendations = this.generateRecommendations({
            level,
            riskScore,
            totalHours,
            density,
            avgBreakTime,
            eventCount: events.length
        });

        return {
            date,
            totalHours: parseFloat(totalHours.toFixed(2)),
            totalMinutes: Math.round(totalMinutes),
            eventCount: events.length,
            density: parseFloat(density.toFixed(2)),
            avgBreakTime: Math.round(avgBreakTime),
            estimatedTravelTime: Math.round(estimatedTravelTime),
            workloadLevel: level,
            riskScore: Math.round(riskScore),
            recommendations,
            events
        };
    }

    /**
     * Analyze a week's workload
     * @param {Array} events - All events
     * @param {Date} weekStart - Start of week
     * @returns {Object} Weekly analysis
     */
    analyzeWeek(events, weekStart) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const weekEvents = events.filter(event =>
            event.start >= weekStart && event.start < weekEnd
        );

        const dailyAnalyses = [];
        const currentDate = new Date(weekStart);

        for (let i = 0; i < 7; i++) {
            const dayStart = new Date(currentDate);
            dayStart.setHours(0, 0, 0, 0);

            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);

            const dayEvents = weekEvents.filter(event => {
                const eventDate = new Date(event.start);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate.getTime() === dayStart.getTime();
            });

            dailyAnalyses.push(this.analyzeDay(dayEvents, new Date(dayStart)));

            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Calculate weekly metrics
        const totalWeekHours = dailyAnalyses.reduce((sum, day) => sum + day.totalHours, 0);
        const totalWeekEvents = dailyAnalyses.reduce((sum, day) => sum + day.eventCount, 0);
        const avgDailyHours = totalWeekHours / 7;
        const consecutiveWorkDays = this.calculateConsecutiveWorkDays(dailyAnalyses);
        const burnoutDays = dailyAnalyses.filter(day => day.workloadLevel === 'burnout').length;
        const highWorkloadDays = dailyAnalyses.filter(day =>
            day.workloadLevel === 'high' || day.workloadLevel === 'burnout'
        ).length;

        // Calculate weekly risk score
        const weeklyRiskScore = this.calculateWeeklyRiskScore({
            avgDailyHours,
            consecutiveWorkDays,
            burnoutDays,
            highWorkloadDays,
            totalWeekHours
        });

        return {
            weekStart,
            weekEnd,
            dailyAnalyses,
            totalWeekHours: parseFloat(totalWeekHours.toFixed(2)),
            totalWeekEvents,
            avgDailyHours: parseFloat(avgDailyHours.toFixed(2)),
            consecutiveWorkDays,
            burnoutDays,
            highWorkloadDays,
            weeklyRiskScore: Math.round(weeklyRiskScore),
            recommendations: this.generateWeeklyRecommendations({
                avgDailyHours,
                consecutiveWorkDays,
                burnoutDays,
                highWorkloadDays
            })
        };
    }

    /**
     * Calculate working hours span (first to last appointment)
     */
    calculateWorkingHours(events) {
        if (events.length === 0) return 0;

        const sortedEvents = [...events].sort((a, b) => a.start - b.start);
        const firstEvent = sortedEvents[0];
        const lastEvent = sortedEvents[sortedEvents.length - 1];

        const span = (lastEvent.end - firstEvent.start) / (1000 * 60 * 60);
        return Math.max(span, 0);
    }

    /**
     * Calculate average break time between appointments
     */
    calculateAverageBreakTime(events) {
        if (events.length <= 1) return 0;

        const sortedEvents = [...events].sort((a, b) => a.start - b.start);
        let totalBreakTime = 0;
        let breakCount = 0;

        for (let i = 0; i < sortedEvents.length - 1; i++) {
            const breakTime = (sortedEvents[i + 1].start - sortedEvents[i].end) / (1000 * 60);
            if (breakTime >= 0) {
                totalBreakTime += breakTime;
                breakCount++;
            }
        }

        return breakCount > 0 ? totalBreakTime / breakCount : 0;
    }

    /**
     * Estimate travel time (mock - would use Google Maps API)
     */
    estimateTravelTime(events) {
        // Mock: assume 15 minutes travel time per appointment
        return events.length * 15;
    }

    /**
     * Get workload level based on hours
     */
    getWorkloadLevel(hours) {
        if (hours >= this.thresholds.burnout) return 'burnout';
        if (hours >= this.thresholds.high) return 'high';
        if (hours >= this.thresholds.busy) return 'busy';
        return 'comfortable';
    }

    /**
     * Calculate risk score (0-100)
     * Higher score = higher burnout risk
     */
    calculateRiskScore({ totalHours, density, avgBreakTime, travelTime }) {
        let score = 0;

        // Hours factor (0-40 points)
        const hoursRatio = totalHours / this.thresholds.burnout;
        score += Math.min(hoursRatio * 40, 40);

        // Density factor (0-25 points)
        // High density (many appointments per hour) increases risk
        if (density > 1.5) score += 25;
        else if (density > 1) score += 15;
        else if (density > 0.5) score += 5;

        // Break time factor (0-20 points)
        // Short breaks increase risk
        if (avgBreakTime < 15) score += 20;
        else if (avgBreakTime < 30) score += 15;
        else if (avgBreakTime < 60) score += 10;
        else score += 5;

        // Travel time factor (0-15 points)
        const travelHours = travelTime / 60;
        if (travelHours > 3) score += 15;
        else if (travelHours > 2) score += 10;
        else if (travelHours > 1) score += 5;

        return Math.min(score, 100);
    }

    /**
     * Calculate consecutive work days
     */
    calculateConsecutiveWorkDays(dailyAnalyses) {
        let maxConsecutive = 0;
        let currentConsecutive = 0;

        dailyAnalyses.forEach(day => {
            if (day.eventCount > 0) {
                currentConsecutive++;
                maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
            } else {
                currentConsecutive = 0;
            }
        });

        return maxConsecutive;
    }

    /**
     * Calculate weekly risk score
     */
    calculateWeeklyRiskScore({ avgDailyHours, consecutiveWorkDays, burnoutDays, highWorkloadDays, totalWeekHours }) {
        let score = 0;

        // Average daily hours (0-30 points)
        const avgRatio = avgDailyHours / this.thresholds.burnout;
        score += Math.min(avgRatio * 30, 30);

        // Consecutive work days (0-25 points)
        if (consecutiveWorkDays >= 7) score += 25;
        else if (consecutiveWorkDays >= 6) score += 20;
        else if (consecutiveWorkDays >= 5) score += 15;
        else if (consecutiveWorkDays >= 4) score += 10;

        // Burnout days (0-30 points)
        score += burnoutDays * 10;

        // High workload days (0-15 points)
        score += highWorkloadDays * 3;

        return Math.min(score, 100);
    }

    /**
     * Generate daily recommendations
     */
    generateRecommendations({ level, riskScore, totalHours, density, avgBreakTime, eventCount }) {
        const recommendations = [];

        if (level === 'burnout') {
            recommendations.push({
                type: 'critical',
                icon: '🚨',
                title: 'Burnout Risk',
                message: `${totalHours.toFixed(1)} hours scheduled exceeds your burnout threshold (${this.thresholds.burnout}h). Strongly consider declining new bookings or rescheduling.`
            });
        } else if (level === 'high') {
            recommendations.push({
                type: 'warning',
                icon: '⚠️',
                title: 'High Workload',
                message: `${totalHours.toFixed(1)} hours scheduled. Be very selective with new bookings to avoid burnout.`
            });
        } else if (level === 'busy') {
            recommendations.push({
                type: 'info',
                icon: '📊',
                title: 'Busy Day',
                message: `${totalHours.toFixed(1)} hours scheduled. You're approaching your comfortable capacity.`
            });
        } else if (eventCount > 0) {
            recommendations.push({
                type: 'success',
                icon: '✅',
                title: 'Good Capacity',
                message: `${totalHours.toFixed(1)} hours scheduled. You have good capacity for additional bookings.`
            });
        }

        // Break time recommendations
        if (avgBreakTime < 15 && eventCount > 2) {
            recommendations.push({
                type: 'warning',
                icon: '⏰',
                title: 'Short Breaks',
                message: `Average ${Math.round(avgBreakTime)} minutes between appointments. Consider spacing appointments further apart.`
            });
        }

        // Density recommendations
        if (density > 1.5) {
            recommendations.push({
                type: 'info',
                icon: '📍',
                title: 'High Appointment Density',
                message: `${eventCount} appointments in a short timeframe. Ensure routes are optimized to minimize travel time.`
            });
        }

        // Risk-based recommendations
        if (riskScore > 75) {
            recommendations.push({
                type: 'critical',
                icon: '🛑',
                title: 'High Burnout Risk',
                message: `Risk score: ${riskScore}/100. Take extra care to maintain work-life balance and avoid overcommitment.`
            });
        }

        return recommendations;
    }

    /**
     * Generate weekly recommendations
     */
    generateWeeklyRecommendations({ avgDailyHours, consecutiveWorkDays, burnoutDays, highWorkloadDays }) {
        const recommendations = [];

        if (burnoutDays > 0) {
            recommendations.push({
                type: 'critical',
                icon: '🚨',
                title: 'Multiple Burnout Risk Days',
                message: `${burnoutDays} day(s) this week exceed burnout threshold. Strongly recommend reducing workload.`
            });
        }

        if (consecutiveWorkDays >= 7) {
            recommendations.push({
                type: 'warning',
                icon: '😴',
                title: 'No Rest Days',
                message: 'You have no days off this week. Schedule at least one rest day for recovery.'
            });
        } else if (consecutiveWorkDays >= 5) {
            recommendations.push({
                type: 'info',
                icon: '📅',
                title: 'Limited Rest',
                message: `${consecutiveWorkDays} consecutive work days. Consider adding a rest day for better balance.`
            });
        }

        if (avgDailyHours > this.thresholds.busy) {
            recommendations.push({
                type: 'warning',
                icon: '⏱️',
                title: 'High Weekly Average',
                message: `Averaging ${avgDailyHours.toFixed(1)} hours/day. Consider reducing bookings next week.`
            });
        }

        if (highWorkloadDays >= 4) {
            recommendations.push({
                type: 'info',
                icon: '📊',
                title: 'Busy Week',
                message: `${highWorkloadDays} days with high workload. Plan rest time for next week.`
            });
        }

        // Positive reinforcement
        if (avgDailyHours < this.thresholds.comfortable && burnoutDays === 0) {
            recommendations.push({
                type: 'success',
                icon: '🌟',
                title: 'Healthy Workload',
                message: 'Your weekly workload looks sustainable. Great job maintaining balance!'
            });
        }

        return recommendations;
    }

    /**
     * Find optimal days for time off
     * @param {Array} dailyAnalyses - Week of daily analyses
     * @returns {Array} Suggested days off
     */
    findOptimalTimeOff(dailyAnalyses) {
        // Sort days by workload (ascending)
        const sortedDays = [...dailyAnalyses]
            .map((day, index) => ({ day, index }))
            .sort((a, b) => a.day.totalHours - b.day.totalHours);

        // Suggest the lightest workload days
        return sortedDays.slice(0, 2).map(item => ({
            date: item.day.date,
            currentHours: item.day.totalHours,
            currentEvents: item.day.eventCount,
            reason: item.day.totalHours === 0
                ? 'Already a rest day'
                : `Light workload (${item.day.totalHours.toFixed(1)}h) - easiest to reschedule`
        }));
    }

    /**
     * Assess capacity for new booking
     * @param {Object} dailyAnalysis - Analysis for the day
     * @param {number} newBookingHours - Hours for potential new booking
     * @returns {Object} Capacity assessment
     */
    assessNewBookingCapacity(dailyAnalysis, newBookingHours) {
        const projectedHours = dailyAnalysis.totalHours + newBookingHours;
        const projectedLevel = this.getWorkloadLevel(projectedHours);

        let recommendation = '';
        let accept = true;

        if (projectedLevel === 'burnout') {
            recommendation = 'Decline - would exceed burnout threshold';
            accept = false;
        } else if (projectedLevel === 'high') {
            recommendation = 'Consider carefully - would result in high workload';
            accept = 'conditional';
        } else if (projectedLevel === 'busy') {
            recommendation = 'Acceptable - would be busy but manageable';
            accept = true;
        } else {
            recommendation = 'Accept - within comfortable capacity';
            accept = true;
        }

        return {
            currentHours: dailyAnalysis.totalHours,
            newBookingHours,
            projectedHours,
            currentLevel: dailyAnalysis.workloadLevel,
            projectedLevel,
            recommendation,
            accept,
            availableCapacity: Math.max(0, this.thresholds.burnout - projectedHours)
        };
    }
}

// Make available globally
window.WorkloadAnalyzer = WorkloadAnalyzer;
