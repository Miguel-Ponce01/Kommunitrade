import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, X, Mail, Lock, Sparkles } from 'lucide-react';
import '../index.css';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const fillDemoAccount = () => {
    setEmail('neighbor@davao.com');
    setPassword('demo1234');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(`${mode === 'login' ? 'Logging in' : 'Registering'} with ${email}`);
    localStorage.setItem('userRole', 'user');
    navigate('/app'); 
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>

        {/* Top row: brand + close button clearly inside the popup */}
        <div className="auth-modal-top-row">
          <div className="auth-modal-brand">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 10H18L17 19C17 20.1046 16.1046 21 15 21H9C7.89543 21 7 20.1046 7 19L6 10Z" fill="var(--primary)" fillOpacity="0.15" stroke="var(--primary)" strokeWidth="2"/>
              <path d="M9 10V6C9 4.34315 10.3431 3 12 3L12 3C13.6569 3 15 4.34315 15 6V10" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 2L9 5H15L12 2Z" fill="var(--primary)"/>
              <path d="M6 10H18" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            KomuniTrade
          </div>
          <button className="auth-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="auth-header">
          <p className="auth-subtitle" style={{ fontSize: '1rem', marginTop: '0' }}>
            {mode === 'login' ? 'Sign in to your neighborhood marketplace' : 'Create an account to start trading'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <input 
                type="email" 
                id="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="neighbor@davao.com" 
                required 
              />
              <Mail className="input-icon" size={18} />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <input 
                type="password" 
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required 
              />
              <Lock className="input-icon" size={18} />
            </div>
          </div>

          <button type="submit" className="btn-primary flex-center" style={{ width: '100%', marginTop: '1rem', height: '56px', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 800 }}>
            {mode === 'login' ? 'Sign In' : 'Register Now'} <ArrowRight size={20} style={{ marginLeft: '10px' }} />
          </button>
        </form>

        {/* Enhanced Demo Accounts Panel */}
        <div className="demo-account-panel">
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Fast-Track Demo
          </p>
          <button 
            type="button" 
            className="demo-btn"
            onClick={fillDemoAccount} 
          >
            <Sparkles size={16} /> Fill Demo Account
          </button>
        </div>

        <div className="auth-footer" style={{ marginTop: '2rem' }}>
          {mode === 'login' ? (
            <p style={{ fontSize: '0.9rem' }}>Don't have an account? <span className="auth-link" style={{ color: 'var(--primary)', fontWeight: 800, textDecoration: 'none' }} onClick={() => setMode('register')}>Create one now</span></p>
          ) : (
            <p style={{ fontSize: '0.9rem' }}>Already have an account? <span className="auth-link" style={{ color: 'var(--primary)', fontWeight: 800, textDecoration: 'none' }} onClick={() => setMode('login')}>Sign in</span></p>
          )}
        </div>
      </div>
    </div>
  );
}
