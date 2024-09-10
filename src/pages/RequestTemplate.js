import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTemplates, updateTemplate, deleteTemplate } from '../services/firestore';

const RequestTemplate = () => {
  const [templates, setTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchTemplates();
  }, [user]);

  const fetchTemplates = async () => {
    if (user) {
      try {
        const userTemplates = await getTemplates(user.uid);
        console.log('Fetched templates:', userTemplates);
        setTemplates(userTemplates);
      } catch (error) {
        console.error("Error fetching templates:", error);
      }
    }
  };

  const handleDelete = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteTemplate(user.uid, templateId);
        fetchTemplates();
      } catch (error) {
        console.error("Error deleting template:", error);
        alert('Failed to delete template. Please try again.');
      }
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
  };

  const handleSave = async () => {
    if (editingTemplate) {
      try {
        await updateTemplate(user.uid, editingTemplate.id, editingTemplate.data);
        setEditingTemplate(null);
        fetchTemplates();
      } catch (error) {
        console.error("Error updating template:", error);
        alert('Failed to update template. Please try again.');
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditingTemplate(prev => ({
      ...prev,
      data: { ...prev.data, [name]: value }
    }));
  };

  const renderPhotoUrls = (urls) => {
    if (!urls || !Array.isArray(urls) || urls.length === 0) return 'No photos uploaded';
    return urls.map((url, index) => (
      <img key={index} src={url} alt="Uploaded" style={{ width: '50px', height: '50px', marginRight: '5px' }} />
    ));
  };

  return (
    <div className="container mt-5">
      <h2>Request Templates</h2>
      {templates.map(template => (
        <div key={template.id} className="card mb-3">
          <div className="card-body">
            <h5 className="card-title">{template.name}</h5>
            {editingTemplate && editingTemplate.id === template.id ? (
              <div>
                <input 
                  type="text" 
                  name="name" 
                  value={editingTemplate.name} 
                  onChange={(e) => setEditingTemplate(prev => ({ ...prev, name: e.target.value }))} 
                  className="form-control mb-2"
                />
                <input 
                  type="text" 
                  name="hours" 
                  value={editingTemplate.data.hours} 
                  onChange={handleChange} 
                  className="form-control mb-2"
                  placeholder="Hours"
                />
                <input 
                  type="text" 
                  name="cleaningType" 
                  value={editingTemplate.data.cleaningType} 
                  onChange={handleChange} 
                  className="form-control mb-2"
                  placeholder="Cleaning Type"
                />
                <input 
                  type="text" 
                  name="houseSize" 
                  value={editingTemplate.data.houseSize} 
                  onChange={handleChange} 
                  className="form-control mb-2"
                  placeholder="House Size"
                />
                <input 
                  type="text" 
                  name="occupants" 
                  value={editingTemplate.data.occupants} 
                  onChange={handleChange} 
                  className="form-control mb-2"
                  placeholder="Occupants"
                />
                <input 
                  type="text" 
                  name="meetingPlace" 
                  value={editingTemplate.data.meetingPlace} 
                  onChange={handleChange} 
                  className="form-control mb-2"
                  placeholder="Meeting Place"
                />
                <input 
                  type="text" 
                  name="doorNumber" 
                  value={editingTemplate.data.doorNumber} 
                  onChange={handleChange} 
                  className="form-control mb-2"
                  placeholder="Door Number"
                />
                <input 
                  type="text" 
                  name="fullAddress" 
                  value={editingTemplate.data.fullAddress} 
                  onChange={handleChange} 
                  className="form-control mb-2"
                  placeholder="Full Address"
                />
                <textarea 
                  name="cleaningTools" 
                  value={editingTemplate.data.cleaningTools} 
                  onChange={handleChange} 
                  className="form-control mb-2"
                  placeholder="Cleaning Tools"
                />
                <button onClick={handleSave} className="btn btn-primary me-2">Save</button>
                <button onClick={() => setEditingTemplate(null)} className="btn btn-secondary">Cancel</button>
              </div>
            ) : (
              <div>
                <p>Hours: {template.data.hours || 'Not specified'}</p>
                <p>Cleaning Type: {template.data.cleaningType || 'Not specified'}</p>
                <p>House Size: {template.data.houseSize || 'Not specified'}</p>
                <p>Occupants: {template.data.occupants || 'Not specified'}</p>
                <p>Meeting Place: {template.data.meetingPlace || 'Not specified'}</p>
                <p>Door Number: {template.data.doorNumber || 'Not specified'}</p>
                <p>Full Address: {template.data.fullAddress || 'Not specified'}</p>
                <p>Cleaning Tools: {template.data.cleaningTools || 'Not specified'}</p>
                <p>Dirty Clean Photos:</p>
                {renderPhotoUrls(template.data.dirtyCleanPhotos)}
                <p>Area Clean Photos:</p>
                {renderPhotoUrls(template.data.areaCleanPhotos)}
                <p>Cleaning Tools Photos:</p>
                {renderPhotoUrls(template.data.cleaningToolsPhotos)}
                <button onClick={() => handleEdit(template)} className="btn btn-link me-2">Edit</button>
                <button onClick={() => handleDelete(template.id)} className="btn btn-link text-danger">Delete</button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RequestTemplate;