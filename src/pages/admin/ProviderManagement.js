import React, { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';

const ProviderManagement = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchProviders = async () => {
      const providersRef = collection(db, 'providers');
      const q = query(providersRef);
      const querySnapshot = await getDocs(q);
      const providerList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status || 'pending'
      }));
      setProviders(providerList);
      setLoading(false);
    };

    fetchProviders();
  }, []);

  const getLocationString = (provider) => {
    if (provider.city) {
      return provider.city;
    } else if (provider.location && provider.location.city) {
      return `${provider.location.city}${provider.location.region ? `, ${provider.location.region}` : ''}`;
    } else {
      return 'Location not specified';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      case 'suspended': return 'warning';
      default: return 'secondary';
    }
  };

  const serviceTypes = [...new Set(providers.map(provider => provider.service))];

  const filteredProviders = selectedService
    ? providers.filter(provider => provider.service === selectedService)
    : providers;

  if (!user || !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mt-5">
      <h2>Provider Management</h2>
      <div className="mb-3">
        <label htmlFor="serviceFilter" className="form-label">Filter by Service:</label>
        <select
          id="serviceFilter"
          className="form-select"
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
        >
          <option value="">All Services</option>
          {serviceTypes.map(service => (
            <option key={service} value={service}>{service}</option>
          ))}
        </select>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Service</th>
            <th>Location</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProviders.map(provider => (
            <tr key={provider.id}>
              <td>{provider.name || 'Name not provided'}</td>
              <td>{provider.service || 'Service not specified'}</td>
              <td>{getLocationString(provider)}</td>
              <td>
                <span className={`badge bg-${getStatusColor(provider.status)}`}>
                  {provider.status}
                </span>
              </td>
              <td>
                <Link to={`/admin/provider/${provider.id}`} className="btn btn-primary btn-sm">
                  View Details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProviderManagement;