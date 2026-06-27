import React, { useRef, useState } from 'react';
import { X, CheckCircle, MapPin, Calendar, Clock, Download, ShieldCheck, XCircle, Check, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, doc, updateDoc, addDoc, collection, getDoc, serverTimestamp } from '../firebase';
import { encryptMessage } from '../utils/crypto';

const formatReceiptDate = (val) => {
  if (!val) return "";
  try {
    const d = val.toDate ? val.toDate() : new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleString();
  } catch (e) {
    return String(val);
  }
};

export default function TransactionReceipt({ transaction, onClose }) {
  const receiptRef = useRef(null);
  const { currentUser } = useAuth();

  const [pinInput, setPinInput] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('Rule 303: Meetup No-Show');
  const [disputeComments, setDisputeComments] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [submittingVerification, setSubmittingVerification] = useState(false);

  // Cancellation States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of mind');
  const [cancelComments, setCancelComments] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const showAlert = (message, title = 'Notice', type = 'info') => {
    setAlertModal({ isOpen: true, title, message, type });
  };

  const isSeller = currentUser?.uid === transaction?.sellerId;
  const isBuyer = currentUser?.uid === transaction?.buyerId;

  const handleVerifyPin = async (e) => {
    e.preventDefault();
    setVerificationError('');
    setSubmittingVerification(true);
    try {
      const targetPin = isSeller ? transaction.buyerPin : transaction.sellerPin;
      if (pinInput.trim() !== targetPin) {
        setVerificationError('Invalid PIN code. Please check with your partner.');
        setSubmittingVerification(false);
        return;
      }

      const txRef = doc(db, 'transactions', transaction.id);
      await updateDoc(txRef, { status: 'Completed' });

      const sellerRef = doc(db, 'users', transaction.sellerId);
      const buyerRef = doc(db, 'users', transaction.buyerId);

      const sellerSnap = await getDoc(sellerRef);
      const buyerSnap = await getDoc(buyerRef);

      if (sellerSnap.exists()) {
        const sData = sellerSnap.data();
        const nextScore = Math.min(100, (sData.trustScore ?? 100) + 5);
        await updateDoc(sellerRef, { trustScore: nextScore });
        await addDoc(collection(db, 'trust_logs'), {
          userId: transaction.sellerId,
          change: 5,
          newScore: nextScore,
          event: 'Trade Reward',
          ruleApplied: 'Commendation 1',
          reason: `Successfully completed trade for item: "${transaction.item_name}"`,
          timestamp: serverTimestamp()
        });
      }

      if (buyerSnap.exists()) {
        const bData = buyerSnap.data();
        const nextScore = Math.min(100, (bData.trustScore ?? 100) + 5);
        await updateDoc(buyerRef, { trustScore: nextScore });
        await addDoc(collection(db, 'trust_logs'), {
          userId: transaction.buyerId,
          change: 5,
          newScore: nextScore,
          event: 'Trade Reward',
          ruleApplied: 'Commendation 1',
          reason: `Successfully completed trade for item: "${transaction.item_name}"`,
          timestamp: serverTimestamp()
        });
      }

      setVerificationSuccess(true);
      showAlert('Transaction completed successfully! Trust scores have been updated for both parties.', 'Trade Complete', 'success');
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      setVerificationError('Error completing transaction: ' + err.message);
    } finally {
      setSubmittingVerification(false);
    }
  };

  const handleRaiseDispute = async (e) => {
    e.preventDefault();
    if (!disputeComments.trim()) return;
    setSubmittingDispute(true);
    try {
      const refNo = transaction.reference_number;
      const offenderId = isSeller ? transaction.buyerId : transaction.sellerId;
      
      const currentUserName = localStorage.getItem('komuni_display_name') || `Agent_${currentUser.uid.substring(0, 6).toUpperCase()}`;

      await addDoc(collection(db, 'disputes'), {
        transactionId: transaction.id,
        reference_number: refNo,
        item_name: transaction.item_name,
        reporterId: currentUser.uid,
        reporterAlias: currentUserName,
        reportedUserId: offenderId,
        reason: disputeReason,
        comments: disputeComments,
        timestamp: serverTimestamp(),
        status: 'active'
      });

      const txRef = doc(db, 'transactions', transaction.id);
      await updateDoc(txRef, { 
        disputed: true,
        disputeReason: disputeReason
      });

      showAlert('Dispute has been filed and reported to the moderation team.', 'Dispute Filed', 'success');
      setShowDisputeModal(false);
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      showAlert('Failed to raise dispute: ' + err.message, 'Error', 'error');
    } finally {
      setSubmittingDispute(false);
    }
  };

  const handleCancelTransactionConfirmed = async (e) => {
    e.preventDefault();
    setSubmittingCancel(true);
    try {
      const txRef = doc(db, 'transactions', transaction.id);
      
      // 1. Update Transaction status
      await updateDoc(txRef, {
        status: 'Cancelled',
        cancelledBy: currentUser.uid,
        cancelReason: cancelReason,
        cancelComments: cancelComments,
        cancelledAt: serverTimestamp()
      });

      // 2. Restore Listing status
      if (transaction.listingId) {
        const listingRef = doc(db, 'listings', transaction.listingId);
        await updateDoc(listingRef, { isSold: false });
      }

      // 3. Deduct 5 Trust Score Points from cancelling user
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentScore = userSnap.data().trustScore ?? 0;
        const nextScore = Math.max(0, currentScore - 5);
        await updateDoc(userRef, { trustScore: nextScore });

        await addDoc(collection(db, 'trust_logs'), {
          userId: currentUser.uid,
          change: -5,
          newScore: nextScore,
          event: 'Cancellation Penalty',
          ruleApplied: 'Rule 303: Meetup Reliability',
          reason: `Cancelled confirmed deal for item: "${transaction.item_name}"`,
          timestamp: serverTimestamp()
        });
      }

      // 4. Send E2EE System Message
      const chatId = [transaction.buyerId, transaction.sellerId, transaction.listingId].sort().join('_');
      const peerId = currentUser.uid === transaction.sellerId ? transaction.buyerId : transaction.sellerId;
      const peerSnap = await getDoc(doc(db, 'users', peerId));
      let peerPublicKey = null;
      if (peerSnap.exists()) {
        const peerData = peerSnap.data();
        peerPublicKey = peerData.publicKeyJwk;
      }

      const currentUserName = localStorage.getItem('komuni_display_name') || 'Partner';
      const cancelText = `[System] Confirmed Deal Cancelled by ${currentUserName}. Reason: ${cancelReason}. Details: ${cancelComments}`;
      
      let finalMsgText = cancelText;
      let isEncrypted = false;
      if (peerPublicKey) {
        try {
          finalMsgText = await encryptMessage(cancelText, peerPublicKey, chatId);
          isEncrypted = true;
        } catch (encryptErr) {
          console.error("E2EE Encryption of cancellation failed:", encryptErr);
        }
      }

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: finalMsgText,
        senderId: currentUser.uid,
        senderAlias: 'System Notice',
        timestamp: serverTimestamp(),
        isEncrypted: isEncrypted
      });

      // 5. Send Notification
      await addDoc(collection(db, 'notifications'), {
        userId: peerId,
        type: 'agreement_cancelled',
        title: 'Deal Cancelled',
        message: `The deal for "${transaction.item_name}" has been cancelled by the partner. Reason: ${cancelReason}`,
        relatedId: transaction.id,
        read: false,
        createdAt: serverTimestamp()
      });

      showAlert('Deal cancelled successfully. Trust score has been adjusted.', 'Deal Cancelled', 'info');
      setShowCancelModal(false);
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      showAlert('Error cancelling deal: ' + err.message, 'Error', 'error');
    } finally {
      setSubmittingCancel(false);
    }
  };

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    try {
      let html2canvas = window.html2canvas;
      if (!html2canvas) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
          script.onload = () => {
            html2canvas = window.html2canvas;
            resolve();
          };
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }
      
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement('a');
      link.download = `KomuniTrade-Receipt-${transaction.reference_number}.png`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error("Error generating receipt:", error);
      showAlert('Failed to generate receipt image. Please try again.', 'Error', 'error');
    }
  };

  if (!transaction) return null;

  const getStatusConfig = (status) => {
    switch (status) {
      case 'Confirmed':
      case 'Completed':
        return {
          headerBg: '#10B981',
          statusColor: '#10B981',
          statusBg: '#ECFDF5',
          icon: <CheckCircle size={32} color="#10B981" />,
          label: 'Agreement Confirmed'
        };
      case 'Pending Agreement':
        return {
          headerBg: '#F59E0B',
          statusColor: '#D97706',
          statusBg: '#FEF3C7',
          icon: <Clock size={32} color="#D97706" />,
          label: 'Pending Confirmation'
        };
      case 'Cancelled':
      case 'Declined':
        return {
          headerBg: '#EF4444',
          statusColor: '#DC2626',
          statusBg: '#FEE2E2',
          icon: <X size={32} color="#DC2626" />,
          label: 'Agreement Cancelled'
        };
      default:
        return {
          headerBg: '#2563EB',
          statusColor: '#2563EB',
          statusBg: '#E0E7FF',
          icon: <Clock size={32} color="#2563EB" />,
          label: status
        };
    }
  };

  const statusConfig = getStatusConfig(transaction.status);

  return (
    <div className="location-modal-overlay" style={{ zIndex: 2000 }}>
      <style>{`
        .receipt-container::-webkit-scrollbar {
          width: 8px;
          display: block !important;
        }
        .receipt-container::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .receipt-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .receipt-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
          border-radius: 4px;
        }
      `}</style>
      <div className="location-modal-content" style={{ maxWidth: '450px', background: 'transparent', boxShadow: 'none' }}>
        
        {/* Actions Header (Not captured in image) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', background: 'var(--card-bg)', padding: '1rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', gap: '0.5rem' }}>
           <button onClick={handleDownload} className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px', fontSize: '0.9rem' }}>
             <Download size={16} /> Download
           </button>
           <button onClick={onClose} className="glass" style={{ width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
             <X size={20} />
           </button>
        </div>

        {/* Receipt (Captured in image) */}
        <div 
          ref={receiptRef}
          className="receipt-container"
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            overflowY: 'auto',
            maxHeight: '70vh',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            position: 'relative',
            color: '#1a1a1a',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          {/* Receipt Header */}
          <div style={{ background: statusConfig.headerBg, color: '#ffffff', padding: '1.5rem', textAlign: 'center', transition: 'background-color 0.3s' }}>
             <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>KomuniTrade</h2>
             <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '2px' }}>Transaction Agreement</p>
          </div>

          <div style={{ padding: '2rem 1.5rem' }}>
            {/* Status Status Icon */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
               <div style={{ width: '60px', height: '60px', background: statusConfig.statusBg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                 {statusConfig.icon}
               </div>
               <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: statusConfig.statusColor }}>{statusConfig.label}</h3>
               <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#6b7280' }}>Agreement securely recorded</p>
            </div>

            <hr style={{ border: 'none', borderTop: '1px dashed #e5e7eb', margin: '0 0 1.5rem 0' }} />

            {/* Details Grid */}
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
               
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                 <span style={{ color: '#6b7280', fontSize: '0.85rem', fontWeight: 600 }}>Item</span>
                 <div style={{ textAlign: 'right', maxWidth: '60%' }}>
                   <div style={{ fontWeight: 800, color: '#1f2937' }}>{transaction.item_name}</div>
                   <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Condition: {transaction.item_condition}</div>
                 </div>
               </div>

               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: '#6b7280', fontSize: '0.85rem', fontWeight: 600 }}>Agreed Price</span>
                 <span style={{ fontWeight: 800, color: '#1f2937', fontSize: '1.1rem' }}>₱{transaction.agreed_price.toLocaleString()}</span>
               </div>

               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: '#6b7280', fontSize: '0.85rem', fontWeight: 600 }}>Payment Method</span>
                 <span style={{ fontWeight: 700, color: '#4b5563' }}>{transaction.payment_method}</span>
               </div>

            </div>

            <hr style={{ border: 'none', borderTop: '1px dashed #e5e7eb', margin: '0 0 1.5rem 0' }} />

            {/* Identity & Verification */}
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ color: '#6b7280', fontSize: '0.85rem', fontWeight: 600 }}>Seller</span>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <span style={{ fontWeight: 800, color: '#1f2937' }}>{transaction.seller_masked_name}</span>
                   <ShieldCheck size={16} color="#2563eb" />
                 </div>
               </div>
               
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ color: '#6b7280', fontSize: '0.85rem', fontWeight: 600 }}>Buyer</span>
                 <span style={{ fontWeight: 700, color: '#4b5563' }}>{transaction.buyer_name}</span>
               </div>
            </div>

            <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Logistics Agreement</div>
              <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.85rem', color: '#1f2937' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><MapPin size={14} color="#6b7280"/> {transaction.meetup_location}</div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Calendar size={14} color="#6b7280"/> {transaction.meetup_date}</div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Clock size={14} color="#6b7280"/> {transaction.meetup_time}</div>
              </div>
            </div>            <div style={{ fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.5, fontStyle: 'italic', marginBottom: '2rem', textAlign: 'center' }}>
              "{transaction.agreement_summary}"
            </div>

            {/* PIN HANDSHAKE VERIFICATION SECTION */}
            {transaction.status === 'Confirmed' && (isBuyer || isSeller) && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'left' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>In-Person Meetup Verification</div>
                
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#1e40af', lineHeight: 1.4 }}>
                  Your Verification PIN: <strong style={{ fontSize: '1rem', color: '#1d4ed8', fontFamily: 'monospace' }}>{isSeller ? transaction.sellerPin : transaction.buyerPin}</strong><br/>
                  <span style={{ fontSize: '0.75rem', opacity: 0.95 }}>Share this code with your partner ONLY during the physical meetup.</span>
                </p>

                <form onSubmit={handleVerifyPin} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af' }}>Enter Partner's PIN to Complete Trade</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      maxLength={6} 
                      placeholder="6-digit PIN"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                      style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '0.9rem', color: '#1a1a1a', outline: 'none' }}
                      required
                    />
                    <button 
                      type="submit" 
                      disabled={submittingVerification}
                      style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      {submittingVerification ? 'Verifying...' : 'Complete'}
                    </button>
                  </div>
                  {verificationError && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', fontWeight: 700 }}>
                      {verificationError}
                    </div>
                  )}
                </form>
              </div>
            )}

            {transaction.status === 'Confirmed' && (isBuyer || isSeller) && (
              <div style={{ textAlign: 'center', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCancelModal(true)}
                  style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', padding: '0.5rem 1.25rem', borderRadius: '8px', width: 'fit-content', transition: 'all 0.2s' }}
                >
                  Cancel Confirmed Deal
                </button>
              </div>
            )}

            {/* DISPUTE TRIGGER SECTION */}
            {(transaction.status === 'Confirmed' || transaction.status === 'Completed') && (isBuyer || isSeller) && !transaction.disputed && (
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowDisputeModal(true)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Flag Dispute / Report Issue
                </button>
              </div>
            )}

            {transaction.disputed && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'center', color: '#b91c1c', fontSize: '0.8rem', fontWeight: 700 }}>
                ⚠️ This transaction is currently disputed: "{transaction.disputeReason || 'Reported Issue'}"
              </div>
            )}

             {/* QR & Reference */}
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${transaction.reference_number}`} 
                  alt="QR Code"
                  style={{ width: '60px', height: '60px', borderRadius: '8px' }}
                  crossOrigin="anonymous" 
                />
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Reference No.</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: '#0f172a', letterSpacing: '1px' }}>{transaction.reference_number}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.2rem' }}>Generated: {formatReceiptDate(transaction.created_at)}</div>
                </div>
             </div>

           </div>

           {/* Footer Ribbon */}
           <div style={{ background: '#1e293b', padding: '0.75rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.7rem' }}>
             Verify this transaction at komunitrade.app/verify
           </div>
           
           {/* Jagged Edge Effect (CSS generated) */}
           <div style={{ 
             height: '10px', 
             background: 'linear-gradient(-45deg, transparent 5px, #ffffff 0), linear-gradient(45deg, transparent 5px, #ffffff 0)',
             backgroundPosition: 'left-bottom',
             backgroundRepeat: 'repeat-x',
             backgroundSize: '10px 10px',
             position: 'absolute',
             bottom: 0,
             left: 0,
             width: '100%',
             transform: 'rotate(180deg)',
             opacity: 0.1
           }} />
         </div>

       </div>

      {/* Dispute Modal Overlay */}
      {showDisputeModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="panel animate-slide-up" style={{ width: '100%', maxWidth: '400px', padding: '2rem', color: 'var(--text-main)', background: 'var(--card-bg)', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'center' }}>
              Flag Dispute on Receipt
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              Reporting this transaction will flag it for administration and immediately deduct from the trust score loop if verified.
            </p>
            
            <form onSubmit={handleRaiseDispute} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Dispute Category</label>
                <select 
                  className="form-control" 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)', outline: 'none' }}
                  required 
                  value={disputeReason} 
                  onChange={(e) => setDisputeReason(e.target.value)}
                >
                  <option value="Rule 303: Meetup No-Show">Rule 303: Meetup No-Show</option>
                  <option value="Rule 202: Item Not as Described">Rule 202: Item Not as Described</option>
                  <option value="Rule 404: Receipt/Currency Fraud">Rule 404: Receipt/Currency Fraud</option>
                  <option value="Rule 101: Bad Conduct/Harassment">Rule 101: Bad Conduct/Harassment</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Detailed Explanation</label>
                <textarea 
                  className="form-control"
                  style={{ width: '100%', height: '100px', resize: 'none', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none' }}
                  placeholder="Provide details about what went wrong at the meetup..."
                  required
                  value={disputeComments}
                  onChange={(e) => setDisputeComments(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowDisputeModal(false)} className="btn-secondary" style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: '#ef4444', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800, width: 'auto' }} disabled={submittingDispute}>
                  {submittingDispute ? 'Filing...' : 'File Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Cancel Modal Overlay */}
      {showCancelModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="panel animate-slide-up" style={{ width: '100%', maxWidth: '400px', padding: '2rem', color: 'var(--text-main)', background: 'var(--card-bg)', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'center' }}>
              Cancel Confirmed Deal
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              Canceling this confirmed deal will return the item to the active marketplace, but will deduct <strong>5 trust points</strong> from your score as penalty.
            </p>
            
            <form onSubmit={handleCancelTransactionConfirmed} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Cancellation Reason</label>
                <select 
                  className="form-control" 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)', outline: 'none' }}
                  required 
                  value={cancelReason} 
                  onChange={(e) => setCancelReason(e.target.value)}
                >
                  <option value="Change of mind">Change of mind</option>
                  <option value="Item no longer needed">Item no longer needed</option>
                  <option value="Scheduling conflict">Scheduling conflict</option>
                  <option value="Partner unresponsive">Partner unresponsive</option>
                  <option value="Incorrect details on listing">Incorrect details on listing</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Detailed Reason (Required)</label>
                <textarea 
                  className="form-control"
                  style={{ width: '100%', height: '80px', resize: 'none', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none' }}
                  placeholder="Explain why you are canceling this transaction..."
                  required
                  value={cancelComments}
                  onChange={(e) => setCancelComments(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCancelModal(false)} className="btn-secondary" style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: '#ef4444', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800, width: 'auto' }} disabled={submittingCancel}>
                  {submittingCancel ? 'Canceling Deal...' : 'Cancel Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Premium Alert Modal */}
      {alertModal.isOpen && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000 }}
          onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '2.5rem 2rem', width: '90%', maxWidth: '380px', textAlign: 'center', boxShadow: 'var(--shadow-premium)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: alertModal.type === 'success' ? 'rgba(16,185,129,0.08)' : alertModal.type === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)', border: alertModal.type === 'success' ? '2px solid rgba(16,185,129,0.2)' : alertModal.type === 'error' ? '2px solid rgba(239,68,68,0.2)' : '2px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: alertModal.type === 'success' ? '#10B981' : alertModal.type === 'error' ? '#EF4444' : '#3B82F6' }}>
              {alertModal.type === 'success' && <Check size={32} />}
              {alertModal.type === 'error' && <XCircle size={32} />}
              {alertModal.type === 'info' && <Info size={32} />}
            </div>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '0.75rem' }}>{alertModal.title}</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>{alertModal.message}</p>
            <button onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))} style={{ width: '100%', padding: '0.85rem', borderRadius: '100px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', background: alertModal.type === 'error' ? '#EF4444' : 'var(--primary)', color: 'white', border: 'none' }}>Got it</button>
          </div>
        </div>
      )}
    </div>
  );
}
