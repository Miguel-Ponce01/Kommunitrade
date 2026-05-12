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
  Lock,
  FileText,
  X
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../contexts/AuthContext';
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
  const { lang, setLang, t } = useLanguage();
  const { logout } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [purgeCount, setPurgeCount] = useState(0);
  const [showRules, setShowRules] = useState(false);

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

      {/* Regional Group */}
      <div className="settings-section">
        <h2 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', paddingLeft: '0.5rem' }}>
          Regional & Language
        </h2>
        <div className="settings-card-group">
          
          <div className="settings-item-row" onClick={() => setLang('en')}>
            <div className="settings-item-left">
              <div className="settings-icon-box" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                <Globe size={20} />
              </div>
              <div className="settings-label-wrap">
                <span className="settings-label-main">English</span>
                <span className="settings-label-sub">Default system language</span>
              </div>
            </div>
            {lang === 'en' && <Check size={20} color="var(--primary)" strokeWidth={3} />}
          </div>

          <div className="settings-item-row" onClick={() => setLang('tl')}>
            <div className="settings-item-left">
              <div className="settings-icon-box" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                <Globe size={20} />
              </div>
              <div className="settings-label-wrap">
                <span className="settings-label-main">Tagalog</span>
                <span className="settings-label-sub">Lokal na wika ng komunidad</span>
              </div>
            </div>
            {lang === 'tl' && <Check size={20} color="var(--primary)" strokeWidth={3} />}
          </div>

          <div className="settings-item-row" onClick={() => setLang('bis')}>
            <div className="settings-item-left">
              <div className="settings-icon-box" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                <Globe size={20} />
              </div>
              <div className="settings-label-wrap">
                <span className="settings-label-main">Bisaya</span>
                <span className="settings-label-sub">Lokal nga pinulongan</span>
              </div>
            </div>
            {lang === 'bis' && <Check size={20} color="var(--primary)" strokeWidth={3} />}
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

      {/* Policies Group */}
      <div className="settings-section">
        <h2 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', paddingLeft: '0.5rem' }}>
          Legal & Policies
        </h2>
        <div className="settings-card-group">
          
          <div className="settings-item-row" onClick={() => setShowRules(true)}>
            <div className="settings-item-left">
              <div className="settings-icon-box" style={{ background: '#FCE7F3', color: '#DB2777' }}>
                <FileText size={20} />
              </div>
              <div className="settings-label-wrap">
                <span className="settings-label-main">Rules and Regulations</span>
                <span className="settings-label-sub">Davao Consumer & Barter Guidelines</span>
              </div>
            </div>
            <ChevronLeft size={20} style={{ transform: 'rotate(180deg)', color: 'var(--text-muted)' }} />
          </div>

        </div>
      </div>

      <button className="logout-btn-premium" onClick={async () => { await logout(); navigate('/'); }}>
        <LogOut size={22} />
        {t('sett_sign_out')}
      </button>

      {/* Rules Modal */}
      {showRules && (
        <div className="location-modal-overlay" onClick={() => setShowRules(false)} style={{ zIndex: 3000 }}>
          <div className="location-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="location-modal-header" style={{ position: 'sticky', top: 0, background: 'var(--card-bg)', zIndex: 10, paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>Rules & Regulations</h2>
              <button className="location-modal-close" onClick={() => setShowRules(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ color: 'var(--text-main)', lineHeight: 1.6, fontSize: '0.9rem' }}>
              <h3 style={{ color: 'var(--primary)', marginTop: '1rem' }}>1. Safe Meetup Guidelines (Davao City)</h3>
              <p>For your safety, all meetups must be conducted in public, well-lit areas with high foot traffic and CCTV coverage. Recommended locations include: SM City Davao (Ecoland), SM Lanang Premier, Abreeza Mall, Gaisano Mall of Davao, or inside branded coffee shops (e.g., Starbucks, Bo's Coffee).</p>
              
              <h3 style={{ color: 'var(--primary)', marginTop: '1.5rem' }}>2. Item Verification</h3>
              <p>Buyers are required to thoroughly inspect the item at the meetup location BEFORE finalizing the payment or completing the barter. KomuniTrade acts as a platform for connection but does not provide warranties for physical goods exchanged.</p>
              
              <h3 style={{ color: 'var(--primary)', marginTop: '1.5rem' }}>3. Prohibited Items</h3>
              <p>The exchange of illegal drugs, unregistered firearms, stolen goods, counterfeit items, and items restricted by the Local Government Unit of Davao City and Philippine Law is strictly prohibited. Violators will be banned and reported to the PNP Cybercrime Unit.</p>

              <h3 style={{ color: 'var(--primary)', marginTop: '1.5rem' }}>4. Payment Protocol</h3>
              <p>For cash transactions, verify the authenticity of the bills. For digital payments (GCash, Maya, Bank Transfer), ensure the amount reflects in your account BEFORE handing over the item. Do not rely solely on screenshot proofs.</p>

              <h3 style={{ color: 'var(--primary)', marginTop: '1.5rem' }}>5. Respect and Anti-Haggle Policy</h3>
              <p>Respect the agreed-upon price. "Joy reserving" and extreme lowballing at the meetup location are highly discouraged. Users reported multiple times for such behavior will have their accounts suspended to maintain community integrity.</p>

              <h3 style={{ color: 'var(--primary)', marginTop: '1.5rem' }}>6. Transaction Agreement Receipts</h3>
              <p>Utilize the built-in Transaction Agreement feature to lock in logistics and price. This digital receipt serves as your proof of agreement and helps in dispute resolution.</p>
            </div>
            
            <button className="btn-primary" onClick={() => setShowRules(false)} style={{ marginTop: '2rem', width: '100%' }}>
              I Understand & Agree
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
