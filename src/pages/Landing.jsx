import React, { useState } from 'react';
import { Search, ArrowRight, Shield, MapPin as MapPinIcon, Languages } from 'lucide-react';
import AuthModal from '../components/AuthModal';
import { useLanguage } from '../hooks/useLanguage.jsx';
import '../index.css';

export default function Landing() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [lang, setLang, t] = useLanguage();

  const openAuth = (mode) => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'tl' : 'en');
  };

  // Categories mapped to translation keys with specific images
  const CATEGORIES_DATA = [
    { key: 'fresh', icon: '🥭', img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=600' },
    { key: 'ukay', icon: '👗', img: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=600' },
    { key: 'gadgets', icon: '📱', img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600' },
    { key: 'services', icon: '🛠️', img: 'https://images.unsplash.com/photo-1581578731522-62047aa7451a?auto=format&fit=crop&q=80&w=600' },
    { key: 'home', icon: '🏠', img: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=600' },
    { key: 'school', icon: '🎒', img: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600' },
  ];

  return (
    <div className="editorial-landing animate-fade-in">
      {/* Navbar */}
      <nav className="editorial-nav">
        <div className="apple-grid" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem' }}>
          <div className="nav-brand">
            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.05em', fontFamily: "'Outfit', sans-serif" }}>
              {t('nav_brand')}
            </span>
          </div>
          <div className="nav-controls">
            {/* Language Toggle */}
            <div 
              className="language-toggle-pill" 
              onClick={toggleLanguage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--bg-color)',
                border: '1px solid var(--border-color)',
                padding: '0.5rem 1rem',
                borderRadius: '999px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: 'var(--text-main)',
                transition: 'var(--transition)'
              }}
            >
              <Languages size={16} />
              <span>{lang === 'en' ? 'ENGLISH' : 'TAGALOG'}</span>
            </div>

            <div className="search-bar" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', marginLeft: '1rem' }}>
              <input type="text" placeholder={t('nav_search_ph')} />
              <button aria-label="Search"><Search size={16} /></button>
            </div>
            <button className="auth-action-btn" onClick={() => openAuth('login')} style={{ fontWeight: 700 }}>{t('nav_login')}</button>
            <button className="btn-primary" onClick={() => openAuth('register')} style={{ padding: '0.6rem 1.5rem', borderRadius: '12px' }}>{t('nav_signup')}</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="editorial-hero">
        <div className="apple-grid">
          <div className="location-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', fontWeight: 800 }}>
            {t('hero_davao')}
          </div>
          
          <h1 className="hero-heading" dangerouslySetInnerHTML={{ __html: t('hero_barangay') }} />

          <div className="hero-sub" style={{ border: 'none', paddingTop: 0 }}>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '540px', marginBottom: '2.5rem', lineHeight: 1.7 }}>
              {t('hero_buy_sell')}
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button className="hero-cta-btn" onClick={() => openAuth('register')}>
                {t('hero_mag_lista')} <ArrowRight size={22} />
              </button>
              <button onClick={() => openAuth('login')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: '2px solid var(--border-color)', padding: '1rem 1.75rem', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', color: 'var(--text-main)', transition: 'all 0.3s ease' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                {t('hero_mag_browse')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Banner — Davao Market Vibe */}
      <div style={{ padding: '0 var(--container-padding)', marginBottom: '6rem' }}>
        <div className="apple-grid" style={{ padding: 0 }}>
          <div style={{ position: 'relative', borderRadius: '40px', overflow: 'hidden', height: '460px', boxShadow: 'var(--shadow-premium)' }}>
            <img 
              src="https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&q=80&w=1400"
              alt="Local Davao community market"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />
            <div style={{ position: 'absolute', top: '50%', left: 'var(--container-padding)', transform: 'translateY(-50%)', color: 'white' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>{t('stats_subtitle')}</p>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", lineHeight: 1.1, marginBottom: '2rem' }}>
                {t('stats_title').split(',')[0]},<br />{t('stats_title').split(',')[1]}
              </h2>
              <div className="banner-stats-grid">
                {[['🏘️', '50+', t('stats_barangays')], ['⚡', '<10s', t('stats_ai')], ['🔒', 'E2EE', t('stats_chat')]].map(([icon, val, label]) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{icon}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif" }}>{val}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What You Can Trade — Community Categories */}
      <section style={{ padding: '0 0 var(--section-gap)' }}>
        <div className="apple-grid">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="section-title" style={{ fontSize: '3.5rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", marginBottom: '1rem' }} dangerouslySetInnerHTML={{ __html: t('cat_title') }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
              {t('cat_subtitle')}
            </p>
          </div>

          <div className="category-grid">
            {CATEGORIES_DATA.map((item) => (
              <div 
                key={item.key}
                className="category-card"
                onClick={() => openAuth('register')}
              >
                <div className="card-bg-img" style={{ backgroundImage: `url(${item.img})` }} />
                <div className="card-overlay" />
                <div className="card-content">
                  <div className="card-icon">{item.icon}</div>
                  <h3 className="card-label">{t(`cat_${item.key}`)}</h3>
                  <p className="card-desc">{t(`cat_${item.key}_desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why KomuniTrade — Trust Features */}
      <section style={{ background: 'var(--card-bg)', padding: '8rem 0', marginBottom: '8rem' }}>
        <div className="apple-grid">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.4rem 1rem', borderRadius: '999px', fontWeight: 800, fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                <Shield size={14} /> {t('trust_badge')}
              </div>
              <h2 style={{ fontSize: '3rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", lineHeight: 1.1, marginBottom: '1.5rem' }}>
                {t('trust_title')}
              </h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '1.05rem', marginBottom: '2rem' }}>
                {t('trust_desc')}
              </p>
              {[
                ['🔐', t('trust_feat1_title'), t('trust_feat1_desc')],
                ['⏱️', t('trust_feat2_title'), t('trust_feat2_desc')],
                ['📍', t('trust_feat3_title'), t('trust_feat3_desc')],
              ].map(([icon, title, desc]) => (
                <div key={title} style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: '0.2rem', color: 'var(--text-main)' }}>{title}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ borderRadius: '32px', overflow: 'hidden', boxShadow: 'var(--shadow-premium)' }}>
                <img 
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=700"
                  alt="Safe community trading"
                  style={{ width: '100%', height: '400px', objectFit: 'cover' }}
                />
              </div>
              <div style={{ position: 'absolute', bottom: '-1rem', left: '-1rem', background: 'var(--primary)', color: 'white', borderRadius: '20px', padding: '1rem 1.5rem', boxShadow: '0 20px 40px rgba(16,185,129,0.4)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.8 }}>AI LISTING TIME</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>~8s</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="editorial-faq-section" style={{ padding: '0 0 8rem' }}>
        <div className="apple-grid">
          <div className="faq-section-inner">
            <div className="faq-header">
              <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }} dangerouslySetInnerHTML={{ __html: t('faq_title') }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>{t('faq_subtitle')}</p>
            </div>
            <div className="faq-list">
              {[
                { q: t('faq_q1'), a: t('faq_a1') },
                { q: t('faq_q2'), a: t('faq_a2') },
                { q: t('faq_q3'), a: t('faq_a3') },
                { q: t('faq_q4'), a: t('faq_a4') }
              ].map((item, i) => (
                <div key={i} className="faq-item">
                  <div className="faq-num">0{i+1}</div>
                  <div className="faq-content">
                    <h3>{item.q}</h3>
                    <p>{item.a}</p>
                  </div>
                  <ArrowRight className="faq-arrow" size={18} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="editorial-footer-cta">
        <div className="apple-grid">
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1.5rem', position: 'relative' }}>
            {t('cta_footer_location')}
          </p>
          <h2 dangerouslySetInnerHTML={{ __html: t('cta_footer_title') }} />
          <p>
            {t('cta_footer_desc')}
          </p>
          <button 
            onClick={() => openAuth('register')} 
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
              background: '#fff', color: '#0F172A', border: 'none', 
              padding: '1.1rem 2.5rem', borderRadius: '16px', 
              fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease', position: 'relative'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 28px 50px rgba(0,0,0,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)'; }}
          >
            {t('cta_footer_btn_text')} <ArrowRight size={20} />
          </button>
        </div>
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
