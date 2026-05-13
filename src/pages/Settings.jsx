import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight,
  Moon, 
  Sun, 
  Globe, 
  Shield, 
  AlertTriangle, 
  Clock, 
  Database, 
  Trash2, 
  Smartphone, 
  Check, 
  RefreshCw,
  FileText,
  Lock,
  LogOut,
  User,
  Heart,
  MapPin,
  X,
  Loader2,
  Bell,
  Zap
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../contexts/AuthContext';
import { db, auth, doc, setDoc, collection, getDocs, deleteDoc, getDoc, updateDoc } from '../firebase';
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
  const { currentUser, logout } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [purgeCount, setPurgeCount] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(localStorage.getItem('komuni_user_phone') || "");
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [tradingMode, setTradingMode] = useState("Open to Both");
  const [savedSpots, setSavedSpots] = useState([]);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyPriceDrops, setNotifyPriceDrops] = useState(true);
  const [notifyReminders, setNotifyReminders] = useState(true);
  const [notifySMS, setNotifySMS] = useState(false);
  const [exactLocation, setExactLocation] = useState(false);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [isDeletingSample, setIsDeletingSample] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.phoneNumber) setPhoneNumber(data.phoneNumber);
          if (data.tradingMode) setTradingMode(data.tradingMode);
          if (data.savedSpots) setSavedSpots(data.savedSpots);
          if (data.notificationPrefs) {
            setNotifyMessages(data.notificationPrefs.messages ?? true);
            setNotifyPriceDrops(data.notificationPrefs.priceDrops ?? true);
            setNotifyReminders(data.notificationPrefs.reminders ?? true);
            setNotifySMS(data.notificationPrefs.sms ?? false);
          }
          if (data.exactLocation !== undefined) setExactLocation(data.exactLocation);
        }
      }
    };
    fetchUserData();
  }, [currentUser]);

  const handleSavePhone = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setIsSavingPhone(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        phoneNumber: phoneNumber
      });
      alert("Phone number updated in Firebase!");
    } catch (error) {
      console.error("Error updating phone number:", error);
      alert("Failed to update phone number.");
    } finally {
      setIsSavingPhone(false);
    }
  };

  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const handleSavePreferences = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setIsSavingPrefs(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        tradingMode: tradingMode,
        savedSpots: savedSpots
      });
      alert("Trading preferences updated in Firebase!");
    } catch (error) {
      console.error("Error updating preferences:", error);
      alert("Failed to update preferences.");
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const handleSaveNotifications = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setIsSavingNotifications(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        notificationPrefs: {
          messages: notifyMessages,
          priceDrops: notifyPriceDrops,
          reminders: notifyReminders,
          sms: notifySMS
        }
      });
      alert("Notification preferences updated in Firebase!");
    } catch (error) {
      console.error("Error updating notifications:", error);
      alert("Failed to update notifications.");
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleSavePrivacy = async () => {
    if (!currentUser) return;
    setIsSavingPrivacy(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        exactLocation: exactLocation
      });
      alert("Privacy preferences updated in Firebase!");
    } catch (error) {
      console.error("Error updating privacy:", error);
      alert("Failed to update privacy settings.");
    } finally {
      setIsSavingPrivacy(false);
    }
  };

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

  const deleteSampleListings = async () => {
    setIsDeletingSample(true);
    try {
      let deleted = 0;
      for (let i = 1; i <= 12; i++) {
        const docRef = doc(db, 'listings', i.toString());
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          await deleteDoc(docRef);
          deleted++;
        }
      }
      alert(`Deleted ${deleted} sample listings!`);
    } catch (error) {
      console.error("Delete Error:", error);
      alert("Failed to delete sample listings.");
    } finally {
      setIsDeletingSample(false);
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

      {/* Account Settings Group */}
      <div className="settings-section">
        <h2 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', paddingLeft: '0.5rem' }}>
          Account & Security
        </h2>
        <div className="settings-card-group">
          
          <div className="settings-item-row">
            <div className="settings-item-left">
              <div className="settings-icon-box" style={{ background: '#E0E7FF', color: '#4F46E5' }}>
                <User size={20} />
              </div>
              <div className="settings-label-wrap">
                <span className="settings-label-main">Email Address</span>
                <span className="settings-label-sub">{auth.currentUser?.email || "Not set"}</span>
              </div>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Verified</span>
          </div>

          <div className="settings-item-row settings-phone-row">
            <div className="settings-item-left">
              <div className="settings-icon-box" style={{ background: '#FEF3C7', color: '#D97706' }}>
                <Smartphone size={20} />
              </div>
              <div className="settings-label-wrap">
                <span className="settings-label-main">Phone Number</span>
                <span className="settings-label-sub">Used for meetup coordination</span>
              </div>
            </div>
            <div className="settings-phone-controls">
              <input 
                id="settings-phone-input"
                name="phone"
                type="tel" 
                className="premium-input-small" 
                placeholder="+63 9xx xxx xxxx"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <button 
                onClick={handleSavePhone}
                disabled={isSavingPhone}
                className="btn-primary settings-phone-save-btn"
              >
                {isSavingPhone ? <Loader2 className="animate-spin" size={12} /> : "Save"}
              </button>
            </div>
          </div>

          <div className="settings-item-row" onClick={() => alert("Verification system coming soon!")} style={{ cursor: 'pointer' }}>
            <div className="settings-item-left">
              <div className="settings-icon-box" style={{ background: '#D1FAE5', color: '#059669' }}>
                <Shield size={20} />
              </div>
              <div className="settings-label-wrap">
                <span className="settings-label-main">Apply for Verification</span>
                <span className="settings-label-sub">Get badge for manuscript trust claims</span>
              </div>
            </div>
            <ChevronLeft size={20} style={{ transform: 'rotate(180deg)', color: 'var(--text-muted)' }} />
          </div>

        </div>
      </div>

      {/* Trading & Meetups Group */}
      <div className="settings-section">
        <h2 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', paddingLeft: '0.5rem' }}>
          Trading & Meetups
        </h2>
        <div className="settings-card-group">
          
          <div className="settings-item-row">
            <div className="settings-item-left">
              <div className="settings-icon-box" style={{ background: '#FFE4E6', color: '#E11D48' }}>
                <Heart size={20} />
              </div>
              <div className="settings-label-wrap">
                <span className="settings-label-main">Default Trading Mode</span>
                <span className="settings-label-sub">Prefer Cash, Barter, or Both</span>
              </div>
            </div>
            <select 
              value={tradingMode}
              onChange={(e) => setTradingMode(e.target.value)}
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.25rem 0.5rem', color: 'var(--text-main)', fontSize: '0.85rem' }}
            >
              <option value="Prefer Cash" style={{ background: 'var(--card-bg)', color: 'var(--text-main)' }}>Prefer Cash</option>
              <option value="Prefer Barter" style={{ background: 'var(--card-bg)', color: 'var(--text-main)' }}>Prefer Barter</option>
              <option value="Open to Both" style={{ background: 'var(--card-bg)', color: 'var(--text-main)' }}>Open to Both</option>
            </select>
          </div>

          <div className="settings-item-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%' }}>
              <div className="settings-icon-box" style={{ background: '#E0F2FE', color: '#0369A1' }}>
                <MapPin size={20} />
              </div>
              <div className="settings-label-wrap">
                <span className="settings-label-main">Saved Meetup Spots</span>
                <span className="settings-label-sub">Quick-add your favorite locations</span>
              </div>
            </div>
            
            {/* Tag List */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', width: '100%' }}>
              {savedSpots.map((spot, index) => (
                <div key={index} style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '0.25rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{spot}</span>
                  <button 
                    onClick={() => setSavedSpots(savedSpots.filter((_, i) => i !== index))}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Hotspots Quick Add */}
            <div style={{ width: '100%' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Davao Hotspots (Click to add):</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {["SM City Ecoland", "Abreeza Mall", "SM Lanang", "GMall Davao", "Roxas Night Market", "People's Park"].map((spot) => (
                  <button
                    key={spot}
                    onClick={() => {
                      if (!savedSpots.includes(spot)) {
                        setSavedSpots([...savedSpots, spot]);
                      }
                    }}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-main)', cursor: 'pointer' }}
                  >
                    + {spot}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Input */}
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
              <input 
                type="text" 
                className="premium-input-small" 
                placeholder="Add custom spot..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value) {
                    if (!savedSpots.includes(e.target.value)) {
                      setSavedSpots([...savedSpots, e.target.value]);
                    }
                    e.target.value = '';
                  }
                }}
                style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.25rem 0.5rem', color: 'var(--text-main)' }}
              />
            </div>
          </div>

          {/* Save Button for this section */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem' }}>
            <button 
              onClick={handleSavePreferences}
              disabled={isSavingPrefs}
              className="btn-primary"
              style={{ width: 'auto', padding: '0.5rem 1.5rem' }}
            >
              {isSavingPrefs ? <Loader2 className="animate-spin" size={16} /> : "Save Preferences"}
            </button>
          </div>

        </div>
      </div>

      {/* Notifications Group */}
      <div className="settings-section">
        <h2 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', paddingLeft: '0.5rem' }}>
          Notifications
        </h2>
        <div className="settings-card-group">
          
          <div className="settings-item-row">
            <div className="settings-item-left">
              <div className="settings-icon-box" style={{ background: '#E0F2FE', color: '#0369A1' }}>
                <Bell size={20} />
              </div>
              <div className="settings-label-wrap">
                <span className="settings-label-main">New Messages</span>
                <span className="settings-label-sub">Alerts for new chat messages</span>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={notifyMessages}
              onChange={(e) => setNotifyMessages(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
            />
          </div>

          <div className="settings-item-row">
            <div className="settings-item-left">
              <div className="settings-icon-box" style={{ background: '#FEF3C7', color: '#D97706' }}>
                <Bell size={20} />
              </div>
              <div className="settings-label-wrap">
                <span className="settings-label-main">Price Drops</span>
                <span className="settings-label-sub">Alerts for liked items</span>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={notifyPriceDrops}
              onChange={(e) => setNotifyPriceDrops(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
            />
          </div>

          <div className="settings-item-row">
            <div className="settings-item-left">
              <div className="settings-icon-box" style={{ background: '#D1FAE5', color: '#059669' }}>
                <Bell size={20} />
              </div>
              <div className="settings-label-wrap">
                <span className="settings-label-main">Meetup Reminders</span>
                <span className="settings-label-sub">Alerts for scheduled meetups</span>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={notifyReminders}
              onChange={(e) => setNotifyReminders(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
            />
          </div>

          <div className="settings-item-row">
            <div className="settings-item-left">
              <div className="settings-icon-box" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                <Smartphone size={20} />
              </div>
              <div className="settings-label-wrap">
                <span className="settings-label-main">SMS Alerts</span>
                <span className="settings-label-sub">Urgent notifications via SMS</span>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={notifySMS}
              onChange={(e) => setNotifySMS(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
            />
          </div>

          {/* Save Button for this section */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem' }}>
            <button 
              onClick={handleSaveNotifications}
              disabled={isSavingNotifications}
              className="btn-primary"
              style={{ width: 'auto', padding: '0.5rem 1.5rem' }}
            >
              {isSavingNotifications ? <Loader2 className="animate-spin" size={16} /> : "Save Notifications"}
            </button>
          </div>

        </div>
      </div>

      {/* Privacy & Security Group */}
      <div className="settings-section">
        <h2 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', paddingLeft: '0.5rem' }}>
          Privacy & Security
        </h2>
        <div className="settings-card-group">
          <div className="settings-item-row" onClick={() => setExactLocation(!exactLocation)}>
            <div className="settings-item-left">
              <div className="settings-icon-box" style={{ background: '#ECFDF5', color: '#10B981' }}>
                <MapPin size={20} />
              </div>
              <div className="settings-label-wrap">
                <span className="settings-label-main">Share Exact Location</span>
                <span className="settings-label-sub">Show precise GPS instead of Barangay radius</span>
              </div>
            </div>
            <Switch active={exactLocation} onClick={() => setExactLocation(!exactLocation)} />
          </div>

          <div className="settings-item-row" onClick={() => navigate('/app/verification')} style={{ cursor: 'pointer' }}>
            <div className="settings-item-left">
              <div className="settings-icon-box" style={{ background: '#E0F2FE', color: '#0369A1' }}>
                <Shield size={20} />
              </div>
              <div className="settings-label-wrap">
                <span className="settings-label-main">ID Verification</span>
                <span className="settings-label-sub">Verify your ID with AI facial recognition</span>
              </div>
            </div>
            <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
          </div>

          {/* Save Button for this section */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem' }}>
            <button 
              onClick={handleSavePrivacy}
              disabled={isSavingPrivacy}
              className="btn-primary"
              style={{ width: 'auto', padding: '0.5rem 1.5rem' }}
            >
              {isSavingPrivacy ? <Loader2 className="animate-spin" size={16} /> : "Save Privacy"}
            </button>
          </div>
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

      {/* Support & About Group */}
      <div className="settings-section">
        <h2 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', paddingLeft: '0.5rem' }}>
          Support & About
        </h2>
        <div className="settings-card-group">
          
          <div className="settings-item-row">
            <div className="settings-item-left">
              <div className="settings-icon-box" style={{ background: '#F0F9FF', color: '#0EA5E9' }}>
                <AlertTriangle size={20} />
              </div>
              <div className="settings-label-wrap">
                <span className="settings-label-main">Help & FAQ</span>
                <span className="settings-label-sub">Common questions and support</span>
              </div>
            </div>
            <ChevronLeft size={20} style={{ transform: 'rotate(180deg)', color: 'var(--text-muted)' }} />
          </div>

          <div className="settings-item-row">
            <div className="settings-item-left">
              <div className="settings-icon-box" style={{ background: '#F3F4F6', color: '#4B5563' }}>
                <Check size={20} />
              </div>
              <div className="settings-label-wrap">
                <span className="settings-label-main">App Version</span>
                <span className="settings-label-sub">v1.0.0 (Anti-Gravity Core)</span>
              </div>
            </div>
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Rule 1 */}
              <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', display: 'flex', gap: '1rem' }}>
                <div style={{ background: '#FFE4E6', color: '#E11D48', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>1. Safe Meetup Guidelines (Davao City)</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>For your safety, all meetups must be conducted in public, well-lit areas with high foot traffic and CCTV coverage. Recommended locations include: SM City Davao (Ecoland), SM Lanang Premier, Abreeza Mall, Gaisano Mall of Davao, or inside branded coffee shops.</p>
                </div>
              </div>

              {/* Rule 2 */}
              <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', display: 'flex', gap: '1rem' }}>
                <div style={{ background: '#D1FAE5', color: '#059669', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Shield size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>2. Item Verification</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>Buyers are required to thoroughly inspect the item at the meetup location BEFORE finalizing the payment or completing the barter. KomuniTrade acts as a platform for connection but does not provide warranties for physical goods exchanged.</p>
                </div>
              </div>

              {/* Rule 3 */}
              <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', display: 'flex', gap: '1rem' }}>
                <div style={{ background: '#FEE2E2', color: '#DC2626', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>3. Prohibited Items</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>The exchange of illegal drugs, unregistered firearms, stolen goods, counterfeit items, and items restricted by the Local Government Unit of Davao City and Philippine Law is strictly prohibited. Violators will be banned and reported.</p>
                </div>
              </div>

              {/* Rule 4 */}
              <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', display: 'flex', gap: '1rem' }}>
                <div style={{ background: '#FEF3C7', color: '#D97706', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>4. Payment Protocol</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>For cash transactions, verify the authenticity of the bills. For digital payments (GCash, Maya, Bank Transfer), ensure the amount reflects in your account BEFORE handing over the item. Do not rely solely on screenshot proofs.</p>
                </div>
              </div>

              {/* Rule 5 */}
              <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', display: 'flex', gap: '1rem' }}>
                <div style={{ background: '#FFE4E6', color: '#E11D48', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Heart size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>5. Respect and Anti-Haggle Policy</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>Respect the agreed-upon price. "Joy reserving" and extreme lowballing at the meetup location are highly discouraged. Users reported multiple times for such behavior will have their accounts suspended.</p>
                </div>
              </div>

              {/* Rule 6 */}
              <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', display: 'flex', gap: '1rem' }}>
                <div style={{ background: '#E0F2FE', color: '#0369A1', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>6. Transaction Agreement Receipts</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>Utilize the built-in Transaction Agreement feature to lock in logistics and price. This digital receipt serves as your proof of agreement and helps in dispute resolution.</p>
                </div>
              </div>

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
