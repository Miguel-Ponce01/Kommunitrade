import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, X } from 'lucide-react';
import '../index.css';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const fillDemoAccount = () => {
    setEmail('demo@komunitrade.com');
    setPassword('demo1234');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(`${mode === 'login' ? 'Logging in' : 'Registering'} with ${email}`);
    // Auth success routing
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
            <ShoppingBag className="auth-icon" />
            <h2>KomuniTrade</h2>
          </div>
          <p className="auth-subtitle">
            {mode === 'login' ? 'Sign in to your neighborhood marketplace' : 'Create an account to start trading'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="neighbor@davao.com" 
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              required 
            />
          </div>

          <button type="submit" className="btn-primary flex-center" style={{ width: '100%', marginTop: '1rem' }}>
            {mode === 'login' ? 'Sign In' : 'Register'} <ArrowRight size={18} style={{ marginLeft: '8px' }} />
          </button>
        </form>

        {/* Demo Accounts */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 600 }}>Prototype Demonstration</p>
          <button 
            type="button" 
            onClick={fillDemoAccount} 
            style={{ 
              width: '100%', 
              padding: '0.6rem', 
              fontSize: '0.875rem', 
              borderRadius: '8px', 
              border: '1px solid var(--primary)', 
              backgroundColor: 'transparent', 
              color: 'var(--primary)', 
              cursor: 'pointer', 
              fontWeight: 600 
            }}
          >
            Fill Demo Account
          </button>
        </div>

        <div className="auth-footer">
          {mode === 'login' ? (
            <p>Don't have an account? <span className="auth-link" onClick={() => setMode('register')}>Create one now</span></p>
          ) : (
            <p>Already have an account? <span className="auth-link" onClick={() => setMode('login')}>Sign in</span></p>
          )}
        </div>
      </div>
    </div>
  );
}
