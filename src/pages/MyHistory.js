import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const MyHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      console.log('Fetching completed and cancelled orders for user:', user.uid);
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef, 
        where('userId', '==', user.uid),
        where('status', 'in', ['completed', 'cancelled'])
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedOrders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log('Fetched completed and cancelled orders:', fetchedOrders);
        const sortedOrders = fetchedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sortedOrders);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching completed and cancelled orders:", error);
        setError(`Failed to fetch orders: ${error.message}`);
        setLoading(false);
      });

      return unsubscribe;
    } else {
      setLoading(false);
      setError('No user logged in. Please log in to view your order history.');
    }
  }, [user]);

  const handleOrderClick = (orderId) => {
    navigate(`/order-history/${orderId}`);
  };

  const getStatusBadgeClass = (status) => {
    return status === 'completed' ? 'bg-success' : 'bg-danger';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Date not available';
    
    let date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return 'Invalid date';
    }

    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderOrderList = (orders) => (
    <ul className="list-group">
      {orders.map(order => (
        <li 
          key={order.id} 
          className="list-group-item d-flex justify-content-between align-items-center"
          onClick={() => handleOrderClick(order.id)}
          style={{ cursor: 'pointer' }}
        >
          <div className="d-flex align-items-center">
            <img 
              src={order.providerPhotoURL || 'https://via.placeholder.com/50'} 
              alt="Provider Avatar" 
              className="rounded-circle me-3"
              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
            />
            <div>
              <strong>Order #{order.id}</strong> - {formatDate(order.createdAt)}
              <br />
              <strong>Service:</strong> {order.service}
              <br />
              <strong>From:</strong> {order.from || 'Not specified'}
              <br />
              <strong>To:</strong> {order.to || 'Not specified'}
              <br />
              <strong>Car Model:</strong> {order.carModel || 'Not specified'}
              <br />
              <strong>Provider:</strong> {order.providerName || 'Not specified'}
              <br />
              <strong>Total Cost:</strong> RM {order.priceDetails ? order.priceDetails.totalFare.toFixed(2) : 'Not specified'}
              <br />
              <strong>Status:</strong> {' '}
              <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                {order.status}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Order History</h2>
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/my-order')}
        >
          View Active Orders
        </button>
      </div>
      
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="alert alert-danger">
          {error}
          <br />
          <small>Please check the console for more details.</small>
        </div>
      ) : orders.length === 0 ? (
        <p>No completed or cancelled orders found.</p>
      ) : (
        renderOrderList(orders)
      )}
    </div>
  );
};

export default MyHistory;