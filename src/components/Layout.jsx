import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  MessageCircle, 
  User, 
  MapPin, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  LogOut,
  Package,
  ShieldCheck,
  HelpCircle,
  Sun,
  Moon,
  Languages
} from 'lucide-react';
import { auth } from '../firebase';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage.jsx';

export default function Layout() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [theme, setTheme] = useTheme();
  const [lang, setLang, t] = useLanguage();
  const currentUser = auth.currentUser;
  const anonymousID = currentUser ? currentUser.uid.substring(0, 6).toUpperCase() : 'GUEST';

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'tl' : 'en');
  };

  const handleLogout = async () => {
    if (window.confirm(t('set_signout_confirm') || 'Are you sure you want to log out?')) {
      await auth.signOut();
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
          <div className="logo-icon-wrap">
            <MapPin size={20} strokeWidth={3} />
          </div>
          {!isCollapsed && <span className="logo-text" style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)' }}>KomuniTrade</span>}
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
            <span className="nav-label">{t('side_logout')} ({anonymousID})</span>
          </button>
        </div>
      </nav>

      {/* Main Content Stage */}
      <main className="main-content">
        <header className="mobile-header">
          <MapPin size={24} color="var(--primary)" />
          <span className="logo-text">KomuniTrade</span>
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
      </nav>
    </div>
  );
}
