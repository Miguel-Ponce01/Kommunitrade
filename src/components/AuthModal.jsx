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
        <button className="auth-modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="auth-header">
          <div className="auth-logo">
            <ShoppingBag className="auth-icon" size={32} color="var(--primary)" />
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 900 }}>KomuniTrade</h2>
          </div>
          <p className="auth-subtitle" style={{ fontSize: '1rem', marginTop: '0.5rem' }}>
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
