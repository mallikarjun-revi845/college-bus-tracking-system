import { calculateDistance } from './validation.js';

class LocationSimulator {
  constructor() {
    this.routes = new Map();
    this.driverLocations = new Map();
  }

  // Initialize route with stops
  initializeRoute(tripId, stops) {
    if (!stops || stops.length === 0) return null;
    
    this.routes.set(tripId, {
      stops,
      currentStopIndex: 0,
      progress: 0, // 0-1 between stops
      createdAt: Date.now(),
    });

    return this.getNextLocation(tripId);
  }

  // Simulate movement along route
  getNextLocation(tripId) {
    const route = this.routes.get(tripId);
    if (!route) return null;

    const currentStop = route.stops[route.currentStopIndex];
    if (!currentStop) return null;

    const nextStop = route.stops[Math.min(route.currentStopIndex + 1, route.stops.length - 1)];
    
    // Progress from current to next
    route.progress = Math.min(route.progress + 0.15, 1);
    
    const lat =
      currentStop.latitude +
      (nextStop.latitude - currentStop.latitude) * route.progress;
    const lon =
      currentStop.longitude +
      (nextStop.longitude - currentStop.longitude) * route.progress;

    // Move to next stop if reached
    if (route.progress >= 1) {
      route.currentStopIndex = Math.min(route.currentStopIndex + 1, route.stops.length - 1);
      route.progress = 0;
    }

    return {
      latitude: lat,
      longitude: lon,
      accuracy: 10,
      altitude: 50,
      speed: 25 + Math.random() * 10, // 25-35 km/h
      heading: this.calculateHeading(
        currentStop.latitude,
        currentStop.longitude,
        nextStop.latitude,
        nextStop.longitude
      ),
    };
  }

  calculateHeading(lat1, lon1, lat2, lon2) {
    const dLon = lon2 - lon1;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const heading = (Math.atan2(y, x) * 180) / Math.PI;
    return (heading + 360) % 360;
  }

  // Clean up
  removeRoute(tripId) {
    this.routes.delete(tripId);
    this.driverLocations.delete(tripId);
  }
}

export default new LocationSimulator();
