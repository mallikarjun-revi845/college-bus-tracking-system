import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Auth APIs
export const authAPI = {
  register: (email, password, name, role) =>
    apiClient.post('/api/auth/register', { email, password, name, role }),
  login: (email, password) =>
    apiClient.post('/api/auth/login', { email, password }),
  logout: () => apiClient.post('/api/auth/logout'),
  me: () => apiClient.get('/api/auth/me'),
};

// Bus APIs
export const busAPI = {
  getAll: (params) => apiClient.get('/api/buses', { params }),
  getById: (id) => apiClient.get(`/api/buses/${id}`),
  create: (data) => apiClient.post('/api/buses', data),
  update: (id, data) => apiClient.put(`/api/buses/${id}`, data),
  delete: (id) => apiClient.delete(`/api/buses/${id}`),
  getLocation: (id) => apiClient.get(`/api/buses/${id}/location`),
  getTrips: (id, params) => apiClient.get(`/api/buses/${id}/trips`, { params }),
};

// Route APIs
export const routeAPI = {
  getAll: (params) => apiClient.get('/api/routes', { params }),
  getById: (id) => apiClient.get(`/api/routes/${id}`),
  create: (data) => apiClient.post('/api/routes', data),
  update: (id, data) => apiClient.put(`/api/routes/${id}`, data),
  delete: (id) => apiClient.delete(`/api/routes/${id}`),
  getStops: (id) => apiClient.get(`/api/routes/${id}/stops`),
  addStop: (id, data) => apiClient.post(`/api/routes/${id}/stops`, data),
  removeStop: (id, stopId) => apiClient.delete(`/api/routes/${id}/stops/${stopId}`),
};

// Stop APIs
export const stopAPI = {
  getAll: (params) => apiClient.get('/api/stops', { params }),
  getById: (id) => apiClient.get(`/api/stops/${id}`),
  create: (data) => apiClient.post('/api/stops', data),
  update: (id, data) => apiClient.put(`/api/stops/${id}`, data),
  delete: (id) => apiClient.delete(`/api/stops/${id}`),
  getNearby: (latitude, longitude, radiusKm) =>
    apiClient.get('/api/stops/nearby', { params: { latitude, longitude, radiusKm } }),
};

// Driver APIs
export const driverAPI = {
  getAll: (params) => apiClient.get('/api/drivers', { params }),
  getById: (id) => apiClient.get(`/api/drivers/${id}`),
  create: (data) => apiClient.post('/api/drivers', data),
  update: (id, data) => apiClient.put(`/api/drivers/${id}`, data),
  delete: (id) => apiClient.delete(`/api/drivers/${id}`),
  getTrips: (id, params) => apiClient.get(`/api/drivers/${id}/trips`, { params }),
  assignBus: (id, busId) => apiClient.post(`/api/drivers/${id}/assign-bus`, { busId }),
};

// Trip APIs
export const tripAPI = {
  getAll: (params) => apiClient.get('/api/trips', { params }),
  getById: (id) => apiClient.get(`/api/trips/${id}`),
  create: (data) => apiClient.post('/api/trips', data),
  start: (id) => apiClient.post(`/api/trips/${id}/start`),
  stop: (id) => apiClient.post(`/api/trips/${id}/stop`),
  getLocations: (id, params) => apiClient.get(`/api/trips/${id}/locations`, { params }),
  getEvents: (id) => apiClient.get(`/api/trips/${id}/events`),
};

// Stats APIs
export const statsAPI = {
  getStats: () => apiClient.get('/api/stats'),
  getTripStats: (params) => apiClient.get('/api/stats/trips', { params }),
};

export default apiClient;
