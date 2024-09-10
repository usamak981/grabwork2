import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  console.log('ProtectedRoute - User:', user, 'Loading:', loading);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    console.log('User not authenticated, redirecting to /profile');
    return <Navigate to="/profile" replace />;
  }

  console.log('User authenticated, rendering children');
  return children;
};

export default ProtectedRoute;