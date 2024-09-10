import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import ChatBox from '../components/ChatBox';

const Messages = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = auth.currentUser;

  const fetchChats = async () => {
    try {
      console.log("Fetching chats for user:", user.uid);
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('participants', 'array-contains', user.uid));
      const querySnapshot = await getDocs(q);
      let fetchedChats = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Filter out chats with no messages
      fetchedChats = fetchedChats.filter(chat => chat.lastMessage == "" || chat.lastMessage);

      // Sort chats by lastMessageTime, latest first
      fetchedChats.sort((a, b) => {
        const timeA = a.lastMessageTime ? a.lastMessageTime.toDate() : new Date(0);
        const timeB = b.lastMessageTime ? b.lastMessageTime.toDate() : new Date(0);
        return timeB - timeA;
      });
      
      console.log("Fetched chats:", fetchedChats);
      setChats(fetchedChats);
      setLoading(false);

      if (chatId) {
        const selectedChat = fetchedChats.find(chat => chat.id === chatId);
        if (selectedChat) {
          console.log("Setting active chat:", selectedChat);
          setActiveChat(selectedChat);
        } else {
          console.log("Chat not found for ID:", chatId);
          setError("Chat not found.");
        }
      }
    } catch (err) {
      console.error("Error fetching chats:", err);
      console.error("Error details:", JSON.stringify(err, null, 2));
      setError("Failed to load chats. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      console.log("Authenticated user:", user.uid);
      fetchChats();
    } else {
      console.log("No authenticated user");
      setError("Please log in to view messages.");
      setLoading(false);
    }
  }, [user, chatId]);

  const handleChatClick = (chat) => {
    console.log("Chat clicked:", chat);
    navigate(`/message-list/${chat.id}`);
  };

  const handleBack = () => {
    console.log("Navigating back to chat list");
    navigate('/message-list');
  };

  if (loading) return <div className="d-flex justify-content-center align-items-center" style={{height: "calc(100vh - 56px)"}}>Loading chats...</div>;
  if (error) return <div className="d-flex justify-content-center align-items-center alert alert-danger" style={{height: "calc(100vh - 56px)"}}>{error}</div>;

  if (chatId) {
    return (
      <div className="vh-100 d-flex flex-column">
        <ChatBox
          chatId={chatId}
          orderId={activeChat?.orderId}
          otherUserId={activeChat?.userId === user.uid ? activeChat?.providerId : activeChat?.userId}
          otherUserName={activeChat?.userId === user.uid ? activeChat?.providerName : activeChat?.userName}
          onBack={handleBack}
        />
      </div>
    );
  }

  return (
    <div className="flex-grow-1 overflow-auto p-3">
      <h2 className="mb-4">Messages</h2>
      {chats.length === 0 ? (
        <p>No messages found.</p>
      ) : (
        <div className="list-group">
          {chats.map(chat => (
            <div 
              key={chat.id} 
              className="list-group-item list-group-item-action"
              onClick={() => handleChatClick(chat)}
            >
              <div className="d-flex w-100 justify-content-between">
                <h5 className="mb-1">
                  {chat.userId === user.uid ? chat.providerName : chat.userName}
                </h5>
                <small>{chat.lastMessageTime ? new Date(chat.lastMessageTime.toDate()).toLocaleString() : 'No messages'}</small>
              </div>
              <p className="mb-1">Order #{chat.orderId}</p>
              <p className="mb-1">{chat.lastMessage}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Messages;