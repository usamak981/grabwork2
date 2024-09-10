import React, { useState, useEffect } from 'react';
import { signOut, onAuthStateChanged, updateProfile, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../services/firebase';
import { useNavigate, Link } from 'react-router-dom';
import General from '../components/forms/General';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [formData, setFormData] = useState({});
  const [profileComplete, setProfileComplete] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [editMode, setEditMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        console.log("User authenticated:", currentUser.uid);
        setUser(currentUser);
        setDisplayName(currentUser.displayName || '');
        await fetchUserProfile(currentUser.uid);
      } else {
        console.log("No user authenticated");
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isProfileComplete = (userData) => {
    const requiredFields = ['city', 'race', 'gender', 'birthday', 'whatsapp', 'icNumber', 'icUrl'];
    return requiredFields.every(field => userData[field]);
  };

  const fetchUserProfile = async (userId) => {
    console.log("Fetching user profile for:", userId);
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        console.log("User document exists:", userDoc.data());
        const userData = userDoc.data();
        setFormData(userData);
        const isComplete = isProfileComplete(userData);
        setProfileComplete(isComplete);
        console.log("Profile complete:", isComplete);
      } else {
        console.log("No user document found. Creating a new one.");
        const newUserData = {
          displayName: auth.currentUser.displayName,
          email: auth.currentUser.email,
          phoneNumber: auth.currentUser.phoneNumber,
          createdAt: new Date().toISOString(),
          isProfileComplete: false
        };
        await setDoc(userRef, newUserData);
        setFormData(newUserData);
        setProfileComplete(false);
      }
    } catch (error) {
      console.error('Error fetching/creating user profile:', error);
      setError('Failed to fetch/create user profile. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Sign-out failed:', error);
      setError('Sign-out failed. Please try again.');
    }
  };

  const updateDisplayName = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(auth.currentUser, { displayName: displayName });
      setUser({ ...user, displayName: displayName });
      alert('Display name updated successfully');
    } catch (error) {
      console.error('Error updating display name:', error);
      setError('Failed to update display name. Please try again.');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting profile data:", formData);
    try {
      const userRef = doc(db, 'users', user.uid);
      let updatedData = {
        ...formData,
        displayName: user.displayName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        lastUpdated: new Date().toISOString()
      };

      // Handle IC file upload
      if (formData.ic && formData.ic instanceof File) {
        const icRef = ref(storage, `ic/${user.uid}`);
        await uploadBytes(icRef, formData.ic);
        const icUrl = await getDownloadURL(icRef);
        updatedData.icUrl = icUrl;
      }

      // Remove the File object before saving to Firestore
      delete updatedData.ic;

      const isComplete = isProfileComplete(updatedData);
      updatedData.isProfileComplete = isComplete;

      await setDoc(userRef, updatedData);
      console.log("Profile updated successfully");
      setProfileComplete(isComplete);
      setEditMode(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError('Failed to sign in with Google. Please try again.');
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in with email:', error);
      setError('Failed to sign in with email. Please try again.');
    }
  };

  if (loading) {
    return <div className="container mt-5">Loading...</div>;
  }

  if (error) {
    return <div className="container mt-5 alert alert-danger">{error}</div>;
  }

  if (!user) {
    return (
      <div className="container mt-5">
        <h2>Please sign in to view your profile.</h2>
        <button className="btn btn-primary w-100 my-2" onClick={handleGoogleSignIn}>Sign in with Google</button>
        <form onSubmit={handleEmailSignIn}>
          <div className="mb-3">
            <input
              type="email"
              className="form-control"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">Sign in with Email</button>
        </form>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Profile</h2>
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">
            Welcome, {user.displayName || user.email}
            {profileComplete && <FaCheckCircle className="text-success ms-2" title="Profile Complete" />}
          </h5>
          <p className="card-text">Email: {user.email} (Cannot be changed)</p>
          <form onSubmit={updateDisplayName} className="mb-3">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Enter display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Update Name</button>
            </div>
          </form>
          {user.phoneNumber && (
            <p className="card-text">
              Phone Number: {user.phoneNumber}
              <small className="text-muted ms-2">(Can be changed after 2 months)</small>
            </p>
          )}
          <button className="btn btn-danger" onClick={handleSignOut}>Sign Out</button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">
            {profileComplete ? "Your Profile" : "Complete Your Profile"}
          </h5>
          {!profileComplete && (
            <p className="card-text">Please complete your profile before becoming a provider.</p>
          )}
          <form onSubmit={handleProfileSubmit}>
            <General 
              formData={formData} 
              setFormData={setFormData} 
              readOnlyFields={profileComplete ? ['race', 'gender', 'birthday', 'icNumber'] : []}
              editMode={editMode || !profileComplete}
            />
            {(editMode || !profileComplete) && (
              <button type="submit" className="btn btn-primary">
                {profileComplete ? "Update Profile" : "Complete Profile"}
              </button>
            )}
          </form>
          {profileComplete && !editMode && (
            <button className="btn btn-secondary mt-3" onClick={() => setEditMode(true)}>Edit Profile</button>
          )}
        </div>
      </div>

      {profileComplete && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Become a Provider</h5>
            <p>Your profile is complete. You can now become a provider!</p>
            <Link to="/provider-dashboard" className="btn btn-primary">Go to Provider Dashboard</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;