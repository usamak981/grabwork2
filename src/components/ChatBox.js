import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../services/firebase';
import { collection, query, where, orderBy, addDoc, onSnapshot, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { IoArrowBack, IoPaperPlaneOutline } from 'react-icons/io5';

const ChatBox = ({ chatId, orderId, otherUserId, otherUserName, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(fetchedMessages);
    }, (error) => {
      console.error('Error in onSnapshot:', error);
    });

    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const messageData = {
        chatId,
        orderId,
        senderId: user.uid,
        senderName: user.displayName,
        recipientId: otherUserId,
        content: newMessage,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'messages'), messageData);
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: newMessage,
        lastMessageTime: serverTimestamp()
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="d-flex flex-column h-100">
      <div className="bg-primary text-white d-flex align-items-center sticky-top" style={{ height: '90px' }}>
        <button className="btn btn-link text-white" onClick={onBack} style={{ padding: '0 10px' }}>
          <IoArrowBack size={24} />
        </button>
        <div className="ms-2">
          <strong>{otherUserName}</strong>
        </div>
      </div>
      <div className="flex-grow-1 overflow-auto p-3" style={{ backgroundColor: '#e5ddd5' }}>
        {messages.map((message) => (
          <div key={message.id} className={`d-flex ${message.senderId === user.uid ? 'justify-content-end' : 'justify-content-start'} mb-2`}>
            <div 
              className={`rounded p-2 ${message.senderId === user.uid ? 'text-black' : 'bg-white'}`} 
              style={{ maxWidth: '70%', backgroundColor: message.senderId === user.uid ? '#e7fed8' : 'white' }}
            >
              <p className="mb-0">{message.content}</p>
              <small style={{ fontSize: '0.7rem', color: 'grey' }}>
                {message.timestamp ? new Date(message.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
              </small>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="bg-light" style={{ padding: '10px', position: 'sticky', bottom: 0, left: 0, right: 0 }}>
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <button type="submit" className="btn btn-primary">
            <IoPaperPlaneOutline size={24} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;