import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, FileText, CheckCircle2, Clock, MapPin, Loader2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, collection, query, where, onSnapshot } from '../firebase';
import TransactionReceipt from '../components/TransactionReceipt';

export default function TransactionHistory() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return { bg: '#dcfce7', text: '#166534', icon: <CheckCircle2 size={14} /> };
      case 'Confirmed': return { bg: '#dbeafe', text: '#1e40af', icon: <CheckCircle2 size={14} /> };
      case 'Pending Agreement': return { bg: '#fef3c7', text: '#92400e', icon: <Clock size={14} /> };
      case 'Cancelled': return { bg: '#fee2e2', text: '#991b1b', icon: <XCircle size={14} /> };
      default: return { bg: '#f3f4f6', text: '#374151', icon: <Clock size={14} /> };
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.reference_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tx.item_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '800px', margin: '0 auto', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <button onClick={() => navigate(-1)} className="glass" style={{ width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", margin: 0 }}>Agreements</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Your transaction history & receipts</p>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search reference no. or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '3rem', borderRadius: '12px', background: 'var(--card-bg)' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {['All', 'Pending Agreement', 'Confirmed', 'Completed', 'Cancelled'].map(status => (
            <button 
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{ 
                padding: '0.5rem 1rem', 
                borderRadius: '20px', 
                border: '1px solid',
                borderColor: statusFilter === status ? 'var(--primary)' : 'var(--border-color)',
                background: statusFilter === status ? 'var(--primary)' : 'transparent',
                color: statusFilter === status ? '#fff' : 'var(--text-main)',
                fontSize: '0.85rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
            <p>Loading transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
           <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
             <FileText size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
             <p>No transactions found.</p>
           </div>
        ) : (
          filteredTransactions.map(tx => {
            const statusStyle = getStatusColor(tx.status);
            return (
              <div 
                key={tx.id} 
                className="glass" 
                style={{ 
                  borderRadius: '16px', 
                  padding: '1.5rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '1rem',
                  border: '1px solid var(--border-color)',
                  background: 'var(--card-bg)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', letterSpacing: '1px', marginBottom: '4px' }}>
                      {tx.reference_number}
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{tx.item_name}</h3>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.4rem', 
                    padding: '0.4rem 0.8rem', 
                    borderRadius: '20px', 
                    background: statusStyle.bg, 
                    color: statusStyle.text,
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {statusStyle.icon} {tx.status}
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                   <div>
                     <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)' }}>₱{tx.agreed_price.toLocaleString()}</p>
                     <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Seller: <span style={{ fontWeight: 700 }}>{tx.seller_masked_name}</span></p>
                   </div>
                   
                   {tx.status !== 'Pending Agreement' && tx.status !== 'Cancelled' && (
                     <button 
                       onClick={() => setSelectedTx(tx)}
                       className="btn-primary"
                       style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', width: 'auto', borderRadius: '10px' }}
                     >
                       View Receipt
                     </button>
                   )}
                </div>
                
                {tx.status !== 'Pending Agreement' && tx.status !== 'Cancelled' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-color)', padding: '0.75rem', borderRadius: '8px' }}>
                    <MapPin size={14} /> Meetup: {tx.meetup_date} @ {tx.meetup_time}
                  </div>
                )}
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
