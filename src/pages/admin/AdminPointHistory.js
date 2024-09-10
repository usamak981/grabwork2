import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Link } from 'react-router-dom';

const AdminPointHistory = () => {
  const [pointHistory, setPointHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPointHistory = async () => {
      try {
        console.log('Fetching point history...');
        const q = query(collection(db, 'pointHistory'));
        const querySnapshot = await getDocs(q);
        console.log('Point history snapshot received:', querySnapshot.size, 'documents');

        const historyData = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          console.log('Processing document:', docSnapshot.id, data);

          let displayName = 'N/A';
          let userType = data.userType || 'User';

          try {
            if (data.userId) {
              const userDoc = userType === 'Provider' 
                ? await getDoc(doc(db, 'providers', data.userId))
                : await getDoc(doc(db, 'users', data.userId));

              if (userDoc.exists()) {
                // For providers, use 'name' field, for users use 'displayName'
                displayName = userType === 'Provider' 
                  ? userDoc.data().name || 'No Name'
                  : userDoc.data().displayName || 'No Name';
              } else {
                console.log(`${userType} document not found for ID:`, data.userId);
              }
            }
          } catch (fetchError) {
            console.error(`Error fetching ${userType.toLowerCase()} details:`, fetchError);
          }

          return {
            id: docSnapshot.id,
            ...data,
            displayName,
            userType
          };
        }));

        console.log('Processed history data:', historyData);
        setPointHistory(historyData);
      } catch (err) {
        console.error('Error fetching point history:', err);
        setError(`Failed to fetch point history: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPointHistory();
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
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="container mt-5">
      <h2>All Users Point History</h2>
      {pointHistory.length === 0 ? (
        <p>No point history found.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Name</th>
              <th>Description</th>
              <th>Point Type</th>
              <th>User Type</th>
              <th>Point Amount</th>
            </tr>
          </thead>
          <tbody>
            {pointHistory.map((item) => (
              <tr key={item.id}>
                <td>{item.date ? new Date(item.date.toDate()).toLocaleDateString() : 'N/A'}</td>
                <td>
                  {item.userId ? (
                    <Link to={item.userType === 'Provider' ? `/admin/provider/${item.userId}` : `/admin/user/${item.userId}`}>
                      {item.displayName}
                    </Link>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td>{item.description || 'No description'}</td>
                <td>{item.pointType || 'N/A'}</td>
                <td>{item.userType || 'N/A'}</td>
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

export default AdminPointHistory;