import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, FileText, CheckCircle2, Clock, MapPin, Loader2, XCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, collection, query, where, onSnapshot } from '../firebase';
import TransactionReceipt from '../components/TransactionReceipt';

export default function TransactionHistory() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All'); // 'All', 'Purchases', 'Sales'
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState(null);

  const [sellerTxs, setSellerTxs] = useState([]);
  const [buyerTxs, setBuyerTxs] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    
    // 1. Subscribe to seller transactions
    const qSeller = query(
      collection(db, 'transactions'),
      where('sellerId', '==', currentUser.uid)
    );
    const unsubSeller = onSnapshot(qSeller, (snapshot) => {
      const txs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : new Date().toISOString()
        };
      });
      setSellerTxs(txs);
    });

    // 2. Subscribe to buyer transactions
    const qBuyer = query(
      collection(db, 'transactions'),
      where('buyerId', '==', currentUser.uid)
    );
    const unsubBuyer = onSnapshot(qBuyer, (snapshot) => {
      const txs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : new Date().toISOString()
        };
      });
      setBuyerTxs(txs);
    });

    return () => {
      unsubSeller();
      unsubBuyer();
    };
  }, [currentUser]);

  useEffect(() => {
    const allTxsMap = new Map();
    sellerTxs.forEach(tx => allTxsMap.set(tx.id, tx));
    buyerTxs.forEach(tx => allTxsMap.set(tx.id, tx));
    
    const combined = Array.from(allTxsMap.values());
    combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    setTransactions(combined);
    setIsLoading(false);
  }, [sellerTxs, buyerTxs]);

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.reference_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tx.item_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || tx.status === statusFilter;
    
    let matchesRole = true;
    if (roleFilter === 'Purchases') {
      matchesRole = tx.buyerId === currentUser.uid;
    } else if (roleFilter === 'Sales') {
      matchesRole = tx.sellerId === currentUser.uid;
    }
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="animate-fade-in" style={{ padding: '2.5rem 1.5rem', maxWidth: '800px', margin: '0 auto', minHeight: '100vh' }}>
      
      <style>{`
        .segmented-control button {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .segmented-control button:hover {
          color: var(--text-main) !important;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.4rem 0.8rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.2px;
          text-transform: capitalize;
        }
        .status-badge[data-status="Completed"] {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        [data-theme="dark"] .status-badge[data-status="Completed"] {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .status-badge[data-status="Confirmed"] {
          background: rgba(59, 130, 246, 0.1);
          color: #1d4ed8;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        [data-theme="dark"] .status-badge[data-status="Confirmed"] {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }
        .status-badge[data-status="Pending Agreement"] {
          background: rgba(245, 158, 11, 0.1);
          color: #b45309;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }
        [data-theme="dark"] .status-badge[data-status="Pending Agreement"] {
          background: rgba(245, 158, 11, 0.2);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        .status-badge[data-status="Cancelled"] {
          background: rgba(239, 68, 68, 0.1);
          color: #b91c1c;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        [data-theme="dark"] .status-badge[data-status="Cancelled"] {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .agreement-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .agreement-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md) !important;
          border-color: var(--primary) !important;
        }
        .agreement-card button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.12);
        }
        .status-pills::-webkit-scrollbar {
          height: 0px;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2.5rem', gap: '1.25rem' }}>
        <button 
          onClick={() => navigate(-1)} 
          className="glass" 
          style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '14px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, background-color 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(-3px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="heading-xl" style={{ margin: 0, fontWeight: 900, fontSize: '1.75rem', letterSpacing: '-0.02em' }}>
            Agreements
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '2px 0 0 0' }}>
            Your transaction history, receipts, and meetup verification PINs.
          </p>
        </div>
      </div>

      {/* Filter controls panel */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1.25rem', 
        marginBottom: '2rem',
        background: 'var(--card-bg)', 
        border: '1px solid var(--border-color)',
        borderRadius: '20px', 
        padding: '1.25rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search reference no. or item name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-control"
            style={{ 
              paddingLeft: '3rem', 
              borderRadius: '12px', 
              border: '1px solid var(--border-color)',
              background: 'var(--bg-color)',
              fontSize: '0.9rem',
              height: '46px',
              transition: 'all 0.2s ease'
            }}
          />
        </div>

        {/* Filter sub-row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          {/* Role Filter (Purchases / Sales) */}
          <div className="segmented-control" style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-color)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            {['All', 'Purchases', 'Sales'].map(role => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                style={{
                  border: 'none',
                  background: roleFilter === role ? 'var(--card-bg)' : 'transparent',
                  color: roleFilter === role ? 'var(--text-main)' : 'var(--text-muted)',
                  padding: '0.4rem 0.9rem',
                  fontSize: '0.8rem',
                  fontWeight: roleFilter === role ? 700 : 550,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: roleFilter === role ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div className="status-pills" style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', maxWidth: '100%', paddingBottom: '2px' }}>
            {['All', 'Pending Agreement', 'Confirmed', 'Completed', 'Cancelled'].map(status => {
              const displayLabel = status === 'Pending Agreement' ? 'Pending' : status;
              const isActive = statusFilter === status;
              return (
                <button 
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  style={{
                    padding: '0.4rem 0.9rem', 
                    fontSize: '0.8rem',
                    borderRadius: '9999px',
                    border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    background: isActive ? 'var(--primary)' : 'var(--bg-color)',
                    color: isActive ? 'var(--bg-color)' : 'var(--text-muted)',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {displayLabel}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {isLoading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 className="animate-spin" size={36} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
            <p style={{ margin: 0, fontSize: '0.95rem' }}>Loading transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 1.5rem', color: 'var(--text-muted)', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '20px' }}>
            <FileText size={48} style={{ opacity: 0.15, margin: '0 auto 1.25rem' }} />
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>No transaction agreements found.</p>
          </div>
        ) : (
          filteredTransactions.map(tx => {
            const isSeller = tx.sellerId === currentUser.uid;
            const roleLabel = isSeller ? 'Sale' : 'Purchase';
            const formattedPrice = Number(tx.agreed_price || 0).toLocaleString('en-PH', {
              style: 'currency',
              currency: 'PHP',
              minimumFractionDigits: 0
            });

            const dateObj = new Date(tx.created_at);
            const formattedDate = dateObj.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <div 
                key={tx.id} 
                className="agreement-card" 
                style={{ 
                  borderRadius: '20px', 
                  padding: '1.5rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '1.25rem',
                  border: '1px solid var(--border-color)',
                  background: 'var(--card-bg)',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Visual indicator bar */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  background: isSeller ? '#10b981' : '#3b82f6'
                }} />

                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      background: isSeller ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                      color: isSeller ? '#10b981' : '#3b82f6'
                    }}>
                      {isSeller ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                      {roleLabel}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                      {tx.reference_number}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {formattedDate}
                  </span>
                </div>

                {/* Card Body */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.25 }}>
                      {tx.item_name}
                    </h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {isSeller ? (
                        <span>Buyer: <strong style={{ color: 'var(--text-main)' }}>{tx.buyer_masked_name || 'Buyer'}</strong></span>
                      ) : (
                        <span>Seller: <strong style={{ color: 'var(--text-main)' }}>{tx.seller_masked_name || 'Seller'}</strong></span>
                      )}
                    </p>
                  </div>
                  <div>
                    <div className="status-badge" data-status={tx.status}>
                      {tx.status === 'Pending Agreement' ? 'Pending' : tx.status}
                    </div>
                  </div>
                </div>

                {/* Meetup logistics ticket */}
                {tx.meetup_date && (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.5rem', 
                    padding: '0.75rem 1rem', 
                    borderRadius: '12px', 
                    background: 'var(--bg-color)', 
                    border: '1px solid var(--border-color)',
                    fontSize: '0.8rem' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontWeight: 600 }}>
                      <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>{tx.meetup_location || 'Meetup details agreed'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} />
                        {tx.meetup_date} @ {tx.meetup_time}
                      </span>
                    </div>
                  </div>
                )}

                {/* Footer details & action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.25rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Agreed Amount</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.02em', fontFamily: "'Outfit', sans-serif" }}>
                      {formattedPrice}
                    </span>
                  </div>

                  {tx.status !== 'Pending Agreement' && tx.status !== 'Cancelled' && (
                    <button 
                      onClick={() => setSelectedTx(tx)}
                      className="button-primary-pill"
                      style={{ 
                        padding: '0.6rem 1.25rem', 
                        fontSize: '0.85rem', 
                        width: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        transform: 'translateY(0)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <FileText size={15} />
                      <span>View Receipt</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Receipt Modal */}
      {selectedTx && (
        <TransactionReceipt 
          transaction={selectedTx} 
          onClose={() => setSelectedTx(null)} 
        />
      )}

    </div>
  );
}
