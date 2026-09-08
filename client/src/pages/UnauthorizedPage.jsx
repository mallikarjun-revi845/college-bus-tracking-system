import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Alert from '../components/Alert';
import { AlertCircle } from 'lucide-react';

function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-md">
          <div className="card shadow-xl text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-3xl font-bold text-red-600">Access Denied</h1>
            <p className="text-gray-600 mt-4">
              You don't have permission to access this page.
            </p>
            <Alert
              type="error"
              title="Unauthorized Access"
              message="Please login with appropriate credentials to access this resource."
              className="mt-6"
            />
            <a
              href="/login"
              className="btn-primary w-full mt-6 inline-block text-center"
            >
              Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UnauthorizedPage;
