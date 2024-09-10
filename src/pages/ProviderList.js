import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useNavigate } from 'react-router-dom';

const ProviderList = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const providersCollection = collection(db, 'providers');
        const providerSnapshot = await getDocs(providersCollection);
        const providerList = providerSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).filter(provider => provider.name);
        setProviders(providerList);
      } catch (error) {
        console.error('Error fetching providers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  if (loading) {
    return <div className="container mt-5">Loading...</div>;
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Service Providers</h2>
      {providers.length > 0 ? (
        <div className="row">
          {providers.map(provider => (
            <div key={provider.id} className="col-md-4 mb-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">{provider.name}</h5>
                  <p className="card-text">Service: {provider.service}</p>
                  <p className="card-text">
                    Location: {provider.location.city}, {provider.location.region}, {provider.location.properties && provider.location.properties.length > 0 ? provider.location.properties.join(', ') : 'No property specified'}
                  </p>
                  <p className="card-text">Client Types: {provider.clientTypes.join(', ')}</p>
                  <p className="card-text">Submitted on: {new Date(provider.submissionTime).toLocaleString()}</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate(`/provider/${provider.id}`)}
                                    >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No providers available at the moment.</p>
      )}
    </div>
  );
};

export default ProviderList;
                 