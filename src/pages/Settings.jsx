import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Moon, Sun, Smartphone, Bell, Shield, LogOut, Database, Check, Loader2 } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { db, auth } from '../firebase';
import { doc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { MOCK_LISTINGS } from '../data/mockData';
import { isListingActive } from '../utils/geo';

export default function Settings() {
  const navigate = useNavigate();
  const [theme, setTheme] = useTheme();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [purgeCount, setPurgeCount] = useState(0);

  const seedDatabase = async () => {
    setIsSeeding(true);
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("Please wait for authentication to complete.");
      setIsSeeding(false);
      return;
    }

    try {
      for (const item of MOCK_LISTINGS) {
        await setDoc(doc(db, 'listings', item.id), {
          ...item,
          sellerId: currentUser.uid, // Associate with current demo user
          createdAt: new Date().toISOString(),
        });
      }
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
    } catch (error) {
      console.error("Seeding Error:", error);
      alert("Failed to seed. Check console or Firestore rules.");
    } finally {
      setIsSeeding(false);
    }
  };

  const purgeExpired = async () => {
    setIsPurging(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'listings'));
      let deleted = 0;
      for (const listingDoc of querySnapshot.docs) {
        const data = listingDoc.data();
        if (!isListingActive(data.expiresAt)) {
          await deleteDoc(doc(db, 'listings', listingDoc.id));
          deleted++;
        }
      }
      setPurgeCount(deleted);
      setTimeout(() => setPurgeCount(0), 4000);
    } catch (error) {
      console.error("Purge Error:", error);
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '1rem', paddingBottom: '80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <button onClick={() => navigate(-1)} className="back-btn" style={{ position: 'static' }}>
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Settings</h1>
      </div>

      <div className="settings-section" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1rem', paddingLeft: '0.5rem' }}>Appearance</h2>
        
        <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Sun size={20} color="var(--primary)" />
              <span style={{ fontWeight: 500 }}>Light Mode</span>
            </div>
            <input 
              type="radio" 
              name="theme" 
              checked={theme === 'light'} 
              onChange={() => setTheme('light')} 
              style={{ accentColor: 'var(--primary)', width: '20px', height: '20px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Moon size={20} color="var(--primary)" />
              <span style={{ fontWeight: 500 }}>Dark Mode</span>
            </div>
            <input 
              type="radio" 
              name="theme" 
              checked={theme === 'dark'} 
              onChange={() => setTheme('dark')}
              style={{ accentColor: 'var(--primary)', width: '20px', height: '20px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Smartphone size={20} color="var(--primary)" />
              <span style={{ fontWeight: 500 }}>System Default</span>
            </div>
            <input 
              type="radio" 
              name="theme" 
              checked={theme === 'system'} 
              onChange={() => setTheme('system')}
              style={{ accentColor: 'var(--primary)', width: '20px', height: '20px' }}
            />
          </div>

        </div>
      </div>

      <div className="settings-section" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1rem', paddingLeft: '0.5rem' }}>Preferences</h2>
        <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Bell size={20} color="var(--text-muted)" />
              <span style={{ fontWeight: 500 }}>Push Notifications</span>
            </div>
            <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>Enabled</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Shield size={20} color="var(--text-muted)" />
              <span style={{ fontWeight: 500 }}>Privacy & Safety</span>
            </div>
          </div>
        </div>
      </div>
      <div className="settings-section" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1rem', paddingLeft: '0.5rem' }}>Developer Tools</h2>
        <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Database size={20} color="var(--text-muted)" />
              <div>
                <span style={{ fontWeight: 500, display: 'block' }}>Seed Database</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Populate Firestore with mock data</span>
              </div>
            </div>
            <button 
              onClick={seedDatabase}
              disabled={isSeeding || seedSuccess}
              style={{ 
                background: seedSuccess ? 'var(--primary)' : 'transparent',
                color: seedSuccess ? 'white' : 'var(--primary)',
                border: '1px solid var(--primary)',
                borderRadius: '8px',
                padding: '0.4rem 0.8rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {isSeeding ? <Loader2 className="animate-spin" size={14} /> : (seedSuccess ? <Check size={14} /> : 'Seed Now')}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Shield size={20} color="#ef4444" />
              <div>
                <span style={{ fontWeight: 500, display: 'block' }}>Purge Expired</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Simulate automated TTL cleanup</span>
              </div>
            </div>
            <button 
              onClick={purgeExpired}
              disabled={isPurging}
              style={{ 
                background: purgeCount > 0 ? '#ef4444' : 'transparent',
                color: purgeCount > 0 ? 'white' : '#ef4444',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                padding: '0.4rem 0.8rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {isPurging ? <Loader2 className="animate-spin" size={14} /> : (purgeCount > 0 ? `Deleted ${purgeCount}` : 'Purge Now')}
            </button>
          </div>
        </div>
      </div>

      <button className="btn" onClick={() => navigate('/')} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        <LogOut size={20} />
        Sign Out
      </button>

    </div>
  );
}
