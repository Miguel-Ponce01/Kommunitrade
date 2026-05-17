import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Languages, X } from 'lucide-react';
import Auth from './Login';
import { useLanguage } from '../hooks/useLanguage.jsx';
import '../index.css';

export default function Landing() {
  const navigate = useNavigate();
  const { lang, setLang, t } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [feedback, setFeedback] = useState([
    { id: 1, name: 'Juan Dela Cruz', message: 'Great platform! Very easy to use.', date: '2026-05-10' },
    { id: 2, name: 'Maria Santos', message: 'I found a great deal on a laptop here.', date: '2026-05-11' }
  ]);
  const [adminMode, setAdminMode] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [newFeedbackName, setNewFeedbackName] = useState('');
  const [newFeedbackMessage, setNewFeedbackMessage] = useState('');

  const openAuth = () => setShowAuthModal(true);

  const toggleLanguage = () => {
    if (lang === 'en') setLang('tl');
    else if (lang === 'tl') setLang('bis');
    else setLang('en');
  };

  // Categories mapped to translation keys with specific images
  const CATEGORIES_DATA = [
    { key: 'durian', img: '/fresh.png' },
    { key: 'ukay', img: '/thrift.png' },
    { key: 'gadgets', img: '/gadgets.png' },
    { key: 'services', img: '/Services.png' },
    { key: 'Furniture', img: '/sofa.png' },
    { key: 'students', img: '/student_esse.png' },
  ];

  return (
    <div className="editorial-landing animate-fade-in">
      {/* Navbar */}
      <nav className="editorial-nav">
        <div className="apple-grid" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'nowrap' }}>
          <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flexShrink: 1 }}>
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 10H18L17 19C17 20.1046 16.1046 21 15 21H9C7.89543 21 7 20.1046 7 19L6 10Z" fill="var(--primary)" fillOpacity="0.1" stroke="var(--primary)" strokeWidth="2" />
              <path d="M9 10V6C9 4.34315 10.3431 3 12 3L12 3C13.6569 3 15 4.34315 15 6V10" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 2L9 5H15L12 2Z" fill="var(--primary)" />
              <path d="M6 10H18" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.05em', fontFamily: "'Outfit', sans-serif" }}>
              {t('nav_brand')}
            </span>
          </div>
          <div className="nav-controls" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              className="language-toggle-pill"
              onClick={toggleLanguage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.8rem',
                color: 'var(--text-main)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <Languages size={14} color="var(--primary)" />
              <span>{lang === 'en' ? 'EN' : lang === 'tl' ? 'TL' : 'BIS'}</span>
            </div>
            <button className="btn-primary" onClick={openAuth} style={{ padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.85rem' }}>{t('nav_signup')}</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="editorial-hero" style={{ width: '100%', overflowX: 'hidden', position: 'relative' }}>
        <div className="apple-grid" style={{ position: 'relative', zIndex: 2 }}>
          <div className="location-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', fontWeight: 800 }}>
            {t('hero_badge')}
          </div>

          <h1 className="hero-heading" dangerouslySetInnerHTML={{ __html: t('hero_title') }} />

          <div className="hero-sub" style={{ border: 'none', paddingTop: 0, width: '100%' }}>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '100%', marginBottom: '2.5rem', lineHeight: 1.7 }}>
              {t('hero_subtitle')}
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button className="hero-cta-btn" onClick={openAuth}>
                {t('hero_cta_sell')} <ArrowRight size={22} />
              </button>
              <button onClick={openAuth} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: '2px solid var(--border-color)', padding: '1rem 1.75rem', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', color: 'var(--text-main)', transition: 'all 0.3s ease' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                {t('hero_cta_browse')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Why KomuniTrade — Trust Features */}
      <section style={{ background: 'var(--card-bg)', padding: '8rem 0', marginBottom: '8rem', position: 'relative' }}>
        <div className="apple-grid" style={{ position: 'relative', zIndex: 2 }}>
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
                ['', t('trust_feat1_title'), t('trust_feat1_desc')],
                ['', t('trust_feat2_title'), t('trust_feat2_desc')],
                ['', t('trust_feat3_title'), t('trust_feat3_desc')],
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


              </div>
              <div style={{ position: 'absolute', bottom: '-1rem', left: '-1rem', background: 'var(--primary)', color: 'white', borderRadius: '20px', padding: '1rem 1.5rem', boxShadow: '0 20px 40px rgba(16,185,129,0.4)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.8 }}>VERIFICATION SPEED</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>~2s</div>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      {/* Feedback Forum Section */}
      <section id="feedback-section" className="editorial-faq-section" style={{ padding: '0 0 8rem' }}>
        <div className="apple-grid">
          <div className="faq-section-inner">
            <div className="faq-header">
              <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Community Feedback</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Hear from our users or share your experience.</p>
            </div>

            {/* Feedback List */}
            <div className="faq-list">
              {feedback.map((item) => (
                <div key={item.id} className="faq-item" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1.5rem', background: 'var(--card-bg)', borderRadius: '12px', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.date}</div>
                  </div>
                  <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>{item.message}</p>
                  {adminMode && (
                    <button
                      onClick={() => setFeedback(feedback.filter(f => f.id !== item.id))}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 700 }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Feedback Form */}
            <div style={{ marginTop: '3rem', background: 'var(--card-bg)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontFamily: "'Outfit', sans-serif" }}>Leave a Feedback</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={newFeedbackName}
                  onChange={(e) => setNewFeedbackName(e.target.value)}
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                />
                <textarea
                  placeholder="Your Feedback"
                  value={newFeedbackMessage}
                  onChange={(e) => setNewFeedbackMessage(e.target.value)}
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100px' }}
                />
                <button
                  onClick={() => {
                    if (newFeedbackName && newFeedbackMessage) {
                      setFeedback([...feedback, { id: Date.now(), name: newFeedbackName, message: newFeedbackMessage, date: new Date().toISOString().split('T')[0] }]);
                      setNewFeedbackName('');
                      setNewFeedbackMessage('');
                    }
                  }}
                  className="btn-primary"
                  style={{ padding: '0.75rem', borderRadius: '8px' }}
                >
                  Submit Feedback
                </button>
              </div>
            </div>

            {/* Admin Switch */}
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              {!adminMode ? (
                <button
                  onClick={() => setShowAdminLogin(!showAdminLogin)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', opacity: 0.5 }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
                >
                  Admin Switch
                </button>
              ) : (
                <button
                  onClick={() => setAdminMode(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                >
                  Exit Admin Mode
                </button>
              )}

              {showAdminLogin && !adminMode && (
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="User"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', width: '100px' }}
                  />
                  <input
                    type="password"
                    placeholder="Pass"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', width: '100px' }}
                  />
                  <button
                    onClick={() => {
                      if (adminUsername === 'admin' && adminPassword === 'admin123') {
                        setAdminMode(true);
                        setShowAdminLogin(false);
                        setAdminUsername('');
                        setAdminPassword('');
                      } else {
                        alert('Invalid credentials');
                      }
                    }}
                    style={{ padding: '0.5rem', borderRadius: '4px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}
                  >
                    Login
                  </button>
                </div>
              )}
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

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2.5rem' }}>
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
              {t('cta_footer_btn')} <ArrowRight size={20} />
            </button>

            {/* Feedback Forum Button */}
            <button
              onClick={() => document.getElementById('feedback-section')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                padding: '0.6rem 1.25rem', borderRadius: '999px',
                fontWeight: 800, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer', transition: 'all 0.3s ease', letterSpacing: '0.05em'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <span>FEEDBACK FORUM</span>
            </button>

            {/* Language Toggle moved to Footer */}
            <div
              className="language-toggle-pill"
              onClick={toggleLanguage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '0.6rem 1.25rem',
                borderRadius: '999px',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.5)',
                transition: 'all 0.3s ease',
                letterSpacing: '0.05em'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <Languages size={14} />
              <span>{lang === 'en' ? 'ENGLISH' : lang === 'tl' ? 'TAGALOG' : 'BISAYA'}</span>
            </div>
          </div>

          <div style={{ marginTop: '5rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', textAlign: 'center' }}>
            © 2026 KomuniTrade. {t('footer_tagline')}
          </div>
        </div>
      </section>

      {/* Auth Modal Popup */}
      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button
              className="auth-modal-close"
              onClick={() => setShowAuthModal(false)}
              style={{ top: '1.5rem', right: '1.5rem', zIndex: 10 }}
            >
              <X size={20} />
            </button>
            <Auth />
          </div>
        </div>
      )}

    </div>
  );
}
