import React, { useState, useEffect } from 'react';
import cityData from '../data/cityData';

const LocationSelector = ({ onLocationChange }) => {
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedProperties, setSelectedProperties] = useState([]);

  useEffect(() => {
    onLocationChange({ city: selectedCity, region: selectedRegion, properties: selectedProperties });
  }, [selectedCity, selectedRegion, selectedProperties]);

  const handleCityChange = (e) => {
    const city = e.target.value;
    setSelectedCity(city);
    setSelectedRegion('');
    setSelectedProperties([]);
  };

  const handleRegionChange = (e) => {
    const region = e.target.value;
    setSelectedRegion(region);
    setSelectedProperties([]);
  };

  const handlePropertyChange = (property) => {
    setSelectedProperties(prev => 
      prev.includes(property) 
        ? prev.filter(p => p !== property) 
        : [...prev, property]
    );
  };

  return (
    <div className="row">
      <div className="col-md-4 mb-3">
        <label htmlFor="citySelect" className="form-label">Select a City</label>
        <select 
          id="citySelect" 
          className="form-select" 
          value={selectedCity} 
          onChange={handleCityChange}
        >
          <option value="">Choose a city</option>
          {Object.keys(cityData).map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      {selectedCity && (
        <div className="col-md-4 mb-3">
          <label htmlFor="regionSelect" className="form-label">Select a Region</label>
          <select 
            id="regionSelect" 
            className="form-select" 
            value={selectedRegion} 
            onChange={handleRegionChange}
          >
            <option value="">Choose a region</option>
            {Object.keys(cityData[selectedCity]).map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
      )}

      {selectedRegion && (
        <div className="col-md-4 mb-3">
          <label className="form-label">Select Properties</label>
          {cityData[selectedCity][selectedRegion].map(property => (
            <div key={property} className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id={`property-${property}`}
                checked={selectedProperties.includes(property)}
                onChange={() => handlePropertyChange(property)}
              />
              <label className="form-check-label" htmlFor={`property-${property}`}>
                {property}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationSelector;