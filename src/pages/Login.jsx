import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const fillDemoAccount = () => {
    setEmail('demo@komunitrade.com');
    setPassword('demo1234');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    console.log(`Logging in with ${email}`);
    // Auth success routing
    localStorage.setItem('userRole', 'user');
    navigate('/app'); 
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <ShoppingBag className="auth-icon" />
            <h2>KomuniTrade</h2>
          </Link>
          <p className="auth-subtitle">Sign in to your neighborhood marketplace</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
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

          <button type="submit" className="btn-primary flex-center" style={{ width: '100%' }}>
            Sign In <ArrowRight size={18} style={{ marginLeft: '8px' }} />
          </button>
        </form>

        {/* Demo Accounts */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 600 }}>Prototype Demonstration</p>
          <button 
            type="button" 
            onClick={fillDemoAccount} 
            style={{ width: '100%', padding: '0.6rem', fontSize: '0.875rem', borderRadius: '8px', border: '1px solid var(--primary)', backgroundColor: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
          >
            Fill Demo Account
          </button>
        </div>

        <div className="auth-footer">
          <p>Don't have an account? <span className="auth-link">Create one now</span></p>
        </div>
      </div>
    </div>
  );
}
