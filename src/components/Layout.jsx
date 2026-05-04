import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
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
            <NavLink to="/app/post" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <Package className="nav-icon" />
              <span className="nav-label">{t('side_inventory')}</span>
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
            <NavLink to="/app/security" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <ShieldCheck className="nav-icon" />
              <span className="nav-label">{t('side_privacy')}</span>
            </NavLink>
          </div>

        </div>

        {/* Language Toggle Area */}
        <div className="sidebar-lang-wrap" style={{ padding: '0.5rem 1rem', display: 'flex', justifyContent: 'center' }}>
           <button 
             onClick={toggleLanguage}
             className="nav-item"
             style={{ width: '100%', background: 'none', border: '1px solid var(--border-color)', borderRadius: '12px', justifyContent: isCollapsed ? 'center' : 'flex-start', gap: '1rem', padding: '0.75rem 1rem' }}
           >
             <Languages size={20} className="nav-icon" />
             {!isCollapsed && <span className="nav-label" style={{ fontSize: '0.8rem' }}>{lang === 'en' ? 'ENGLISH' : 'TAGALOG'}</span>}
           </button>
        </div>

        {/* Theme Toggle Area */}
        <div className="sidebar-theme-wrap" style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center' }}>
          {isCollapsed ? (
            <button 
              className="nav-item" 
              onClick={toggleTheme} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.75rem' }}
              title={theme === 'dark' ? 'Daymode' : 'Nightmode'}
            >
              {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          ) : (
            <div 
              className={`theme-toggle-pill ${theme === 'dark' ? 'dark' : ''}`} 
              onClick={toggleTheme}
            >
              <div className="toggle-handle">
                {theme === 'dark' ? <Moon size={18} fill="currentColor" /> : <Sun size={18} />}
              </div>
              <span className="toggle-label">
                {theme === 'dark' ? 'NIGHTMODE' : 'DAYMODE'}
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sidebar-footer">
          <div className="nav-item" style={{ cursor: 'pointer' }}>
            <HelpCircle className="nav-icon" />
            <span className="nav-label">{t('side_help')}</span>
          </div>
          <div className="nav-item" style={{ cursor: 'pointer', color: '#ef4444' }}>
            <LogOut className="nav-icon" />
            <span className="nav-label">{t('side_logout')} ({anonymousID})</span>
          </div>
        </div>
      </nav>

      {/* Main Content Stage */}
      <main className="main-content">
        <header className="mobile-header">
          <MapPin size={24} color="var(--primary)" />
          <span className="logo-text">KomuniTrade</span>
        </header>
        <div className="content-scroll">
          <Outlet />
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
