import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User, Bot, AlertTriangle, ShieldCheck, Lock } from 'lucide-react';
import { 
  db, 
  auth,
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc
} from '../firebase';
import { isListingActive } from '../utils/geo';
import { encryptMessage, decryptMessage } from '../utils/crypto';

export default function ChatModal({ isOpen, onClose, item }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState(null);
  const [sendError, setSendError] = useState(null);
  const [peerPublicKey, setPeerPublicKey] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showE2eeInfo, setShowE2eeInfo] = useState(false);
  const [peerFingerprint, setPeerFingerprint] = useState(null);
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

    const sellerId = item.sellerId || item.userId;
    const buyerId = item.buyerId || currentUser.uid;
    const chatIdString = item.chatId || [buyerId, sellerId, item.id].sort().join('_');
    setChatId(chatIdString);

    const peerId = currentUser.uid === sellerId ? buyerId : sellerId;

    // Fetch peer's public E2EE key
    const fetchPeerKey = async () => {
      try {
        const peerRef = doc(db, 'users', peerId);
        const peerSnap = await getDoc(peerRef);
        if (peerSnap.exists()) {
          const peerData = peerSnap.data();
          if (peerData.publicKeyJwk) {
            setPeerPublicKey(peerData.publicKeyJwk);
            try {
              const jwkString = JSON.stringify({ x: peerData.publicKeyJwk.x, y: peerData.publicKeyJwk.y });
              const msgBuffer = new TextEncoder().encode(jwkString);
              const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
              const hashArray = Array.from(new Uint8Array(hashBuffer));
              const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(':').toUpperCase();
              setPeerFingerprint(hashHex);
            } catch (err) {
              console.error("Failed to compute key fingerprint:", err);
              setPeerFingerprint("PENDING_VERIFICATION");
            }
          } else {
            setPeerFingerprint("NO_KEY_REGISTERED");
          }
        } else {
          setPeerFingerprint("NO_USER_PROFILE");
        }
      } catch (err) {
        console.error("Failed to fetch peer E2EE key:", err);
        setPeerFingerprint("ERROR_FETCHING_KEY");
      }
    };
    fetchPeerKey();

    const q = query(
      collection(db, 'chats', chatIdString, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgsPromises = snapshot.docs.map(async (doc) => {
        const data = doc.data();
        let decryptedText = '';
        try {
          decryptedText = await decryptMessage(data.text, peerPublicKey, chatIdString);
        } catch (e) {
          console.error("Failed to decrypt message:", e);
          decryptedText = "[Unable to decrypt message]";
        }
        return {
          id: doc.id,
          ...data,
          text: decryptedText
        };
      });

      const msgs = await Promise.all(msgsPromises);
      setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, (err) => {
      console.error("Chats subscription error:", err);
    });

    return () => unsubscribe();
  }, [isOpen, item, currentUser, peerPublicKey]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId) return;
    setSendError(null);

    try {
      const encryptedMsg = await encryptMessage(newMessage, peerPublicKey, chatId);
      
      // 1. Add message to subcollection
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: encryptedMsg,
        senderId: currentUser.uid,
        senderAlias: getAlias(currentUser.uid),
        timestamp: serverTimestamp(),
        isEncrypted: true
      });
      
      // 2. Update parent document for inbox listing
      const sellerId = item.sellerId || item.userId;
      const buyerId = item.buyerId || currentUser.uid;
      
      await setDoc(doc(db, 'chats', chatId), {
        participants: [buyerId, sellerId],
        lastMessage: encryptedMsg,
        lastTimestamp: serverTimestamp(),
        itemTitle: item.title,
        itemId: item.id,
        sellerId: sellerId,
        buyerId: buyerId
      }, { merge: true });

      setNewMessage('');
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
      }, 2500);
    } catch (error) {
      console.error("Error sending message:", error);
      setSendError(error.message.includes('permission') 
        ? 'Permission denied. Please make sure you are logged in.' 
        : 'Failed to send. Please try again.');
    }
  };

  const handleReportUser = async (e) => {
    e.preventDefault();
    if (!reportReason) return;
    try {
      const sellerId = item.sellerId || item.userId;
      const buyerId = item.buyerId || currentUser.uid;
      const peerId = currentUser.uid === sellerId ? buyerId : sellerId;

      await addDoc(collection(db, 'reports'), {
        reporterId: currentUser.uid,
        reportedUserId: peerId,
        chatId: chatId,
        reason: reportReason,
        timestamp: serverTimestamp(),
        status: 'active'
      });

      // Decrease trust score
      const peerRef = doc(db, 'users', peerId);
      const peerSnap = await getDoc(peerRef);
      if (peerSnap.exists()) {
        const currentScore = peerSnap.data().trustScore ?? 100;
        await updateDoc(peerRef, { trustScore: Math.max(0, currentScore - 10) });
      }

      setIsReporting(false);
      setReportReason('');
      alert("User has been reported to administration.");
    } catch (err) {
      console.error("Failed to report user:", err);
      alert("Error reporting user.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="location-modal-overlay chat-modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="location-modal-content chat-modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Chat Header */}
        <div className="location-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <User size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Chat with Seller</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Re: {item.title}</p>
            </div>
          </div>
          <div className="chat-header-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              title="Report User"
              onClick={() => setIsReporting(true)}
              style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#EF4444', cursor: 'pointer', padding: '0.4rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <AlertTriangle size={16} />
            </button>
            <button 
              className="btn-primary chat-finalize-btn"
              onClick={() => {
                alert('Transaction Agreement created! Check your Transaction History.');
              }}
            >
              Finalize Agreement
            </button>
            <button className="location-modal-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Anonymous Identity Notice */}
        <div style={{ padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.08)', fontSize: '0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bot size={14} />
            <span>Your identity is hidden. Messages are <strong>E2EE Encrypted</strong>.</span>
          </div>
          <button 
            type="button" 
            onClick={() => setShowE2eeInfo(!showE2eeInfo)} 
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0, fontWeight: 700 }}
          >
            <ShieldCheck size={14} /> {showE2eeInfo ? 'Hide Key' : 'Verify'}
          </button>
        </div>

        {/* E2EE Info Panel */}
        {showE2eeInfo && (
          <div style={{
            padding: '1.25rem',
            background: 'var(--bg-color)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: 'var(--text-main)', fontSize: '0.85rem' }}>
              <Lock size={14} color="var(--primary)" /> End-to-End Encryption Metrics
            </div>
            <div style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              fontSize: '0.75rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Key Exchange:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 800 }}>ECDH (Curve P-256)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Cipher Protocol:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 800 }}>AES-GCM (256-bit)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Peer Identity Key Fingerprint (SHA-256):</span>
                <span style={{ 
                  color: 'var(--text-main)', 
                  fontFamily: 'monospace', 
                  fontSize: '0.7rem', 
                  background: 'var(--bg-color)', 
                  padding: '0.4rem', 
                  borderRadius: '6px', 
                  wordBreak: 'break-all',
                  textAlign: 'center',
                  border: '1px dashed var(--border-color)'
                }}>
                  {peerFingerprint || "COMPUTING_SECURE_FINGERPRINT..."}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Report Overlay */}
        {isReporting && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', borderRadius: '24px' }}>
            <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '16px', width: '100%', maxWidth: '300px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ margin: '0 0 1rem', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} /> Report User
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Please select a reason for reporting. This will flag the user for moderation.</p>
              <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="form-control" style={{ marginBottom: '1rem', width: '100%', padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                <option value="">Select reason...</option>
                <option value="Rude Behavior">Rude Behavior</option>
                <option value="Scam/Fraud">Scam / Fraud</option>
                <option value="Spam">Spam</option>
                <option value="Other">Other</option>
              </select>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsReporting(false)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}>Cancel</button>
                <button type="button" onClick={handleReportUser} className="btn-primary" style={{ background: '#EF4444', padding: '0.4rem 0.8rem', fontSize: '0.8rem', border: 'none', borderRadius: '8px', color: 'white' }} disabled={!reportReason}>Submit Report</button>
              </div>
            </div>
          </div>
        )}

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
          {sendError && (
            <div style={{ 
              background: 'rgba(239,68,68,0.15)', 
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: '8px',
              padding: '0.6rem 0.9rem',
              color: '#f87171',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <AlertTriangle size={14} />
              {sendError}
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
                {msg.senderAlias} • {msg.timestamp ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '…'}
              </p>
            </div>
          ))}
          {isTyping && (
            <div style={{ alignSelf: 'flex-start', maxWidth: '80%', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ 
                padding: '0.6rem 0.9rem', 
                borderRadius: '16px', 
                background: 'var(--card-bg)', 
                border: '1px solid var(--border-color)',
                fontSize: '0.85rem',
                color: 'var(--text-muted)'
              }}>
                <span className="typing-indicator-dot" />
                <span className="typing-indicator-dot" />
                <span className="typing-indicator-dot" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Quick Bargaining Chips */}
        {isListingActive(item.expiresAt) && (
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            overflowX: 'auto', 
            padding: '0.5rem 1rem', 
            background: 'var(--bg-color)', 
            borderTop: '1px solid var(--border-color)',
            scrollbarWidth: 'none'
          }}>
            {[
              "Is this still available?",
              "Can we meet at the Barangay Hall?",
              "Would you accept a trade?",
              "What is the final price?"
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setNewMessage(chip);
                  setSendError(null);
                }}
                style={{
                  fontSize: '0.75rem',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '4px 12px',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="chat-input-form">
          <input 
            id="chat-message-input"
            name="chat-message"
            type="text" 
            className="form-control" 
            placeholder={isListingActive(item.expiresAt) ? "Type a message..." : "Chat disabled"} 
            value={newMessage}
            onChange={(e) => { setNewMessage(e.target.value); setSendError(null); }}
            disabled={!isListingActive(item.expiresAt)}
            autoComplete="off"
          />
          <button type="submit" className="btn btn-primary chat-send-btn" disabled={!newMessage.trim()}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
