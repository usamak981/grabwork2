import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import Chauffeur from '../components/forms/Chauffeur';
import { useAuth } from '../contexts/AuthContext';

const ProviderDashboard = () => {
  const [providerInfo, setProviderInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedService, setSelectedService] = useState('');
  const [formData, setFormData] = useState({});
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        await fetchProviderInfo(user.uid);
        await checkProfileCompletion(user.uid);
        setLoading(false);
      } else {
        setLoading(false);
        setError('Please log in to access the Provider Dashboard.');
      }
    };
    fetchData();
  }, [user]);

  const fetchProviderInfo = async (userId) => {
    try {
      const providersRef = collection(db, 'providers');
      const q = query(providersRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const providerDoc = querySnapshot.docs[0];
        setProviderInfo({ id: providerDoc.id, ...providerDoc.data() });
        setSelectedService(providerDoc.data().service);
      } else {
        setProviderInfo(null);
      }
    } catch (error) {
      console.error('Error fetching provider info:', error);
      setError('Failed to fetch provider information. Please try again.');
    }
  };

  const checkProfileCompletion = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setIsProfileComplete(userData.isProfileComplete || false);
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
      setError('Failed to check profile completion. Please try again.');
    }
  };

  const handleServiceChange = (e) => {
    setSelectedService(e.target.value);
  };

  const handleProviderSubmit = async (e) => {
    e.preventDefault();
    if (!isProfileComplete) {
      setError('Please complete your profile before submitting a provider application.');
      return;
    }
    try {
      const providerRef = doc(db, 'providers', user.uid);
      await setDoc(providerRef, {
        userId: user.uid,
        service: selectedService,
        ...formData,
        status: 'pending',
        submissionTime: new Date().toISOString()
      }, { merge: true });

      alert('Provider application submitted successfully! Please wait for approval.');
      await fetchProviderInfo(user.uid);
    } catch (error) {
      console.error('Error submitting provider application:', error);
      setError('Failed to submit provider application. Please try again.');
    }
  };

  const handleWithdraw = async () => {
    if (window.confirm('Are you sure you want to withdraw as a provider?')) {
      try {
        await setDoc(doc(db, 'providers', user.uid), { status: 'withdrawn' }, { merge: true });
        setProviderInfo(null);
        setSelectedService('');
        alert('You have successfully withdrawn as a provider.');
      } catch (error) {
        console.error('Error withdrawing as provider:', error);
        setError('Failed to withdraw as provider. Please try again.');
      }
    }
  };

  if (loading) {
    return <div className="container mt-5">Loading...</div>;
  }

  if (error) {
    return <div className="container mt-5 alert alert-danger">{error}</div>;
  }

  if (!isProfileComplete) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          Please complete your profile before accessing the Provider Dashboard.
          <button className="btn btn-primary ms-3" onClick={() => navigate('/profile')}>Complete Profile</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Provider Dashboard</h2>
      
      {providerInfo ? (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Your Provider Status</h5>
            <p className="card-text"><strong>Service:</strong> {providerInfo.service}</p>
            <p className="card-text"><strong>City:</strong> {providerInfo.city}</p>
            <p className="card-text"><strong>Driving Since:</strong> {providerInfo.drivingSince}</p>
            <p className="card-text"><strong>Has PSV:</strong> {providerInfo.hasPSV ? 'Yes' : 'No'}</p>
            <p className="card-text">
              <strong>Status:</strong>{' '}
              <span className={`badge bg-${
                providerInfo.status === 'approved' ? 'success' : 
                providerInfo.status === 'pending' ? 'warning' : 
                providerInfo.status === 'rejected' ? 'danger' : 'secondary'
              }`}>
                {providerInfo.status ? providerInfo.status.charAt(0).toUpperCase() + providerInfo.status.slice(1) : 'Unknown'}
              </span>
            </p>
            {providerInfo.status === 'approved' && providerInfo.approvalTime && (
              <p className="card-text"><strong>Approval Time:</strong> {new Date(providerInfo.approvalTime).toLocaleString()}</p>
            )}
            {providerInfo.status === 'pending' && (
              <p className="card-text text-muted">Your provider application is pending approval. Please check back later.</p>
            )}
            {providerInfo.status === 'rejected' && (
              <p className="card-text text-danger">Your provider application has been rejected. Please contact support for more information.</p>
            )}
            <button className="btn btn-danger mt-3" onClick={handleWithdraw}>Withdraw as Provider</button>
          </div>
        </div>
      ) : (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Become a Provider</h5>
            <div className="mb-3">
              <label className="form-label">Choose a Service</label>
              <select
                className="form-select"
                value={selectedService}
                onChange={handleServiceChange}
              >
                <option value="">Select a service</option>
                <option value="chauffeur">Chauffeur</option>
                {/* Add more service options here */}
              </select>
            </div>
            {selectedService && (
              <form onSubmit={handleProviderSubmit}>
                {selectedService === 'chauffeur' && (
                  <Chauffeur 
                    formData={formData} 
                    setFormData={setFormData}
                    isProfileComplete={isProfileComplete}
                  />
                )}
                {/* Add more conditions for other service types */}
                <button type="submit" className="btn btn-primary mt-3">Submit Application</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderDashboard;