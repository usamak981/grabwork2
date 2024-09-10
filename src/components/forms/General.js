import React from 'react';
import cityData from '../../data/cityData';

const General = ({ formData, setFormData, readOnlyFields = [] }) => {
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData(prevData => ({ ...prevData, [name]: files[0] }));
    } else {
      setFormData(prevData => ({ ...prevData, [name]: value }));
    }
  };

  return (
    <div>
      <div className="mb-3">
        <label htmlFor="city" className="form-label">City</label>
        <select
          className="form-select"
          id="city"
          name="city"
          value={formData.city || ''}
          onChange={handleChange}
          disabled={readOnlyFields.includes('city')}
        >
          <option value="">Select a city</option>
          {Object.keys(cityData).map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label htmlFor="race" className="form-label">Race</label>
        <input
          type="text"
          className="form-control"
          id="race"
          name="race"
          value={formData.race || ''}
          onChange={handleChange}
          readOnly={readOnlyFields.includes('race')}
        />
      </div>
      <div className="mb-3">
        <label htmlFor="gender" className="form-label">Gender</label>
        <select
          className="form-select"
          id="gender"
          name="gender"
          value={formData.gender || ''}
          onChange={handleChange}
          disabled={readOnlyFields.includes('gender')}
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="mb-3">
        <label htmlFor="birthday" className="form-label">Birthday</label>
        <input
          type="date"
          className="form-control"
          id="birthday"
          name="birthday"
          value={formData.birthday || ''}
          onChange={handleChange}
          readOnly={readOnlyFields.includes('birthday')}
        />
      </div>
      <div className="mb-3">
        <label htmlFor="whatsapp" className="form-label">WhatsApp</label>
        <input
          type="text"
          className="form-control"
          id="whatsapp"
          name="whatsapp"
          value={formData.whatsapp || ''}
          onChange={handleChange}
        />
      </div>
      <div className="mb-3">
        <label htmlFor="icNumber" className="form-label">IC Number</label>
        <input
          type="text"
          className="form-control"
          id="icNumber"
          name="icNumber"
          value={formData.icNumber || ''}
          onChange={handleChange}
          readOnly={readOnlyFields.includes('icNumber')}
        />
      </div>
      <div className="mb-3">
        <label htmlFor="ic" className="form-label">IC Photo</label>
        <input
          type="file"
          className="form-control"
          id="ic"
          name="ic"
          onChange={handleChange}
          accept="image/*"
        />
      </div>
      {formData.icUrl && (
        <div className="mb-3">
          <label className="form-label">Current IC Photo</label>
          <img src={formData.icUrl} alt="IC" className="img-thumbnail" style={{maxWidth: '200px'}} />
        </div>
      )}
    </div>
  );
};

export default General;