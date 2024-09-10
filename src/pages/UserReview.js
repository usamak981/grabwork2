import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, addDoc, collection, increment } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

const UserReview = ({ orderId, onReviewSubmit, onCancel }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(0);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        if (orderDoc.exists()) {
          const orderData = orderDoc.data();
          if (orderData.userReview) {
            // If review already exists, close the modal
            onCancel();
            return;
          }
          setOrder({ id: orderDoc.id, ...orderData });
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
  }, [orderId, onCancel]);

  const addContributionPoint = async (userId) => {
    const pointData = {
      userId,
      date: new Date(),
      description: 'Submitted a review',
      pointType: 'contribution',
      userType: 'User',
      pointAmount: 1,
    };

    await addDoc(collection(db, 'pointHistory'), pointData);
  };

  const handleRecommend = async () => {
    if (rating === 0) {
      alert('Please select a rating before submitting your recommendation.');
      return;
    }

    try {
      // Add reputation point to provider
      await updateDoc(doc(db, 'providers', order.providerId), {
        reputationPoints: increment(1),
      });

      // Add reputation point to provider's point history
      const providerPointData = {
        userId: order.providerId,
        date: new Date(),
        description: 'Received a recommendation',
        pointType: 'reputation',
        userType: 'Provider',
        pointAmount: 1,
      };
      await addDoc(collection(db, 'pointHistory'), providerPointData);

      // Update order with user review
      await updateDoc(doc(db, 'orders', orderId), {
        userReview: { type: 'recommend', review, rating },
      });

      // Add contribution point to user
      await addContributionPoint(auth.currentUser.uid);

      alert('Thank you for your recommendation!');
      onReviewSubmit();
    } catch (err) {
      console.error('Error submitting recommendation:', err);
      setError('Failed to submit recommendation');
    }
  };

  const handleComplain = async () => {
    if (rating === 0) {
      alert('Please select a rating before submitting your complaint.');
      return;
    }

    try {
      // Update order with user review
      await updateDoc(doc(db, 'orders', orderId), {
        userReview: { type: 'complaint', review, rating },
      });

      // Add contribution point to user
      await addContributionPoint(auth.currentUser.uid);

      alert('Your complaint has been submitted. We will review it shortly.');
      onReviewSubmit();
    } catch (err) {
      console.error('Error submitting complaint:', err);
      setError('Failed to submit complaint');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!order) return <div>No order found</div>;

  return (
    <div>
      <h5>Order #{order.id}</h5>
      <p><strong>Provider:</strong> {order.providerName}</p>
      <p><strong>Service:</strong> {order.service}</p>

      <div className="form-group mb-3">
        <label htmlFor="review">Your Review:</label>
        <textarea
          id="review"
          className="form-control"
          rows="3"
          value={review}
          onChange={(e) => setReview(e.target.value)}
        ></textarea>
      </div>

      <div className="form-group mb-3">
        <label>Rating:</label>
        <div>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              onClick={() => setRating(star)}
              style={{ cursor: 'pointer', fontSize: '2em', color: star <= rating ? 'gold' : 'gray' }}
            >
              ★
            </span>
          ))}
        </div>
      </div>

      <div className="d-flex justify-content-between">
        <button className="btn btn-success" onClick={handleRecommend}>Recommend</button>
        <button className="btn btn-danger" onClick={handleComplain}>Complain</button>
        <button className="btn btn-secondary" onClick={onCancel}>Cancel Review</button>
      </div>
    </div>
  );
};

export default UserReview;