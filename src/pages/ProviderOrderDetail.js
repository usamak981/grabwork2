import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

const ProviderOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [waitingTimer, setWaitingTimer] = useState(0);
  const [journeyTimer, setJourneyTimer] = useState(0);
  const [isWaitingRunning, setIsWaitingRunning] = useState(false);
  const [isJourneyRunning, setIsJourneyRunning] = useState(false);
  const [canInitiateWaiting, setCanInitiateWaiting] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        if (orderDoc.exists()) {
          const orderData = orderDoc.data();
          setOrder({ id: orderDoc.id, ...orderData });
          if (orderData.waitingStartTime && orderData.status === 'waiting') {
            setIsWaitingRunning(true);
            setCanInitiateWaiting(false);
            const waitingStartTime = new Date(orderData.waitingStartTime).getTime();
            const elapsedSeconds = Math.floor((Date.now() - waitingStartTime) / 1000);
            setWaitingTimer(elapsedSeconds);
          }
          if (orderData.startTime && orderData.status === 'in-progress') {
            setIsJourneyRunning(true);
            const startTime = new Date(orderData.startTime).getTime();
            const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
            setJourneyTimer(elapsedSeconds);
          }
          if (orderData.status === 'completed') {
            setWaitingTimer(orderData.waitingDuration || 0);
            setJourneyTimer(orderData.journeyDuration || 0);
          }
        } else {
          setError('Order not found');
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  useEffect(() => {
    let waitingInterval, journeyInterval;
    if (isWaitingRunning) {
      waitingInterval = setInterval(() => {
        setWaitingTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    }
    if (isJourneyRunning) {
      journeyInterval = setInterval(() => {
        setJourneyTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    }
    return () => {
      clearInterval(waitingInterval);
      clearInterval(journeyInterval);
    };
  }, [isWaitingRunning, isJourneyRunning]);

  const formatTime = (time) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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

  const getScheduledTimeDisplay = (scheduledTime, when) => {
    if (when === 'now') {
      return `Now (${formatDate(new Date())})`;
    }
    return formatDate(scheduledTime);
  };

  const handleInitiateWaiting = async () => {
    try {
      const waitingStartTime = new Date().toISOString();
      await updateDoc(doc(db, 'orders', orderId), { 
        waitingStartTime: waitingStartTime,
        status: 'waiting'
      });
      setOrder({ ...order, waitingStartTime: waitingStartTime, status: 'waiting' });
      setIsWaitingRunning(true);
      setCanInitiateWaiting(false);

      // Send message to user
      await addDoc(collection(db, 'messages'), {
        chatId: order.chatId,
        content: 'Driver has arrived and is waiting',
        senderId: auth.currentUser.uid,
        timestamp: new Date(),
        type: 'system'
      });
    } catch (err) {
      console.error('Error initiating waiting:', err);
      setError('Failed to initiate waiting');
    }
  };

  const handleStartJourney = async () => {
    try {
      const startTime = new Date().toISOString();
      const waitingDuration = order.waitingStartTime 
        ? Math.floor((new Date(startTime).getTime() - new Date(order.waitingStartTime).getTime()) / 1000)
        : 0;
      await updateDoc(doc(db, 'orders', orderId), { 
        status: 'in-progress',
        startTime: startTime,
        waitingDuration: waitingDuration
      });
      setOrder({ ...order, status: 'in-progress', startTime: startTime, waitingDuration: waitingDuration });
      setIsWaitingRunning(false);
      setIsJourneyRunning(true);
    } catch (err) {
      console.error('Error starting journey:', err);
      setError('Failed to start journey');
    }
  };

  const handleEndTask = async () => {
    if (window.confirm('Are you sure you want to end this task?')) {
      try {
        const endTime = new Date().toISOString();
        const journeyDuration = Math.floor((new Date(endTime).getTime() - new Date(order.startTime).getTime()) / 1000);
        await updateDoc(doc(db, 'orders', orderId), { 
          status: 'completed',
          endTime: endTime,
          journeyDuration: journeyDuration
        });
        setOrder({ ...order, status: 'completed', endTime: endTime, journeyDuration: journeyDuration });
        setIsJourneyRunning(false);
        navigate('/provider-orders');
      } catch (err) {
        console.error('Error ending task:', err);
        setError('Failed to end task');
      }
    }
  };

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await updateDoc(doc(db, 'orders', orderId), { 
          status: 'cancelled',
          cancelledAt: new Date().toISOString()
        });
        setOrder({ ...order, status: 'cancelled' });
        alert('Order cancelled successfully');
        navigate('/provider-orders');
      } catch (err) {
        console.error('Error cancelling order:', err);
        setError('Failed to cancel order');
      }
    }
  };

  const handleOpenChat = () => {
    if (order.chatId) {
      navigate(`/message-list/${order.chatId}`);
    } else {
      setError("Chat not available. This order doesn't have an associated chat.");
    }
  };

  if (loading) return <div className="container mt-5">Loading...</div>;
  if (error) return <div className="container mt-5 alert alert-danger">{error}</div>;
  if (!order) return <div className="container mt-5">No order found</div>;

  return (
    <div className="container mt-5">
      <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>Back</button>
      <h2 className="mb-4">Order Details</h2>
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <img 
              src={order.userPhotoURL || 'https://via.placeholder.com/50'} 
              alt="User Avatar" 
              className="rounded-circle me-3"
              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
            />
            <h4 className="card-title mb-0">Order #{order.id}</h4>
          </div>
          <p><strong>Status:</strong> {order.status}</p>
          <p><strong>Customer:</strong> {order.userName}</p>
          <p><strong>Service:</strong> {order.service}</p>
          <p><strong>Request Date:</strong> {formatDate(order.createdAt)}</p>
          <p><strong>Scheduled Time:</strong> {getScheduledTimeDisplay(order.dateTime, order.when)}</p>
          <p><strong>From:</strong> {order.from || 'Not specified'}</p>
          <p><strong>To:</strong> {order.to || 'Not specified'}</p>
          <p><strong>Car Model:</strong> {order.carModel || 'Not specified'}</p>
          <p><strong>Total Cost:</strong> RM {order.priceDetails ? order.priceDetails.totalFare.toFixed(2) : 'Not specified'}</p>
          
          {order.status === 'waiting accept' && (
            <div className="mt-3">
              
            </div>
          )}

          {order.status === 'accepted' && (
            <div className="mt-3">
              {canInitiateWaiting && (
                <button className="btn btn-warning me-2" onClick={handleInitiateWaiting}>Start Waiting</button>
              )}
              <button className="btn btn-info me-2" onClick={handleStartJourney}>Start Journey</button>
              <button className="btn btn-danger me-2" onClick={handleCancel}>Cancel Order</button>
              <button className="btn btn-secondary" onClick={handleOpenChat}>Open Chat</button>
            </div>
          )}

          {order.status === 'waiting' && (
            <div className="mt-3">
              <button className="btn btn-info me-2" onClick={handleStartJourney}>Start Journey</button>
              <button className="btn btn-danger me-2" onClick={handleCancel}>Cancel Order</button>
              <button className="btn btn-secondary" onClick={handleOpenChat}>Open Chat</button>
            </div>
          )}
          
          {order.status === 'in-progress' && (
            <div className="mt-3">
              <button className="btn btn-danger me-2" onClick={handleEndTask}>End Task</button>
              <button className="btn btn-secondary" onClick={handleOpenChat}>Open Chat</button>
            </div>
          )}
          
          {(order.status === 'waiting' || order.status === 'in-progress') && (
            <p><strong>Waiting Time:</strong> {formatTime(waitingTimer)}</p>
          )}
          {order.status === 'in-progress' && (
            <p><strong>Journey Time:</strong> {formatTime(journeyTimer)}</p>
          )}
          
          {order.status === 'completed' && (
            <>
              <p><strong>Total Waiting Time:</strong> {formatTime(waitingTimer)}</p>
              <p><strong>Total Journey Time:</strong> {formatTime(journeyTimer)}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderOrderDetail;