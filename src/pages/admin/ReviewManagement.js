import React, { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Link } from 'react-router-dom';

const AdminReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      const q = query(collection(db, 'orders'));
      const querySnapshot = await getDocs(q);
      const reviewsData = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(order => order.userReview)
        .map(order => ({
          orderId: order.id,
          ...order.userReview,
          userName: order.userName,
          providerName: order.providerName,
          userId: order.userId,
          providerId: order.providerId
        }));
      setReviews(reviewsData);
      setLoading(false);
    };

    fetchReviews();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mt-5">
      <h2>Review Management</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Rating</th>
            <th>Review Text</th>
            <th>User</th>
            <th>Provider</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => (
            <tr key={review.orderId}>
              <td>
                {review.type === 'recommend' ? (
                  <span className="badge bg-success">Recommend</span>
                ) : (
                  <span className="badge bg-danger">Complain</span>
                )}
              </td>
              <td>{review.rating}/5</td>
              <td>{review.review}</td>
              <td><Link to={`/admin/user/${review.userId}`}>{review.userName}</Link></td>
              <td><Link to={`/admin/provider/${review.providerId}`}>{review.providerName}</Link></td>
              <td>
                <Link to={`/admin/order/${review.orderId}`} className="btn btn-sm btn-primary">View Order</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminReviewManagement;