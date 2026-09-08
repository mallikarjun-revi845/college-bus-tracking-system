import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const BusTrackingContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function BusTrackingContextProvider({ children }) {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [trips, setTrips] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [busLocations, setBusLocations] = useState(new Map());
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize Socket.IO
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setSocketConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setSocketConnected(false);
    });

    newSocket.on('server:busLocationUpdated', (data) => {
      setBusLocations((prev) => {
        const updated = new Map(prev);
        updated.set(data.busId, {
          ...data,
          timestamp: new Date(data.timestamp),
        });
        return updated;
      });
    });

    newSocket.on('server:tripStarted', (data) => {
      console.log('Trip started:', data);
    });

    newSocket.on('server:tripStopped', (data) => {
      console.log('Trip stopped:', data);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setError(error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch buses
  const fetchBuses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/buses`);
      setBuses(response.data.buses);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch buses:', err);
      setError('Failed to fetch buses');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch routes
  const fetchRoutes = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/routes`);
      setRoutes(response.data.routes);
    } catch (err) {
      console.error('Failed to fetch routes:', err);
    }
  }, []);

  // Fetch stops
  const fetchStops = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/stops`);
      setStops(response.data.stops);
    } catch (err) {
      console.error('Failed to fetch stops:', err);
    }
  }, []);

  // Fetch trips
  const fetchTrips = useCallback(async (filters = {}) => {
    try {
      const response = await axios.get(`${API_URL}/api/trips`, { params: filters });
      setTrips(response.data.trips);
    } catch (err) {
      console.error('Failed to fetch trips:', err);
    }
  }, []);

  // Subscribe to bus
  const subscribeToBus = useCallback(
    (busId) => {
      if (socket && busId) {
        socket.emit('subscribe:bus', { busId });
        setSelectedBus(busId);
      }
    },
    [socket]
  );

  // Unsubscribe from bus
  const unsubscribeFromBus = useCallback(
    (busId) => {
      if (socket && busId) {
        socket.emit('unsubscribe:bus', { busId });
      }
    },
    [socket]
  );

  // Get bus location
  const getBusLocation = useCallback((busId) => {
    return busLocations.get(busId);
  }, [busLocations]);

  // Request bus info
  const requestBusInfo = useCallback(
    (busId) => {
      if (socket) {
        socket.emit('request:busInfo', { busId });
      }
    },
    [socket]
  );

  const value = {
    buses,
    routes,
    stops,
    trips,
    selectedBus,
    busLocations,
    socket,
    socketConnected,
    loading,
    error,
    fetchBuses,
    fetchRoutes,
    fetchStops,
    fetchTrips,
    subscribeToBus,
    unsubscribeFromBus,
    getBusLocation,
    requestBusInfo,
    setError,
  };

  return (
    <BusTrackingContext.Provider value={value}>
      {children}
    </BusTrackingContext.Provider>
  );
}

export function useBusTracking() {
  const context = useContext(BusTrackingContext);
  if (!context) {
    throw new Error('useBusTracking must be used within BusTrackingContextProvider');
  }
  return context;
}

export function BusTrackingContext({ children }) {
  return <BusTrackingContextProvider>{children}</BusTrackingContextProvider>;
}
