import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { Modal, Button, Form } from 'react-bootstrap';
import UserReview from './UserReview'; // Import the UserReview component

const MyOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [waitingTimer, setWaitingTimer] = useState(0);
  const [journeyTimer, setJourneyTimer] = useState(0);
  const [isWaitingRunning, setIsWaitingRunning] = useState(false);
  const [isJourneyRunning, setIsJourneyRunning] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const isHistoricalOrder = location.pathname.includes('/order-history/');

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'orders', orderId), (doc) => {
      if (doc.exists()) {
        const orderData = { id: doc.id, ...doc.data() };
        setOrder(orderData);

        if (orderData.status === 'completed' && !orderData.userReview) {
          setShowReviewModal(true);
        }

        if (orderData.waitingStartTime && (orderData.status === 'waiting' || orderData.status === 'accepted')) {
          setIsWaitingRunning(true);
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

        setLoading(false);
      } else {
        setError('Order not found');
        setLoading(false);
      }
    }, (error) => {
      console.error("Error fetching order details:", error);
      setError('Failed to fetch order details');
      setLoading(false);
    });

    return () => unsubscribe();
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

  useEffect(() => {
    if (order && order.status === 'completed' && !order.userReview) {
      const updateTimeRemaining = () => {
        const endTime = new Date(order.endTime);
        const now = new Date();
        const timeLeft = 24 * 60 * 60 * 1000 - (now - endTime);
        
        if (timeLeft <= 0) {
          setTimeRemaining('Review period has ended');
          return;
        }

        const hours = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
        setTimeRemaining(`${hours} hours and ${minutes} minutes`);
      };

      updateTimeRemaining();
      const interval = setInterval(updateTimeRemaining, 60000);
      return () => clearInterval(interval);
    }
  }, [order]);

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
  
  const formatTime = (time) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleCancel = async () => {
    if (order.status === 'waiting accept' || (order.status === 'accepted' && !order.startTime)) {
      setShowCancelModal(true);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelReason) {
      alert('Please select a reason for cancellation.');
      return;
    }
    try {
      const cancellationFee = order.startTime ? 20 : 0;
      await updateDoc(doc(db, 'orders', orderId), { 
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancellationReason: cancelReason,
        cancellationFee: cancellationFee
      });
      setShowCancelModal(false);
      alert(`Order cancelled successfully. ${cancellationFee > 0 ? `A cancellation fee of RM ${cancellationFee} has been charged.` : ''}`);
      navigate('/my-order');
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError('Failed to cancel order');
    }
  };

  const handleReviewSubmit = () => {
    setShowReviewModal(false);
    // Optionally, you can refresh the order data here if needed
  };

  const handleCancelReview = () => {
    setShowReviewModal(false);
  };

  const handleOpenChat = async () => {
    if (order.chatId) {
      const now = new Date();
      const endTime = new Date(order.endTime);
      if (now - endTime > 24 * 60 * 60 * 1000) {
        setError("Chat is no longer available 24 hours after the order has ended.");
      } else {
        navigate(`/message-list/${order.chatId}`);
      }
    } else {
      setError("Chat not available. Please wait for the provider to accept the order.");
    }
  };

  const canReview = () => {
    if (!order || !order.endTime) return false;
    const endTime = new Date(order.endTime);
    const now = new Date();
    return now - endTime <= 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  };

  if (loading) return <div className="container mt-5">Loading...</div>;
  if (error) return <div className="container mt-5 alert alert-danger">{error}</div>;
  if (!order) return <div className="container mt-5">No order found</div>;

  return (
    <div className="container mt-5">
      <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>Back</button>
      <h2 className="mb-4">{isHistoricalOrder ? 'Order History Detail' : 'My Order Detail'}</h2>
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <img 
              src={order.providerPhotoURL || 'https://via.placeholder.com/50'} 
              alt="Provider Avatar" 
              className="rounded-circle me-3"
              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
            />
            <h4 className="card-title mb-0">Order #{order.id}</h4>
          </div>
          <p><strong>Status:</strong> {order.status}</p>
          <p><strong>Provider:</strong> {order.providerName}</p>
          <p><strong>Service:</strong> {order.service}</p>
          <p><strong>Request Date:</strong> {formatDate(order.createdAt)}</p>
          <p><strong>Scheduled Time:</strong> {getScheduledTimeDisplay(order.dateTime, order.when)}</p>
          <p><strong>From:</strong> {order.from}</p>
          <p><strong>To:</strong> {order.to}</p>
          <p><strong>Car Model:</strong> {order.carModel}</p>
          <p><strong>Total Cost:</strong> RM {order.priceDetails ? order.priceDetails.totalFare.toFixed(2) : 'Not specified'}</p>
          
          {!isHistoricalOrder && (
            <div className="mt-3">
              {(order.status === 'waiting accept' || (order.status === 'accepted' && !order.startTime)) && (
                <button className="btn btn-danger me-2" onClick={handleCancel}>Cancel Order</button>
              )}
              {order.status !== 'waiting accept' && (
                <button className="btn btn-secondary" onClick={handleOpenChat}>Open Chat</button>
              )}
              {order.status === 'completed' && !order.userReview && canReview() && (
                <button className="btn btn-primary ms-2" onClick={() => setShowReviewModal(true)}>Leave Review</button>
              )}
            </div>
          )}
          {(order.status === 'waiting' || order.status === 'accepted') && isWaitingRunning && (
            <p><strong>Driver Waiting Time:</strong> {formatTime(waitingTimer)}</p>
          )}
          {order.status === 'in-progress' && isJourneyRunning && (
            <p><strong>Journey Duration:</strong> {formatTime(journeyTimer)}</p>
          )}
          {order.status === 'completed' && (
            <>
              <p><strong>Total Waiting Time:</strong> {formatTime(waitingTimer)}</p>
              <p><strong>Total Journey Duration:</strong> {formatTime(journeyTimer)}</p>
            </>
          )}
        </div>
      </div>

      {/* User Review Section */}
      {order.userReview && (
        <div className="card mt-4">
          <div className="card-body">
            <h5 className="card-title">Your Review</h5>
            <p><strong>Type:</strong> {order.userReview.type}</p>
            <p><strong>Rating:</strong> {order.userReview.rating} / 5</p>
            <p><strong>Comment:</strong> {order.userReview.review}</p>
          </div>
        </div>
      )}

      {/* Time Remaining for Review */}
      {order.status === 'completed' && !order.userReview && canReview() && (
        <div className="alert alert-info mt-3">
          Time remaining to leave a review: {timeRemaining}
        </div>
      )}

      {/* Cancel Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Cancel Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Please select a reason for cancelling the order:</p>
          <Form.Select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>
            <option value="">Select Reason</option>
            <option value="Provider did not show up">Provider did not show up</option>
            <option value="Changed my mind">Changed my mind</option>
            <option value="Found a better price">Found a better price</option>
          </Form.Select>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>Close</Button>
          <Button variant="danger" onClick={handleCancelConfirm}>Confirm Cancel</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Leave a Review</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <UserReview 
            orderId={orderId} 
            onReviewSubmit={handleReviewSubmit} 
            onCancel={handleCancelReview}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default MyOrderDetail;
