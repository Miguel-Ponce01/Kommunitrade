import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  MessageCircle, 
  User, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  LogOut,
  ShieldCheck,
  HelpCircle,
  Languages,
  History
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage.jsx';

export default function Layout() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [theme, setTheme] = useTheme();
  const { lang, setLang, t } = useLanguage();
  const { currentUser, logout } = useAuth();
  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || currentUser?.phoneNumber || 'User';

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'tl' : 'en');
  };

  const handleLogout = async () => {
    if (window.confirm(t('set_signout_confirm') || 'Are you sure you want to log out?')) {
      await logout();
      navigate('/');
    }
  };

  const handleHelp = () => {
    alert(t('help_coming_soon') || 'Help Center: Community guidelines and safety tips coming soon!');
  };

  return (
    <div className={`app-container ${isCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      
      {/* ── Modern Collapsible Sidebar ────────────────────────────────────────── */}
      <nav className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        
        {/* Toggle Button */}
        <button className="sidebar-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Logo Section */}
        <div className="sidebar-logo">
          <div className="logo-icon-wrap" style={{ background: 'transparent', width: 'auto', height: 'auto', display: 'flex', alignItems: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 10H18L17 19C17 20.1046 16.1046 21 15 21H9C7.89543 21 7 20.1046 7 19L6 10Z" fill="var(--primary)" fillOpacity="0.1" stroke="var(--primary)" strokeWidth="2.5"/>
              <path d="M9 10V6C9 4.34315 10.3431 3 12 3L12 3C13.6569 3 15 4.34315 15 6V10" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M12 2L9 5H15L12 2Z" fill="var(--primary)"/>
            </svg>
          </div>
          {!isCollapsed && <span className="logo-text" style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)', marginLeft: '0.5rem' }}>KomuniTrade</span>}
        </div>

        {/* Search Bar (Expanded Only) */}
        <div className="sidebar-search">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon-fixed" />
            <input type="text" placeholder={t('nav_search_ph')} />
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="sidebar-links">
          
          {/* Group 1: MAIN */}
          <div className="sidebar-group">
            <div className="sidebar-group-label">{t('side_main')}</div>
            <NavLink to="/app" end className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <Home className="nav-icon" />
              <span className="nav-label">{t('side_dash')}</span>
            </NavLink>
          </div>

          {/* Group 2: COMMUNICATION */}
          <div className="sidebar-group">
            <div className="sidebar-group-label">{t('side_comm')}</div>
            <NavLink to="/app/messages" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <MessageCircle className="nav-icon" />
              <span className="nav-label">{t('side_messages')}</span>
            </NavLink>
            <NavLink to="/app/profile" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <User className="nav-icon" />
              <span className="nav-label">{t('side_profile')}</span>
            </NavLink>
            <NavLink to="/app/transactions" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <History className="nav-icon" />
              <span className="nav-label">Transaction History</span>
            </NavLink>
          </div>

          {/* Group 3: SETTINGS */}
          <div className="sidebar-group">
            <div className="sidebar-group-label">{t('side_settings')}</div>
            <NavLink to="/app/settings" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <Settings className="nav-icon" />
              <span className="nav-label">{t('side_app_settings')}</span>
            </NavLink>
            <NavLink to="/app/profile?tab=security" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <ShieldCheck className="nav-icon" />
              <span className="nav-label">{t('side_privacy')}</span>
            </NavLink>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="sidebar-footer">
          <button className="nav-item" onClick={handleHelp} style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}>
            <HelpCircle className="nav-icon" />
            <span className="nav-label">{t('side_help')}</span>
          </button>
          <button className="nav-item" onClick={handleLogout} style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', color: '#ef4444' }}>
            <LogOut className="nav-icon" />
            <span className="nav-label">{t('side_logout')} ({displayName})</span>
          </button>
        </div>
      </nav>

      {/* Main Content Stage */}
      <main className="main-content">
        <header className="mobile-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 10H18L17 19C17 20.1046 16.1046 21 15 21H9C7.89543 21 7 20.1046 7 19L6 10Z" fill="var(--primary)" fillOpacity="0.1" stroke="var(--primary)" strokeWidth="2"/>
            <path d="M9 10V6C9 4.34315 10.3431 3 12 3L12 3C13.6569 3 15 4.34315 15 6V10" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 2L9 5H15L12 2Z" fill="var(--primary)"/>
          </svg>
          <span className="logo-text" style={{ fontSize: '1.4rem', fontWeight: 900 }}>KomuniTrade</span>
        </header>
        <div className="content-scroll">
          <div className="apple-grid">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <NavLink to="/app" end className={({isActive}) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Home />
        </NavLink>
        <NavLink to="/app/messages" className={({isActive}) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <MessageCircle />
        </NavLink>
        <NavLink to="/app/profile" className={({isActive}) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <User />
        </NavLink>
        <NavLink to="/app/settings" className={({isActive}) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Settings />
        </NavLink>
      </nav>
    </div>
  );
}
