import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import LocationSelector from '../components/LocationSelector';
import { db } from '../services/firebase';

const BecomeProvider = () => {
  const [selectedService, setSelectedService] = useState('');
  const [location, setLocation] = useState({ city: '', region: '', properties: [] });
  const [clientTypes, setClientTypes] = useState([]);
  const [isAlreadyProvider, setIsAlreadyProvider] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkIfAlreadyProvider = async () => {
      if (user) {
        console.log("Checking if user is already a provider:", user.uid);
        const providerDoc = await getDoc(doc(db, 'providers', user.uid));
        if (providerDoc.exists()) {
          console.log("User is already a provider. Fetching provider data.");
          setIsAlreadyProvider(true);
          const providerData = providerDoc.data();
          setSelectedService(providerData.service);
          setLocation(providerData.location);
          setClientTypes(providerData.clientTypes);
        } else {
          console.log("User is not a provider yet.");
          setIsAlreadyProvider(false);
        }
      }
    };

    checkIfAlreadyProvider();
  }, [user]);

  const handleServiceChange = (e) => {
    setSelectedService(e.target.value);
  };

  const handleLocationChange = (newLocation) => {
    console.log("Location changed:", newLocation);
    setLocation(newLocation);
  };

  const handleClientTypeChange = (e) => {
    const value = e.target.value;
    setClientTypes((prevTypes) =>
      prevTypes.includes(value)
        ? prevTypes.filter((type) => type !== value)
        : [...prevTypes, value]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!user) {
        console.error("BecomeProvider: No authenticated user");
        throw new Error('User not authenticated');
      }

      const providerId = user.uid;
      console.log(`BecomeProvider: ${isAlreadyProvider ? 'Updating' : 'Creating'} provider with ID`, providerId);

      const providerData = {
        userId: user.uid,
        name: user.displayName || user.email,
        service: selectedService,
        location,
        clientTypes,
        submissionTime: new Date().toISOString(),
        status: 'pending', // Set initial status to 'pending'
      };

      console.log("BecomeProvider: Provider data to be saved:", providerData);

      await setDoc(doc(db, 'providers', providerId), providerData);
      console.log(`BecomeProvider: Provider document ${isAlreadyProvider ? 'updated' : 'created'} successfully`);

      alert(isAlreadyProvider ? 'Provider information updated successfully!' : 'Successfully registered as a provider! Your application is pending approval.');
      navigate('/profile');
    } catch (error) {
      console.error('BecomeProvider: Error registering/updating provider:', error);
      alert('Failed to register/update as a provider. Please try again.');
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">{isAlreadyProvider ? 'Edit Your Provider Information' : 'Become a Provider'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Choose a service:</label>
            <select 
              className="form-select" 
              value={selectedService} 
              onChange={handleServiceChange}
              required
            >
              <option value="">Select a service</option>
              <option value="chauffeur">chauffeur</option>
              
              {/* Add more services as needed */}
            </select>
          </div>
        </div>

        <LocationSelector onLocationChange={handleLocationChange} selectedLocation={location} />

        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Serve for:</label>
            <div className="form-check">
              <input 
                className="form-check-input" 
                type="checkbox" 
                value="family" 
                id="family" 
                checked={clientTypes.includes('family')}
                onChange={handleClientTypeChange}
              />
              <label className="form-check-label" htmlFor="family">
                Family in house
              </label>
            </div>
            <div className="form-check">
              <input 
                className="form-check-input" 
                type="checkbox" 
                value="single-male" 
                id="single-male" 
                checked={clientTypes.includes('single-male')}
                onChange={handleClientTypeChange}
              />
              <label className="form-check-label" htmlFor="single-male">
                Single person (male) in house
              </label>
            </div>
            {/* Add more client types as needed */}
          </div>
        </div>

        <button type="submit" className="btn btn-primary">
          {isAlreadyProvider ? 'Save Changes' : 'Register as Provider'}
        </button>
      </form>
    </div>
  );
};

export default BecomeProvider;