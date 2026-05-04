import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User, Bot, AlertTriangle } from 'lucide-react';
import { db, auth } from '../firebase';
import { isListingActive } from '../utils/geo';
import { encryptMessage, decryptMessage } from '../utils/crypto';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';

export default function ChatModal({ isOpen, onClose, item }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState(null);
  const scrollRef = useRef(null);

  const currentUser = auth.currentUser;

  // Generate anonymous aliases based on UID
  const getAlias = (uid) => {
    if (!uid) return "User";
    if (uid === item.sellerId) return "Seller (Anonymous)";
    return `Buyer_${uid.substring(0, 4)}`;
  };

  useEffect(() => {
    if (!isOpen || !item || !currentUser) return;

    // In a real app, you'd find or create a specific chat document for this buyer/seller/item combo
    // For this prototype, we'll use a simple collection keyed by buyer + seller + item
    const chatIdString = [currentUser.uid, item.sellerId, item.id].sort().join('_');
    setChatId(chatIdString);

    const q = query(
      collection(db, 'chats', chatIdString, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        text: decryptMessage(doc.data().text)
      }));
      setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubscribe();
  }, [isOpen, item, currentUser]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId) return;

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: encryptMessage(newMessage),
        senderId: currentUser.uid,
        senderAlias: getAlias(currentUser.uid),
        timestamp: serverTimestamp(),
        isEncrypted: true // Metadata flag for manuscript proof
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="location-modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="location-modal-content" onClick={(e) => e.stopPropagation()} style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Chat Header */}
        <div className="location-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <User size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Chat with Seller</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Re: {item.title}</p>
            </div>
          </div>
          <button className="location-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Anonymous Identity Notice */}
        <div style={{ padding: '0.5rem 1rem', background: 'rgba(var(--primary-rgb), 0.1)', fontSize: '0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bot size={14} />
          <span>Your identity is hidden. Messages are <strong>E2EE Encrypted</strong>.</span>
        </div>

        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
          {!isListingActive(item.expiresAt) && (
            <div style={{ 
              position: 'absolute', 
              inset: 0, 
              background: 'rgba(0,0,0,0.85)', 
              zIndex: 50, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              textAlign: 'center', 
              padding: '2rem',
              backdropFilter: 'blur(4px)'
            }}>
              <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
              <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Listing Expired</h3>
              <p style={{ color: '#aaa', fontSize: '0.875rem', maxWidth: '300px' }}>
                This item has reached its Time-to-Live (TTL) limit and is no longer available for transaction.
              </p>
              <button className="btn" onClick={onClose} style={{ width: 'auto', marginTop: '1.5rem', background: '#333', color: 'white', border: 'none' }}>
                Back to Marketplace
              </button>
            </div>
          )}
          
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
              <p>No messages yet. Start the conversation!</p>
            </div>
          )}
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              style={{ 
                alignSelf: msg.senderId === currentUser?.uid ? 'flex-end' : 'flex-start',
                maxWidth: '80%'
              }}
            >
              <div style={{ 
                padding: '0.75rem 1rem', 
                borderRadius: '16px', 
                background: msg.senderId === currentUser?.uid ? 'var(--primary)' : 'var(--card-bg)',
                color: msg.senderId === currentUser?.uid ? 'white' : 'var(--text-main)',
                border: msg.senderId === currentUser?.uid ? 'none' : '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                fontSize: '0.9rem'
              }}>
                {msg.text}
              </div>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem', textAlign: msg.senderId === currentUser?.uid ? 'right' : 'left' }}>
                {msg.senderAlias} • {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            className="form-control" 
            placeholder={isListingActive(item.expiresAt) ? "Type a message..." : "Chat disabled"} 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={!isListingActive(item.expiresAt)}
          />
          <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0.5rem' }}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
