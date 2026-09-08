import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Alert from '../components/Alert';
import { statsAPI } from '../services/api';
import { Loader, BarChart3, Users, Bus, Zap } from 'lucide-react';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await statsAPI.getStats();
        setStats(response.data);
      } catch (err) {
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader className="animate-spin" size={40} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📊 Admin Dashboard</h1>
          <p className="text-gray-600">System Overview and Statistics</p>
        </div>

        {error && (
          <Alert type="error" title="Error" message={error} onClose={() => setError(null)} />
        )}

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Buses</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalBuses}</p>
                </div>
                <Bus className="text-blue-500" size={40} />
              </div>
            </div>

            <div className="card border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Active Buses</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.activeBuses}</p>
                </div>
                <Zap className="text-green-500" size={40} />
              </div>
            </div>

            <div className="card border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Drivers</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalDrivers}</p>
                </div>
                <Users className="text-purple-500" size={40} />
              </div>
            </div>

            <div className="card border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Active Trips</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.activeTrips}</p>
                </div>
                <BarChart3 className="text-orange-500" size={40} />
              </div>
            </div>
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">System Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Students</span>
                  <span className="font-semibold">{stats.totalStudents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Drivers</span>
                  <span className="font-semibold">{stats.activeDrivers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed Trips (Today)</span>
                  <span className="font-semibold">{stats.completedTripsToday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bus Utilization</span>
                  <span className="font-semibold">
                    {stats.totalBuses > 0
                      ? ((stats.activeBuses / stats.totalBuses) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Quick Stats</h2>
              <div className="space-y-3 text-center">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded p-4">
                  <p className="text-gray-600 text-sm">Avg Trip Duration</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.averageTripDuration || 'N/A'}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded p-4">
                  <p className="text-gray-600 text-sm">Bus Fleet Health</p>
                  <p className="text-2xl font-bold text-green-600">Excellent</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
