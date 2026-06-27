import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Lock, CheckCircle, Languages, X, MapPin, Star, Settings, Camera, ShieldCheck, Handshake, Download, Wifi, Zap, Smartphone, Loader2 } from 'lucide-react';
import Auth from './Login';
import { useLanguage } from '../hooks/useLanguage.jsx';
import { db, collection, addDoc, getDocs } from '../firebase';
import GoogleMap from '../components/GoogleMap';
import '../index.css';

/* ─── Count-up hook ──────────────────────────────────────────────── */
function useCountUp(target, duration = 2000, startCounting = false) {
  const [count, setCount] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!startCounting || hasRun.current) return;
    hasRun.current = true;

    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, startCounting]);

  return count;
}

/* ─── Particle data (memoized) ───────────────────────────────────── */
function generateParticles(n = 14) {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    size: 4 + Math.random() * 10,
    top: `${10 + Math.random() * 80}%`,
    left: `${5 + Math.random() * 90}%`,
    dx: `${-80 + Math.random() * 160}px`,
    dy: `${-140 + Math.random() * 80}px`,
    scaleEnd: 0.3 + Math.random() * 0.7,
    dur: `${8 + Math.random() * 14}s`,
    delay: `${-Math.random() * 12}s`,
  }));
}

export default function Landing() {
  const navigate = useNavigate();
  const { lang, setLang, t } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [newFeedbackName, setNewFeedbackName] = useState('');
  const [newFeedbackMessage, setNewFeedbackMessage] = useState('');
  const [newFeedbackRating, setNewFeedbackRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitSuccess, setFeedbackSubmitSuccess] = useState(false);
  const [feedbackValidationError, setFeedbackValidationError] = useState('');

  // PWA install prompt
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Stats count-up trigger
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);

  // Particles
  const particles = useMemo(() => generateParticles(14), []);

  const scrollToTop = () => {
    document.querySelector('.editorial-landing')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
            { name: 'Ramon from Buhangin', message: 'Traded my excess garden mangoes for a working router in under an hour. Clean local transaction!', rating: 5, date: '2026-06-12' },
            { name: 'Sarah from Matina', message: 'The AI scanner auto-filled everything from my photo including a suggested price. Super smooth experience!', rating: 5, date: '2026-06-14' },
            { name: 'Dave from Poblacion', message: 'Secure meetup receipts with pin verification are a game changer. No more flaky barter partners.', rating: 5, date: '2026-06-15' },
            { name: 'Lani from Agdao', message: 'I love how easy it is to find pre-loved items near me. Saved ₱1,500 on textbooks already.', rating: 5, date: '2026-06-16' },
            { name: 'Marco from Obrero', message: 'The face verification feature makes me feel safe meeting other local traders. Best local app ever!', rating: 5, date: '2026-06-18' }
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

  // Scroll detection for navbar
  useEffect(() => {
    const container = document.querySelector('.editorial-landing');
    const handleScroll = () => setScrolled(container?.scrollTop > 20);
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Scroll-Reveal Intersection Observer ──
  useEffect(() => {
    const els = document.querySelectorAll('.kt-reveal, .kt-reveal-group');
    if (!els.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('kt-visible');
        }
      });
    }, { threshold: 0.15 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [feedback]); // re-run after feedback loads to catch testimonial section

  // ── Stats counter Intersection Observer ──
  useEffect(() => {
    if (!statsRef.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setStatsVisible(true);
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  // ── PWA beforeinstallprompt ──
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handlePWAInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackValidationError('');

    if (!newFeedbackName.trim()) {
      setFeedbackValidationError('Please enter your name.');
      return;
    }
    if (!newFeedbackMessage.trim()) {
      setFeedbackValidationError('Please enter a feedback message.');
      return;
    }

    setIsSubmittingFeedback(true);

    const newFB = {
      name: newFeedbackName.trim(),
      message: newFeedbackMessage.trim(),
      rating: newFeedbackRating,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      await new Promise(r => setTimeout(r, 800)); // Soothing transition delay
      const docRef = await addDoc(collection(db, "feedback"), newFB);
      setFeedback(prev => [{ id: docRef.id, ...newFB }, ...prev]);
      setNewFeedbackName('');
      setNewFeedbackMessage('');
      setNewFeedbackRating(5);
      setFeedbackSubmitSuccess(true);
      setTimeout(() => {
        setFeedbackSubmitSuccess(false);
      }, 4500);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      setFeedbackValidationError('Failed to submit. Please try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

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

  // Count-up values
  const listingsCount = useCountUp(2000, 2200, statsVisible);
  const sellersCount = useCountUp(500, 2000, statsVisible);
  const satisfactionCount = useCountUp(98, 1800, statsVisible);

  // Duplicate feedback for seamless carousel loop
  const carouselItems = useMemo(() => {
    if (feedback.length === 0) return [];
    // Ensure enough items for smooth infinite scroll
    const base = feedback.length < 6 ? [...feedback, ...feedback, ...feedback] : feedback;
    return [...base, ...base]; // duplicate for seamless loop
  }, [feedback]);

  return (
    <div className="editorial-landing animate-fade-in" style={{ backgroundColor: 'var(--colors-canvas-night)', color: 'var(--colors-on-primary)', minHeight: '100vh' }}>
      <style>{`
        .editorial-landing {
          background-color: var(--colors-canvas-night) !important;
          color: var(--colors-on-primary) !important;
        }
        .kt-editorial-nav {
          display: flex;
          align-items: center;
          padding: 16px 24px;
          background-color: transparent;
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          transition: background-color 0.3s;
        }
        .kt-editorial-nav.scrolled {
          background-color: var(--colors-canvas-night);
          border-bottom: 1px solid var(--colors-hairline-dark);
        }
        .kt-nav-inner {
          display: flex;
          justify-content: space-between;
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
        }
        .kt-nav-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .kt-nav-brand:hover {
          transform: scale(1.02);
        }
        .kt-brand-logo {
          width: 32px;
          height: 32px;
          filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.4));
          transition: transform 0.2s ease;
        }
        .kt-nav-brand:hover .kt-brand-logo {
          transform: rotate(5deg) scale(1.08);
        }
        .kt-brand-text {
          font-family: 'NeueHaasGrotesk Display', Helvetica, Arial, sans-serif;
          font-weight: 500;
          font-size: 1.6rem;
          letter-spacing: 0.5px;
          color: #10B981;
          transition: color 0.2s;
        }
        .kt-nav-brand:hover .kt-brand-text {
          color: var(--colors-on-primary);
        }
        .kt-nav-link {
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          color: var(--colors-shade-30);
          text-decoration: none;
          margin: 0 12px;
        }
        .kt-nav-link:hover { color: var(--colors-on-primary); }
        .kt-hero {
          position: relative;
          padding: 192px 24px 128px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          overflow: hidden;
        }
        .kt-hero-heading {
          font-family: 'NeueHaasGrotesk Display', Helvetica, Arial, sans-serif;
          font-size: 96px;
          font-weight: 330;
          line-height: 1.0;
          letter-spacing: 2.4px;
          color: var(--colors-on-primary);
          margin-bottom: 32px;
          position: relative;
          z-index: 10;
        }
        @media (max-width: 768px) {
          .kt-hero-heading { font-size: 55px; letter-spacing: 0; }
        }
        .kt-hero-sub {
          font-family: 'Inter', sans-serif;
          font-size: 18px;
          font-weight: 420;
          color: var(--colors-shade-30);
          max-width: 600px;
          margin: 0 auto 48px;
          position: relative;
          z-index: 10;
        }
        .kt-hero-image-wrap {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          z-index: 0;
          opacity: 0.4;
        }
        .kt-hero-img {
          width: 100%; height: 100%; object-fit: cover;
        }
        .kt-order-btn, .kt-cta-pill {
          background: transparent;
          color: var(--colors-on-primary);
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          font-weight: 420;
          border-radius: 9999px;
          padding: 12px 26px;
          border: 2px solid var(--colors-on-primary);
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          position: relative;
          z-index: 10;
        }
        .kt-order-btn:hover, .kt-cta-pill:hover { background: rgba(255,255,255,0.1); }

        /* ── SMARTER TRADING SECTION ── */
        .kt-smarter-trading-section {
          background-color: var(--colors-canvas-night);
          padding: 128px 24px;
          border-top: 1px solid var(--colors-hairline-dark);
          color: var(--colors-on-primary);
        }
        .kt-smarter-heading {
          font-family: 'NeueHaasGrotesk Display', Helvetica, Arial, sans-serif;
          font-size: 48px;
          font-weight: 330;
          line-height: 1.14;
          letter-spacing: -0.02em;
          margin-bottom: 56px;
          color: var(--colors-on-primary);
          text-align: left;
        }
        .kt-smarter-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 80px;
        }
        @media (max-width: 992px) {
          .kt-smarter-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .kt-smarter-heading {
            font-size: 36px;
            margin-bottom: 40px;
          }
        }
        .kt-smarter-card {
          background-color: var(--colors-canvas-night-elevated);
          border: 1px solid var(--colors-hairline-dark);
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.3s ease, border-color 0.3s ease;
        }
        .kt-smarter-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 255, 255, 0.15);
        }
        .kt-smarter-graphic-wrap {
          height: 220px;
          position: relative;
          overflow: hidden;
          background: radial-gradient(circle at center, #111111 0%, #050505 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid var(--colors-hairline-dark);
        }
        
        /* Card 1: Meetup Receipt Mockup */
        .mockup-meetup-card {
          width: 190px;
          background: #ffffff;
          color: #1a1a1a;
          border-radius: 12px;
          padding: 14px;
          font-family: 'Inter', sans-serif;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          transform: rotate(-3deg);
          transition: transform 0.3s ease;
        }
        .kt-smarter-card:hover .mockup-meetup-card {
          transform: rotate(0deg) scale(1.03);
        }
        .mockup-meetup-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 8px;
        }
        .mockup-user-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #000000;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
        }
        .mockup-username {
          font-size: 10px;
          font-weight: 600;
          text-align: left;
        }
        .mockup-item {
          font-size: 8px;
          color: #666666;
          text-align: left;
        }
        .mockup-meetup-details {
          font-size: 9px;
          margin-bottom: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
        }
        .detail-row span {
          color: #888888;
        }
        .badge-verified {
          background: #d4f9e0;
          color: #0b512c;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 7px;
          font-weight: 700;
        }
        .mockup-meetup-action {
          width: 100%;
        }
        .btn-shop-pay {
          width: 100%;
          background: #5a31f4;
          color: white;
          border: none;
          padding: 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }
        .floating-badge {
          position: absolute;
          background: var(--colors-on-primary);
          color: var(--colors-primary);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }
        .map-badge {
          bottom: 20px;
          right: 30px;
          transform: rotate(10deg);
        }
        
        /* Card 2: AI Scanner Mockup */
        .mockup-ai-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mockup-ai-frame {
          width: 110px;
          height: 110px;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          border: 1px solid rgba(255,255,255,0.1);
          background: #111111;
        }
        .mockup-ai-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.8;
        }
        .mockup-ai-scanner-line {
          position: absolute;
          width: 100%;
          height: 2px;
          background: #c1fbd4;
          box-shadow: 0 0 8px #c1fbd4;
          top: 0;
          left: 0;
          animation: scan 2s linear infinite;
          z-index: 2;
        }
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .mockup-ai-tags {
          position: absolute;
          left: 15px;
          bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ai-tag {
          font-size: 8px;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #eeeeee;
          padding: 3px 6px;
          border-radius: 4px;
          font-weight: 500;
          white-space: nowrap;
          text-align: left;
        }
        .ai-tag.tag-green {
          border-color: #c1fbd4;
          color: #c1fbd4;
        }
        .ai-tag.tag-purple {
          border-color: #d6bbfb;
          color: #d6bbfb;
        }
        .ai-sparkle {
          position: absolute;
          color: #d6bbfb;
          font-size: 16px;
          text-shadow: 0 0 5px #d6bbfb;
          animation: pulse-sparkle 1.5s ease-in-out infinite alternate;
        }
        .sparkle-1 { top: 40px; right: 40px; }
        .sparkle-2 { bottom: 50px; right: 25px; animation-delay: 0.75s; }
        @keyframes pulse-sparkle {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.2); opacity: 1; }
        }

        /* Card 3: Radar Map Mockup */
        .mockup-radar-container {
          position: relative;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          border: 1px dashed rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .mockup-davao-map-overlay {
          position: absolute;
          width: 100%;
          height: 100%;
          background: url('/davao_map_clean.webp') no-repeat center;
          background-size: cover;
          opacity: 0.15;
        }
        .radar-circle {
          position: absolute;
          border: 1px solid rgba(193, 251, 212, 0.2);
          border-radius: 50%;
          animation: radar-pulse 3s linear infinite;
        }
        .circle-1 { width: 60px; height: 60px; }
        .circle-2 { width: 120px; height: 120px; animation-delay: 1s; }
        .circle-3 { width: 180px; height: 180px; animation-delay: 2s; }
        .radar-center {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #c1fbd4;
          box-shadow: 0 0 8px #c1fbd4;
          z-index: 2;
        }
        @keyframes radar-pulse {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(1.2); opacity: 0; }
        }
        .radar-marker {
          position: absolute;
          font-size: 12px;
          z-index: 2;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
          animation: marker-bounce 2s ease-in-out infinite alternate;
        }
        .marker-1 { top: 40px; left: 50px; }
        .marker-2 { bottom: 45px; right: 50px; animation-delay: 0.5s; }
        .marker-3 { top: 80px; right: 35px; animation-delay: 1s; }
        @keyframes marker-bounce {
          0% { transform: translateY(0); }
          100% { transform: translateY(-4px); }
        }
        .radar-stats {
          position: absolute;
          background: rgba(0,0,0,0.85);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 50%;
          width: 90px;
          height: 90px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(0,0,0,0.4);
          z-index: 3;
        }
        .radar-metric {
          font-family: 'NeueHaasGrotesk Display', sans-serif;
          font-size: 16px;
          font-weight: 500;
          color: #c1fbd4;
        }
        .radar-label {
          font-size: 7px;
          color: #888888;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 2px;
        }

        /* Card Typography details */
        .kt-smarter-card-title {
          font-family: 'NeueHaasGrotesk Display', Helvetica, Arial, sans-serif;
          font-size: 20px;
          font-weight: 500;
          margin: 24px 24px 8px;
          color: var(--colors-on-primary);
          text-align: left;
        }
        .kt-smarter-card-desc {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: var(--colors-shade-30);
          line-height: 1.5;
          margin-bottom: 24px;
          padding: 0 24px;
          text-align: left;
        }

        /* Quote Section at the bottom */
        .kt-smarter-quote-wrap {
          border-top: 1px solid var(--colors-hairline-dark);
          padding-top: 48px;
          margin-top: 48px;
          text-align: left;
        }
        .kt-smarter-quote {
          font-family: 'NeueHaasGrotesk Display', Helvetica, Arial, sans-serif;
          font-size: 26px;
          font-weight: 330;
          line-height: 1.4;
          color: var(--colors-on-primary);
          margin-bottom: 24px;
          max-width: 800px;
          text-align: left;
        }
        .kt-smarter-quote-author {
          font-family: 'Inter', sans-serif;
        }
        .author-name {
          font-weight: 600;
          font-size: 14px;
          color: var(--colors-on-primary);
        }
        .author-role {
          font-size: 12px;
          color: var(--colors-shade-40);
          margin-top: 2px;
        }
        .zest-design-image {
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .zest-design-image:hover {
          transform: scale(1.04);
        }
      `}</style>

      {/* ── NAVBAR ──────────────────────────────────── */}
      <nav className={`kt-editorial-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="kt-nav-inner">
          {/* Brand */}
          <div className="kt-nav-brand" onClick={scrollToTop} title="Scroll to top">
            <img src="/logo.svg" alt="KomuniTrade Logo" className="kt-brand-logo" />
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

        {/* Floating particles */}
        {particles.map(p => (
          <span
            key={p.id}
            className="kt-particle"
            style={{
              width: p.size, height: p.size,
              top: p.top, left: p.left,
              '--dx': p.dx, '--dy': p.dy, '--scale-end': p.scaleEnd,
              animationDuration: p.dur, animationDelay: p.delay,
            }}
          />
        ))}

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
          </button>

        </div>

      </section>

      {/* ── STATS COUNTER SECTION ──────────────────── */}
      <section className="kt-stats-section" ref={statsRef}>
        <div className="apple-grid">
          <div className="kt-stats-header kt-reveal">
            <h2>{t('stats_counter_title')}</h2>
            <p>{t('stats_counter_subtitle')}</p>
          </div>
          <div className="kt-stats-grid kt-reveal-group kt-reveal">
            <div className="kt-stat-card kt-reveal-child">
              <div className="kt-stat-icon listings"><ShieldCheck size={22} /></div>
              <div className="kt-stat-number">{listingsCount.toLocaleString()}+</div>
              <div className="kt-stat-label">{t('stats_listings_label')}</div>
            </div>
            <div className="kt-stat-card kt-reveal-child">
              <div className="kt-stat-icon sellers"><CheckCircle size={22} /></div>
              <div className="kt-stat-number">{sellersCount.toLocaleString()}+</div>
              <div className="kt-stat-label">{t('stats_sellers_label')}</div>
            </div>
            <div className="kt-stat-card kt-reveal-child">
              <div className="kt-stat-icon rating"><Star size={22} /></div>
              <div className="kt-stat-number">{satisfactionCount}%</div>
              <div className="kt-stat-label">{t('stats_satisfaction_label')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SMARTER TRADING STARTS HERE ── */}
      <section className="kt-smarter-trading-section kt-reveal">
        <div className="apple-grid">
          <h2 className="kt-smarter-heading">{t('smarter_trading_title')}</h2>
          
          <div className="kt-smarter-grid">
            {/* Card 1: Safe Meetups */}
            <div className="kt-smarter-card">
              <div className="kt-smarter-graphic-wrap">
                <div className="mockup-meetup-card">
                  <div className="mockup-meetup-header">
                    <div className="mockup-user-avatar">J</div>
                    <div>
                      <div className="mockup-username">Juan D. (Seller)</div>
                      <div className="mockup-item">Fresh Durian • 5kg</div>
                    </div>
                  </div>
                  <div className="mockup-meetup-details">
                    <div className="detail-row"><span>Meetup Spot</span><strong>Barangay 11-B Hotspot</strong></div>
                    <div className="detail-row"><span>Status</span><span className="badge-verified">Verified Meetup Zone</span></div>
                    <div className="detail-row"><span>Total</span><strong>₱1,250.00</strong></div>
                  </div>
                  <div className="mockup-meetup-action">
                    <button className="btn-shop-pay">Accept & Meet</button>
                  </div>
                </div>
                <div className="floating-badge map-badge"><MapPin size={18} /></div>
              </div>
              <h3 className="kt-smarter-card-title">{t('smarter_card1_title')}</h3>
              <p className="kt-smarter-card-desc">{t('smarter_card1_desc')}</p>
            </div>

            {/* Card 2: AI verification */}
            <div className="kt-smarter-card">
              <div className="kt-smarter-graphic-wrap">
                <div className="mockup-ai-container">
                  <div className="mockup-ai-frame">
                    <div className="mockup-ai-scanner-line" />
                    <img src="/fresh.webp" alt="AI item check" className="mockup-ai-img" />
                  </div>
                  <div className="mockup-ai-tags">
                    <span className="ai-tag">Item: Durian 100%</span>
                    <span className="ai-tag tag-green">Safe Content ✓</span>
                    <span className="ai-tag tag-purple">Fair Price Match ✓</span>
                  </div>
                  <div className="ai-sparkle sparkle-1">✦</div>
                  <div className="ai-sparkle sparkle-2">✦</div>
                </div>
              </div>
              <h3 className="kt-smarter-card-title">{t('smarter_card2_title')}</h3>
              <p className="kt-smarter-card-desc">{t('smarter_card2_desc')}</p>
            </div>

            {/* Card 3: Fast Local Matching */}
            <div className="kt-smarter-card">
              <div className="kt-smarter-graphic-wrap">
                <div className="mockup-radar-container">
                  <div className="mockup-davao-map-overlay" />
                  <div className="radar-circle circle-1" />
                  <div className="radar-circle circle-2" />
                  <div className="radar-circle circle-3" />
                  <div className="radar-center" />
                  <div className="radar-marker marker-1">📱</div>
                  <div className="radar-marker marker-2">👚</div>
                  <div className="radar-marker marker-3">🍍</div>
                  <div className="radar-stats">
                    <div className="radar-metric">98.4%</div>
                    <div className="radar-label">Local Match Rate</div>
                  </div>
                </div>
              </div>
              <h3 className="kt-smarter-card-title">{t('smarter_card3_title')}</h3>
              <p className="kt-smarter-card-desc">{t('smarter_card3_desc')}</p>
            </div>
          </div>

          <div className="kt-smarter-quote-wrap">
            <p className="kt-smarter-quote">{t('smarter_quote')}</p>
            <div className="kt-smarter-quote-author">
              <div className="author-name">{t('smarter_quote_author')}</div>
              <div className="author-role">{t('smarter_quote_role')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST SECTION ───────────────────────────── */}
      <section id="trust" className="kt-reveal" style={{ background: 'var(--colors-canvas-night)', padding: '128px 0', position: 'relative', borderTop: '1px solid var(--colors-hairline-dark)' }}>
        <div className="apple-grid" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid var(--colors-shade-50)', color: 'var(--colors-shade-30)', padding: '0.4rem 1rem', borderRadius: '9999px', fontWeight: 500, fontSize: '0.85rem', marginBottom: '1.5rem', fontFamily: "'Inter', sans-serif" }}>
                <Shield size={14} /> {t('trust_badge')}
              </div>
              <h2 style={{ fontSize: '70px', fontWeight: 330, fontFamily: "'NeueHaasGrotesk Display', Helvetica, Arial, sans-serif", lineHeight: 1.0, marginBottom: '1.5rem', color: 'var(--colors-on-primary)', letterSpacing: '0' }}>
                {t('trust_title')}
              </h2>
              <p style={{ color: 'var(--colors-shade-30)', lineHeight: 1.56, fontSize: '18px', fontWeight: 550, marginBottom: '2rem', fontFamily: "'Inter', sans-serif" }}>
                {t('trust_desc')}
              </p>
              {[
                [<Lock size={20} />, t('trust_feat1_title'), t('trust_feat1_desc')],
                [<CheckCircle size={20} />, t('trust_feat2_title'), t('trust_feat2_desc')],
                [<Shield size={20} />, t('trust_feat3_title'), t('trust_feat3_desc')],
              ].map(([icon, title, desc]) => (
                <div key={title} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ color: 'var(--colors-on-primary)', flexShrink: 0, marginTop: '0.2rem' }}>{icon}</div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '20px', marginBottom: '0.25rem', color: 'var(--colors-on-primary)', fontFamily: "'NeueHaasGrotesk Display', Helvetica, Arial, sans-serif" }}>{title}</div>
                    <div style={{ fontSize: '16px', color: 'var(--colors-shade-40)', lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ borderRadius: '20px', overflow: 'hidden', background: 'var(--colors-canvas-night-elevated)', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '350px', border: '1px solid var(--colors-hairline-dark)', boxShadow: 'var(--shadow-premium)' }}>
                <img 
                  src="/zest_mockup.png" 
                  alt="Zest Shop Mockup Design" 
                  className="zest-design-image"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────── */}
      <section className="kt-how-section">
        <div className="apple-grid">
          <div className="kt-how-header kt-reveal">
            <h2>{t('hiw_title')}</h2>
            <p>{t('hiw_subtitle')}</p>
          </div>
          <div className="kt-how-steps kt-reveal-group kt-reveal">
            <div className="kt-step kt-reveal-child">
              <div className="kt-step-num">1</div>
              <div className="kt-step-title">{t('hiw_step1_title')}</div>
              <div className="kt-step-desc">{t('hiw_step1_desc')}</div>
              <div className="kt-connector" />
            </div>
            <div className="kt-step kt-reveal-child">
              <div className="kt-step-num">2</div>
              <div className="kt-step-title">{t('hiw_step2_title')}</div>
              <div className="kt-step-desc">{t('hiw_step2_desc')}</div>
              <div className="kt-connector" />
            </div>
            <div className="kt-step kt-reveal-child">
              <div className="kt-step-num">3</div>
              <div className="kt-step-title">{t('hiw_step3_title')}</div>
              <div className="kt-step-desc">{t('hiw_step3_desc')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ──────────────────────────────── */}
      <section id="categories" className="kt-reveal" style={{ padding: '0 0 var(--section-gap)' }}>
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

      {/* ── FEEDBACK / TESTIMONIALS SECTION ──────────── */}
      <section id="feedback-section" className="editorial-faq-section" style={{ padding: '0 0 8rem' }}>
        <div className="apple-grid">
          <div className="faq-section-inner">
            <div className="faq-header kt-reveal">
              <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Community Feedback</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Hear from our users or share your experience.</p>
            </div>

            {/* Auto-scrolling testimonial carousel */}
            {carouselItems.length > 0 && (
              <div className="kt-testimonial-section kt-reveal" style={{ marginBottom: '2.5rem' }}>
                <div className="kt-testimonial-track-wrapper">
                  <div className="kt-testimonial-track">
                    {carouselItems.map((item, idx) => (
                      <div key={`${item.id || item.name}-${idx}`} className="kt-testimonial-card">
                        <div className="kt-testimonial-top">
                          <div className="kt-testimonial-avatar">
                            {(item.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="kt-testimonial-meta">
                            <div className="kt-testimonial-name">{item.name}</div>
                            <div className="kt-testimonial-date">{item.date}</div>
                          </div>
                        </div>
                        <div className="kt-testimonial-stars">
                          {[1, 2, 3, 4, 5].map(s => {
                            const isFilled = s <= (item.rating || 5);
                            return (
                              <Star 
                                key={s} 
                                size={14} 
                                fill={isFilled ? "#FACC15" : "transparent"} 
                                stroke={isFilled ? "#FACC15" : "rgba(255,255,255,0.3)"} 
                              />
                            );
                          })}
                        </div>
                        <div className="kt-testimonial-msg">{item.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Premium Glassmorphic Feedback form */}
            <div className="kt-reveal" style={{ 
              marginTop: '1rem', 
              background: 'rgba(255, 255, 255, 0.03)', 
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              padding: '2.5rem', 
              borderRadius: '24px', 
              border: '1px solid rgba(255, 255, 255, 0.06)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
            }}>
              {feedbackSubmitSuccess ? (
                <div style={{
                  padding: '1.5rem 0',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem',
                  animation: 'fadeIn 0.4s ease'
                }}>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    color: '#10B981',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}>
                    <CheckCircle size={30} />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Feedback Received!</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '320px', lineHeight: 1.55, margin: 0 }}>
                    Thank you for sharing your experience. Your rating helps us make hyperlocal trading safer and more connected.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'left' }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 850, marginBottom: '0.25rem', color: 'var(--text-main)', fontFamily: "'Outfit', sans-serif" }}>Share Your Experience</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Your feedback is public and helps improve the Davao community trading space.</p>
                  </div>

                  {/* Star Rating Picker */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overall Rating</label>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      {[1, 2, 3, 4, 5].map((s) => {
                        const isHighlighted = s <= (hoverRating || newFeedbackRating);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setNewFeedbackRating(s)}
                            onMouseEnter={() => setHoverRating(s)}
                            onMouseLeave={() => setHoverRating(0)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px',
                              transition: 'transform 0.15s ease',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Star
                              size={26}
                              fill={isHighlighted ? "#FACC15" : "transparent"}
                              stroke={isHighlighted ? "#FACC15" : "rgba(255,255,255,0.25)"}
                              style={{ transition: 'fill 0.15s, stroke 0.15s' }}
                            />
                          </button>
                        );
                      })}
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FACC15', marginLeft: '0.5rem' }}>
                        {newFeedbackRating === 5 ? 'Excellent!' : newFeedbackRating === 4 ? 'Great!' : newFeedbackRating === 3 ? 'Good' : newFeedbackRating === 2 ? 'Fair' : 'Poor'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', textAlign: 'left' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Name / Alias</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Alex from Buhangin" 
                        value={newFeedbackName} 
                        onChange={(e) => setNewFeedbackName(e.target.value)} 
                        style={{ 
                          padding: '0.85rem 1rem', 
                          borderRadius: '12px', 
                          border: '1px solid rgba(255, 255, 255, 0.08)', 
                          background: 'rgba(0, 0, 0, 0.2)', 
                          color: 'var(--text-main)',
                          outline: 'none',
                          fontSize: '0.92rem',
                          fontFamily: 'inherit',
                          transition: 'border-color 0.2s'
                        }} 
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', textAlign: 'left' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Feedback Message</label>
                      <textarea 
                        placeholder="Tell us what you think of KomuniTrade..." 
                        value={newFeedbackMessage} 
                        onChange={(e) => setNewFeedbackMessage(e.target.value)} 
                        style={{ 
                          padding: '0.85rem 1rem', 
                          borderRadius: '12px', 
                          border: '1px solid rgba(255, 255, 255, 0.08)', 
                          background: 'rgba(0, 0, 0, 0.2)', 
                          color: 'var(--text-main)',
                          minHeight: '110px',
                          outline: 'none',
                          fontSize: '0.92rem',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          transition: 'border-color 0.2s'
                        }} 
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                      />
                    </div>
                  </div>

                  {feedbackValidationError && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.85rem 1rem',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '12px',
                      color: '#ef4444',
                      fontSize: '0.82rem',
                      textAlign: 'left'
                    }}>
                      <span>⚠️ {feedbackValidationError}</span>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={isSubmittingFeedback}
                    className="btn-primary" 
                    style={{
                      padding: '0.9rem',
                      borderRadius: '12px',
                      fontWeight: 750,
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      border: 'none',
                      marginTop: '0.5rem'
                    }}
                  >
                    {isSubmittingFeedback ? (
                      <>
                        <Loader2 className="animate-spin" size={18} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      "Submit Feedback"
                    )}
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ── PWA INSTALL SECTION ────────────────────── */}
      <section className="kt-pwa-section kt-reveal">
        <div className="apple-grid">
          <div className="kt-pwa-grid">
            <div className="kt-pwa-text">
              <h2>{t('pwa_title')}</h2>
              <p>{t('pwa_desc')}</p>
              <button className="kt-pwa-install-btn" onClick={handlePWAInstall}>
                <Download size={18} />
                <span>{t('pwa_cta')}</span>
              </button>
            </div>
            <div className="kt-pwa-features kt-reveal-group kt-reveal">
              <div className="kt-pwa-feat kt-reveal-child">
                <div className="kt-pwa-feat-icon"><Wifi size={18} /></div>
                <div className="kt-pwa-feat-text">
                  {t('pwa_feat1')}
                  <span>Browse even without internet</span>
                </div>
              </div>
              <div className="kt-pwa-feat kt-reveal-child">
                <div className="kt-pwa-feat-icon"><Zap size={18} /></div>
                <div className="kt-pwa-feat-text">
                  {t('pwa_feat2')}
                  <span>Cached assets for instant pages</span>
                </div>
              </div>
              <div className="kt-pwa-feat kt-reveal-child">
                <div className="kt-pwa-feat-icon"><Smartphone size={18} /></div>
                <div className="kt-pwa-feat-text">
                  {t('pwa_feat3')}
                  <span>No app store download required</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ──────────────────────────────── */}
      <section className="editorial-footer-cta" style={{ background: 'var(--colors-canvas-night)', padding: '128px 24px', borderTop: '1px solid var(--colors-hairline-dark)', textAlign: 'center' }}>
        <div className="apple-grid">
          <p style={{ color: 'var(--colors-shade-40)', fontSize: '12px', fontWeight: 400, letterSpacing: '0.72px', marginBottom: '24px', position: 'relative', fontFamily: "'Inter', sans-serif", textTransform: 'uppercase' }}>
            {t('cta_footer_location')}
          </p>
          <h2 style={{ fontFamily: "'NeueHaasGrotesk Display', sans-serif", fontSize: '55px', fontWeight: 330, color: 'var(--colors-on-primary)', marginBottom: '24px' }} dangerouslySetInnerHTML={{ __html: t('cta_footer_title') }} />
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '18px', color: 'var(--colors-shade-30)', maxWidth: '600px', margin: '0 auto 48px' }}>{t('cta_footer_desc')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2.5rem' }}>
            <button onClick={() => openAuth('register')} className="button-outline-on-dark" style={{ fontSize: '18px', padding: '16px 32px' }}>
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
            <Auth onClose={() => setShowAuthModal(false)} />
          </div>
        </div>
      )}

    </div>
  );
}
