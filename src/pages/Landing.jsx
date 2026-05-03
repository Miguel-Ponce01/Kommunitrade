import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Menu, ArrowRight } from 'lucide-react';
import AuthModal from '../components/AuthModal';
import '../index.css'; // ensure styles are imported

export default function Landing() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const openAuth = (mode) => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  return (
    <div className="editorial-landing">
      {/* Navbar */}
      <nav className="editorial-nav">
        <div className="nav-brand">
          <span className="brand-name">KomuniTrade<sup style={{ fontSize: '0.5em' }}>®</sup></span>
        </div>
        <div className="nav-controls">
          <div className="search-bar">
            <input type="text" placeholder="Search" />
            <button aria-label="Search"><Search size={16} /></button>
          </div>
          <button className="auth-action-btn" onClick={() => openAuth('login')}>Log In</button>
          <button className="auth-action-btn primary" onClick={() => openAuth('register')}>Sign Up</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="editorial-hero">
        <div className="location-badge">📍 Your Barangay, Your Marketplace</div>
        
        <h1 className="hero-heading">
          Smart 
          <span className="inline-img img-1" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=150)' }}></span> 
          trading built for <em className="italic-serif">modern</em>
          <br />
          local <span className="inline-img img-2" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1513530534585-c7b1394c6d51?auto=format&fit=crop&q=80&w=150)' }}></span> communities
        </h1>

        <div className="hero-sub">
          <p className="hero-text">
            In a world where neighborhoods thrive on trust, trading locally shouldn't slow you down—it should bring you closer.
          </p>
          <button className="hero-cta-btn" onClick={() => openAuth('register')}>
            Start Trading Now <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Main Banner Image */}
      <div className="editorial-banner">
        <img 
          src="https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&q=80&w=1200" 
          alt="Local community trading" 
          className="banner-img"
        />
      </div>

      {/* Masonry / Grid Section */}
      <section className="editorial-gallery-section">
        <h2 className="section-title">
          Trade That Works Where<br />
          <em className="italic-serif">It Matters Most</em>
        </h2>
        <p className="section-subtitle">
          KomuniTrade empowers communities to buy, sell, and connect safely with verified neighbors in a hyper-local ecosystem.
        </p>

        <div className="masonry-grid">
          <div className="grid-col col-1">
             <img src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=400" alt="Home Decor" className="grid-img" />
             <img src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=400" alt="Fashion and Sneakers" className="grid-img" />
          </div>
          <div className="grid-col col-2">
             <img src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=600" alt="Second hand clothing rack" className="grid-img main-grid-img" />
          </div>
          <div className="grid-col col-3">
             <img src="https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=400" alt="Vintage camera and bike" className="grid-img" />
             <img src="https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=400" alt="Potted plants" className="grid-img" />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="editorial-faq-section">
        <div className="faq-header">
          <h2>Common Questions<br /><em className="italic-serif">About KomuniTrade</em></h2>
        </div>
        <div className="faq-list">
          <div className="faq-item">
            <span className="faq-num">[01]</span>
            <div className="faq-content">
              <h3>Is my neighborhood safe to trade in?</h3>
            </div>
            <ArrowRight className="faq-arrow" />
          </div>
          <div className="faq-item active">
            <span className="faq-num">[02]</span>
            <div className="faq-content">
              <h3><em>How fast</em> can I list an item?</h3>
              <p>With our AI-powered engine, listings are generated in seconds, allowing you to scale your community shop effortlessly.</p>
            </div>
            <ArrowRight className="faq-arrow" />
          </div>
          <div className="faq-item">
            <span className="faq-num">[03]</span>
            <div className="faq-content">
              <h3>Are my personal details private?</h3>
            </div>
            <ArrowRight className="faq-arrow" />
          </div>
          <div className="faq-item">
            <span className="faq-num">[04]</span>
            <div className="faq-content">
              <h3>Is KomuniTrade exclusive to Davao?</h3>
            </div>
            <ArrowRight className="faq-arrow" />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="editorial-footer-cta">
        <h2>
          Trading that feels human,<br />
          measurable, and built to <em className="italic-serif">connect in</em><br />
          modern barangays
        </h2>
        <p>
          KomuniTrade helps local communities create sustainable ecosystems that are not only reliable, but also practical, scalable, and trust-driven.
        </p>
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
