import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Map from '../components/Map';
import Alert from '../components/Alert';
import { BusMarker, StopMarker, RouteLine } from '../components/MapMarkers';
import TripStatus from '../components/TripStatus';
import { useBusTracking } from '../context/BusTrackingContext';
import { busAPI, tripAPI } from '../services/api';
import { formatDistance, formatSpeed } from '../utils/formatting';
import { Loader } from 'lucide-react';

function TrackingPage() {
  const { busId } = useParams();
  const { subscribeToBus, unsubscribeFromBus, getBusLocation, socketConnected } = useBusTracking();
  const [bus, setBus] = useState(null);
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const busResponse = await busAPI.getById(busId);
        setBus(busResponse.data.bus);

        // Get active trip
        const tripsResponse = await busAPI.getTrips(busId, { status: 'IN_PROGRESS' });
        if (tripsResponse.data.trips.length > 0) {
          setTrip(tripsResponse.data.trips[0]);
        }

        subscribeToBus(busId);
      } catch (err) {
        setError('Failed to load bus information');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      unsubscribeFromBus(busId);
    };
  }, [busId, subscribeToBus, unsubscribeFromBus]);

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

  const location = getBusLocation(busId);
  const centerCoords = location
    ? [location.latitude, location.longitude]
    : bus?.assignedRoute?.stops?.[0]
    ? [bus.assignedRoute.stops[0].busStop.latitude, bus.assignedRoute.stops[0].busStop.longitude]
    : [40.7128, -74.006];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-64px)]">
        {/* Map */}
        <div className="lg:col-span-2 h-full">
          <Map center={centerCoords}>
            {bus && location && <BusMarker bus={bus} location={location} />}
            {bus?.assignedRoute?.stops?.map((routeStop) => (
              <StopMarker key={routeStop.id} stop={routeStop.busStop} />
            ))}
            {bus?.assignedRoute?.stops && <RouteLine stops={bus.assignedRoute.stops.map(rs => rs.busStop)} />}
          </Map>
        </div>

        {/* Info Panel */}
        <div className="overflow-y-auto p-4 space-y-4">
          {error && (
            <Alert type="error" title="Error" message={error} onClose={() => setError(null)} />
          )}

          {bus && <TripStatus trip={trip || bus} socketConnected={socketConnected} />}

          {location && (
            <div className="card">
              <h3 className="font-bold text-lg mb-3">Location Details</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">Latitude:</span> {location.latitude.toFixed(6)}
                </p>
                <p>
                  <span className="font-semibold">Longitude:</span> {location.longitude.toFixed(6)}
                </p>
                {location.accuracy && (
                  <p>
                    <span className="font-semibold">Accuracy:</span> {location.accuracy.toFixed(2)}m
                  </p>
                )}
                {location.speed && (
                  <p>
                    <span className="font-semibold">Speed:</span> {formatSpeed(location.speed)}
                  </p>
                )}
                <p>
                  <span className="font-semibold">Last Update:</span>{' '}
                  {new Date(location.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          )}

          {bus?.assignedRoute?.stops && (
            <div className="card">
              <h3 className="font-bold text-lg mb-3">Route Stops</h3>
              <div className="space-y-2">
                {bus.assignedRoute.stops.map((routeStop, idx) => (
                  <div key={routeStop.id} className="pb-2 border-b last:border-b-0">
                    <p className="font-semibold text-sm">
                      {idx + 1}. {routeStop.busStop.name}
                    </p>
                    {routeStop.estimatedMinutes && (
                      <p className="text-xs text-gray-600">
                        {routeStop.estimatedMinutes} min from previous
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

export default TrackingPage;
