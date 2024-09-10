import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RequestCleanerForm from './RequestCleanerForm';
import { useAuth } from '../contexts/AuthContext';
import { createOrder, getTemplates, saveTemplate } from '../services/firestore';


const RequestCleaner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { provider, selectedService, city, region, property } = location.state || {};
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [currentFormData, setCurrentFormData] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, [user]);

  const fetchTemplates = async () => {
    if (user) {
      try {
        const userTemplates = await getTemplates(user.uid);
        setTemplates(userTemplates);
      } catch (error) {
        console.error('Error fetching templates:', error);
        // You might want to show an error message to the user here
      }
    }
  };

  const handleFormSubmit = async (formData) => {
    const now = new Date();
    const formattedDateTime = now.toLocaleString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const hourlyRates = {
      '1': 35,
      '2': 55,
      '3': 75,
      '4': 90,
      '8': 150,
    };
    const generalCleaningCost = hourlyRates[formData.hours];
    const dirtyCleanCost = formData.dirtyCleanPhotos.length * 10;
    const totalCost = generalCleaningCost + dirtyCleanCost;

    const bookingDetails = {
      ...formData,
      generalCleaningCost,
      dirtyCleanCost,
      totalCost,
      city,
      region,
      selectedProperty: formData.selectedProperty,
      dateTime: formData.scheduling === 'now' ? formattedDateTime : formData.scheduledDateTime,
      address: `${city}, ${region}, ${formData.selectedProperty}`,
      providerId: provider.providerId,
      providerName: provider.name,
      service: selectedService,
      userId: user.uid,
      userName: user.displayName || user.email,
      status: 'pending',
    };

    try {
      const { orderId, chatId } = await createOrder(bookingDetails);
      console.log('Order created:', orderId, 'Chat created:', chatId);
      navigate('/cleaner-confirmation', { state: { bookingDetails, orderId, chatId } });
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    }
  };

  const handleSaveTemplate = async () => {
    if (user && currentFormData) {
      try {
        await saveTemplate(user.uid, templateName, currentFormData);
        setShowSaveModal(false);
        setTemplateName('');
        fetchTemplates();
        alert('Template saved successfully!');
      } catch (error) {
        console.error('Error saving template:', error);
        alert('Failed to save template. Please try again.');
      }
    } else {
      alert('Please fill out the form before saving a template.');
    }
  };

  const handleLoadTemplate = (event) => {
    const selectedTemplateId = event.target.value;
    setSelectedTemplate(selectedTemplateId);
    const template = templates.find(t => t.id === selectedTemplateId);
    if (template) {
      setCurrentFormData({
        ...template.data,
        dirtyCleanPhotos: template.data.dirtyCleanPhotos || [],
        cleaningToolsPhotos: template.data.cleaningToolsPhotos || [],
        areaCleanPhotos: template.data.areaCleanPhotos || [],
      });
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleFormChange = (formData) => {
    setCurrentFormData(formData);
  };

  if (!provider) {
    return <div className="container mt-5">No provider selected.</div>;
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Request Service from {provider.name}</h2>
      <p><strong>Customer:</strong> {user.displayName || user.email}</p>
      <p><strong>Provider ID:</strong> {provider.providerId}</p>

      {/* Template dropdown and save button */}
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <select 
          className="form-select w-75" 
          value={selectedTemplate} 
          onChange={handleLoadTemplate}
        >
          <option value="">Select a template</option>
          {templates.map(template => (
            <option key={template.id} value={template.id}>{template.name}</option>
          ))}
        </select>
        <button 
          className="btn btn-outline-primary" 
          onClick={() => setShowSaveModal(true)}
        >
          Save Template
        </button>
      </div>

      <RequestCleanerForm 
        onSubmit={handleFormSubmit} 
        locationState={location.state} 
        onBack={handleBack}
        initialData={currentFormData}
        onChange={handleFormChange}
      />

      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Save Template</h5>
                <button type="button" className="btn-close" onClick={() => setShowSaveModal(false)}></button>
              </div>
              <div className="modal-body">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Enter template name" 
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSaveModal(false)}>Close</button>
                <button type="button" className="btn btn-primary" onClick={handleSaveTemplate}>Save Template</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestCleaner;