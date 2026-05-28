import React, { useRef } from 'react';
import { X, CheckCircle, MapPin, Calendar, Clock, Download, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function TransactionReceipt({ transaction, onClose }) {
  const receiptRef = useRef(null);
  const { currentUser } = useAuth();

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
      alert("Failed to generate receipt image.");
    }
  };

  if (!transaction) return null;

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
          <div style={{ background: '#2563eb', color: '#ffffff', padding: '1.5rem', textAlign: 'center' }}>
             <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>KomuniTrade</h2>
             <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '2px' }}>Transaction Agreement</p>
          </div>

          <div style={{ padding: '2rem 1.5rem' }}>
            {/* Status Status Icon */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
               <div style={{ width: '60px', height: '60px', background: '#ecfdf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                 <CheckCircle size={32} color="#10b981" />
               </div>
               <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>{transaction.status}</h3>
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
            </div>

            <div style={{ fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.5, fontStyle: 'italic', marginBottom: '2rem', textAlign: 'center' }}>
              "{transaction.agreement_summary}"
            </div>

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
                 <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.2rem' }}>Generated: {new Date(transaction.created_at).toLocaleString()}</div>
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
    </div>
  );
}
