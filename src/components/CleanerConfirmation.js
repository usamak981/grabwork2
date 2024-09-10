import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

const CleanerConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingDetails, orderId } = location.state || {};
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [isOrderConfirmed, setIsOrderConfirmed] = useState(false);

  useEffect(() => {
    console.log('CleanerConfirmation - Received booking details:', bookingDetails);
    if (bookingDetails && (!bookingDetails.providerId || !bookingDetails.providerName)) {
      console.error('Provider information is missing or incomplete:', bookingDetails);
      setError('Provider information is missing or incomplete. Please go back and try again.');
    }

    // Check if the order has already been confirmed
    const checkOrderStatus = async () => {
      if (orderId) {
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        if (orderDoc.exists() && orderDoc.data().status !== 'pending') {
          setIsOrderConfirmed(true);
        }
      }
    };
    checkOrderStatus();

    // Prevent going back to this page after confirmation
    const handlePopState = (event) => {
      if (isOrderConfirmed) {
        navigate('/', { replace: true });
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [bookingDetails, orderId, isOrderConfirmed, navigate]);

  if (!bookingDetails || isOrderConfirmed) {
    navigate('/', { replace: true });
    return null;
  }

  // Calculate the correct total with dirty clean charges
  const dirtyCleanCost = bookingDetails.dirtyCleanPhotos.length * 10;
  const totalCost = bookingDetails.generalCleaningCost + dirtyCleanCost;

  // Handle Date and Time Display
  let dateTimeDisplay;
  if (bookingDetails.scheduling === 'now') {
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + 30 * 60000); // 30 minutes from now
    dateTimeDisplay = `Now or arrived by ${arrivalTime.toLocaleTimeString('en-MY', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })} on ${arrivalTime.toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })}`;
  } else {
    dateTimeDisplay = bookingDetails.dateTime;
  }

  const handleConfirm = async () => {
    if (isOrderConfirmed) {
      console.log('Order already confirmed. Redirecting to home page.');
      navigate('/', { replace: true });
      return;
    }

    setIsConfirming(true);
    setError(null);
    try {
      console.log('Starting confirmation process...');
      
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (!orderId) {
        throw new Error('Order ID is missing');
      }

      const orderData = {
        ...bookingDetails,
        status: 'waiting accept',
        createdAt: new Date().toISOString(),
        userId: user.uid,
        userName: user.displayName || user.email,
      };

      // Save the order to Firestore under the 'orders' collection
      await setDoc(doc(db, 'orders', orderId), orderData);
      console.log('Order saved to "orders" collection');

      const chatData = {
        orderId: orderId,
        userId: auth.currentUser.uid,
        providerId: orderData.providerId,
        userName: auth.currentUser.displayName || auth.currentUser.email,
        providerName: orderData.providerName,
        lastMessage: '',
        lastMessageTime: null,
        participants: [auth.currentUser.uid, orderData.providerId]
      };

      const chatRef = await addDoc(collection(db, 'chats'), chatData);

      // Update the order with the new chatId
      await updateDoc(doc(db, 'orders', orderId), { chatId: chatRef.id });

      setIsOrderConfirmed(true);
      navigate('/my-order', { replace: true });
    } catch (error) {
      console.error('Error confirming order:', error);
      setError(`Failed to confirm order: ${error.message}`);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Confirm Booking?</h2>

      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : (
        <>
          <div className="card mb-4">
            <div className="card-body">
              <h4 className="card-title">Cleaning Task</h4>
              <p className="card-text">Scheduled booking · {bookingDetails.selectedProperty}, {bookingDetails.city}, {bookingDetails.region}</p>
              <p className="card-text"><strong>Provider:</strong> {bookingDetails.providerName} (ID: {bookingDetails.providerId})</p>
              <p className="card-text"><strong>Customer:</strong> {bookingDetails.userName}</p>
              <h5>Tasks details</h5>
              <ul className="list-unstyled">
                <li><span className="fw-bold text-success">Cleaning type: {bookingDetails.cleaningType === 'standard' ? 'Standard Cleaning' : 'Deep Cleaning'}</span></li>
                <li>Cleaning Task ({bookingDetails.hours} hour) <span className="float-end">RM {bookingDetails.generalCleaningCost}</span></li>
                {dirtyCleanCost > 0 && (
                  <li>Dirty clean x {bookingDetails.dirtyCleanPhotos.length} <span className="float-end">RM {dirtyCleanCost}</span></li>
                )}
                <li className="mt-2">Total <strong className="float-end">RM {totalCost}</strong></li>
              </ul>
            </div>
          </div>

          <div className="mb-4">
            <h5>Booking details</h5>
            <p><strong>Date & time</strong><br />{dateTimeDisplay}</p>
            <p><strong>City, Region, Property</strong><br />{`${bookingDetails.city}, ${bookingDetails.region}, ${bookingDetails.selectedProperty}`}</p>
            <p><strong>Size of House</strong><br />{bookingDetails.houseSize} sf</p>
            <p><strong>Who is in the House?</strong><br />{bookingDetails.occupants}</p>
            <p><strong>Where to meet?</strong><br />{bookingDetails.meetingPlace === 'door' ? `Direct to my door: ${bookingDetails.doorLocation}` : 'Wait at guard house'}</p>
          </div>

          <div className="mb-4">
            <h5>What cleaning tools I have?</h5>
            <p>{bookingDetails.cleaningTools}</p>
            <div className="d-flex flex-wrap">
              {(bookingDetails.cleaningToolsPhotos || []).map((image, index) => (
                <img key={index} src={image} alt="Cleaning tool" className="img-thumbnail me-2 mb-2" style={{ width: '70px', height: '70px' }} />
              ))}
            </div>
          </div>

          <div className="mb-4">
            <h5>Area to be Cleaned</h5>
            <div className="d-flex flex-wrap">
              {(bookingDetails.areaCleanPhotos || []).map((image, index) => (
                <img key={index} src={image} alt="Area to be cleaned" className="img-thumbnail me-2 mb-2" style={{ width: '70px', height: '70px' }} />
              ))}
            </div>
          </div>

          <div className="mb-4">
            <h5>Dirty clean Extra Charges</h5>
            <div className="d-flex flex-wrap">
              {(bookingDetails.dirtyCleanPhotos || []).map((image, index) => (
                <img key={index} src={image} alt="Dirty area" className="img-thumbnail me-2 mb-2" style={{ width: '70px', height: '70px' }} />
              ))}
            </div>
          </div>

          <div className="row">
            <div className="col-6">
              <button onClick={handleBack} className="btn btn-outline-secondary w-100">Back</button>
            </div>
            <div className="col-6">
              <button 
                className="btn btn-primary w-100" 
                onClick={handleConfirm}
                disabled={isConfirming || isOrderConfirmed}
              >
                {isConfirming ? 'Confirming...' : 'Confirm'}
              </button>
            </div>
          </div>

          {isConfirming && (
            <div className="mt-3 text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p>Processing your order...</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CleanerConfirmation;