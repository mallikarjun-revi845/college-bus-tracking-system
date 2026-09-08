import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, useAuth } from './context/AuthContext';
import { BusTrackingContext } from './context/BusTrackingContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TrackingPage from './pages/TrackingPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Student Routes */}
      <Route
        path="/student/*"
        element={
          <ProtectedRoute roles={['STUDENT']}>
            <Routes>
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="track/:busId" element={<TrackingPage />} />
              <Route path="" element={<Navigate to="dashboard" />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* Driver Routes */}
      <Route
        path="/driver/*"
        element={
          <ProtectedRoute roles={['DRIVER']}>
            <Routes>
              <Route path="dashboard" element={<DriverDashboard />} />
              <Route path="" element={<Navigate to="dashboard" />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <Routes>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="" element={<Navigate to="dashboard" />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* Default routes */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={`/${user.role.toLowerCase()}/dashboard`} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthContext>
      <BusTrackingContext>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </BusTrackingContext>
    </AuthContext>
  );
}

export default App;
