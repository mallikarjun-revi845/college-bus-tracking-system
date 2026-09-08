# Architecture Documentation

## System Design

### High-Level Overview

The College Bus Tracking System follows a three-tier architecture:

1. **Presentation Layer** (React Frontend)
2. **Application Layer** (Node.js Backend with Express & Socket.IO)
3. **Data Layer** (PostgreSQL Database)

### Real-Time Tracking Flow

```
┌──────────────────┐
│  Driver Browser  │
│                  │
│ 1. User clicks   │
│    "Start Trip" │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Browser Geolocation API
│  - Request permission
│  - Get coordinates
│  - Watch position
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Socket.IO Emit  │
│  ↳ tripId        │
│  ↳ busId         │
│  ↳ latitude      │
│  ↳ longitude     │
│  ↳ timestamp     │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────┐
│       Node.js Backend                │
│                                      │
│  1. Socket.IO receives update        │
│  2. Validate coordinates & driver    │
│  3. Save to database (BusLocation)   │
│  4. Broadcast to students            │
└────────┬─────────────────────────────┘
         │
         ├─────────────────────────────┐
         │                             │
         ▼                             ▼
┌──────────────────┐        ┌──────────────────┐
│   PostgreSQL     │        │  Socket.IO Emit  │
│   - Trip record  │        │  to all students │
│   - Location log │        │  watching bus    │
└──────────────────┘        └────────┬─────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │ Student Browser  │
                            │                  │
                            │ 1. Receive event │
                            │ 2. Update marker │
                            │ 3. Update ETA    │
                            │ 4. Refresh UI    │
                            └──────────────────┘
```

## Database Schema

### Tables and Relationships

```sql
-- Users (Base authentication and profiles)
USERS
├── id (PK)
├── email (UNIQUE)
├── passwordHash
├── name
├── role (ADMIN, DRIVER, STUDENT)
├── phone
├── createdAt
└── updatedAt

-- Student Profile
STUDENTS
├── id (PK)
├── userId (FK → USERS)
├── studentId (UNIQUE)
├── department
├── year
└── registeredBuses (M2M)

-- Driver Profile
DRIVERS
├── id (PK)
├── userId (FK → USERS)
├── licenseNumber (UNIQUE)
├── licenseExpiry
├── status (ACTIVE, INACTIVE, ON_LEAVE)
└── assignedBus (FK → BUSES)

-- Bus Information
BUSES
├── id (PK)
├── busNumber (UNIQUE)
├── registrationNumber (UNIQUE)
├── capacity
├── status (ACTIVE, MAINTENANCE, INACTIVE)
├── currentDriver (FK → DRIVERS)
├── currentRoute (FK → ROUTES)
└── active (Boolean)

-- Routes
ROUTES
├── id (PK)
├── name
├── description
├── active
└── stops (1:M → ROUTESTOPS)

-- Physical Bus Stops
BUSSTO PS
├── id (PK)
├── name
├── latitude
├── longitude
├── address
├── city
└── zipcode

-- Route Stops (Join table with ordering)
ROUTESTOPS
├── id (PK)
├── routeId (FK → ROUTES)
├── busStopId (FK → BUSSTOPS)
├── stopOrder
├── estimatedMinutes (from previous stop)
└── estimatedDistance

-- Bus Trips
TRIPS
├── id (PK)
├── busId (FK → BUSES)
├── driverId (FK → DRIVERS)
├── routeId (FK → ROUTES)
├── status (NOT_STARTED, IN_PROGRESS, COMPLETED, CANCELLED)
├── startedAt
├── endedAt
├── plannedStartTime
├── actualStartTime
├── estimatedEndTime
└── actualEndTime

-- Bus Location Tracking
BUSLOCATIONS
├── id (PK)
├── busId (FK → BUSES)
├── tripId (FK → TRIPS)
├── latitude
├── longitude
├── accuracy
├── altitude
├── speed
├── heading
├── recordedAt
└── createdAt

-- Trip Stop Events
TRIPEVENTS
├── id (PK)
├── tripId (FK → TRIPS)
├── stopId (FK → BUSSTOPS)
├── eventType (ARRIVED, DEPARTED, SKIPPED)
├── timestamp
└── notes
```

## API Layer

### Authentication Endpoints

```
POST /api/auth/register
- Body: { email, password, name }
- Response: { token, user, role }
- No auth required

POST /api/auth/login
- Body: { email, password }
- Response: { token, user, role }
- No auth required

GET /api/auth/me
- Headers: { Authorization: Bearer <token> }
- Response: { user }
- Protected

POST /api/auth/logout
- Headers: { Authorization: Bearer <token> }
- Response: { success: true }
- Protected
```

### Bus Management (Admin)

```
GET /api/buses
- Query: { status?, active?, limit, offset }
- Response: { buses: [...], total }
- Admin/Driver/Student (filtered based on role)

GET /api/buses/:id
- Response: { bus }
- Public if active

POST /api/buses
- Body: { busNumber, registrationNumber, capacity, status }
- Response: { bus }
- Admin only

PUT /api/buses/:id
- Body: { busNumber?, registrationNumber?, capacity?, status?, active? }
- Response: { bus }
- Admin only

DELETE /api/buses/:id
- Response: { success: true }
- Admin only

GET /api/buses/:id/location
- Response: { latitude, longitude, timestamp, accuracy }
- Public (shows last known location)

GET /api/buses/:id/trips
- Query: { limit, offset, status? }
- Response: { trips: [...], total }
- Protected
```

### Route Management (Admin)

```
GET /api/routes
- Query: { active?, limit, offset }
- Response: { routes: [...], total }
- Admin/Driver/Student

GET /api/routes/:id
- Response: { route, stops: [...] }
- Public

POST /api/routes
- Body: { name, description, stops: [{ stopId, stopOrder, estimatedMinutes }] }
- Response: { route }
- Admin only

PUT /api/routes/:id
- Body: { name?, description?, active? }
- Response: { route }
- Admin only

DELETE /api/routes/:id
- Response: { success: true }
- Admin only

GET /api/routes/:id/stops
- Response: { stops: [{ id, name, latitude, longitude, stopOrder, ... }] }
- Public

POST /api/routes/:id/stops
- Body: { busStopId, stopOrder, estimatedMinutes }
- Response: { routeStop }
- Admin only

DELETE /api/routes/:id/stops/:stopId
- Response: { success: true }
- Admin only
```

### Stop Management (Admin)

```
GET /api/stops
- Query: { limit, offset }
- Response: { stops: [...], total }
- Public

GET /api/stops/:id
- Response: { stop }
- Public

POST /api/stops
- Body: { name, latitude, longitude, address, city, zipcode }
- Response: { stop }
- Admin only

PUT /api/stops/:id
- Body: { name?, latitude?, longitude?, address?, city?, zipcode? }
- Response: { stop }
- Admin only

DELETE /api/stops/:id
- Response: { success: true }
- Admin only

GET /api/stops/nearby
- Query: { latitude, longitude, radiusKm }
- Response: { stops: [...] }
- Public
```

### Driver Management

```
GET /api/drivers
- Query: { status?, limit, offset }
- Response: { drivers: [...], total }
- Admin only

GET /api/drivers/:id
- Response: { driver }
- Driver (self) or Admin

POST /api/drivers
- Body: { userId, licenseNumber, licenseExpiry }
- Response: { driver }
- Admin only

PUT /api/drivers/:id
- Body: { status?, licenseExpiry? }
- Response: { driver }
- Driver (self) or Admin

DELETE /api/drivers/:id
- Response: { success: true }
- Admin only

GET /api/drivers/:id/trips
- Query: { status?, limit, offset }
- Response: { trips: [...], total }
- Driver (self) or Admin

POST /api/drivers/:id/assign-bus
- Body: { busId }
- Response: { driver }
- Admin only
```

### Trip Management

```
GET /api/trips
- Query: { status?, busId?, driverId?, limit, offset }
- Response: { trips: [...], total }
- Protected (filtered by role)

GET /api/trips/:id
- Response: { trip, locations: [...], events: [...] }
- Protected

POST /api/trips
- Body: { busId, driverId, routeId, plannedStartTime }
- Response: { trip }
- Admin only

POST /api/trips/:id/start
- Body: { latitude?, longitude? }
- Response: { trip, status: IN_PROGRESS }
- Driver of trip or Admin
- Emits Socket.IO event: driver:tripStarted

POST /api/trips/:id/stop
- Body: { latitude?, longitude? }
- Response: { trip, status: COMPLETED }
- Driver of trip or Admin
- Emits Socket.IO event: driver:tripStopped

GET /api/trips/:id/locations
- Query: { limit, offset }
- Response: { locations: [...], total }
- Protected

GET /api/trips/:id/events
- Response: { events: [...] }
- Protected
```

### Statistics (Admin)

```
GET /api/stats
- Response: {
    totalBuses,
    activeBuses,
    totalDrivers,
    activeDrivers,
    totalStudents,
    activeTrips,
    completedTripsToday,
    averageTripDuration,
    busUtilization
  }
- Admin only

GET /api/stats/trips
- Query: { startDate, endDate }
- Response: { daily: [...], stats: {...} }
- Admin only
```

## Socket.IO Architecture

### Connection Flow

```javascript
// Driver Connection
const socket = io('http://localhost:5000');

socket.on('connect', () => {
  // Authenticate
  socket.emit('auth', { token: jwtToken });
});

socket.on('authenticated', (user) => {
  console.log('Connected as:', user.email);
});

// Student Connection
const socket = io('http://localhost:5000');

socket.on('connect', () => {
  socket.emit('auth', { token: jwtToken });
});

socket.on('authenticated', (user) => {
  // Subscribe to specific buses
  socket.emit('subscribe:bus', { busId });
});
```

### Event Types

```javascript
// ========== DRIVER EVENTS ==========

// Driver sends location update (every 5 seconds during active trip)
socket.emit('driver:locationUpdate', {
  tripId: 'trip-123',
  busId: 'bus-456',
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 5,
  altitude: 10,
  speed: 25,
  heading: 90,
  timestamp: Date.now()
});

// Driver starts trip
socket.emit('driver:tripStarted', {
  tripId: 'trip-123',
  busId: 'bus-456',
  routeId: 'route-789',
  startedAt: Date.now()
});

// Driver stops trip
socket.emit('driver:tripStopped', {
  tripId: 'trip-123',
  busId: 'bus-456',
  stoppedAt: Date.now(),
  totalDistance: 12.5,
  totalDuration: 1800
});

// Driver signals stop arrival
socket.emit('driver:arriveStop', {
  tripId: 'trip-123',
  stopId: 'stop-111',
  timestamp: Date.now()
});

// ========== STUDENT EVENTS ==========

// Student subscribes to bus
socket.emit('subscribe:bus', { busId: 'bus-456' });

// Student unsubscribes from bus
socket.emit('unsubscribe:bus', { busId: 'bus-456' });

// Student requests bus info
socket.emit('request:busInfo', { busId: 'bus-456' });

// ========== SERVER BROADCASTS ==========

// Broadcast to students watching a specific bus
socket.to('bus:456').emit('server:busLocationUpdated', {
  busId: 'bus-456',
  tripId: 'trip-123',
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 5,
  timestamp: Date.now(),
  speed: 25,
  heading: 90
});

// Broadcast trip started
socket.to('bus:456').emit('server:tripStarted', {
  tripId: 'trip-123',
  busId: 'bus-456',
  routeId: 'route-789',
  driverId: 'driver-222',
  startedAt: Date.now(),
  estimatedDuration: 1800
});

// Broadcast trip stopped
socket.to('bus:456').emit('server:tripStopped', {
  tripId: 'trip-123',
  busId: 'bus-456',
  stoppedAt: Date.now()
});

// Broadcast bus arrived at stop
socket.to('bus:456').emit('server:busArrivedStop', {
  tripId: 'trip-123',
  stopId: 'stop-111',
  stopName: 'Main Gate',
  timestamp: Date.now()
});

// Broadcast ETA update
socket.to('bus:456').emit('server:etaUpdated', {
  busId: 'bus-456',
  stopId: 'stop-111',
  eta: 300, // seconds
  distance: 2.5 // km
});

// Broadcast connection status
socket.emit('server:connectionStatus', {
  status: 'connected',
  timestamp: Date.now()
});
```

## Authentication & Authorization

### JWT Token Structure

```javascript
{
  iat: 1234567890,
  exp: 1234654290,
  sub: 'user-id-123',
  email: 'user@example.com',
  role: 'DRIVER' | 'STUDENT' | 'ADMIN',
  busId: 'bus-456' // Driver only
}
```

### Middleware Flow

```
Request
  ↓
[CORS Check]
  ↓
[Parse JSON]
  ↓
[Extract JWT from Authorization header]
  ↓
[Verify JWT signature]
  ↓
[Check expiration]
  ↓
[Attach user to request]
  ↓
[Check role-based access]
  ↓
Route Handler
  ↓
Response
```

## Error Handling

### Standard Error Response

```json
{
  "error": "Bus not found",
  "code": "BUS_NOT_FOUND",
  "statusCode": 404
}
```

### Common Error Codes

| Code | HTTP | Meaning |
|------|------|----------|
| UNAUTHORIZED | 401 | No valid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid input |
| DUPLICATE_ENTRY | 409 | Unique constraint violation |
| SERVER_ERROR | 500 | Internal server error |
| GPS_PERMISSION_DENIED | 400 | Browser geolocation denied |
| INVALID_COORDINATES | 400 | Invalid lat/long |
| TRIP_NOT_ACTIVE | 400 | Trip not in progress |

## Performance Considerations

### Database Indexes

```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);

-- Bus tracking
CREATE INDEX idx_bus_locations_bus_id_recorded_at ON bus_locations(bus_id, recorded_at);
CREATE INDEX idx_bus_locations_trip_id ON bus_locations(trip_id);

-- Trip queries
CREATE INDEX idx_trips_bus_id_status ON trips(bus_id, status);
CREATE INDEX idx_trips_driver_id_status ON trips(driver_id, status);
CREATE INDEX idx_trips_started_at ON trips(started_at);

-- Route/Stop queries
CREATE INDEX idx_route_stops_route_id ON route_stops(route_id);
CREATE INDEX idx_route_stops_stop_id ON route_stops(bus_stop_id);
```

### Caching Strategy

1. **Routes & Stops**: Cache for 1 hour (rarely change)
2. **Bus List**: Cache for 5 minutes (updates on bus assignment)
3. **Current Trips**: Real-time via Socket.IO
4. **Location History**: Paginated, not cached

### Location Data Management

- Store raw location updates every 5 seconds
- Aggregate to 1-minute intervals after trip ends
- Archive to separate table after 30 days
- Keep latest location in-memory for quick access

## Scalability

### Current Architecture Supports

- **Buses**: 1000+
- **Concurrent Students**: 10,000+
- **Concurrent Drivers**: 100+
- **Location Updates**: 1000/second

### Future Scaling Improvements

1. **Database**: Read replicas for analytics
2. **Cache**: Redis for location data
3. **Message Queue**: Kafka for location events
4. **Geo-indexing**: PostGIS for spatial queries
5. **CDN**: CloudFront for static assets
6. **Load Balancer**: Distribute traffic across servers

---

For implementation details, see the code comments and test files.
