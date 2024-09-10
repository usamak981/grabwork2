import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { addDoc, collection, query, where, getDocs, setDoc, doc, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

const generateOrderId = async () => {
  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, orderBy('id', 'desc'), limit(1));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return 'AA0001';
  } else {
    const lastOrder = querySnapshot.docs[0].data();
    const lastId = lastOrder.id;
    const numPart = parseInt(lastId.slice(2), 10) + 1;
    const newNumPart = numPart.toString().padStart(4, '0');
    return `AA${newNumPart}`;
  }
};

const Confirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    if (!location.state) {
      navigate('/');
    } else {
      setOrderDetails(location.state);
    }
  }, [location, navigate]);

  useEffect(() => {
    const checkActiveOrders = async () => {
      if (user) {
        const ordersRef = collection(db, 'orders');
        const q = query(
          ordersRef, 
          where('userId', '==', user.uid),
          where('status', 'in', ['waiting accept', 'accepted', 'waiting', 'in-progress'])
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setError("You have an active order. Please complete or cancel it before making a new request.");
        }
      }
    };

    checkActiveOrders();
  }, [user]);

  const handleConfirm = async () => {
    if (!user) {
      setError("Please log in to confirm your order.");
      return;
    }

    if (!orderDetails) {
      setError("Order details are missing. Please try again.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newOrderId = await generateOrderId();
      const orderData = {
        id: newOrderId,
        ...orderDetails,
        userId: user.uid,
        status: 'waiting accept',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'orders', newOrderId), orderData);
      console.log('Order created successfully with ID:', newOrderId);

      // Find all providers in the city
      const providersRef = collection(db, 'providers');
      const q = query(providersRef, where('location.city', '==', orderData.city));
      const querySnapshot = await getDocs(q);

      // Send the order to all providers in the city
      const providerPromises = querySnapshot.docs.map(async (providerDoc) => {
        const providerOrderData = {
          orderId: newOrderId,
          providerId: providerDoc.id,
          ...orderData
        };
        await addDoc(collection(db, 'providerOrders'), providerOrderData);
      });

      await Promise.all(providerPromises);

      alert('Your order has been sent to all available providers in the city!');
      navigate(`/my-order-detail/${newOrderId}`);
    } catch (error) {
      console.error('Error creating order:', error);
      setError('Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!orderDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Order Confirmation</h2>
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Route Details</h5>
          <p><strong>From:</strong> {orderDetails.from}</p>
          <p><strong>To:</strong> {orderDetails.to}</p>
          <p><strong>City:</strong> {orderDetails.city}</p>
          <p><strong>When:</strong> {orderDetails.when === 'now' ? 'Now' : `${orderDetails.scheduledDate} ${orderDetails.scheduledTime}`}</p>
          <p><strong>Car Model:</strong> {orderDetails.carModel}</p>
          <p><strong>Distance:</strong> {orderDetails.distance}</p>
          <p><strong>Estimated Duration:</strong> {orderDetails.duration}</p>
          {orderDetails.note && <p><strong>Note:</strong> {orderDetails.note}</p>}

          <h5 className="mt-4">Price Breakdown</h5>
          <ul className="list-unstyled">
            <li>Base Fare: RM {orderDetails.priceDetails.baseFare.toFixed(2)}</li>
            <li>Distance: {orderDetails.priceDetails.distanceInKm.toFixed(1)} km x RM 4 = RM {orderDetails.priceDetails.distanceFare.toFixed(2)}</li>
            <li><strong>Total Fare: RM {orderDetails.priceDetails.totalFare.toFixed(2)}</strong></li>
          </ul>

          {error && <div className="alert alert-danger mt-3">{error}</div>}

          <button 
            className="btn btn-primary mt-3" 
            onClick={handleConfirm} 
            disabled={isSubmitting || error}
          >
            {isSubmitting ? 'Confirming...' : 'Confirm Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;