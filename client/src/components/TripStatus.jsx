import React from 'react';
import { Clock, MapPin, User, Wifi, WifiOff } from 'lucide-react';
import { formatTimeOnly, formatDateTime } from '../utils/formatting';

function TripStatus({ trip, socketConnected }) {
  return (
    <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Trip Status</h2>
          <p className="text-sm text-gray-600 mt-1">{trip.bus?.busNumber}</p>
        </div>
        <div className="text-3xl">{trip.status === 'IN_PROGRESS' ? '🚗' : '✓'}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <Clock className="text-blue-600" size={20} />
          <div>
            <p className="text-xs text-gray-600">Status</p>
            <p className="font-semibold text-gray-800">{trip.status}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {socketConnected ? (
            <Wifi className="text-green-600" size={20} />
          ) : (
            <WifiOff className="text-red-600" size={20} />
          )}
          <div>
            <p className="text-xs text-gray-600">Connection</p>
            <p className="font-semibold text-gray-800">
              {socketConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
        </div>

        {trip.actualStartTime && (
          <div className="flex items-center gap-3">
            <Clock className="text-blue-600" size={20} />
            <div>
              <p className="text-xs text-gray-600">Started</p>
              <p className="font-semibold text-gray-800">
                {formatTimeOnly(trip.actualStartTime)}
              </p>
            </div>
          </div>
        )}

        {trip.actualEndTime && (
          <div className="flex items-center gap-3">
            <Clock className="text-green-600" size={20} />
            <div>
              <p className="text-xs text-gray-600">Ended</p>
              <p className="font-semibold text-gray-800">
                {formatTimeOnly(trip.actualEndTime)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-white rounded border border-gray-200">
        <p className="text-xs text-gray-600">Route</p>
        <p className="font-semibold text-gray-800">{trip.route?.name}</p>
      </div>
    </div>
  );
}

export default TripStatus;
