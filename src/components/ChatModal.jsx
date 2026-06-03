import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User, Bot, AlertTriangle, ShieldCheck, Lock, Calendar, Clock, ShoppingBag, Check } from 'lucide-react';
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
import { isListingActive, BARANGAY_COORDS } from '../utils/geo';
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

  // Premium Checkout & Agreement States
  const [showCheckout, setShowCheckout] = useState(false);
  const [proposalTxs, setProposalTxs] = useState({});
  const [peerProfile, setPeerProfile] = useState(null);

  const [agreedPrice, setAgreedPrice] = useState(item?.price || '');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Meetup');
  const [meetupLocation, setMeetupLocation] = useState(item?.barangay || 'Obrero');
  const [customLocation, setCustomLocation] = useState('');
  const [meetupDate, setMeetupDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // Default to tomorrow
    return d.toISOString().split('T')[0];
  });
  const [meetupTime, setMeetupTime] = useState('14:00');
  const [additionalTerms, setAdditionalTerms] = useState('Inspect item carefully before finalizing trade.');

  useEffect(() => {
    if (item) {
      setAgreedPrice(item.price || '');
      setMeetupLocation(item.barangay || 'Obrero');
    }
  }, [item]);

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

    // Fetch peer's public E2EE key & profile data
    const fetchPeerKey = async () => {
      try {
        const peerRef = doc(db, 'users', peerId);
        const peerSnap = await getDoc(peerRef);
        if (peerSnap.exists()) {
          const peerData = peerSnap.data();
          setPeerProfile(peerData);
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

  // Fetch details for proposed transactions in messages
  useEffect(() => {
    const idsToFetch = [];
    messages.forEach(msg => {
      if (msg.text && msg.text.startsWith('[PROPOSAL:')) {
        const parts = msg.text.split(':');
        if (parts.length > 1) {
          const txId = parts[1].replace(']', '').trim();
          if (txId && !proposalTxs[txId]) {
            idsToFetch.push(txId);
          }
        }
      }
    });

    if (idsToFetch.length === 0) return;

    idsToFetch.forEach(async (txId) => {
      try {
        const txRef = doc(db, 'transactions', txId);
        const txSnap = await getDoc(txRef);
        if (txSnap.exists()) {
          setProposalTxs(prev => ({
            ...prev,
            [txId]: { id: txSnap.id, ...txSnap.data() }
          }));
        }
      } catch (err) {
        console.error("Failed to fetch proposal:", txId, err);
      }
    });
  }, [messages]);

  const handleCreateAgreement = async (e) => {
    e.preventDefault();
    if (!currentUser || !item || !chatId) return;

    try {
      const sellerId = item.sellerId || item.userId;
      const buyerId = item.buyerId || currentUser.uid;
      
      const currentUserName = localStorage.getItem('komuni_display_name') || `Agent_${currentUser.uid.substring(0, 6).toUpperCase()}`;
      const peerName = peerProfile?.displayName || `Agent_${(currentUser.uid === sellerId ? buyerId : sellerId).substring(0, 6).toUpperCase()}`;

      const sellerName = currentUser.uid === sellerId ? currentUserName : peerName;
      const buyerName = currentUser.uid === buyerId ? currentUserName : peerName;

      const finalLocation = meetupLocation === 'Custom Spot' ? customLocation : meetupLocation;

      // 1. Write transaction doc with Pending Agreement
      const refNo = `TRX-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const txDocRef = await addDoc(collection(db, 'transactions'), {
        reference_number: refNo,
        status: 'Pending Agreement',
        item_name: item.title,
        item_condition: item.condition || 'Used',
        agreed_price: parseFloat(agreedPrice) || 0,
        payment_method: paymentMethod,
        seller_masked_name: sellerName,
        sellerId: sellerId,
        buyer_name: buyerName,
        buyerId: buyerId,
        meetup_location: finalLocation,
        meetup_date: meetupDate,
        meetup_time: meetupTime,
        agreement_summary: additionalTerms,
        created_at: serverTimestamp(),
        listingId: item.id
      });

      // 2. Format proposal tag
      const proposalText = `[PROPOSAL:${txDocRef.id}]`;
      const encryptedMsg = await encryptMessage(proposalText, peerPublicKey, chatId);

      // 3. Add to messages subcollection
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: encryptedMsg,
        senderId: currentUser.uid,
        senderAlias: getAlias(currentUser.uid),
        timestamp: serverTimestamp(),
        isEncrypted: true
      });

      // 4. Update parent preview
      await setDoc(doc(db, 'chats', chatId), {
        participants: [buyerId, sellerId],
        lastMessage: encryptedMsg,
        lastTimestamp: serverTimestamp(),
        itemTitle: item.title,
        itemId: item.id,
        sellerId: sellerId,
        buyerId: buyerId
      }, { merge: true });

      setShowCheckout(false);
    } catch (err) {
      console.error("Failed to create agreement:", err);
      alert("Error proposing transaction agreement.");
    }
  };

  const handleAcceptAgreement = async (txId, txListingId) => {
    if (!currentUser) return;
    try {
      const txRef = doc(db, 'transactions', txId);
      await updateDoc(txRef, { status: 'Confirmed' });

      if (txListingId) {
        const listingRef = doc(db, 'listings', txListingId);
        await updateDoc(listingRef, { isSold: true });
      }

      const sysMsgText = `[System] Transaction Agreement Accepted! The deal is confirmed. View your receipt in the Agreements history page.`;
      const encryptedMsg = await encryptMessage(sysMsgText, peerPublicKey, chatId);
      
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: encryptedMsg,
        senderId: currentUser.uid,
        senderAlias: 'System Notice',
        timestamp: serverTimestamp(),
        isEncrypted: true
      });

      setProposalTxs(prev => ({
        ...prev,
        [txId]: { ...prev[txId], status: 'Confirmed' }
      }));
    } catch (err) {
      console.error("Failed to accept agreement:", err);
      alert("Error confirming transaction.");
    }
  };

  const handleDeclineAgreement = async (txId) => {
    if (!currentUser) return;
    try {
      const txRef = doc(db, 'transactions', txId);
      await updateDoc(txRef, { status: 'Cancelled' });

      const sysMsgText = `[System] Transaction Agreement Declined.`;
      const encryptedMsg = await encryptMessage(sysMsgText, peerPublicKey, chatId);
      
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: encryptedMsg,
        senderId: currentUser.uid,
        senderAlias: 'System Notice',
        timestamp: serverTimestamp(),
        isEncrypted: true
      });

      setProposalTxs(prev => ({
        ...prev,
        [txId]: { ...prev[txId], status: 'Cancelled' }
      }));
    } catch (err) {
      console.error("Failed to decline agreement:", err);
      alert("Error declining transaction.");
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
              onClick={() => setShowCheckout(true)}
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
          {messages.map((msg) => {
            const isProposal = msg.text && msg.text.startsWith('[PROPOSAL:');
            let txId = '';
            if (isProposal) {
              const parts = msg.text.split(':');
              if (parts.length > 1) {
                txId = parts[1].replace(']', '').trim();
              }
            }

            if (isProposal) {
              const txData = proposalTxs[txId];
              return (
                <div 
                  key={msg.id} 
                  style={{ 
                    alignSelf: msg.senderId === currentUser?.uid ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    width: '300px',
                    margin: '0.5rem 0'
                  }}
                >
                  <div style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '20px',
                    padding: '1.25rem',
                    boxShadow: 'var(--shadow-md)',
                    color: 'var(--text-main)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: txData?.status === 'Confirmed' ? '#10B981' : txData?.status === 'Cancelled' ? '#EF4444' : 'var(--primary)'
                    }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 850, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                      <ShoppingBag size={14} color="var(--primary)" />
                      <span>PROPOSED TRANSACTION</span>
                    </div>

                    {!txData ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div className="skeleton" style={{ height: '18px', width: '80%' }} />
                        <div className="skeleton" style={{ height: '14px', width: '60%' }} />
                        <div className="skeleton" style={{ height: '14px', width: '50%' }} />
                      </div>
                    ) : (
                      <>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '2px' }}>{txData.item_name}</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)' }}>₱{txData.agreed_price.toLocaleString()}</div>
                        </div>

                        <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', background: 'var(--bg-color)', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)' }}>
                            <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ fontWeight: 600 }}>{txData.meetup_location}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)' }}>
                            <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                            <span>{txData.meetup_date} @ {txData.meetup_time}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)' }}>
                            <Lock size={12} style={{ color: 'var(--text-muted)' }} />
                            <span>Method: {txData.payment_method}</span>
                          </div>
                        </div>

                        {txData.agreement_summary && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', borderLeft: '2px solid var(--border-color)', paddingLeft: '0.5rem', margin: '0.2rem 0' }}>
                            "{txData.agreement_summary}"
                          </div>
                        )}

                        <div style={{ marginTop: '0.25rem' }}>
                          {txData.status === 'Pending Agreement' ? (
                            msg.senderId === currentUser?.uid ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>
                                <Clock size={12} className="animate-pulse" />
                                <span>Waiting for buyer response...</span>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  type="button"
                                  onClick={() => handleAcceptAgreement(txId, txData.listingId)}
                                  style={{
                                    flex: 1,
                                    background: '#10B981',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.5rem',
                                    borderRadius: '10px',
                                    fontSize: '0.8rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.25rem'
                                  }}
                                >
                                  <Check size={12} /> Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeclineAgreement(txId)}
                                  style={{
                                    flex: 1,
                                    background: 'transparent',
                                    color: '#EF4444',
                                    border: '1px solid rgba(239, 68, 68, 0.4)',
                                    padding: '0.5rem',
                                    borderRadius: '10px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Decline
                                </button>
                              </div>
                            )
                          ) : txData.status === 'Confirmed' || txData.status === 'Completed' ? (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              color: '#10B981',
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              background: 'rgba(16, 185, 129, 0.08)',
                              padding: '0.4rem 0.6rem',
                              borderRadius: '8px',
                              width: 'fit-content'
                            }}>
                              <Check size={14} strokeWidth={3} />
                              <span>Agreement Confirmed</span>
                            </div>
                          ) : (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              color: '#EF4444',
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              background: 'rgba(239, 68, 68, 0.08)',
                              padding: '0.4rem 0.6rem',
                              borderRadius: '8px',
                              width: 'fit-content'
                            }}>
                              <X size={14} strokeWidth={3} />
                              <span>Agreement Declined</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem', textAlign: msg.senderId === currentUser?.uid ? 'right' : 'left' }}>
                    {msg.senderAlias} • {msg.timestamp ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '…'}
                  </p>
                </div>
              );
            }

            return (
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
            );
          })}
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

        {/* Checkout Modal Overlay */}
        {showCheckout && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
            borderRadius: '24px',
            animation: 'fadeIn 0.25s ease-out'
          }}>
            <div 
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '24px',
                width: '100%',
                maxHeight: '100%',
                overflowY: 'auto',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-premium)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                color: 'var(--text-main)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShoppingBag size={20} color="var(--primary)" /> Finalize Agreement
                </h3>
                <button 
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateAgreement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Final Agreed Price (₱)</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="number" 
                      required 
                      className="premium-input" 
                      style={{ paddingLeft: '2rem' }}
                      value={agreedPrice} 
                      onChange={(e) => setAgreedPrice(e.target.value)} 
                    />
                    <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.9rem' }}>₱</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payment Method</label>
                  <select 
                    className="premium-input premium-select" 
                    required 
                    value={paymentMethod} 
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Cash on Meetup">Cash on Meetup</option>
                    <option value="GCash">GCash</option>
                    <option value="Maya">Maya</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Meetup Location (Davao Hotspot)</label>
                  <select 
                    className="premium-input premium-select" 
                    required 
                    value={meetupLocation} 
                    onChange={(e) => setMeetupLocation(e.target.value)}
                  >
                    {Object.keys(BARANGAY_COORDS).map(brgy => (
                      <option key={brgy} value={brgy}>{brgy === 'Davao City' ? 'Davao City (Center)' : `${brgy} Hotspot`}</option>
                    ))}
                    <option value="Custom Spot">Custom Meetup Spot...</option>
                  </select>
                </div>

                {meetupLocation === 'Custom Spot' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }} className="animate-fade-in">
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Specify Custom Location</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Starbucks Abreeza" 
                      className="premium-input" 
                      value={customLocation} 
                      onChange={(e) => setCustomLocation(e.target.value)} 
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Meetup Date</label>
                    <input 
                      type="date" 
                      required 
                      className="premium-input" 
                      value={meetupDate} 
                      onChange={(e) => setMeetupDate(e.target.value)} 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Meetup Time</label>
                    <input 
                      type="time" 
                      required 
                      className="premium-input" 
                      value={meetupTime} 
                      onChange={(e) => setMeetupTime(e.target.value)} 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Additional Agreement Terms</label>
                  <textarea 
                    className="premium-input" 
                    style={{ height: '70px', resize: 'none', padding: '10px' }}
                    placeholder="e.g. Bring exact cash change. No returns."
                    value={additionalTerms}
                    onChange={(e) => setAdditionalTerms(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowCheckout(false)} 
                    className="btn-secondary" 
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', fontSize: '0.9rem' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 800 }}
                  >
                    Propose Deal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
