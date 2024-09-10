import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

const ProviderDetail = () => {
  const { providerId } = useParams();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProvider = async () => {
      const providerDoc = await getDoc(doc(db, 'providers', providerId));
      if (providerDoc.exists()) {
        setProvider({ id: providerDoc.id, ...providerDoc.data() });
      }
      setLoading(false);
    };

    fetchProvider();
  }, [providerId]);

  const handleStatusChange = async (newStatus) => {
    try {
      await updateDoc(doc(db, 'providers', providerId), { status: newStatus });
      setProvider(prev => ({ ...prev, status: newStatus }));
      alert('Provider status updated successfully.');
    } catch (error) {
      console.error('Error updating provider status:', error);
      alert('Failed to update provider status. Please try again.');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return 'bg-success';
      case 'pending': return 'bg-warning';
      case 'suspended': return 'bg-warning';
      case 'rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (!user || !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!provider) {
    return <div>Provider not found</div>;
  }

  return (
    <div className="container mt-5">
      <button className="btn btn-secondary mb-3" onClick={handleBack}>Back</button>
      <h2>Provider Details</h2>
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">{provider.name || 'Name not provided'}</h5>
          <p className="card-text">
            <strong>Status:</strong>{' '}
            <span className={`badge ${getStatusBadgeClass(provider.status)}`}>
              {provider.status}
            </span>
          </p>
          <p className="card-text"><strong>Email:</strong> {provider.email}</p>
          <p className="card-text"><strong>User ID:</strong> {provider.userId}</p>
          <p className="card-text"><strong>Service:</strong> {provider.service}</p>
          <p className="card-text"><strong>City:</strong> {provider.city || 'Not specified'}</p>
          <p className="card-text"><strong>Driving Since:</strong> {provider.drivingSince}</p>
          <p className="card-text"><strong>Has PSV:</strong> {provider.hasPSV}</p>
          
          {/* Display any additional fields here */}
          {Object.entries(provider).map(([key, value]) => {
            if (!['id', 'userId', 'name', 'email', 'service', 'status', 'city', 'drivingSince', 'hasPSV'].includes(key) && typeof value !== 'object') {
              return (
                <p key={key} className="card-text">
                  <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}
                </p>
              );
            }
            return null;
          })}

          <div className="mt-4">
            <button 
              className="btn btn-success me-2" 
              onClick={() => handleStatusChange('approved')}
              disabled={provider.status === 'approved'}
            >
              Approve
            </button>
            <button 
              className="btn btn-warning me-2" 
              onClick={() => handleStatusChange('suspended')}
              disabled={provider.status === 'suspended'}
            >
              Suspend
            </button>
            <button 
              className="btn btn-info me-2" 
              onClick={() => handleStatusChange('pending')}
              disabled={provider.status === 'pending'}
            >
              Reconsider
            </button>
            <button 
              className="btn btn-danger" 
              onClick={() => handleStatusChange('rejected')}
              disabled={provider.status === 'rejected'}
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDetail;