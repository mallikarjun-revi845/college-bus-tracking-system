// Format distance in km
export const formatDistance = (km) => {
  if (!km) return 'N/A';
  return km < 1 ? `${(km * 1000).toFixed(0)}m` : `${km.toFixed(2)}km`;
};

// Format speed in km/h
export const formatSpeed = (speed) => {
  if (!speed) return 'N/A';
  return `${speed.toFixed(1)} km/h`;
};

// Format time in HH:MM:SS
export const formatTime = (seconds) => {
  if (!seconds || seconds < 0) return '00:00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// Format ETA in minutes
export const formatETA = (seconds) => {
  if (!seconds || seconds < 0) return 'N/A';
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} min`;
};

// Get status badge color
export const getStatusColor = (status) => {
  const statusMap = {
    ACTIVE: 'green',
    IDLE: 'yellow',
    OFFLINE: 'red',
    ON_TRIP: 'blue',
    IN_PROGRESS: 'blue',
    COMPLETED: 'green',
    NOT_STARTED: 'gray',
    CANCELLED: 'red',
  };
  return statusMap[status] || 'gray';
};

// Get status icon emoji
export const getStatusEmoji = (status) => {
  const emojiMap = {
    ACTIVE: '🟢',
    IDLE: '🟡',
    OFFLINE: '🔴',
    ON_TRIP: '🔵',
    IN_PROGRESS: '🔵',
    COMPLETED: '✅',
    NOT_STARTED: '⭕',
    CANCELLED: '❌',
  };
  return emojiMap[status] || '⭕';
};

// Calculate ETA from distance and average speed
export const calculateETA = (distance, averageSpeedKmh = 30) => {
  if (!distance || distance <= 0) return null;
  const hours = distance / averageSpeedKmh;
  return Math.round(hours * 3600); // Return in seconds
};

// Format date and time
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleString();
};

// Format time only (HH:MM)
export const formatTimeOnly = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Format date only (MM/DD/YYYY)
export const formatDateOnly = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString();
};
