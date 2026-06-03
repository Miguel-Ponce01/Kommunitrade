import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Lock, CheckCircle, Languages, X, MapPin, Star, Settings } from 'lucide-react';
import Auth from './Login';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { db, collection, addDoc, getDocs } from '../firebase';
import GoogleMap from '../components/GoogleMap';
import '../index.css';

export default function Landing() {
  const navigate = useNavigate();
  const { lang, setLang, t } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [newFeedbackName, setNewFeedbackName] = useState('');
  const [newFeedbackMessage, setNewFeedbackMessage] = useState('');

  // Fetch Feedback from Firestore
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const snap = await getDocs(collection(db, "feedback"));
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (list.length > 0) {
          list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
          setFeedback(list);
        } else {
          // Seed database if empty
          const initial = [
            { name: 'Juan Dela Cruz', message: 'Great platform! Very easy to use.', date: '2026-05-10' },
            { name: 'Maria Santos', message: 'I found a great deal on a laptop here.', date: '2026-05-11' }
          ];
          for (let item of initial) {
            await addDoc(collection(db, "feedback"), item);
          }
          setFeedback(initial);
        }
      } catch (e) {
        console.error("Failed to load feedback from Firestore:", e);
      }
    };
    fetchFeedback();
  }, []);

  useEffect(() => {
    const container = document.querySelector('.editorial-landing');
    const handleScroll = () => setScrolled(container?.scrollTop > 20);
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  const openAuth = () => setShowAuthModal(true);

  const toggleLanguage = () => {
    if (lang === 'en') setLang('tl');
    else if (lang === 'tl') setLang('bis');
    else setLang('en');
  };

  const CATEGORIES_DATA = [
    { key: 'durian', img: '/fresh.webp' },
    { key: 'ukay', img: '/thrift.webp' },
    { key: 'gadgets', img: '/gadgets.webp' },
    { key: 'services', img: '/Services.webp' },
    { key: 'Furniture', img: '/sofa.webp' },
    { key: 'students', img: '/student_esse.webp' },
  ];

  return (
    <div className="editorial-landing animate-fade-in">

      {/* ── NAVBAR ──────────────────────────────────── */}
      <nav className={`kt-editorial-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="kt-nav-inner">
          {/* Brand */}
          <div className="kt-nav-brand">
            <svg className="kt-nav-logo" width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M6 10H18L17 19C17 20.1046 16.1046 21 15 21H9C7.89543 21 7 20.1046 7 19L6 10Z" fill="#FF4757" fillOpacity="0.15" stroke="#FF4757" strokeWidth="2" />
              <path d="M9 10V6C9 4.34315 10.3431 3 12 3C13.6569 3 15 4.34315 15 6V10" stroke="#FF4757" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 2L9 5H15L12 2Z" fill="#FF4757" />
            </svg>
            <span className="kt-brand-text">KOMUNITRADE</span>
          </div>

          {/* Center Nav Links */}
          <div className="kt-nav-links">
            <a href="#categories" className="kt-nav-link">Categories</a>
            <a href="#trust" className="kt-nav-link">Our Story</a>
            <a href="#feedback-section" className="kt-nav-link">Community</a>
          </div>

          {/* Right Controls */}
          <div className="kt-nav-controls">
            <div className="kt-lang-pill" onClick={toggleLanguage}>
              <Languages size={13} />
              <span>{lang === 'en' ? 'EN' : lang === 'tl' ? 'TL' : 'BIS'}</span>
            </div>
            <button className="kt-cta-pill" onClick={openAuth}>
              {t('nav_signup')}
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ────────────────────────────── */}
      <section className="kt-hero">

        {/* Giant decorative background text */}
        <div className="kt-hero-deco-text" aria-hidden="true">
          KT
        </div>

        {/* Floating hero image */}
        <div className="kt-hero-image-wrap">
          <img
            src="/durian_fruit.webp"
            alt="Fresh Davao products"
            className="kt-hero-img"
          />
          {/* Floating stat badges */}
          <div className="kt-hero-badge kt-badge-top-left">
            <MapPin size={14} />
            <span>Davao City</span>
          </div>
          <div className="kt-hero-badge kt-badge-top-right">
            <Star size={14} fill="currentColor" />
            <span>Verified Sellers</span>
          </div>
          <div className="kt-hero-badge kt-badge-bottom">
            <span className="kt-badge-num">2,000+</span>
            <span>Local Listings</span>
          </div>
        </div>

        {/* Text block */}
        <div className="kt-hero-text">
          <div className="kt-location-chip">
            <MapPin size={12} />
            <span>{t('hero_badge')}</span>
          </div>

          <h1 className="kt-hero-heading">
            {lang === 'en' ? (
              <>Bold trades that define<br /><span className="kt-heading-accent">authentic Davao</span> living</>
            ) : lang === 'tl' ? (
              <>Bumili at magbenta kasama ang<br /><span className="kt-heading-accent">kapitbahay mo</span></>
            ) : (
              <>Palit ug baligya sa imong<br /><span className="kt-heading-accent">lokal nga komunidad</span></>
            )}
          </h1>

          <p className="kt-hero-sub">
            {t('hero_subtitle')}
          </p>

          <button className="kt-order-btn" onClick={openAuth}>
            <span>{t('hero_cta_sell')}</span>
            <ArrowRight size={18} />
          </button>
        </div>

      </section>

      {/* ── TRUST SECTION ───────────────────────────── */}
      <section id="trust" style={{ background: 'var(--card-bg)', padding: '8rem 0', position: 'relative' }}>
        <div className="apple-grid" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.4rem 1rem', borderRadius: '999px', fontWeight: 800, fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                <Shield size={14} /> {t('trust_badge')}
              </div>
              <h2 style={{ fontSize: '3rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", lineHeight: 1.1, marginBottom: '1.5rem', color: 'var(--text-main)' }}>
                {t('trust_title')}
              </h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '1.05rem', marginBottom: '2rem' }}>
                {t('trust_desc')}
              </p>
              {[
                [<Lock size={20} />, t('trust_feat1_title'), t('trust_feat1_desc')],
                [<CheckCircle size={20} />, t('trust_feat2_title'), t('trust_feat2_desc')],
                [<Shield size={20} />, t('trust_feat3_title'), t('trust_feat3_desc')],
              ].map(([icon, title, desc]) => (
                <div key={title} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '0.2rem' }}>{icon}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.25rem', color: 'var(--text-main)', fontFamily: "'Outfit', sans-serif" }}>{title}</div>
                    <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ borderRadius: '32px', overflow: 'hidden', boxShadow: 'var(--shadow-premium)', background: 'var(--bg-color)', padding: '1rem', textAlign: 'center', height: '350px' }}>
                <GoogleMap 
                  center={{ lat: 7.0731, lng: 125.6128 }} 
                  zoom={13} 
                  markers={[
                    { lat: 7.0707, lng: 125.6092, title: 'Barangay 11-B Hotspot' },
                    { lat: 7.0731, lng: 125.6128, title: 'Davao City Hall Hotspot' },
                    { lat: 7.0850, lng: 125.6180, title: 'Bajada Comm Activity' },
                    { lat: 7.0910, lng: 125.6310, title: 'Lanang Student Moving Hub' },
                    { lat: 7.0650, lng: 125.5990, title: 'Matina Thrift Center' }
                  ]}
                />
              </div>
              <div style={{ position: 'absolute', bottom: '-1rem', left: '-1rem', background: 'var(--primary)', color: 'white', borderRadius: '20px', padding: '1rem 1.5rem', boxShadow: '0 20px 40px rgba(255,71,87,0.4)', zIndex: 10 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.8 }}>VERIFICATION SPEED</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>~2s</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ──────────────────────────────── */}
      <section id="categories" style={{ padding: '0 0 var(--section-gap)' }}>
        <div className="apple-grid">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="section-title" style={{ fontSize: '3.5rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", marginBottom: '1rem' }} dangerouslySetInnerHTML={{ __html: t('cat_title') }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
              {t('cat_subtitle')}
            </p>
          </div>
          <div className="category-grid">
            {CATEGORIES_DATA.map((item) => (
              <div key={item.key} className="category-card" onClick={() => openAuth('register')}>
                <div className="card-bg-img" style={{ backgroundImage: `url(${item.img})` }} />
                <div className="card-overlay" />
                <div className="card-content">
                  <h3 className="card-label">{t(`cat_${item.key}`)}</h3>
                  <p className="card-desc">{t(`cat_${item.key}_desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEEDBACK SECTION ────────────────────────── */}
      <section id="feedback-section" className="editorial-faq-section" style={{ padding: '0 0 8rem' }}>
        <div className="apple-grid">
          <div className="faq-section-inner">
            <div className="faq-header">
              <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Community Feedback</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Hear from our users or share your experience.</p>
            </div>

            <div className="faq-list">
              {feedback.map((item) => (
                <div key={item.id} className="faq-item" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1.5rem', background: 'var(--card-bg)', borderRadius: '12px', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.date}</div>
                  </div>
                  <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>{item.message}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '3rem', background: 'var(--card-bg)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontFamily: "'Outfit', sans-serif" }}>Leave a Feedback</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input type="text" placeholder="Your Name" value={newFeedbackName} onChange={(e) => setNewFeedbackName(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
                <textarea placeholder="Your Feedback" value={newFeedbackMessage} onChange={(e) => setNewFeedbackMessage(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100px' }} />
                <button 
                  onClick={async () => { 
                    if (newFeedbackName && newFeedbackMessage) { 
                      const newFB = {
                        name: newFeedbackName,
                        message: newFeedbackMessage,
                        date: new Date().toISOString().split('T')[0]
                      };
                      try {
                        const docRef = await addDoc(collection(db, "feedback"), newFB);
                        setFeedback([{ id: docRef.id, ...newFB }, ...feedback]);
                        setNewFeedbackName('');
                        setNewFeedbackMessage('');
                      } catch (e) {
                        alert("Failed to submit feedback: " + e.message);
                      }
                    } 
                  }} 
                  className="btn-primary" 
                  style={{ padding: '0.75rem', borderRadius: '8px' }}
                >
                  Submit Feedback
                </button>
              </div>
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <button 
                onClick={() => navigate("/admin-login")} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', opacity: 0.15, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }} 
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'} 
                onMouseLeave={e => e.currentTarget.style.opacity = '0.15'}
                title="Developer Options"
              >
                <Settings size={12} /> Developer Options
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ──────────────────────────────── */}
      <section className="editorial-footer-cta">
        <div className="apple-grid">
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1.5rem', position: 'relative' }}>
            {t('cta_footer_location')}
          </p>
          <h2 dangerouslySetInnerHTML={{ __html: t('cta_footer_title') }} />
          <p>{t('cta_footer_desc')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2.5rem' }}>
            <button onClick={() => openAuth('register')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: '#fff', color: '#0F172A', border: 'none', padding: '1.1rem 2.5rem', borderRadius: '16px', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", boxShadow: '0 20px 40px rgba(0,0,0,0.3)', transition: 'all 0.3s ease', position: 'relative' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 28px 50px rgba(0,0,0,0.4)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)'; }}>
              {t('cta_footer_btn')} <ArrowRight size={20} />
            </button>
            <button onClick={() => document.getElementById('feedback-section')?.scrollIntoView({ behavior: 'smooth' })} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem 1.25rem', borderRadius: '999px', fontWeight: 800, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.3s ease', letterSpacing: '0.05em' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
              <span>FEEDBACK FORUM</span>
            </button>
            <div className="language-toggle-pill" onClick={toggleLanguage} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem 1.25rem', borderRadius: '999px', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', transition: 'all 0.3s ease', letterSpacing: '0.05em' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
              <Languages size={14} />
              <span>{lang === 'en' ? 'ENGLISH' : lang === 'tl' ? 'TAGALOG' : 'BISAYA'}</span>
            </div>
          </div>
          <div style={{ marginTop: '5rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', textAlign: 'center' }}>
            © 2026 KomuniTrade. {t('footer_tagline')}
          </div>
        </div>
      </section>

      {/* ── AUTH MODAL ──────────────────────────────── */}
      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button className="auth-modal-close" onClick={() => setShowAuthModal(false)} style={{ top: '1.5rem', right: '1.5rem', zIndex: 10 }}>
              <X size={20} />
            </button>
            <Auth />
          </div>
        </div>
      )}

    </div>
  );
}
