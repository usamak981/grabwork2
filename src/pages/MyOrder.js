import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const MyOrder = () => {
  const [orders, setOrders] = useState([]);
  const user = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      console.log('Fetching active orders for user:', user.uid);
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef, 
        where('userId', '==', user.uid),
        where('status', 'in', ['waiting accept', 'accepted', 'in-progress'])
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedOrders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log('Fetched active orders:', fetchedOrders);
        // Sort orders by date, latest on top
        const sortedOrders = fetchedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sortedOrders);
      }, (error) => {
        console.error("Error fetching active orders:", error);
      });

      return unsubscribe;
    }
  }, [user]);

  const handleOrderClick = (orderId) => {
    navigate(`/my-order-detail/${orderId}`);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'waiting accept':
        return 'bg-warning';
      case 'accepted':
        return 'bg-info';
      case 'in-progress':
        return 'bg-primary';
      default:
        return 'bg-secondary';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Date not available';
    
    let date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (timestamp.seconds) {
      // Firestore Timestamp
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

  const getScheduledTimeDisplay = (scheduledTime, when) => {
    if (when === 'now') {
      return `Now (${formatDate(new Date())})`;
    }
    return formatDate(scheduledTime);
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Active Orders</h2>
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/my-history')}
        >
          View Order History
        </button>
      </div>
      
      {orders.length === 0 ? (
        <p>No active orders found.</p>
      ) : (
        <div className="row">
          {orders.map(order => (
            <div key={order.id} className="col-md-6 mb-4">
              <div 
                className="card" 
                onClick={() => handleOrderClick(order.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-body">
                  <h5 className="card-title">{order.service}</h5>
                  <h6 className="card-subtitle mb-2 text-muted">Provider: {order.providerName || 'Not specified'}</h6>
                  <p className="card-text">
                    <strong>From:</strong> {order.from || 'Not specified'}<br />
                    <strong>To:</strong> {order.to || 'Not specified'}<br />
                    <strong>Car Model:</strong> {order.carModel || 'Not specified'}<br />
                    <strong>Request Date:</strong> {formatDate(order.createdAt)}<br />
                    <strong>Scheduled Time:</strong> {getScheduledTimeDisplay(order.dateTime, order.when)}<br />
                    <strong>Status:</strong> {' '}
                    <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                      {order.status}
                    </span>
                  </p>
                  {order.priceDetails && (
                    <p className="card-text"><strong>Total Cost:</strong> RM {order.priceDetails.totalFare.toFixed(2)}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrder;