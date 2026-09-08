import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Map from '../components/Map';
import Alert from '../components/Alert';
import { BusMarker, RouteLine, StopMarker } from '../components/MapMarkers';
import TripStatus from '../components/TripStatus';
import { useAuth } from '../context/AuthContext';
import { useBusTracking } from '../context/BusTrackingContext';
import { tripAPI, driverAPI } from '../services/api';
import { watchLocation, clearLocationWatch } from '../utils/geolocation';
import { Loader, MapPin, Wifi, WifiOff } from 'lucide-react';

function DriverDashboard() {
  const { user } = useAuth();
  const { socket, socketConnected } = useBusTracking();
  const [driver, setDriver] = useState(null);
  const [trip, setTrip] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationWatchId, setLocationWatchId] = useState(null);
  const [tripStarting, setTripStarting] = useState(false);
  const [tripStopping, setTripStopping] = useState(false);

  // Fetch driver info
  useEffect(() => {
    const fetchDriver = async () => {
      try {
        const response = await driverAPI.getById(user.id);
        setDriver(response.data.driver);

        // Get active or planned trip
        const tripsResponse = await driverAPI.getTrips(response.data.driver.id, {
          status: 'IN_PROGRESS,NOT_STARTED',
        });
        if (tripsResponse.data.trips.length > 0) {
          setTrip(tripsResponse.data.trips[0]);
        }
      } catch (err) {
        setError('Failed to load driver information');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchDriver();
  }, [user]);

  // Start location tracking when trip starts
  useEffect(() => {
    if (trip?.status === 'IN_PROGRESS' && socket) {
      const watchId = watchLocation(
        (newLocation) => {
          setLocation(newLocation);
          socket.emit('driver:locationUpdate', {
            tripId: trip.id,
            busId: trip.busId,
            ...newLocation,
          });
        },
        (error) => {
          setError(`Location error: ${error.message}`);
        },
        5000
      );
      setLocationWatchId(watchId);
    }

    return () => {
      if (locationWatchId) {
        clearLocationWatch(locationWatchId);
      }
    };
  }, [trip, socket]);

  const handleStartTrip = async () => {
    if (!trip) return;
    try {
      setTripStarting(true);
      await tripAPI.start(trip.id);
      setTrip({ ...trip, status: 'IN_PROGRESS', actualStartTime: new Date() });
      if (socket) {
        socket.emit('driver:tripStarted', {
          tripId: trip.id,
          busId: trip.busId,
          routeId: trip.routeId,
        });
      }
    } catch (err) {
      setError('Failed to start trip');
    } finally {
      setTripStarting(false);
    }
  };

  const handleStopTrip = async () => {
    if (!trip) return;
    try {
      setTripStopping(true);
      await tripAPI.stop(trip.id);
      setTrip({ ...trip, status: 'COMPLETED', actualEndTime: new Date() });
      if (locationWatchId) clearLocationWatch(locationWatchId);
      if (socket) {
        socket.emit('driver:tripStopped', {
          tripId: trip.id,
          busId: trip.busId,
        });
      }
    } catch (err) {
      setError('Failed to stop trip');
    } finally {
      setTripStopping(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader className="animate-spin" size={40} />
        </div>
      </div>
    );
  }

  const mapCenter = location
    ? [location.latitude, location.longitude]
    : trip?.route?.stops?.[0]?.busStop
    ? [trip.route.stops[0].busStop.latitude, trip.route.stops[0].busStop.longitude]
    : [40.7128, -74.006];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-64px)]">
        {/* Map */}
        <div className="lg:col-span-2 h-full">
          <Map center={mapCenter}>
            {location && trip && (
              <BusMarker bus={trip.bus} location={location} />
            )}
            {trip?.route?.stops?.map((routeStop) => (
              <StopMarker key={routeStop.id} stop={routeStop.busStop} />
            ))}
            {trip?.route?.stops && (
              <RouteLine stops={trip.route.stops.map((rs) => rs.busStop)} />
            )}
          </Map>
        </div>

        {/* Control Panel */}
        <div className="overflow-y-auto p-4 space-y-4">
          <div className="flex items-center gap-2">
            {socketConnected ? (
              <Wifi className="text-green-600" size={20} />
            ) : (
              <WifiOff className="text-red-600" size={20} />
            )}
            <span className={socketConnected ? 'text-green-600' : 'text-red-600'}>
              {socketConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {error && (
            <Alert type="error" title="Error" message={error} onClose={() => setError(null)} />
          )}

          {trip && <TripStatus trip={trip} socketConnected={socketConnected} />}

          {trip && (
            <div className="card space-y-3">
              {trip.status === 'NOT_STARTED' && (
                <button
                  onClick={handleStartTrip}
                  disabled={tripStarting}
                  className="btn-success w-full disabled:opacity-50"
                >
                  {tripStarting ? 'Starting...' : 'Start Trip'}
                </button>
              )}

              {trip.status === 'IN_PROGRESS' && (
                <>
                  <button
                    onClick={handleStopTrip}
                    disabled={tripStopping}
                    className="btn-danger w-full disabled:opacity-50"
                  >
                    {tripStopping ? 'Stopping...' : 'Stop Trip'}
                  </button>
                  {location && (
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-xs text-gray-600 mb-1">Current Location</p>
                      <p className="font-semibold text-sm">
                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </p>
                      {location.speed && (
                        <p className="text-xs text-gray-600 mt-1">
                          Speed: {location.speed.toFixed(1)} km/h
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {trip?.route?.stops && (
            <div className="card">
              <h3 className="font-bold text-lg mb-3">Route Stops</h3>
              <div className="space-y-2">
                {trip.route.stops.map((routeStop, idx) => (
                  <div key={routeStop.id} className="pb-2 border-b last:border-b-0">
                    <p className="font-semibold text-sm">
                      {idx + 1}. {routeStop.busStop.name}
                    </p>
                    {routeStop.estimatedMinutes && (
                      <p className="text-xs text-gray-600">
                        ~{routeStop.estimatedMinutes} min from previous
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DriverDashboard;
