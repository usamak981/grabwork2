import React, { useState, useEffect } from 'react';
import { storage } from '../services/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const RequestCleanerForm = ({ onSubmit, locationState, onBack, initialData, onChange }) => {
  const { property, region } = locationState || {};

  const [formData, setFormData] = useState(initialData || {
    selectedProperty: property || '',
    selectedRegion: region || '',
    scheduling: 'now',
    scheduledDateTime: '',
    hours: '',
    cleaningType: 'standard',
    dirtyCleanPhotos: [],
    houseSize: '',
    occupants: 'alone',
    meetingPlace: 'guardhouse',
    doorNumber: '',
    fullAddress: '',
    areaCleanPhotos: [],
    cleaningTools: '',
    cleaningToolsPhotos: [],
  });

  const [uploadProgress, setUploadProgress] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };
    setFormData(updatedFormData);
    onChange(updatedFormData);
  };

  const uploadFile = async (file, fieldName) => {
    const storageRef = ref(storage, `${fieldName}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(prev => ({...prev, [fieldName]: progress}));
      },
      (error) => {
        console.error('Upload error:', error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        const updatedFormData = {
          ...formData,
          [fieldName]: [...formData[fieldName], downloadURL]
        };
        setFormData(updatedFormData);
        onChange(updatedFormData);
      }
    );
  };

  const handlePhotoUpload = async (e) => {
    const { name, files } = e.target;
    for (let file of files) {
      await uploadFile(file, name);
    }
  };

  const renderUploadedPhotos = (fieldName) => {
    return formData[fieldName].map((url, index) => (
      <img key={index} src={url} alt={`Uploaded ${fieldName}`} style={{width: '50px', height: '50px', marginRight: '5px'}} />
    ));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <select
          className="form-select"
          name="scheduling"
          value={formData.scheduling}
          onChange={handleFormChange}
        >
          <option value="now">Now</option>
          <option value="schedule">Schedule for later</option>
        </select>
      </div>

      {formData.scheduling === 'schedule' && (
        <div className="mb-3">
          <input
            type="datetime-local"
            name="scheduledDateTime"
            className="form-control"
            value={formData.scheduledDateTime}
            onChange={handleFormChange}
          />
        </div>
      )}

      <div className="mb-3">
        <select
          className="form-select"
          name="hours"
          value={formData.hours}
          onChange={handleFormChange}
        >
          <option value="">How many hours?</option>
          <option value="1">1 Hour (RM 35)</option>
          <option value="2">2 Hours (RM 55)</option>
          <option value="3">3 Hours (RM 75)</option>
          <option value="4">4 Hours (RM 90)</option>
          <option value="8">8 Hours (RM 150)</option>
        </select>
      </div>

      <div className="mb-3">
        <p><strong>Property:</strong> {formData.selectedProperty}</p>
        <p><strong>Region:</strong> {formData.selectedRegion}</p>
      </div>

      <div className="mb-3">
        <label className="form-label">Type of Cleaning:</label>
        <div className="form-check">
          <input
            className="form-check-input"
            type="radio"
            name="cleaningType"
            value="standard"
            checked={formData.cleaningType === 'standard'}
            onChange={handleFormChange}
          />
          <label className="form-check-label">
            Standard Cleaning (all areas)
          </label>
        </div>
        <div className="form-check">
          <input
            className="form-check-input"
            type="radio"
            name="cleaningType"
            value="deep"
            checked={formData.cleaningType === 'deep'}
            onChange={handleFormChange}
          />
          <label className="form-check-label">
            Deep Cleaning (cleaner may not clean all area within the duration)
          </label>
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">Dirty clean Extra Charges (RM 10 per photo):</label>
        <input
          type="file"
          name="dirtyCleanPhotos"
          multiple
          className="form-control"
          onChange={handlePhotoUpload}
        />
        {renderUploadedPhotos('dirtyCleanPhotos')}
        {uploadProgress['dirtyCleanPhotos'] && (
          <div className="progress mt-2">
            <div className="progress-bar" style={{width: `${uploadProgress['dirtyCleanPhotos']}%`}}></div>
          </div>
        )}
      </div>

      <div className="mb-3">
        <label className="form-label">Size of House (sf):</label>
        <input
          type="number"
          name="houseSize"
          className="form-control"
          value={formData.houseSize}
          onChange={handleFormChange}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Who is in the house?</label>
        <div className="form-check">
          <input
            className="form-check-input"
            type="radio"
            name="occupants"
            value="alone"
            checked={formData.occupants === 'alone'}
            onChange={handleFormChange}
          />
          <label className="form-check-label">Me alone</label>
        </div>
        <div className="form-check">
          <input
            className="form-check-input"
            type="radio"
            name="occupants"
            value="family"
            checked={formData.occupants === 'family'}
            onChange={handleFormChange}
          />
          <label className="form-check-label">Family</label>
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">Where to meet?</label>
        <div className="form-check">
          <input
            className="form-check-input"
            type="radio"
            name="meetingPlace"
            value="guardhouse"
            checked={formData.meetingPlace === 'guardhouse'}
            onChange={handleFormChange}
          />
          <label className="form-check-label">Wait at guard house</label>
        </div>
        <div className="form-check">
          <input
            className="form-check-input"
            type="radio"
            name="meetingPlace"
            value="door"
            checked={formData.meetingPlace === 'door'}
            onChange={handleFormChange}
          />
          <label className="form-check-label">Direct to my door</label>
        </div>

        {formData.meetingPlace === 'door' && (
          <div className="mt-2">
            <input
              type="text"
              name="doorNumber"
              className="form-control mb-2"
              placeholder="Door number"
              value={formData.doorNumber}
              onChange={handleFormChange}
            />
            <input
              type="text"
              name="fullAddress"
              className="form-control"
              placeholder="Full address"
              value={formData.fullAddress}
              onChange={handleFormChange}
            />
          </div>
        )}
      </div>

      <div className="mb-3">
        <label className="form-label">Cleaning tools I have:</label>
        <textarea
          name="cleaningTools"
          className="form-control"
          rows="3"
          value={formData.cleaningTools}
          onChange={handleFormChange}
        ></textarea>
      </div>

      <div className="mb-3">
        <label className="form-label">Upload Images of Cleaning Tools:</label>
        <input
          type="file"
          name="cleaningToolsPhotos"
          multiple
          className="form-control"
          onChange={handlePhotoUpload}
        />
        {renderUploadedPhotos('cleaningToolsPhotos')}
        {uploadProgress['cleaningToolsPhotos'] && (
          <div className="progress mt-2">
            <div className="progress-bar" style={{width: `${uploadProgress['cleaningToolsPhotos']}%`}}></div>
          </div>
        )}
      </div>

      <div className="mb-3">
        <label className="form-label">Area to be Cleaned:</label>
        <input
          type="file"
          name="areaCleanPhotos"
          multiple
          className="form-control"
          onChange={handlePhotoUpload}
        />
        {renderUploadedPhotos('areaCleanPhotos')}
        {uploadProgress['areaCleanPhotos'] && (
          <div className="progress mt-2">
            <div className="progress-bar" style={{width: `${uploadProgress['areaCleanPhotos']}%`}}></div>
          </div>
        )}
      </div>

      <div className="row mt-3">
        <div className="col-6">
          <button type="button" onClick={onBack} className="btn btn-outline-secondary w-100">Back</button>
        </div>
        <div className="col-6">
          <button type="submit" className="btn btn-primary w-100">Proceed</button>
        </div>
      </div>
    </form>
  );
};

export default RequestCleanerForm;