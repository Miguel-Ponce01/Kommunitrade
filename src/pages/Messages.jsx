import React, { useState, useEffect } from 'react';
import { MessageCircle, Search, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { useAuth } from '../contexts/AuthContext';
import { db, collection, query, where, onSnapshot, doc, getDoc } from '../firebase';
import { decryptMessage } from '../utils/crypto';
import ChatModal from '../components/ChatModal';

const peerKeyCache = {};

async function fetchUserPublicKey(uid) {
  if (peerKeyCache[uid] !== undefined) {
    return peerKeyCache[uid];
  }
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const pKey = snap.data().publicKeyJwk || null;
      peerKeyCache[uid] = pKey;
      return pKey;
    }
  } catch (e) {
    console.error(`Failed to fetch public key for ${uid}:`, e);
  }
  peerKeyCache[uid] = null;
  return null;
}

const getPeerAlias = (chat, currentUserId) => {
  if (!chat) return "Unknown User";
  if (chat.sellerId === currentUserId) {
    const bId = chat.buyerId || "";
    return `Buyer_${bId.substring(0, 4).toUpperCase()}`;
  } else {
    return "Seller (Anonymous)";
  }
};

export default function Messages() {
  const { lang, setLang, t } = useLanguage();
  const { currentUser } = useAuth();
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // Query chats where current user is a participant
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatListPromises = snapshot.docs.map(async (docObj) => {
        const data = docObj.data();
        let lastMsg = 'No messages';
        
        try {
          if (data.lastMessage) {
            const peerId = data.participants.find(p => p !== currentUser.uid);
            let peerKey = null;
            if (peerId) {
              peerKey = await fetchUserPublicKey(peerId);
            }
            lastMsg = await decryptMessage(data.lastMessage, peerKey, docObj.id);
          }
        } catch (e) {
          console.error("Failed to decrypt message:", e);
          lastMsg = "[Encrypted Message]";
        }

        return {
          id: docObj.id,
          ...data,
          decryptedLastMessage: lastMsg,
          // Format date
          formattedDate: data.lastTimestamp?.toDate ? data.lastTimestamp.toDate().toLocaleString() : ''
        };
      });

      const chatList = await Promise.all(chatListPromises);

      // Sort by timestamp descending
      chatList.sort((a, b) => {
        const t1 = a.lastTimestamp?.toDate ? a.lastTimestamp.toDate().getTime() : 0;
        const t2 = b.lastTimestamp?.toDate ? b.lastTimestamp.toDate().getTime() : 0;
        return t2 - t1;
      });

      setChats(chatList);
      setIsLoading(false);
    }, (err) => {
      console.error("Inbox query failed:", err);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const filteredChats = chats.filter(chat => 
    chat.itemTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.decryptedLastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenChat = (chat) => {
    // Create a minimal item object for the ChatModal
    const mockItem = {
      id: chat.itemId,
      title: chat.itemTitle,
      sellerId: chat.sellerId,
      buyerId: chat.buyerId,
      chatId: chat.id,
      expiresAt: chat.expiresAt || new Date(Date.now() + 86400000 * 30).toISOString() 
    };
    setSelectedChat(mockItem);
    setIsChatOpen(true);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '800px', margin: '0 auto', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", margin: 0 }}>Messages</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Your secure, anonymous conversations</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          className="premium-input" 
          placeholder="Search chats..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '3rem', borderRadius: '12px', background: 'var(--card-bg)' }}
        />
      </div>

      {/* Inbox List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
            <p>Loading conversations...</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '24px', border: '1px dashed var(--border-color)' }}>
            <MessageCircle size={48} style={{ opacity: 0.2, margin: '0 auto 1rem', color: 'var(--primary)' }} />
            <h3 style={{ margin: '0 0 0.5rem' }}>No messages yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Start a chat by contacting a seller on an item listing.</p>
          </div>
        ) : (
          filteredChats.map(chat => (
            <div 
              key={chat.id} 
              className="chat-row" 
              onClick={() => handleOpenChat(chat)}
              style={{ 
                borderRadius: 'var(--radius-lg)', 
                padding: '1.25rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: '1px solid var(--border-color)',
                background: 'var(--card-bg)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {/* Avatar */}
              <div style={{ width: '48px', height: '48px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', flexShrink: 0 }}>
                <MessageCircle size={24} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px', gap: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>
                    {getPeerAlias(chat, currentUser.uid)}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {chat.formattedDate}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Re: {chat.itemTitle || "Unknown Item"}
                </div>
                <p style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {chat.decryptedLastMessage}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    color: 'var(--text-main)', 
                    fontWeight: 600,
                    background: 'var(--bg-color)',
                    border: '1px solid var(--border-color)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {chat.sellerId === currentUser.uid ? "Selling" : "Buying"}
                  </span>
                </div>
              </div>

              <ChevronRight size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </div>
          ))
        )}
      </div>

      {/* Chat Modal Reuse */}
      {isChatOpen && selectedChat && (
        <ChatModal 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
          item={selectedChat} 
        />
      )}

    </div>
  );
}
