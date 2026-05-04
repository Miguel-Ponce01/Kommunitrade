import React, { useState } from 'react';
import { Search, ArrowRight, Sun, Moon } from 'lucide-react';
import AuthModal from '../components/AuthModal';
import { useTheme } from '../hooks/useTheme';
import '../index.css';

export default function Landing() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [theme, setTheme] = useTheme();

  const openAuth = (mode) => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="editorial-landing animate-fade-in">
      {/* Navbar */}
      <nav className="editorial-nav">
        <div className="nav-brand">
          <span className="brand-name" style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.05em' }}>
            KOMUNITRADE<span style={{ color: 'var(--primary)' }}>.</span>
          </span>
        </div>
        <div className="nav-controls">
          <div 
            className={`theme-toggle-pill ${theme === 'dark' ? 'dark' : ''}`} 
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Daymode' : 'Switch to Nightmode'}
          >
            <div className="toggle-handle">
              {theme === 'dark' ? <Moon size={18} fill="currentColor" /> : <Sun size={18} />}
            </div>
            <span className="toggle-label">
              {theme === 'dark' ? 'NIGHTMODE' : 'DAYMODE'}
            </span>
          </div>

          <div className="search-bar" style={{ background: '#f1f5f9', border: 'none', marginLeft: '1rem' }}>
            <input type="text" placeholder="Search neighborhood..." />
            <button aria-label="Search"><Search size={16} /></button>
          </div>
          <button className="auth-action-btn" onClick={() => openAuth('login')} style={{ fontWeight: 700 }}>Log In</button>
          <button className="btn-primary" onClick={() => openAuth('register')} style={{ padding: '0.6rem 1.5rem', borderRadius: '12px' }}>Get Started</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="editorial-hero">
        <div className="location-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', fontWeight: 800 }}>
          📍 Hyperlocal & Hyper-fast
        </div>
        
        <h1 className="hero-heading">
          Trade <span className="text-gradient">smarter</span>,<br />
          live <span className="text-gradient">better</span> in your<br />
          local community.
        </h1>

        <div className="hero-sub" style={{ border: 'none', paddingTop: 0 }}>
          <p className="hero-text" style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '600px', marginBottom: '2.5rem' }}>
            The AI-powered marketplace built specifically for Philippine barangays. Safe, verified, and 100% community-driven.
          </p>
          <button className="hero-cta-btn" onClick={() => openAuth('register')}>
            Start Trading Now <ArrowRight size={24} />
          </button>
        </div>
      </section>

      {/* Main Banner Image */}
      <div className="editorial-banner" style={{ padding: '0 3rem', marginBottom: '8rem' }}>
        <img 
          src="https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&q=80&w=1200" 
          alt="Local community trading" 
          className="banner-img"
          style={{ borderRadius: '40px', boxShadow: 'var(--shadow-premium)' }}
        />
      </div>

      {/* Masonry / Grid Section */}
      <section className="editorial-gallery-section" style={{ paddingBottom: '8rem' }}>
        <h2 className="section-title" style={{ fontSize: '3.5rem', fontWeight: 900, textAlign: 'center', marginBottom: '1rem' }}>
          Hyperlocal <span className="text-gradient">Excellence</span>
        </h2>
        <p className="section-subtitle" style={{ textAlign: 'center', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 4rem' }}>
          KomuniTrade empowers you to connect safely with verified neighbors in a modern, AI-enhanced ecosystem.
        </p>

        <div className="masonry-grid" style={{ padding: '0 3rem' }}>
          <div className="grid-col col-1">
             <img src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=400" alt="Home Decor" className="grid-img" style={{ borderRadius: '24px' }} />
             <img src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=400" alt="Fashion and Sneakers" className="grid-img" style={{ borderRadius: '24px', marginTop: '1.5rem' }} />
          </div>
          <div className="grid-col col-2" style={{ padding: '0 1.5rem' }}>
             <img src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=600" alt="Second hand clothing rack" className="grid-img main-grid-img" style={{ borderRadius: '40px' }} />
          </div>
          <div className="grid-col col-3">
             <img src="https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=400" alt="Vintage camera and bike" className="grid-img" style={{ borderRadius: '24px' }} />
             <img src="https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=400" alt="Potted plants" className="grid-img" style={{ borderRadius: '24px', marginTop: '1.5rem' }} />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="editorial-faq-section glass-card" style={{ margin: '0 3rem 8rem', padding: '4rem' }}>
        <div className="faq-header">
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900 }}>Common <span className="text-gradient">Questions</span></h2>
        </div>
        <div className="faq-list">
          {[
            { q: "Is my neighborhood safe to trade in?", a: "Yes! Every user is verified via Geohash and community trust scores." },
            { q: "How fast can I list an item?", a: "With our Gemini AI engine, you can generate a professional listing in under 10 seconds." },
            { q: "Is my data private?", a: "We use E2EE for all chats and TTL purge for your listing data." }
          ].map((item, i) => (
            <div key={i} className="faq-item" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', padding: '2rem 0' }}>
              <span className="faq-num" style={{ color: 'var(--primary)', fontWeight: 800 }}>0{i+1}</span>
              <div className="faq-content">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>{item.q}</h3>
                <p style={{ color: 'var(--text-muted)' }}>{item.a}</p>
              </div>
              <ArrowRight className="faq-arrow" />
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="editorial-footer-cta" style={{ background: 'var(--text-main)', color: 'white', padding: '10rem 3rem' }}>
        <h2 style={{ fontSize: '4.5rem', fontWeight: 900, marginBottom: '2rem', lineHeight: 1 }}>
          Build your <span style={{ color: 'var(--primary)' }}>community</span> ecosystem.
        </h2>
        <p style={{ fontSize: '1.25rem', opacity: 0.7, maxWidth: '600px', margin: '0 auto 4rem' }}>
          Join thousands of neighbors already trading smarter with KomuniTrade.
        </p>
        <button className="btn-primary" onClick={() => openAuth('register')} style={{ margin: '0 auto', padding: '1.25rem 3rem', fontSize: '1.2rem', background: '#fff', color: '#111' }}>
          Join KomuniTrade Now
        </button>
      </section>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        initialMode={authMode} 
      />
    </div>
  );
}
