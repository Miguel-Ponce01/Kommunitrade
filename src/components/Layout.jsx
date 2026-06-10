import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  MessageCircle, 
  User, 
  Settings, 
  LogOut,
  ShieldCheck,
  History,
  WifiOff,
  ShoppingBag,
  Menu,
  ChevronDown,
  Package,
  Sun,
  Moon,
  MapPin,
  PlusCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { useStore } from '../hooks/useStore';
import { CATEGORIES } from '../data/mockData';
import LocationModal from './LocationModal';

export default function Layout() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [theme, setTheme] = useTheme();
  const { lang, setLang, t } = useLanguage();
  const { currentUser, logout, userProfile } = useAuth();
  const { isOffline, setOffline } = useStore();
  const categoryMenuRef = useRef(null);

  // Location state — read from localStorage so it syncs with Home page
  const [navLocation, setNavLocation] = useState(
    localStorage.getItem('komuni_user_location') || 'Davao City'
  );
  const [navRadius, setNavRadius] = useState(
    parseInt(localStorage.getItem('komuni_user_radius') || '20', 10)
  );

  const [headerSearchVal, setHeaderSearchVal] = useState('');
  const [headerCategoryVal, setHeaderCategoryVal] = useState('All');

  // Synchronize header inputs with URL search parameters (reactive to route changes)
  useEffect(() => {
    const params = new URLSearchParams(routerLocation.search);
    setHeaderSearchVal(params.get('q') || '');
    setHeaderCategoryVal(params.get('category') || 'All');
  }, [routerLocation.search]);

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target)) {
        setShowCategoryMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOffline]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (headerSearchVal) params.set('q', headerSearchVal);
    if (headerCategoryVal && headerCategoryVal !== 'All') params.set('category', headerCategoryVal);
    const queryStr = params.toString();
    navigate(`/app${queryStr ? '?' + queryStr : ''}`);
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const toggleLanguage = () => setLang(lang === 'en' ? 'tl' : 'en');
  const handleLogout = () => setShowLogoutModal(true);

  // Apply location from modal — persist to localStorage then soft-refresh feed
  const handleLocationApply = (locName, rad) => {
    const name = locName || 'Davao City';
    const r = rad || 20;
    setNavLocation(name);
    setNavRadius(r);
    localStorage.setItem('komuni_user_location', name);
    localStorage.setItem('komuni_user_radius', String(r));
    // Soft-refresh: navigate(0) remounts Home so it re-reads localStorage
    navigate(0);
  };

  const handleAllCategories = () => {
    setShowCategoryMenu(false);
    navigate('/app');
  };

  const handleCategorySelect = (categoryId) => {
    setShowCategoryMenu(false);
    navigate(categoryId === 'All' ? '/app' : `/app?category=${categoryId}`);
  };

  return (
    <div className="app-container">

      {/* ── Embedded CSS for Premium Two-Tier Top Navbar ── */}
      <style>{`
          .app-container {
            flex-direction: column !important;
            height: 100vh !important;
          }
          /* Hide the old left sidebar completely */
          .app-sidebar {
            display: flex !important;
            width: 100% !important;
            height: auto !important;
            flex-direction: column !important;
            align-items: stretch !important;
            justify-content: flex-start !important;
            padding: 0 !important;
            border-right: none !important;
            border-bottom: 1px solid var(--border-color) !important;
            overflow: visible !important;
            background: var(--card-bg) !important;
            box-shadow: 0 2px 10px rgba(0,0,0,0.07) !important;
            position: sticky !important;
            top: 0 !important;
            z-index: 200 !important;
          }

          /* ── Tier 1: Main navbar row ── */
          .nav-tier-top {
            display: flex;
            align-items: center;
            height: 64px;
            padding: 0 1.5rem;
            border-bottom: 1px solid var(--border-color);
            gap: 1rem;
            width: 100%;
            overflow-x: auto;
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .nav-tier-top::-webkit-scrollbar {
            display: none;
          }

          /* Brand */
          .brand-logo-wrap {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            cursor: pointer;
            flex-shrink: 0;
            text-decoration: none;
          }
          .kt-brand-logo {
            width: 32px;
            height: 32px;
            filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.4));
            transition: transform 0.2s ease;
          }
          .brand-logo-wrap:hover .kt-brand-logo {
            transform: rotate(5deg) scale(1.08);
          }
          .brand-logo-text {
            font-family: 'NeueHaasGrotesk Display', Helvetica, Arial, sans-serif;
            font-size: 1.35rem !important;
            font-weight: 700 !important;
            color: #10B981 !important;
            letter-spacing: 0.5px;
            white-space: nowrap;
            transition: color 0.2s;
            display: block !important;
          }
          .brand-logo-wrap:hover .brand-logo-text {
            color: var(--text-main) !important;
          }

          /* Search bar */
          .premium-search-box {
            display: flex;
            align-items: center;
            flex: 1;
            max-width: 480px;
            height: 40px;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            overflow: hidden;
            background: var(--bg-color);
          }
          .premium-search-input {
            flex: 1;
            height: 100%;
            border: none !important;
            outline: none !important;
            padding: 0 0.75rem;
            font-size: 0.875rem;
            background: transparent !important;
            color: var(--text-main) !important;
            min-width: 0;
          }
          .premium-search-divider {
            width: 1px;
            height: 20px;
            background: var(--border-color);
            flex-shrink: 0;
          }
          .premium-search-select-wrap {
            position: relative;
            display: flex;
            align-items: center;
            padding-right: 1.6rem;
            padding-left: 0.5rem;
            height: 100%;
            flex-shrink: 0;
          }
          .premium-search-select {
            border: none !important;
            outline: none !important;
            background: transparent !important;
            font-size: 0.78rem;
            font-weight: 600;
            color: var(--text-muted) !important;
            cursor: pointer;
            appearance: none;
            -webkit-appearance: none;
            height: 100%;
            max-width: 105px;
          }
          .premium-select-chevron {
            position: absolute;
            right: 0.4rem;
            pointer-events: none;
            color: var(--text-muted);
          }
          .premium-search-btn {
            background: var(--border-color);
            color: var(--text-main);
            border: none;
            height: 100%;
            padding: 0 1.1rem;
            font-weight: 550;
            font-size: 0.875rem;
            cursor: pointer;
            transition: background 0.2s;
            flex-shrink: 0;
          }
          .premium-search-btn:hover { background: var(--text-muted); color: var(--bg-color); }
          .premium-search-btn:hover { background: var(--colors-shade-40); }

          /* Location button (Davao City pill) */
          .nav-location-btn {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            height: 36px;
            padding: 0 0.85rem;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-pill);
            background: var(--bg-color);
            color: var(--text-main);
            font-size: 0.82rem;
            font-weight: 550;
            cursor: pointer;
            white-space: nowrap;
            flex-shrink: 0;
            transition: border-color 0.2s, color 0.2s;
          }
          .nav-location-btn:hover {
            border-color: var(--text-main);
          }
          .nav-location-btn svg { color: var(--text-main); flex-shrink: 0; }
          .nav-location-radius {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--text-muted);
          }

          /* Right icon nav */
          .premium-nav-items {
            display: flex;
            align-items: center;
            gap: 0.1rem;
            flex-shrink: 0;
            margin-left: auto;
          }
          .premium-nav-link {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            color: var(--text-muted);
            text-decoration: none;
            font-size: 0.68rem;
            font-weight: 550;
            transition: color 0.2s;
            cursor: pointer;
            padding: 0.35rem 0.55rem;
            border-radius: var(--radius-xs);
            white-space: nowrap;
            background: none;
            border: none;
            line-height: 1;
          }
          .premium-nav-link:hover, .premium-nav-link.active { color: var(--text-main); }
          .admin-nav-link { color: #EF4444 !important; }

          /* Theme toggle (same size as nav links) */
          .theme-toggle-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            color: var(--text-muted);
            font-size: 0.68rem;
            font-weight: 550;
            cursor: pointer;
            padding: 0.35rem 0.55rem;
            border-radius: var(--radius-xs);
            background: none;
            border: none;
            transition: color 0.2s;
            line-height: 1;
          }
          .theme-toggle-btn:hover { color: var(--text-main); }

          /* ── Tier 2: Category filters row ── */
          .nav-tier-bottom {
            display: flex;
            align-items: center;
            height: 40px;
            padding: 0 1.5rem;
            gap: 1.5rem;
            width: 100%;
            overflow: visible;
          }
          .sub-nav-left {
            display: flex;
            align-items: center;
            gap: 0.35rem;
            font-weight: 700;
            color: var(--text-main);
            cursor: pointer;
            font-size: 0.85rem;
            padding: 0.3rem 0.6rem;
            border-radius: 6px;
            position: relative;
            flex-shrink: 0;
            white-space: nowrap;
            transition: color 0.2s;
            background: none;
            border: none;
          }
          .sub-nav-left:hover { color: var(--text-muted); }
          .sub-nav-links {
            display: flex;
            align-items: center;
            gap: 0.1rem;
            flex: 1;
            padding: 0 0.5rem;
            overflow-x: auto;
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .sub-nav-links::-webkit-scrollbar {
            display: none;
          }
          .sub-nav-link {
            color: var(--text-muted);
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.25rem;
            transition: color 0.2s;
            white-space: nowrap;
            font-size: 0.85rem;
            background: none;
            border: none;
            padding: 0.25rem 0.65rem;
            border-radius: var(--radius-xs);
          }
          .sub-nav-link:hover { color: var(--text-main); background: var(--border-color); }
          .sub-nav-right-toggles {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex-shrink: 0;
          }
          .sub-nav-toggle-btn {
            cursor: pointer;
            font-weight: 700;
            color: var(--text-muted);
            font-size: 0.8rem;
            transition: color 0.2s;
            white-space: nowrap;
            background: none;
            border: none;
            padding: 0.25rem 0.5rem;
            border-radius: var(--radius-xs);
          }
          .sub-nav-toggle-btn:hover { color: var(--text-main); }

          /* Category dropdown */
          .category-dropdown {
            position: absolute;
            top: calc(100% + 4px);
            left: 0;
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            box-shadow: 0 16px 48px rgba(0,0,0,0.14);
            min-width: 260px;
            z-index: 500;
            padding: 0.5rem;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.2rem;
            animation: slideUp 0.18s ease;
          }
          .category-dropdown-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.55rem 0.75rem;
            border-radius: var(--radius-xs);
            cursor: pointer;
            font-weight: 600;
            font-size: 0.85rem;
            color: var(--text-main);
            transition: background 0.15s, color 0.15s;
            background: none;
            border: none;
            text-align: left;
            width: 100%;
          }
          .category-dropdown-item:hover { background: var(--border-color); color: var(--text-main); }
          .category-dropdown-item.all-item {
            grid-column: 1 / -1;
            border-bottom: 1px solid var(--border-color);
            margin-bottom: 0.2rem;
            padding-bottom: 0.65rem;
            font-size: 0.9rem;
            font-weight: 700;
            color: var(--text-main);
          }
          .cat-emoji { font-size: 1rem; }

          .main-content {
            height: calc(100vh - 104px) !important;
          }

          /* ── Mobile Bottom Navigation Bar Styles ── */
          .mobile-bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 64px;
            background: var(--card-bg);
            border-top: 1px solid var(--border-color);
            display: none;
            justify-content: space-around;
            align-items: center;
            z-index: 1000;
            padding-bottom: env(safe-area-inset-bottom, 0);
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
          }

          .mobile-nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            color: var(--text-muted);
            text-decoration: none;
            font-size: 0.7rem;
            font-weight: 600;
            transition: all 0.2s ease;
            flex: 1;
            height: 100%;
          }

          .mobile-nav-item.active {
            color: var(--primary);
          }

          /* Highlight the Sell button dynamically */
          .mobile-nav-item.sell-btn {
            position: relative;
          }
          
          .mobile-sell-btn-icon {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: var(--primary);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
            margin-top: -24px;
            transition: all 0.2s ease;
            border: 3px solid var(--card-bg);
          }
          
          .mobile-nav-item.sell-btn:hover .mobile-sell-btn-icon {
            transform: scale(1.08) translateY(-2px);
            box-shadow: 0 6px 14px rgba(16, 185, 129, 0.4);
          }

          @media (max-width: 768px) {
            .mobile-bottom-nav {
              display: flex !important;
            }
            .app-sidebar {
              border-bottom: 1px solid var(--border-color);
            }
            .nav-tier-bottom {
              display: none !important;
            }
            .main-content {
              height: calc(100vh - 64px - 64px) !important;
              padding-bottom: 0 !important;
            }
            .premium-nav-items {
              display: none !important;
            }
          }
      `}</style>

      {/* ════════════════════════════════════════════
          TOP HORIZONTAL NAVBAR
      ════════════════════════════════════════════ */}
      <nav className="app-sidebar">

        {/* ── Tier 1: Main Row ── */}
        <div className="nav-tier-top">

          {/* Brand Logo */}
          <div className="brand-logo-wrap" onClick={() => navigate('/app')}>
            <img src="/logo.svg" alt="KomuniTrade Logo" className="kt-brand-logo" />
            <span className="brand-logo-text">KOMUNITRADE</span>
          </div>

          {/* Search Bar */}
          <form className="premium-search-box" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search products near you…"
              className="premium-search-input"
              value={headerSearchVal}
              onChange={(e) => setHeaderSearchVal(e.target.value)}
            />
            <div className="premium-search-divider" />
            <div className="premium-search-select-wrap">
              <select
                className="premium-search-select"
                value={headerCategoryVal}
                onChange={(e) => setHeaderCategoryVal(e.target.value)}
              >
                <option value="All">All categories</option>
                {CATEGORIES.filter(c => c.id !== 'All').map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <ChevronDown size={11} className="premium-select-chevron" />
            </div>
            <button type="submit" className="premium-search-btn">Search</button>
          </form>

          {/* ── Location Button (Davao City • 20km) ── */}
          <button
            className="nav-location-btn"
            onClick={() => setIsLocationModalOpen(true)}
            title="Change your location"
          >
            <MapPin size={14} />
            <span>{navLocation}</span>
            <span className="nav-location-radius">• {navRadius}km</span>
          </button>

          {/* ── Right Nav Icons ── */}
          <div className="premium-nav-items">

            {/* Orders → Transaction History */}
            <NavLink to="/app/transactions" className="premium-nav-link" title="My Orders">
              <Package size={21} />
              <span>Orders</span>
            </NavLink>

            {/* Messages → Chat */}
            <NavLink to="/app/messages" className="premium-nav-link" title="Messages">
              <MessageCircle size={21} />
              <span>Messages</span>
            </NavLink>

            {/* Dark / Light Mode Toggle */}
            <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? <Sun size={21} /> : <Moon size={21} />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            {/* Admin OR Profile + Sign Out */}
            {userProfile?.role === 'admin' ? (
              <NavLink to="/app/admin" className="premium-nav-link admin-nav-link" title="Admin Panel">
                <ShieldCheck size={21} />
                <span>Admin</span>
              </NavLink>
            ) : (
              <>
                <NavLink to="/app/settings" className="premium-nav-link" title="Settings">
                  <Settings size={21} />
                  <span>Settings</span>
                </NavLink>
                <NavLink to="/app/profile" className="premium-nav-link" title="My Profile">
                  <User size={21} />
                  <span>Profile</span>
                </NavLink>
                <button className="premium-nav-link" onClick={handleLogout} title="Sign Out">
                  <LogOut size={21} />
                  <span>Sign Out</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Tier 2: Sub-Nav Row ── */}
        <div className="nav-tier-bottom">

          {/* All Categories dropdown */}
          <div
            className="sub-nav-left"
            ref={categoryMenuRef}
            onClick={() => setShowCategoryMenu(v => !v)}
          >
            <Menu size={14} />
            <span>All Categories</span>
            <ChevronDown
              size={12}
              style={{
                transform: showCategoryMenu ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s'
              }}
            />
            {showCategoryMenu && (
              <div className="category-dropdown" onClick={e => e.stopPropagation()}>
                <button className="category-dropdown-item all-item" onClick={handleAllCategories}>
                  <span className="cat-emoji">🏷️</span>
                  All Products Near Me
                </button>
                {CATEGORIES.filter(c => c.id !== 'All').map(cat => (
                  <button
                    key={cat.id}
                    className="category-dropdown-item"
                    onClick={() => handleCategorySelect(cat.id)}
                  >
                    <span className="cat-emoji">{cat.emoji}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick category shortcut links */}
          <div className="sub-nav-links">
            <button className="sub-nav-link" onClick={() => navigate('/app')}>
              🔥 Near Me
            </button>
            <button className="sub-nav-link" onClick={() => navigate('/app?category=Electronic')}>
              📱 Electronics
            </button>
            <button className="sub-nav-link" onClick={() => navigate('/app?category=Clothing')}>
              👕 Clothing
            </button>
            <button className="sub-nav-link" onClick={() => navigate('/app?category=Service')}>
              🔧 Services
            </button>
            <button className="sub-nav-link" onClick={() => navigate('/app?category=Food')}>
              🍽️ Food
            </button>
            <button className="sub-nav-link" onClick={() => navigate('/app?q=verified')}>
              ⭐ Top Sellers
            </button>
          </div>

          {/* Language toggle */}
          <div className="sub-nav-right-toggles">
            <button className="sub-nav-toggle-btn" onClick={toggleLanguage}>
              🌍 {lang === 'en' ? 'Filipino' : 'English'}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="main-content">
        {isOffline && (
          <div style={{
            background: '#EF4444',
            color: 'white',
            padding: '0.4rem 1rem',
            textAlign: 'center',
            fontSize: '0.82rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}>
            <WifiOff size={15} />
            Offline Mode — showing locally cached listings.
          </div>
        )}

        <div className="content-scroll">
          <div className="apple-grid">
            <Outlet />
          </div>
        </div>
      </main>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <div className="mobile-bottom-nav">
        <NavLink to="/app" end className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Home size={22} />
          <span>Home</span>
        </NavLink>

        <NavLink to="/app/transactions" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Package size={22} />
          <span>Orders</span>
        </NavLink>

        <NavLink to="/app/post" className={({ isActive }) => `mobile-nav-item sell-btn ${isActive ? 'active' : ''}`}>
          <div className="mobile-sell-btn-icon">
            <PlusCircle size={22} />
          </div>
          <span>Sell</span>
        </NavLink>

        <NavLink to="/app/messages" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <MessageCircle size={22} />
          <span>Messages</span>
        </NavLink>

        {userProfile?.role === 'admin' ? (
          <NavLink to="/app/admin" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            <ShieldCheck size={22} />
            <span>Admin</span>
          </NavLink>
        ) : (
          <NavLink to="/app/profile" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            <User size={22} />
            <span>Profile</span>
          </NavLink>
        )}
      </div>


      {/* ── Location Modal (from navbar location button) ── */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        initialLocation={navLocation}
        initialRadius={navRadius}
        onApply={handleLocationApply}
      />

      {/* ── Logout Confirmation Modal ── */}
      {showLogoutModal && (
        <div
          className="auth-modal-overlay"
          onClick={() => setShowLogoutModal(false)}
          style={{ zIndex: 3000 }}
        >
          <div
            className="auth-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '380px', textAlign: 'center', padding: '2.5rem 2rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                background: '#FEE2E2', color: '#EF4444',
                width: '60px', height: '60px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <LogOut size={28} />
              </div>
            </div>
            <h3 style={{
              fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)',
              marginBottom: '0.5rem', fontFamily: "'Outfit', sans-serif"
            }}>
              {t('sett_sign_out')}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              {t('sett_signout_confirm') || 'Are you sure you want to sign out?'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="btn-secondary"
                style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', fontWeight: 700 }}
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
                style={{
                  flex: 1, padding: '0.8rem', borderRadius: '12px',
                  background: '#EF4444', color: '#fff', border: 'none',
                  boxShadow: '0 8px 20px -4px rgba(239,68,68,0.35)', fontWeight: 700
                }}
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
