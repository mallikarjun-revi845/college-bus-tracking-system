import React, { useState, useEffect } from 'react';
import { formatETA, getStatusEmoji } from '../utils/formatting';

function BusCard({ bus, onClick, showETA = false, eta = null }) {
  return (
    <div
      onClick={onClick}
      className="card-hover cursor-pointer border-l-4 border-blue-500 hover:border-blue-600"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-800">{bus.busNumber}</h3>
          <p className="text-sm text-gray-600">{bus.registrationNumber}</p>
        </div>
        <span className="text-2xl">{getStatusEmoji(bus.status)}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div>
          <p className="text-gray-600">Capacity</p>
          <p className="font-semibold text-gray-800">{bus.capacity} seats</p>
        </div>
        <div>
          <p className="text-gray-600">Status</p>
          <p className="font-semibold text-gray-800">{bus.status}</p>
        </div>
      </div>

      {showETA && eta && (
        <div className="bg-blue-50 rounded p-2 text-center">
          <p className="text-xs text-gray-600">Estimated Arrival</p>
          <p className="font-bold text-lg text-blue-600">{formatETA(eta)}</p>
        </div>
      )}

      {bus.assignedRoute && (
        <div className="bg-gray-50 rounded p-2 mt-3">
          <p className="text-xs text-gray-600">Route</p>
          <p className="font-semibold text-gray-800">{bus.assignedRoute.name}</p>
        </div>
      )}
    </div>
  );
}

export default BusCard;
