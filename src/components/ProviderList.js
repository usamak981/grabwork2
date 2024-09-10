// src/components/ProviderList.js
import React, { useState, useEffect } from 'react';
import { getProviders } from '../services/firestore';

const ProviderList = ({ serviceId, onSelectProvider }) => {
  const [providers, setProviders] = useState([]);

  useEffect(() => {
    const fetchProviders = async () => {
      const providersData = await getProviders(serviceId);
      setProviders(providersData);
    };
    fetchProviders();
  }, [serviceId]);

  return (
    <div className="provider-list">
      <h2>Available Providers</h2>
      {providers.map(provider => (
        <div key={provider.id} className="provider-card">
          <h3>{provider.name}</h3>
          <p>{provider.description}</p>
          <button onClick={() => onSelectProvider(provider.id)}>Choose Provider</button>
        </div>
      ))}
    </div>
  );
};

export default ProviderList;