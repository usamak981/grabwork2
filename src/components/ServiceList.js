// src/components/ServiceList.js
import React, { useState, useEffect } from 'react';
import { getServices } from '../services/firestore';

const ServiceList = ({ onSelectService }) => {
  const [services, setServices] = useState([]);

  useEffect(() => {
    const fetchServices = async () => {
      const servicesData = await getServices();
      setServices(servicesData);
    };
    fetchServices();
  }, []);

  return (
    <div className="service-list">
      <h2>Choose a Service</h2>
      {services.map(service => (
        <button key={service.id} onClick={() => onSelectService(service.id)}>
          {service.name}
        </button>
      ))}
    </div>
  );
};

export default ServiceList;