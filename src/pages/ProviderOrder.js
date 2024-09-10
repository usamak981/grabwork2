import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc, arrayUnion, addDoc } from 'firebase/firestore';

const ProviderOrder = () => {
  const [activeTab, setActiveTab] = useState('incoming');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [providerInfo, setProviderInfo] = useState(null);
  const user = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProviderInfo = async () => {
      if (user) {
        try {
          const providerDoc = await getDoc(doc(db, 'providers', user.uid));
          if (providerDoc.exists()) {
            const providerData = providerDoc.data();
            console.log('Provider data:', providerData);
            setProviderInfo(providerData);
          } else {
            setError('Provider information not found.');
          }
        } catch (error) {
          console.error('Error fetching provider info:', error);
          setError('Failed to fetch provider information.');
        }
      }
    };

    fetchProviderInfo();
  }, [user]);

  useEffect(() => {
    const fetchOrders = () => {
      if (user && providerInfo && providerInfo.service && providerInfo.status === 'approved' && providerInfo.city) {
        console.log('Fetching orders for provider:', user.uid);
        const ordersRef = collection(db, 'orders');
        let q;
        
        if (activeTab === 'incoming') {
          q = query(
            ordersRef, 
            where('service', '==', providerInfo.service),
            where('city', '==', providerInfo.city),
            where('status', '==', 'waiting accept')
          );
        } else if (activeTab === 'accepted') {
          q = query(ordersRef, where('providerId', '==', user.uid), where('status', '==', 'accepted'));
        } else if (activeTab === 'in-progress') {
          q = query(ordersRef, where('providerId', '==', user.uid), where('status', '==', 'in-progress'));
        } else { // history
          q = query(ordersRef, where('providerId', '==', user.uid), where('status', 'in', ['completed', 'cancelled']));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedOrders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          console.log(`Fetched ${activeTab} orders:`, fetchedOrders);
          
          const filteredOrders = activeTab === 'incoming' 
            ? fetchedOrders.filter(order => 
                !order.rejectedBy || !order.rejectedBy.includes(user.uid)
              )
            : fetchedOrders;
          
          setOrders(filteredOrders);
          setLoading(false);
        }, (error) => {
          console.error('Error fetching orders:', error);
          setError('Failed to fetch orders. Please try again.');
          setLoading(false);
        });

        return unsubscribe;
      } else {
        setOrders([]);
        setLoading(false);
        if (!providerInfo || !providerInfo.service || providerInfo.status !== 'approved' || !providerInfo.city) {
          setError('Provider information is incomplete or not approved. Please update your profile.');
        }
      }
    };

    if (providerInfo) {
      setLoading(true);
      const unsubscribe = fetchOrders();
      return () => unsubscribe && unsubscribe();
    }
  }, [activeTab, user, providerInfo]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const acceptOrder = async (orderId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      
      if (orderDoc.exists()) {
        const orderData = orderDoc.data();
        
        // Create a new chat
        const chatData = {
          orderId: orderId,
          userId: orderData.userId,
          providerId: user.uid,
          userName: orderData.userName,
          providerName: user.displayName || user.email,
          lastMessage: '',
          lastMessageTime: null,
          participants: [orderData.userId, user.uid]
        };
        
        const chatRef = await addDoc(collection(db, 'chats'), chatData);

        // Update the order
        await updateDoc(orderRef, { 
          status: 'accepted',
          providerId: user.uid,
          providerName: user.displayName || user.email,
          chatId: chatRef.id
        });

        console.log('Order accepted successfully:', orderId);
        setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      } else {
        throw new Error('Order not found');
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      setError('Failed to accept order. Please try again.');
    }
  };

  const rejectOrder = async (orderId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);

      await updateDoc(orderRef, { 
        rejectedBy: arrayUnion(user.uid)
      });

      console.log('Order rejected successfully:', orderId);
      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
    } catch (error) {
      console.error('Error rejecting order:', error);
      setError('Failed to reject order. Please try again.');
    }
  };

  const handleOrderClick = (orderId) => {
    navigate(`/provider-order-detail/${orderId}`);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Not specified';
    
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

  const getScheduledTimeDisplay = (scheduledTime, when) => {
    if (when === 'now') {
      return `Now (${formatDate(new Date())})`;
    }
    return formatDate(scheduledTime);
  };

  const renderOrderList = (orders, showAcceptButton = false) => (
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
              src={order.userPhotoURL || 'https://via.placeholder.com/50'} 
              alt="User Avatar" 
              className="rounded-circle me-3"
              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
            />
            <div>
              <strong>Order #{order.id}</strong>
              <br />
              <strong>Request Date:</strong> {formatDate(order.createdAt)}
              <br />
              <strong>Scheduled Time:</strong> {getScheduledTimeDisplay(order.dateTime, order.when)}
              <br />
              <strong>From:</strong> {order.from || 'Not specified'}
              <br />
              <strong>To:</strong> {order.to || 'Not specified'}
              <br />
              <strong>Car Model:</strong> {order.carModel || 'Not specified'}
              <br />
              <strong>Customer:</strong> {order.userName || 'Anonymous'}
              <br />
              <strong>Total Cost:</strong> RM {order.priceDetails ? order.priceDetails.totalFare.toFixed(2) : 'Not specified'}
            </div>
          </div>
          {showAcceptButton && (
            <div>
              <button 
                className="btn btn-success me-2"
                onClick={(e) => {
                  e.stopPropagation();
                  acceptOrder(order.id);
                }}
              >
                Accept
              </button>
              <button 
                className="btn btn-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  rejectOrder(order.id);
                }}
              >
                Reject
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  if (loading) {
    return <div className="container mt-5">Loading...</div>;
  }

  if (error) {
    return <div className="container mt-5 alert alert-danger">{error}</div>;
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Provider Orders</h2>
      <p>Current user ID: {user ? user.uid : 'Not logged in'}</p>
      <p>Active tab: {activeTab}</p>
      <p>Number of orders: {orders.length}</p>
      {providerInfo && (
        <div>
          <p>Service: {providerInfo.service || 'Not specified'}</p>
          <p>City: {providerInfo.city || 'Not specified'}</p>
          <p>Status: {providerInfo.status || 'Not specified'}</p>
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'incoming' ? 'active' : ''}`} 
            onClick={() => handleTabChange('incoming')}
          >
            Incoming
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'accepted' ? 'active' : ''}`} 
            onClick={() => handleTabChange('accepted')}
          >
            Accepted
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'in-progress' ? 'active' : ''}`} 
            onClick={() => handleTabChange('in-progress')}
          >
            In Progress
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'history' ? 'active' : ''}`} 
            onClick={() => handleTabChange('history')}
          >
            History
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content mt-3">
        {activeTab === 'incoming' && (
          <div className="tab-pane active">
            <h3>Incoming Orders</h3>
            {orders.length === 0 ? (
              <p>No incoming orders found.</p>
            ) : (
              renderOrderList(orders, true)
            )}
          </div>
        )}
        {activeTab === 'accepted' && (
          <div className="tab-pane active">
            <h3>Accepted Orders</h3>
            {orders.length === 0 ? (
              <p>No accepted orders found.</p>
            ) : (
              renderOrderList(orders)
            )}
          </div>
        )}
        {activeTab === 'in-progress' && (
          <div className="tab-pane active">
            <h3>In Progress Orders</h3>
            {orders.length === 0 ? (
              <p>No in-progress orders found.</p>
            ) : (
              renderOrderList(orders)
            )}
          </div>
        )}
        {activeTab === 'history' && (
          <div className="tab-pane active">
            <h3>Order History</h3>
            {orders.length === 0 ? (
              <p>No order history found.</p>
            ) : (
              renderOrderList(orders)
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderOrder;