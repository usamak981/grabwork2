import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchChats = async () => {
      if (!user) {
        setError("User not logged in");
        setLoading(false);
        return;
      }

      try {
        const chatsRef = collection(db, 'chats');
        const q = query(chatsRef, where('participants', 'array-contains', user.uid));
        const querySnapshot = await getDocs(q);
        
        const fetchedChats = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setChats(fetchedChats);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching chats:", err);
        setError("Failed to load chats. Please try again.");
        setLoading(false);
      }
    };

    fetchChats();
  }, [user]);

  const handleChatClick = (chatId) => {
    navigate(`/message-list/${chatId}`);
  };

  if (loading) return <div className="container mt-5">Loading chats...</div>;
  if (error) return <div className="container mt-5 alert alert-danger">{error}</div>;

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Your Chats</h2>
      {chats.length === 0 ? (
        <p>No chats found.</p>
      ) : (
        <div className="list-group">
          {chats.map(chat => (
            <div 
              key={chat.id} 
              className="list-group-item list-group-item-action"
              onClick={() => handleChatClick(chat.id)}
            >
              <div className="d-flex w-100 justify-content-between">
                <h5 className="mb-1">
                  {chat.userId === user.uid ? chat.providerName : chat.userName}
                </h5>
                <small>{chat.lastMessageTime ? new Date(chat.lastMessageTime.toDate()).toLocaleString() : 'No messages'}</small>
              </div>
              <p className="mb-1">Order #{chat.orderId}</p>
              <p className="mb-1">{chat.lastMessage || 'No messages yet'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatList;