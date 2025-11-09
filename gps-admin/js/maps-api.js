/**
 * Google Maps API Integration
 * Handles drive time estimation and route optimization
 */

class MapsAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.service = null;
        this.geocoder = null;
        this.isLoaded = false;
        this.cache = new Map(); // Cache for distance/duration results
    }

    /**
     * Initialize Google Maps API
     */
    async init() {
        try {
            await this.loadMapsAPI();
            this.service = new google.maps.DistanceMatrixService();
            this.geocoder = new google.maps.Geocoder();
            this.isLoaded = true;
            console.log('✅ Maps API initialized');
            return true;
        } catch (error) {
            console.error('Error initializing Maps API:', error);
            return false;
        }
    }

    /**
     * Load Google Maps API script
     */
    loadMapsAPI() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (typeof google !== 'undefined' && google.maps) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Calculate drive time between two locations
     * @param {string} origin - Starting location
     * @param {string} destination - Ending location
     * @param {Date} departureTime - When to depart (for traffic)
     * @returns {Object} Distance and duration info
     */
    async calculateDriveTime(origin, destination, departureTime = null) {
        if (!this.isLoaded) {
            throw new Error('Maps API not initialized');
        }

        // Check cache
        const cacheKey = `${origin}|${destination}`;
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            // Cache valid for 1 hour
            if (Date.now() - cached.timestamp < 3600000) {
                return cached.data;
            }
        }

        try {
            const request = {
                origins: [origin],
                destinations: [destination],
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.IMPERIAL,
            };

            // Add departure time for traffic-aware routing
            if (departureTime) {
                request.drivingOptions = {
                    departureTime: departureTime,
                    trafficModel: google.maps.TrafficModel.BEST_GUESS,
                };
            }

            const result = await new Promise((resolve, reject) => {
                this.service.getDistanceMatrix(request, (response, status) => {
                    if (status === google.maps.DistanceMatrixStatus.OK) {
                        resolve(response);
                    } else {
                        reject(new Error(`Distance Matrix request failed: ${status}`));
                    }
                });
            });

            const element = result.rows[0].elements[0];

            if (element.status !== google.maps.DistanceMatrixElementStatus.OK) {
                throw new Error(`Route not found: ${element.status}`);
            }

            const data = {
                distance: {
                    text: element.distance.text,
                    value: element.distance.value, // meters
                    miles: (element.distance.value * 0.000621371).toFixed(1),
                },
                duration: {
                    text: element.duration.text,
                    value: element.duration.value, // seconds
                    minutes: Math.round(element.duration.value / 60),
                },
                durationInTraffic: element.duration_in_traffic ? {
                    text: element.duration_in_traffic.text,
                    value: element.duration_in_traffic.value,
                    minutes: Math.round(element.duration_in_traffic.value / 60),
                } : null,
                origin: origin,
                destination: destination,
            };

            // Cache result
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now(),
            });

            return data;
        } catch (error) {
            console.error('Error calculating drive time:', error);
            throw error;
        }
    }

    /**
     * Calculate optimal route for multiple stops
     * @param {string} start - Starting location
     * @param {Array} waypoints - Array of waypoint addresses
     * @param {string} end - Ending location (optional, defaults to start)
     * @returns {Object} Optimized route info
     */
    async optimizeRoute(start, waypoints, end = null) {
        if (!this.isLoaded) {
            throw new Error('Maps API not initialized');
        }

        try {
            const directionsService = new google.maps.DirectionsService();

            const request = {
                origin: start,
                destination: end || start,
                waypoints: waypoints.map(wp => ({
                    location: wp,
                    stopover: true,
                })),
                optimizeWaypoints: true,
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.IMPERIAL,
            };

            const result = await new Promise((resolve, reject) => {
                directionsService.route(request, (response, status) => {
                    if (status === google.maps.DirectionsStatus.OK) {
                        resolve(response);
                    } else {
                        reject(new Error(`Directions request failed: ${status}`));
                    }
                });
            });

            const route = result.routes[0];
            const waypointOrder = result.routes[0].waypoint_order;

            let totalDistance = 0;
            let totalDuration = 0;

            route.legs.forEach(leg => {
                totalDistance += leg.distance.value;
                totalDuration += leg.duration.value;
            });

            return {
                waypointOrder: waypointOrder,
                optimizedWaypoints: waypointOrder.map(i => waypoints[i]),
                totalDistance: {
                    text: `${(totalDistance * 0.000621371).toFixed(1)} mi`,
                    value: totalDistance,
                    miles: (totalDistance * 0.000621371).toFixed(1),
                },
                totalDuration: {
                    text: this.formatDuration(totalDuration),
                    value: totalDuration,
                    minutes: Math.round(totalDuration / 60),
                },
                legs: route.legs.map(leg => ({
                    start: leg.start_address,
                    end: leg.end_address,
                    distance: {
                        text: leg.distance.text,
                        value: leg.distance.value,
                        miles: (leg.distance.value * 0.000621371).toFixed(1),
                    },
                    duration: {
                        text: leg.duration.text,
                        value: leg.duration.value,
                        minutes: Math.round(leg.duration.value / 60),
                    },
                })),
            };
        } catch (error) {
            console.error('Error optimizing route:', error);
            throw error;
        }
    }

    /**
     * Geocode an address to get coordinates
     * @param {string} address - Address to geocode
     * @returns {Object} Lat/lng coordinates
     */
    async geocodeAddress(address) {
        if (!this.isLoaded) {
            throw new Error('Maps API not initialized');
        }

        try {
            const result = await new Promise((resolve, reject) => {
                this.geocoder.geocode({ address: address }, (results, status) => {
                    if (status === google.maps.GeocoderStatus.OK) {
                        resolve(results[0]);
                    } else {
                        reject(new Error(`Geocoding failed: ${status}`));
                    }
                });
            });

            return {
                address: result.formatted_address,
                location: {
                    lat: result.geometry.location.lat(),
                    lng: result.geometry.location.lng(),
                },
                placeId: result.place_id,
            };
        } catch (error) {
            console.error('Error geocoding address:', error);
            throw error;
        }
    }

    /**
     * Calculate travel time for a sequence of appointments
     * @param {string} homeBase - Home/office address
     * @param {Array} appointments - Array of appointment objects with locations
     * @returns {Object} Travel analysis
     */
    async analyzeAppointmentTravel(homeBase, appointments) {
        if (appointments.length === 0) {
            return {
                totalTravelTime: 0,
                totalDistance: 0,
                segments: [],
            };
        }

        // Sort appointments by start time
        const sortedAppts = [...appointments].sort((a, b) => a.start - b.start);

        const segments = [];
        let totalTravelTime = 0;
        let totalDistance = 0;

        // Calculate travel from home to first appointment
        if (sortedAppts.length > 0) {
            const firstLeg = await this.calculateDriveTime(
                homeBase,
                sortedAppts[0].location,
                sortedAppts[0].start
            );

            segments.push({
                from: 'Home',
                to: sortedAppts[0].location,
                ...firstLeg,
            });

            totalTravelTime += firstLeg.duration.minutes;
            totalDistance += parseFloat(firstLeg.distance.miles);
        }

        // Calculate travel between appointments
        for (let i = 0; i < sortedAppts.length - 1; i++) {
            const current = sortedAppts[i];
            const next = sortedAppts[i + 1];

            const leg = await this.calculateDriveTime(
                current.location,
                next.location,
                next.start
            );

            segments.push({
                from: current.location,
                to: next.location,
                ...leg,
            });

            totalTravelTime += leg.duration.minutes;
            totalDistance += parseFloat(leg.distance.miles);
        }

        // Calculate travel from last appointment to home
        if (sortedAppts.length > 0) {
            const lastAppt = sortedAppts[sortedAppts.length - 1];
            const lastLeg = await this.calculateDriveTime(
                lastAppt.location,
                homeBase,
                lastAppt.end
            );

            segments.push({
                from: lastAppt.location,
                to: 'Home',
                ...lastLeg,
            });

            totalTravelTime += lastLeg.duration.minutes;
            totalDistance += parseFloat(lastLeg.distance.miles);
        }

        return {
            totalTravelTime,
            totalDistance: totalDistance.toFixed(1),
            segments,
            homeBase,
            appointmentCount: appointments.length,
        };
    }

    /**
     * Estimate travel time (mock fallback when API not available)
     * @param {number} distanceMiles - Distance in miles
     * @returns {number} Estimated minutes
     */
    estimateTravelTime(distanceMiles) {
        // Assume average speed of 30 mph in city
        return Math.round((distanceMiles / 30) * 60);
    }

    /**
     * Format duration in seconds to readable string
     * @param {number} seconds - Duration in seconds
     * @returns {string} Formatted duration
     */
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.round((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes} min`;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys()),
        };
    }
}

// Make available globally
window.MapsAPI = MapsAPI;
