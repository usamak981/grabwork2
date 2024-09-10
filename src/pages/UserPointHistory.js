import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

const UserPointHistory = () => {
  const [pointHistory, setPointHistory] = useState([]);
  const [totalCPoints, setTotalCPoints] = useState(0);
  const [totalRPoints, setTotalRPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userType, setUserType] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error('No user logged in');
          setError('Please log in to view your point history.');
          setLoading(false);
          return;
        }

        setUserInfo({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        });

        console.log('Current user:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        });

        // Check if user exists in 'users' collection
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        // Check if user exists in 'providers' collection
        const providerDocRef = doc(db, 'providers', user.uid);
        const providerDocSnap = await getDoc(providerDocRef);

        console.log('User document exists:', userDocSnap.exists());
        console.log('Provider document exists:', providerDocSnap.exists());

        if (userDocSnap.exists()) {
          setUserType('User');
          console.log('User type: Regular User');
        } else if (providerDocSnap.exists()) {
          setUserType('Provider');
          console.log('User type: Provider');
        } else {
          console.error('User not found in database');
          setError('User profile not found in the database.');
          setLoading(false);
          return;
        }

        // Fetch point history
        const pointHistoryQuery = query(collection(db, 'pointHistory'), where('userId', '==', user.uid));
        const pointHistorySnapshot = await getDocs(pointHistoryQuery);
        console.log('Point history documents found:', pointHistorySnapshot.size);

        const historyData = pointHistorySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Processed history data:', historyData);

        setPointHistory(historyData);

        const cPoints = historyData
          .filter(item => item.pointType === 'contribution')
          .reduce((sum, item) => sum + (item.pointAmount || 0), 0);
        const rPoints = historyData
          .filter(item => item.pointType === 'reputation')
          .reduce((sum, item) => sum + (item.pointAmount || 0), 0);

        console.log('Calculated points:', { cPoints, rPoints });

        setTotalCPoints(cPoints);
        setTotalRPoints(rPoints);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(`Failed to fetch user data: ${err.message}`);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const getBadgeColor = (pointType) => {
    switch (pointType) {
      case 'contribution':
        return 'bg-primary';
      case 'reputation':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">{error}</div>
        {userInfo && (
          <div className="mt-3">
            <h4>Debug Information</h4>
            <p>User UID: {userInfo.uid}</p>
            <p>User Email: {userInfo.email}</p>
            <p>Display Name: {userInfo.displayName || 'Not set'}</p>
          </div>
        )}
        <p>If this issue persists, please contact support with the above information.</p>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2>My Point History</h2>
      <div className="mb-4">
        <h4>Total Points</h4>
        <p>
          Contribution Points (CPoints): 
          <span className={`badge ${getBadgeColor('contribution')} ms-2`}>{totalCPoints}</span>
        </p>
        <p>
          Reputation Points (RPoints): 
          <span className={`badge ${getBadgeColor('reputation')} ms-2`}>{totalRPoints}</span>
        </p>
        {userType === 'Provider' && (
          <p className="text-info">
            As a provider, you earn Reputation Points when users recommend you in their reviews.
          </p>
        )}
      </div>
      {pointHistory.length === 0 ? (
        <p>No point history found.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Point Type</th>
              <th>Point Amount</th>
            </tr>
          </thead>
          <tbody>
            {pointHistory.map((item) => (
              <tr key={item.id}>
                <td>{item.date ? new Date(item.date.toDate()).toLocaleDateString() : 'N/A'}</td>
                <td>{item.description || 'No description'}</td>
                <td>{item.pointType || 'N/A'}</td>
                <td>
                  <span className={`badge ${getBadgeColor(item.pointType)}`}>
                    {item.pointAmount || 0}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserPointHistory;