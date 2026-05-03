import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Moon, Sun, Smartphone, Bell, Shield, LogOut } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function Settings() {
  const navigate = useNavigate();
  const [theme, setTheme] = useTheme();

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

      <button className="btn" onClick={() => navigate('/')} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        <LogOut size={20} />
        Sign Out
      </button>

    </div>
  );
}
