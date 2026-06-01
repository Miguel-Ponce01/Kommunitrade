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
  Smartphone, 
  Check, 
  FileText,
  LogOut,
  User,
  Heart,
  MapPin,
  X,
  Loader2,
  Bell
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../contexts/AuthContext';
import { db, auth, doc, getDoc, updateDoc } from '../firebase';
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

      <button className="logout-btn-premium" onClick={() => setShowLogoutModal(true)}>
        <LogOut size={22} />
        {t('sett_sign_out')}
      </button>

      {/* Rules Modal */}
      {showRules && (
        <div className="rules-modal-overlay" onClick={() => setShowRules(false)}>
          <div className="rules-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="rules-modal-header">
              <h2 className="rules-modal-title">Rules & Regulations</h2>
              <button className="rules-modal-close" onClick={() => setShowRules(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="rules-document-body">
              <p className="rules-intro-text">
                Welcome to KomuniTrade. To maintain a safe, trusted, and respectful hyperlocal marketplace for the Davao City community, all members are required to abide by the following guidelines:
              </p>

              {/* Rule 1 */}
              <div className="rule-section">
                <div className="rule-icon-container" style={{ background: '#FFE4E6', color: '#E11D48' }}>
                  <MapPin size={18} />
                </div>
                <div className="rule-text-content">
                  <h3 className="rule-title">1. Safe Meetup Guidelines (Davao City)</h3>
                  <p className="rule-desc">For your safety, all meetups must be conducted in public, well-lit areas with high foot traffic and CCTV coverage. Recommended locations include: SM City Davao (Ecoland), SM Lanang Premier, Abreeza Mall, Gaisano Mall of Davao, or inside branded coffee shops.</p>
                </div>
              </div>

              {/* Rule 2 */}
              <div className="rule-section">
                <div className="rule-icon-container" style={{ background: '#D1FAE5', color: '#059669' }}>
                  <Shield size={18} />
                </div>
                <div className="rule-text-content">
                  <h3 className="rule-title">2. Item Verification</h3>
                  <p className="rule-desc">Buyers are required to thoroughly inspect the item at the meetup location BEFORE finalizing the payment or completing the barter. KomuniTrade acts as a platform for connection but does not provide warranties for physical goods exchanged.</p>
                </div>
              </div>

              {/* Rule 3 */}
              <div className="rule-section">
                <div className="rule-icon-container" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                  <AlertTriangle size={18} />
                </div>
                <div className="rule-text-content">
                  <h3 className="rule-title">3. Prohibited Items</h3>
                  <p className="rule-desc">The exchange of illegal drugs, unregistered firearms, stolen goods, counterfeit items, and items restricted by the Local Government Unit of Davao City and Philippine Law is strictly prohibited. Violators will be banned and reported.</p>
                </div>
              </div>

              {/* Rule 4 */}
              <div className="rule-section">
                <div className="rule-icon-container" style={{ background: '#FEF3C7', color: '#D97706' }}>
                  <Smartphone size={18} />
                </div>
                <div className="rule-text-content">
                  <h3 className="rule-title">4. Payment Protocol</h3>
                  <p className="rule-desc">For cash transactions, verify the authenticity of the bills. For digital payments (GCash, Maya, Bank Transfer), ensure the amount reflects in your account BEFORE handing over the item. Do not rely solely on screenshot proofs.</p>
                </div>
              </div>

              {/* Rule 5 */}
              <div className="rule-section">
                <div className="rule-icon-container" style={{ background: '#FFE4E6', color: '#E11D48' }}>
                  <Heart size={18} />
                </div>
                <div className="rule-text-content">
                  <h3 className="rule-title">5. Respect and Anti-Haggle Policy</h3>
                  <p className="rule-desc">Respect the agreed-upon price. "Joy reserving" and extreme lowballing at the meetup location are highly discouraged. Users reported multiple times for such behavior will have their accounts suspended.</p>
                </div>
              </div>

              {/* Rule 6 */}
              <div className="rule-section">
                <div className="rule-icon-container" style={{ background: '#E0F2FE', color: '#0369A1' }}>
                  <FileText size={18} />
                </div>
                <div className="rule-text-content">
                  <h3 className="rule-title">6. Transaction Agreement Receipts</h3>
                  <p className="rule-desc">Utilize the built-in Transaction Agreement feature to lock in logistics and price. This digital receipt serves as your proof of agreement and helps in dispute resolution.</p>
                </div>
              </div>
            </div>

            <div className="rules-modal-footer">
              <button className="rules-agree-btn" onClick={() => setShowRules(false)}>
                I Understand & Agree
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Premium Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="location-modal-overlay" onClick={() => setShowLogoutModal(false)} style={{ zIndex: 3000 }}>
          <div className="auth-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '2.5rem 2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div style={{ background: '#FEE2E2', color: '#EF4444', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LogOut size={32} />
              </div>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '0.5rem', fontFamily: "'Outfit', sans-serif" }}>
              {t('sett_sign_out')}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              {t('sett_signout_confirm') || 'Are you sure you want to log out?'}
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setShowLogoutModal(false)} 
                className="btn-secondary" 
                style={{ flex: 1, padding: '0.85rem 1.5rem', borderRadius: '14px', fontWeight: 700, fontSize: '0.95rem' }}
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  setShowLogoutModal(false);
                  await logout();
                  navigate('/');
                }} 
                className="btn-primary" 
                style={{ flex: 1, padding: '0.85rem 1.5rem', borderRadius: '14px', background: '#EF4444', color: '#fff', boxShadow: '0 10px 20px -5px rgba(239, 68, 68, 0.3)', border: 'none', fontWeight: 700, fontSize: '0.95rem' }}
              >
                {t('sett_sign_out')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
