import React from 'react';

function App() {
  console.log('App component rendered');

  return (
    <>
      <div className="container mt-5">
      <h2 className="mb-4">Book a Rides</h2>
      
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
    </div>
    </>
  );
}

export default App;