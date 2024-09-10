// src/components/ProviderCard.js
import React from 'react';

const ProviderCard = ({ provider, onSelect }) => (
  <div>
    <h3>{provider.name}</h3>
    <p>{provider.description}</p>
    <button onClick={onSelect}>Choose Provider</button>
  </div>
);

export default ProviderCard;
