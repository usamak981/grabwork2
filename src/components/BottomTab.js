import React, { useState, useEffect } from 'react';
import { Home, ShoppingBag, MessageSquare, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

const BottomTab = () => {
  const [isProvider, setIsProvider] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const providerDocRef = doc(db, 'providers', currentUser.uid);
        const unsubscribeFirestore = onSnapshot(providerDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            console.log("Provider status found:", docSnapshot.data());
            setIsProvider(true);
          } else {
            console.log("No provider status found for user.");
            setIsProvider(false);
          }
        }, (error) => {
          console.error("Error listening to provider status:", error);
        });

        return () => unsubscribeFirestore();
      } else {
        setIsProvider(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <nav className="fixed-bottom bg-light">
      <ul className="nav nav-pills nav-fill">
        <li className="nav-item">
          <Link to="/" className="nav-link text-center">
            <Home className="d-block mx-auto mb-1" />
            <small>Home</small>
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/my-order" className="nav-link text-center">
            <ShoppingBag className="d-block mx-auto mb-1" />
            <small>My Order</small>
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/message-list" className="nav-link text-center">
            <MessageSquare className="d-block mx-auto mb-1" />
            <small>Messages</small>
          </Link>
        </li>
        {isProvider && (
          <li className="nav-item">
            <Link to="/provider-orders" className="nav-link text-center">
              <ShoppingBag className="d-block mx-auto mb-1" />
              <small>Provider Orders</small>
            </Link>
          </li>
        )}
        <li className="nav-item">
          <Link to="/profile" className="nav-link text-center">
            {user && user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="d-block mx-auto mb-1 rounded-circle"
                style={{ width: '24px', height: '24px', objectFit: 'cover' }}
              />
            ) : (
              <User className="d-block mx-auto mb-1" />
            )}
            <small>Profile</small>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default BottomTab;