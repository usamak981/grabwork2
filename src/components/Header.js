import React, { useState, useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

const Header = () => {
  const [selectedCity, setSelectedCity] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const offcanvasRef = useRef(null);

  useEffect(() => {
    const initComponents = () => {
      if (typeof window.bootstrap !== 'undefined') {
        const offcanvasElement = document.getElementById('sideMenu');
        if (offcanvasElement) {
          offcanvasRef.current = new window.bootstrap.Offcanvas(offcanvasElement);
        }
      }
    };

    const fetchUserCity = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().selectedCity) {
          setSelectedCity(userDoc.data().selectedCity);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      initComponents();
      fetchUserCity();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [user]);

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <header>
      <nav className="navbar navbar-light bg-light shadow-sm">
        <div className="container-fluid">
          <div className="d-flex align-items-center">
            <button 
              className="btn" 
              type="button" 
              data-bs-toggle="offcanvas" 
              data-bs-target="#sideMenu" 
              aria-controls="sideMenu"
            >
              <Menu />
            </button>
            <span className="navbar-brand mb-0 h1 ms-2">Grab Work</span>
          </div>
        </div>
      </nav>

      <div className="offcanvas offcanvas-start" tabIndex="-1" id="sideMenu" aria-labelledby="sideMenuLabel">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="sideMenuLabel">Menu</h5>
          <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div className="offcanvas-body">
          <ul className="nav flex-column">
            <li className="nav-item"><button className="nav-link btn btn-link" onClick={() => handleNavigation('/')}>Home</button></li>
            <li className="nav-item"><button className="nav-link btn btn-link" onClick={() => handleNavigation('/provider-dashboard')}>Provider Dashboard</button></li>
            <li className="nav-item"><button className="nav-link btn btn-link" onClick={() => handleNavigation('/provider-list')}>Service Providers</button></li>
            {user && (
              <li className="nav-item"><button className="nav-link btn btn-link" onClick={() => handleNavigation('/my-points')}>My Points</button></li>
            )}
            {user && user.isAdmin && (
              <>
                <li className="nav-item">
                  <button 
                    className="nav-link btn btn-link" 
                    onClick={() => handleNavigation('/admin/provider-management')}
                  >
                    Provider Management (Admin)
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className="nav-link btn btn-link" 
                    onClick={() => handleNavigation('/admin/user-list')}
                  >
                    User List (Admin)
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className="nav-link btn btn-link" 
                    onClick={() => handleNavigation('/admin/reviews')}
                  >
                    Review Management (Admin)
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className="nav-link btn btn-link" 
                    onClick={() => handleNavigation('/admin/point-history')}
                  >
                    Point History (Admin)
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;