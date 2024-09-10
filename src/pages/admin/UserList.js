import React, { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      const usersRef = collection(db, 'users');
      const providersRef = collection(db, 'providers');
      const ordersRef = collection(db, 'orders');

      const [usersSnapshot, providersSnapshot, ordersSnapshot] = await Promise.all([
        getDocs(query(usersRef)),
        getDocs(query(providersRef)),
        getDocs(query(ordersRef))
      ]);

      const providerMap = new Map();
      providersSnapshot.docs.forEach(doc => {
        providerMap.set(doc.id, doc.data().service);
      });

      const orderCountMap = new Map();
      ordersSnapshot.docs.forEach(doc => {
        const userId = doc.data().userId;
        orderCountMap.set(userId, (orderCountMap.get(userId) || 0) + 1);
      });

      const userList = usersSnapshot.docs.map(doc => {
        const userData = doc.data();
        const lastActivity = userData.lastActivity ? new Date(userData.lastActivity.toDate()) : null;
        const isInactive = lastActivity && (new Date() - lastActivity) > 60 * 24 * 60 * 60 * 1000; // 60 days
        return {
          id: doc.id,
          ...userData,
          status: isInactive ? 'Inactive' : 'Active',
          service: providerMap.get(doc.id) || 'N/A',
          requestCount: orderCountMap.get(doc.id) || 0
        };
      });
      setUsers(userList);
      setLoading(false);
    };

    fetchUsers();
  }, []);

  if (!user || !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mt-5">
      <h2>User List</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Service</th>
            <th>Request Count</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>
                {user.displayName}
                {user.isVerified && <FaCheckCircle className="text-success ms-2" title="Verified User" />}
              </td>
              <td>{user.email}</td>
              <td>{user.status}</td>
              <td>{user.service}</td>
              <td>{user.requestCount}</td>
              <td>
                <Link to={`/admin/user/${user.id}`} className="btn btn-primary btn-sm">
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

export default UserList;