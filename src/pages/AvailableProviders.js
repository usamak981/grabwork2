import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';

const AvailableProviders = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const { providers: searchResults, searchCriteria } = location.state || {};

  useEffect(() => {
    if (searchResults) {
      const currentUser = auth.currentUser;
      // Filter out the current user's provider listing
      const filteredProviders = searchResults.filter(provider => 
        provider.userId !== currentUser?.uid
      );
      setProviders(filteredProviders);
    }
  }, [searchResults]);

  const handleRequestService = (provider) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      navigate('/request-cleaner', { 
        state: { 
          provider: {
            ...provider,
            providerId: provider.userId,
          },
          selectedService: searchCriteria.service,
          city: searchCriteria.city,
          region: searchCriteria.region,
          property: searchCriteria.property,
          userId: currentUser.uid,
          userName: currentUser.displayName || currentUser.email
        } 
      });
    } else {
      // Show login prompt
      if (window.confirm('You need to be logged in to request a service. Would you like to log in now?')) {
        navigate('/profile', { state: { returnTo: location.pathname } });
      }
    }
  };

  return (
    <div className="container mt-5">
      <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>Back</button>
      <h2 className="mb-4">Available Providers</h2>
      {providers.length > 0 ? (
        <ul className="list-group">
          {providers.map(provider => (
            <li key={provider.userId} className="list-group-item">
              <h4>{provider.name}</h4>
              <p>Provider ID: {provider.userId}</p>
              <p>Service: {provider.service}</p>
              <p>
                Location: {provider.location.city}, {provider.location.region}, 
                {provider.location.properties ? provider.location.properties.join(', ') : 'No property specified'}
              </p>
              <button 
                className="btn btn-primary"
                onClick={() => handleRequestService(provider)}
              >
                Request Service
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No providers found for the selected criteria.</p>
      )}
    </div>
  );
};

export default AvailableProviders;