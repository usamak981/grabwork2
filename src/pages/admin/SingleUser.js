import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

const SingleUser = () => {
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleVerify = async () => {
    try {
      await updateDoc(doc(db, 'users', userId), { 
        isVerified: true,
        verificationStatus: 'approved',
        rejectionReason: null
      });
      setUserData(prevData => ({ 
        ...prevData, 
        isVerified: true, 
        verificationStatus: 'approved',
        rejectionReason: null
      }));
      alert('User has been verified successfully.');
    } catch (error) {
      console.error("Error verifying user:", error);
      alert('Failed to verify user. Please try again.');
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      try {
        await updateDoc(doc(db, 'users', userId), { 
          isVerified: false, 
          verificationStatus: 'rejected',
          rejectionReason: reason
        });
        setUserData(prevData => ({ 
          ...prevData, 
          isVerified: false, 
          verificationStatus: 'rejected',
          rejectionReason: reason
        }));
        alert('User verification has been rejected.');
      } catch (error) {
        console.error("Error rejecting user verification:", error);
        alert('Failed to reject user verification. Please try again.');
      }
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

  if (!userData) {
    return <div>User not found</div>;
  }

  return (
    <div className="container mt-5">
      <button className="btn btn-secondary mb-3" onClick={handleBack}>Back</button>
      <h2>User Details</h2>
      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title">
            {userData.displayName}
            {userData.isVerified && <span className="badge bg-success ms-2">Verified</span>}
          </h5>
          <p className="card-text"><strong>Email:</strong> {userData.email}</p>
          <p className="card-text"><strong>Verification Status:</strong> {userData.verificationStatus}</p>
          <p className="card-text"><strong>Last Activity:</strong> {userData.lastActivity ? new Date(userData.lastActivity.toDate()).toLocaleString() : 'N/A'}</p>
          <p className="card-text"><strong>Reputation:</strong> {userData.reputation || 'N/A'}</p>
          
          <h6>General Information</h6>
          <p className="card-text"><strong>City:</strong> {userData.city || 'Not provided'}</p>
          <p className="card-text"><strong>Race:</strong> {userData.race || 'Not provided'}</p>
          <p className="card-text"><strong>Gender:</strong> {userData.gender || 'Not provided'}</p>
          <p className="card-text"><strong>Birthday:</strong> {userData.birthday || 'Not provided'}</p>
          <p className="card-text"><strong>WhatsApp:</strong> {userData.whatsapp || 'Not provided'}</p>
          <p className="card-text"><strong>IC Number:</strong> {userData.icNumber || 'Not provided'}</p>
          <p className="card-text"><strong>IC Photo:</strong> {userData.icUrl ? <a href={userData.icUrl} target="_blank" rel="noopener noreferrer">View IC</a> : 'Not provided'}</p>
          
          {userData.rejectionReason && (
            <p className="card-text text-danger"><strong>Rejection Reason:</strong> {userData.rejectionReason}</p>
          )}

          {userData.verificationStatus !== 'approved' ? (
            <div>
              <button className="btn btn-success me-2" onClick={handleVerify}>Verify User</button>
              <button className="btn btn-danger" onClick={handleReject}>Reject Verification</button>
            </div>
          ) : (
            <button className="btn btn-warning" onClick={handleReject}>Revoke Verification</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleUser;