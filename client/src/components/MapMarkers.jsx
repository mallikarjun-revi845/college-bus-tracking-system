import React from 'react';
import { Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';

// Create custom bus icon
const busIcon = L.divIcon({
  html: '🚌',
  iconSize: [32, 32],
  className: 'text-2xl',
});

const stopIcon = L.divIcon({
  html: '📍',
  iconSize: [32, 32],
  className: 'text-2xl',
});

function BusMarker({ bus, location }) {
  if (!location) return null;

  return (
    <Marker position={[location.latitude, location.longitude]} icon={busIcon}>
      <Popup>
        <div>
          <h3 className="font-bold">{bus.busNumber}</h3>
          <p>Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>
          <p>Updated: {new Date(location.timestamp).toLocaleTimeString()}</p>
        </div>
      </Popup>
    </Marker>
  );
}

function StopMarker({ stop }) {
  return (
    <Marker position={[stop.latitude, stop.longitude]} icon={stopIcon}>
      <Popup>
        <div>
          <h3 className="font-bold">{stop.name}</h3>
          <p className="text-sm text-gray-600">{stop.address}</p>
        </div>
      </Popup>
    </Marker>
  );
}

function RouteLine({ stops }) {
  if (!stops || stops.length < 2) return null;

  const coordinates = stops.map((stop) => [stop.latitude, stop.longitude]);

  return (
    <Polyline
      positions={coordinates}
      color="blue"
      weight={3}
      opacity={0.7}
      dashArray="5, 5"
    />
  );
}

export { BusMarker, StopMarker, RouteLine };
