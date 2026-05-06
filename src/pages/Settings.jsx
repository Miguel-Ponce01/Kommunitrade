import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Moon, 
  Sun, 
  Smartphone, 
  Bell, 
  Shield, 
  LogOut, 
  Database, 
  Check, 
  Loader2,
  User,
  Zap,
  Globe,
  Trash2,
  Lock
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { db, auth, doc, setDoc, collection, getDocs, deleteDoc } from '../firebase';
import { MOCK_LISTINGS } from '../data/mockData';
import { isListingActive } from '../utils/geo';
import { useLanguage } from '../hooks/useLanguage.jsx';

const Switch = ({ active, onClick }) => (
  <div className={`apple-switch ${active ? 'active' : ''}`} onClick={onClick}>
    <div className="switch-handle" />
  </div>
);

export default function Settings() {
  const navigate = useNavigate();
  const [theme, setTheme] = useTheme();
  const [lang, setLang, t] = useLanguage();
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
          sellerId: currentUser.uid, 
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
    <div className="settings-container-redesign animate-fade-in">
      
      {/* Header Area */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3rem', gap: '1.5rem' }}>
        <button onClick={() => navigate(-1)} className="glass" style={{ width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", lineHeight: 1.2 }}>{t('sett_title')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Manage your preferences and security</p>
        </div>
      </div>

      {/* Appearance Group */}
      <div className="settings-section">
        <h2 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', paddingLeft: '0.5rem' }}>
          {t('sett_appearance')}
        </h2>
        <div className="settings-card-group">
          
          <div className="settings-item-row" onClick={() => setTheme('light')}>
            <div className="settings-item-left">
              <div className="settings-icon-box" style={{ background: '#FEF3C7', color: '#D97706' }}>
                <Sun size={20} />
              </div>
              <div className="settings-label-wrap">
                <span className="settings-label-main">{t('sett_light')}</span>
                <span className="settings-label-sub">Optimized for daytime trading</span>
              </div>
            </div>
            <Switch active={theme === 'light'} onClick={() => setTheme('light')} />
          </div>

          <div className="settings-item-row" onClick={() => setTheme('dark')}>
            <div className="settings-item-left">
              <div className="settings-icon-box" style={{ background: '#E0E7FF', color: '#4F46E5' }}>
                <Moon size={20} />
              </div>
              <div className="settings-label-wrap">
                <span className="settings-label-main">{t('sett_dark')}</span>
                <span className="settings-label-sub">Better for low-light environments</span>
              </div>
            </div>
            <Switch active={theme === 'dark'} onClick={() => setTheme('dark')} />
          </div>

          <div className="settings-item-row" onClick={() => setTheme('system')}>
            <div className="settings-item-left">
              <div className="settings-icon-box" style={{ background: '#F1F5F9', color: '#64748B' }}>
                <Smartphone size={20} />
              </div>
              <div className="settings-label-wrap">
                <span className="settings-label-main">{t('sett_system')}</span>
                <span className="settings-label-sub">Sync with device settings</span>
              </div>
            </div>
            <Switch active={theme === 'system'} onClick={() => setTheme('system')} />
          </div>

        </div>
      </div>

      {/* Preferences Group */}
      <div className="settings-section">
        <h2 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', paddingLeft: '0.5rem' }}>
          {t('sett_prefs')}
        </h2>
        <div className="settings-card-group">
          
          <div className="settings-item-row">
            <div className="settings-item-left">
              <div className="settings-icon-box" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                <Bell size={20} />
              </div>
              <div className="settings-label-wrap">
                <span className="settings-label-main">{t('sett_notifs')}</span>
                <span className="settings-label-sub">Real-time alerts for trades</span>
              </div>
            </div>
            <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem' }}>ENABLED</span>
          </div>

          <div className="settings-item-row">
            <div className="settings-item-left">
              <div className="settings-icon-box" style={{ background: '#DBEAFE', color: '#2563EB' }}>
                <Lock size={20} />
              </div>
              <div className="settings-label-wrap">
                <span className="settings-label-main">{t('sett_privacy')}</span>
                <span className="settings-label-sub">Manage your security keys</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Developer Tools Group */}
      <div className="settings-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingLeft: '0.5rem' }}>
           <Zap size={14} color="var(--primary)" fill="var(--primary)" />
           <h2 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {t('sett_dev_tools')}
          </h2>
        </div>
        <div className="settings-card-group">
          
          <div className="settings-item-row">
            <div className="settings-item-left">
              <div className="settings-icon-box" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
                <Database size={20} />
              </div>
              <div className="settings-label-wrap">
                <span className="settings-label-main">{t('sett_seed_db')}</span>
                <span className="settings-label-sub">{t('sett_seed_desc')}</span>
              </div>
            </div>
            <button 
              onClick={seedDatabase}
              disabled={isSeeding || seedSuccess}
              className="btn-primary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', width: 'auto' }}
            >
              {isSeeding ? <Loader2 className="animate-spin" size={14} /> : (seedSuccess ? <Check size={14} /> : t('sett_seed_now'))}
            </button>
          </div>

          <div className="settings-item-row">
            <div className="settings-item-left">
              <div className="settings-icon-box" style={{ background: '#FEF2F2', color: '#EF4444' }}>
                <Trash2 size={20} />
              </div>
              <div className="settings-label-wrap">
                <span className="settings-label-main">{t('sett_purge_exp')}</span>
                <span className="settings-label-sub">{t('sett_purge_desc')}</span>
              </div>
            </div>
            <button 
              onClick={purgeExpired}
              disabled={isPurging}
              className="btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: '#EF4444', borderColor: '#EF4444', width: 'auto' }}
            >
              {isPurging ? <Loader2 className="animate-spin" size={14} /> : (purgeCount > 0 ? `Deleted ${purgeCount}` : t('sett_purge_now'))}
            </button>
          </div>

        </div>
      </div>

      <button className="logout-btn-premium" onClick={() => navigate('/')}>
        <LogOut size={22} />
        {t('sett_sign_out')}
      </button>

    </div>
  );
}
