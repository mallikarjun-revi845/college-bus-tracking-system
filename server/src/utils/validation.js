export const isValidLatitude = (value) => Number.isFinite(value) && value >= -90 && value <= 90;
export const isValidLongitude = (value) => Number.isFinite(value) && value >= -180 && value <= 180;
