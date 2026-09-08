# College Bus Tracking System

A production-quality web-based real-time bus tracking system for college campuses. Students can track buses on interactive maps, drivers can share live GPS location, and administrators manage the entire fleet.

## Features

### Core Functionality
- ✅ Real-time GPS tracking of buses
- ✅ Live map visualization with Leaflet
- ✅ WebSocket-based live location updates
- ✅ Role-based access control (Admin, Driver, Student)
- ✅ JWT authentication with bcrypt password hashing
- ✅ Responsive design for desktop and mobile
- ✅ Estimated arrival time (ETA) calculation
- ✅ Trip history and analytics

### Admin Features
- Dashboard with system statistics
- Manage buses, drivers, students
- Create and manage routes and stops
- Assign buses to routes and drivers
- View active trips and trip history
- System analytics

### Driver Features
- Simple trip management (Start/Stop)
- Live GPS sharing with browser geolocation
- Trip status and duration tracking
- Connection status monitoring
- Mobile-friendly interface

### Student Features
- Search and track available buses
- View bus location on interactive map
- See route and stops
- View last location update timestamp
- Estimated arrival time (ETA)
- Bus status indicators

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐  │
│  │  Student Portal  │  │  Driver Interface│  │Admin Panel │  │
│  └──────────────────┘  └──────────────────┘  └────────────┘  │
│         │                      │                     │         │
│  Leaflet Maps │ Browser Geolocation │ REST API │         │
└─────────────────────────────────────────────────────────────┘
                          │
                    ┌─────▼─────┐
                    │ Socket.IO  │
                    │ (Real-time)│
                    └─────┬─────┘
                          │
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js/Express)                │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────┐   │
│  │  REST APIs     │  │   Socket.IO    │  │  Services   │   │
│  │                │  │    Handler     │  │  & Logic    │   │
│  └────────────────┘  └────────────────┘  └─────────────┘   │
│         │                    │                    │          │
│              Middleware & Authentication           │          │
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────────┐
│                  Database (PostgreSQL)                       │
│  Users │ Buses │ Routes │ Stops │ Trips │ Locations │ etc  │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Leaflet** - Maps
- **Socket.IO Client** - Real-time updates
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **Prisma** - ORM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Helmet** - Security headers
- **Cors** - Cross-origin handling

### Database
- **PostgreSQL** - Relational database
- **Prisma Migrations** - Schema versioning

### Testing
- **Jest** - Test framework
- **Supertest** - HTTP assertions
- **Vitest** - Frontend testing

## Requirements

- Node.js 18+
- PostgreSQL 12+
- npm or yarn
- Modern web browser with geolocation support (for drivers)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/mallikarjun-revi845/college-bus-tracking-system.git
cd college-bus-tracking-system
```

### 2. Set up environment variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your actual values
# For development, defaults should work if PostgreSQL is running locally
```

### 3. Set up PostgreSQL

**Option A: Local PostgreSQL**

```bash
# Create database
createdb college_bus_tracking
```

**Option B: Using Docker**

```bash
docker run --name cbts-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=college_bus_tracking \
  -p 5432:5432 \
  -d postgres:15
```

### 4. Set up backend

```bash
cd server
npm install

# Run database migrations
npx prisma migrate deploy

# Seed the database with development data
npx prisma db seed
```

### 5. Set up frontend

```bash
cd ../client
npm install
```

## Running Locally

### Terminal 1: Start Backend

```bash
cd server
npm run dev
# Backend runs on http://localhost:5000
```

### Terminal 2: Start Frontend

```bash
cd client
npm run dev
# Frontend runs on http://localhost:5173
```

Access the application at `http://localhost:5173`

## Development Credentials

⚠️ **These credentials are ONLY for development. Never use in production.**

### Admin Account
- **Email**: admin@example.com
- **Password**: admin123

### Driver Account
- **Email**: driver@example.com
- **Password**: driver123

### Student Account
- **Email**: student@example.com
- **Password**: student123

## API Documentation

### Authentication

```
POST /api/auth/register
Body: { email, password, name, role }
Response: { token, user }

POST /api/auth/login
Body: { email, password }
Response: { token, user }

GET /api/auth/me
Header: Authorization: Bearer <token>
Response: { user }
```

### Buses

```
GET /api/buses
GET /api/buses/:id
POST /api/buses (Admin only)
PUT /api/buses/:id (Admin only)
DELETE /api/buses/:id (Admin only)
GET /api/buses/:id/location
GET /api/buses/:id/trips
```

### Routes

```
GET /api/routes
GET /api/routes/:id
POST /api/routes (Admin only)
PUT /api/routes/:id (Admin only)
DELETE /api/routes/:id (Admin only)
GET /api/routes/:id/stops
```

### Stops

```
GET /api/stops
POST /api/stops (Admin only)
PUT /api/stops/:id (Admin only)
DELETE /api/stops/:id (Admin only)
```

### Drivers

```
GET /api/drivers (Admin only)
GET /api/drivers/:id
POST /api/drivers (Admin only)
PUT /api/drivers/:id
DELETE /api/drivers/:id (Admin only)
GET /api/drivers/:id/trips
```

### Trips

```
GET /api/trips
GET /api/trips/:id
POST /api/trips (Admin/Driver)
POST /api/trips/:id/start (Driver)
POST /api/trips/:id/stop (Driver)
POST /api/trips/:id/location (Driver - via Socket.IO)
```

### Statistics

```
GET /api/stats (Admin only)
Response: { totalBuses, activeBuses, totalDrivers, totalStudents, activeTrips }
```

## Socket.IO Events

### Driver Events

```javascript
// Driver starts sending location
socket.emit('driver:locationUpdate', {
  tripId,
  busId,
  latitude,
  longitude,
  timestamp
});

// Trip lifecycle
socket.emit('driver:tripStarted', { tripId, busId, routeId });
socket.emit('driver:tripStopped', { tripId });
```

### Server Broadcasts

```javascript
// Broadcast to students watching a bus
socket.broadcast.to(`bus:${busId}`, 'server:busLocationUpdated', {
  busId,
  tripId,
  latitude,
  longitude,
  timestamp
});
```

## Testing

### Run Backend Tests

```bash
cd server
npm test
```

### Run Frontend Tests

```bash
cd client
npm test
```

### End-to-End Testing Workflow

1. Start backend and frontend (see "Running Locally")
2. Login as driver (driver@example.com / driver123)
3. Click "Start Trip"
4. Allow browser geolocation permission
5. Driver's location will be sent every 5 seconds
6. Open a new browser tab/window and login as student
7. Click on a bus or "Track Bus"
8. Watch the map update in real-time as driver moves
9. Click "Stop Trip" on driver interface
10. Verify tracking stops and trip history is saved

## GPS Simulation Mode

For testing without real GPS:

```bash
# Set in server/.env
USE_SIMULATED_GPS=true
SIMULATED_GPS_UPDATE_INTERVAL=5000
```

The backend will generate realistic location updates along predefined routes.

## Database Schema

See `server/prisma/schema.prisma` for the complete schema including:

- **User**: Authentication and profiles
- **Student**: Student-specific data
- **Driver**: Driver-specific data
- **Bus**: Bus information
- **Route**: Bus routes
- **BusStop**: Physical stops
- **RouteStop**: Stop details per route
- **Trip**: Bus trips
- **BusLocation**: Historical location data

## Security Practices

✅ Password hashing with bcryptjs
✅ JWT tokens with expiration
✅ Role-based access control
✅ Input validation and sanitization
✅ SQL injection protection via Prisma
✅ CORS configuration
✅ Helmet security headers
✅ No secrets in Git (.gitignore)
✅ Environment variable management
✅ HTTPS ready for production
✅ Request rate limiting (configurable)

## Deployment

### Frontend Deployment (Vercel)

```bash
# Build
cd client
npm run build

# Deploy
vercel deploy
```

### Backend Deployment (Render / Railway)

```bash
# 1. Push code to GitHub
# 2. Connect to Render/Railway
# 3. Set environment variables
# 4. Database: Use PostgreSQL hosting (Render, Railway, or AWS RDS)
# 5. Deploy
```

### Environment Variables for Production

Set these on your hosting platform:

```
NODE_ENV=production
DATABASE_URL=your-production-db-url
JWT_SECRET=your-production-secret-key-64-chars-minimum
CLIENT_URL=your-production-frontend-url
PORT=5000
```

## Known Limitations

1. **GPS Accuracy**: Depends on device and browser capabilities
2. **ETA Estimation**: Uses average speed calculation; does not account for traffic
3. **Location History**: Stored for performance; older records may be archived
4. **Offline Mode**: Basic; student sees last known location
5. **Real-time Updates**: Requires active Socket.IO connection
6. **Mobile GPS**: Battery usage is significant; warn drivers

## Troubleshooting

### Database Connection Error

```
✗ Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**: Ensure PostgreSQL is running:

```bash
# Check status
sudo systemctl status postgresql

# Start if stopped
sudo systemctl start postgresql
```

### Geolocation Permission Denied

Driver sees: "Geolocation permission denied"

**Solution**: 
1. Check browser permissions
2. For localhost development, most browsers allow it automatically
3. For production, site must use HTTPS

### Socket.IO Connection Issues

Students not seeing live updates.

**Solution**:
1. Verify backend Socket.IO is running on port 5000
2. Check CORS configuration in backend
3. Verify client is connecting to correct server URL
4. Check browser console for errors

### Migrations Failed

```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Then seed again
npx prisma db seed
```

## Contributing

Contributions are welcome! Please:

1. Create a feature branch
2. Make your changes
3. Write tests
4. Submit a pull request

## License

MIT License

## Support

For issues and questions, please create a GitHub issue.

---

**Built with ❤️ for college transportation**
