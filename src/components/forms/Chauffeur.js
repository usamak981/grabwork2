import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import cityData from '../../data/cityData';

const Chauffeur = ({ formData, setFormData, isProfileComplete }) => {
  const { user } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  React.useEffect(() => {
    // Set user-related data
    setFormData(prevData => ({
      ...prevData,
      userId: user.uid,
      email: user.email,
      name: user.displayName || user.email
    }));
  }, [user, setFormData]);

  if (!isProfileComplete) {
    return (
      <div className="alert alert-warning">
        Please complete your profile before registering as a provider.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3">
        <label className="form-label">City</label>
        <select
          className="form-select"
          name="city"
          value={formData.city || ''}
          onChange={handleChange}
          required
        >
          <option value="">Select City</option>
          {Object.keys(cityData).map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label">Start to drive since</label>
        <select
          className="form-select"
          name="drivingSince"
          value={formData.drivingSince || ''}
          onChange={handleChange}
          required
        >
          <option value="">Select Year</option>
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label">Do you have PSV?</label>
        <div className="form-check">
          <input
            className="form-check-input"
            type="radio"
            name="hasPSV"
            id="psvYes"
            value="yes"
            checked={formData.hasPSV === 'yes'}
            onChange={handleChange}
            required
          />
          <label className="form-check-label" htmlFor="psvYes">
            Yes
          </label>
        </div>
        <div className="form-check">
          <input
            className="form-check-input"
            type="radio"
            name="hasPSV"
            id="psvNo"
            value="no"
            checked={formData.hasPSV === 'no'}
            onChange={handleChange}
            required
          />
          <label className="form-check-label" htmlFor="psvNo">
            No
          </label>
        </div>
      </div>
    </div>
  );
};

export default Chauffeur;