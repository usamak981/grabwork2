import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import cityData from '../data/cityData';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBbY4_2UYXSR06mAKOcT8UiDUhyJsZoTQY';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Script load error for ${src}`));
    document.head.appendChild(script);
  });
}

const Home = () => {
  const [selectedService, setSelectedService] = useState('chauffeur');
  const [selectedCity, setSelectedCity] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [when, setWhen] = useState('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [carModel, setCarModel] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [directionsServiceAvailable, setDirectionsServiceAvailable] = useState(true);

  const { user } = useAuth();
  const navigate = useNavigate();

  const fromInputRef = useRef(null);
  const toInputRef = useRef(null);

  const initializeAutocomplete = useCallback(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      if (fromInputRef.current) {
        let autoCompleteFrom  = new window.google.maps.places.Autocomplete(fromInputRef.current);
        autoCompleteFrom.addListener('place_changed', () => {
          const place = autoCompleteFrom.getPlace();
          if (place && place.formatted_address) {
            setFrom(place.formatted_address); // Update the state with the selected place
          }
        });
      }
      if (toInputRef.current) {
        let autoCompleteTo = new window.google.maps.places.Autocomplete(toInputRef.current);
        autoCompleteTo.addListener('place_changed', () => {
          const place = autoCompleteTo.getPlace();
          if (place && place.formatted_address) {
            setTo(place.formatted_address); // Update the state with the selected place
          }
        });
      }
    }
  }, []);

  useEffect(() => {
    const initGoogleMaps = async () => {
      try {
        await loadScript(`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`);
        setGoogleMapsLoaded(true);
        initializeAutocomplete();
      } catch (error) {
        console.error('Failed to load Google Maps API', error);
        setError('Failed to load Google Maps. Please try refreshing the page.');
      }
    };

    initGoogleMaps();
  }, [loading]);

  useEffect(() => {
    if (googleMapsLoaded) {
      initializeAutocomplete();
    }
  }, [googleMapsLoaded, loading]);

  useEffect(() => {
    const fetchUserCity = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().selectedCity) {
            setSelectedCity(userDoc.data().selectedCity);
          }
        } catch (error) {
          console.error('Error fetching user city:', error);
          setError('Failed to load user data. Please try again.');
        }
      }
      setLoading(false);
    };

    fetchUserCity();
  }, [user]);

  const calculateRoute = () => {
    return new Promise((resolve, reject) => {
      if (from && to && window.google && directionsServiceAvailable) {
        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
          {
            origin: from,
            destination: to,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              const route = result.routes[0];
              const distance = route.legs[0].distance.text;
              const duration = route.legs[0].duration.text;
              resolve({ distance, duration });
            } else {
              console.error('Error calculating route:', status);
              if (status === 'REQUEST_DENIED') {
                setDirectionsServiceAvailable(false);
                reject(new Error('Directions API is not enabled. Please enable it in the Google Cloud Console.'));
              } else {
                reject(new Error('Failed to calculate route. Please try again.'));
              }
            }
          }
        );
      } else {
        reject(new Error('Please enter both "From" and "To" locations.'));
      }
    });
  };

  const calculatePrice = (distance, time) => {
    const distanceInKm = parseFloat(distance.split(' ')[0]);
    const hour = parseInt(time.split(':')[0], 10);
    let baseFare;

    if (hour >= 0 && hour < 3) {
      baseFare = 60;
    } else if (hour >= 3 && hour < 7) {
      baseFare = 80;
    } else {
      baseFare = 40;
    }

    const distanceFare = distanceInKm * 4;
    const totalFare = baseFare + distanceFare;

    return {
      baseFare,
      distanceInKm,
      distanceFare,
      totalFare
    };
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("Please log in to continue.");
      return;
    }

    try {
      const result = await calculateRoute();
      const currentTime = when === 'now' ? new Date() : new Date(`${scheduledDate}T${scheduledTime}`);
      const calculatedPrice = calculatePrice(result.distance, `${currentTime.getHours()}:${currentTime.getMinutes()}`);

      navigate('/confirmation', {
        state: {
          service: selectedService,
          city: selectedCity,
          from,
          to,
          when,
          scheduledDate: when === 'scheduled' ? scheduledDate : null,
          scheduledTime: when === 'scheduled' ? scheduledTime : null,
          carModel,
          distance: result.distance,
          duration: result.duration,
          priceDetails: calculatedPrice,
          userId: user.uid,
          userName: user.displayName || user.email,
        }
      });
    } catch (error) {
      console.error('Error calculating route:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return <div className="container mt-5">Loading...</div>;
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Book a Ride</h2>
      {error && <div className="alert alert-danger mt-3">{error}</div>}
      <form onSubmit={handleSearch}>
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Service:</label>
            <select 
              className="form-select"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              required
            >
              <option value="chauffeur">Chauffeur</option>
            </select>
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">City:</label>
            <select 
              className="form-select"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              required
            >
              <option value="">Select a city</option>
              {Object.keys(cityData).map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">From:</label>
            <input 
              ref={fromInputRef}
              type="text" 
              className="form-control" 
              value={from} 
              onChange={(e) => setFrom(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">To:</label>
            <input 
              ref={toInputRef}
              type="text" 
              className="form-control" 
              value={to} 
              onChange={(e) => setTo(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">When:</label>
            <select 
              className="form-select"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              required
            >
              <option value="now">Now</option>
              <option value="scheduled">Schedule for later</option>
            </select>
          </div>
        </div>

        {when === 'scheduled' && (
          <div className="row mb-3">
            <div className="col-md-3">
              <label className="form-label">Date:</label>
              <input 
                type="date" 
                className="form-control"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Time:</label>
              <input 
                type="time" 
                className="form-control"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Car Model:</label>
            <input 
              type="text" 
              className="form-control"
              value={carModel}
              onChange={(e) => setCarModel(e.target.value)}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary">Calculate Route and Price</button>
      </form>

      {!googleMapsLoaded && <div className="alert alert-info mt-3">Loading Google Maps...</div>}
      
      {!directionsServiceAvailable && (
        <div className="alert alert-warning mt-3">
          <h5>Directions API is not enabled</h5>
          <p>Please follow these steps to enable the Directions API:</p>
          <ol>
            <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
            <li>Select your project</li>
            <li>Go to the "APIs & Services" dashboard</li>
            <li>Click on "ENABLE APIS AND SERVICES" at the top</li>
            <li>Search for "Directions API" and enable it</li>
            <li>Make sure billing is enabled for your project</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default Home;