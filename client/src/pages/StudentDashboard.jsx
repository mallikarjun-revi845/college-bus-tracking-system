import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import BusCard from '../components/BusCard';
import Alert from '../components/Alert';
import { useBusTracking } from '../context/BusTracking Context';
import { busAPI } from '../services/api';
import { MapPin, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function StudentDashboard() {
  const navigate = useNavigate();
  const { fetchBuses, buses, loading, error, setError } = useBusTracking();
  const [selectedBus, setSelectedBus] = useState(null);

  useEffect(() => {
    fetchBuses();
  }, [fetchBuses]);

  const handleTrackBus = (busId) => {
    navigate(`/student/track/${busId}`);
  };

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
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📍 Track a Bus</h1>
          <p className="text-gray-600">Select a bus to view its real-time location and estimated arrival time</p>
        </div>

        {error && (
          <Alert type="error" title="Error" message={error} onClose={() => setError(null)} />
        )}

        {buses.length === 0 ? (
          <div className="card text-center py-12">
            <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No buses available at the moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buses.map((bus) => (
              <BusCard
                key={bus.id}
                bus={bus}
                onClick={() => handleTrackBus(bus.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;
