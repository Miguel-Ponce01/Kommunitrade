import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';

export default function AuthAction() {
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const { verifyEmailCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');

    if (mode === 'verifyEmail' && oobCode) {
      verifyEmailCode(oobCode)
        .then(() => {
          setStatus('success');
        })
        .catch((err) => {
          console.error(err);
          setStatus('error');
          setMessage(err.message || 'The verification link is invalid or has expired.');
        });
    } else {
      setStatus('error');
      setMessage('Invalid or missing verification code.');
    }
  }, [location, verifyEmailCode]);

  return (
    <div className="login-container">
      <div className="login-blob login-blob-1"></div>
      <div className="login-blob login-blob-2"></div>
      
      <div className="auth-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        {status === 'verifying' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Loader2 size={48} className="auth-icon" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)', marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Verifying your email</h2>
            <p style={{ color: 'var(--text-muted)' }}>Please wait a moment...</p>
          </div>
        )}

        {status === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <CheckCircle size={40} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Your account is verified!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Thank you for confirming your email address.</p>
            <button className="btn-primary btn-full" onClick={() => navigate('/app')} style={{ padding: '0.85rem', borderRadius: '12px' }}>
              Continue to KomuniTrade <ArrowRight size={16} style={{ marginLeft: 8 }} />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <XCircle size={40} color="#ef4444" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Verification Failed</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{message}</p>
            <button className="btn-primary btn-full" onClick={() => navigate('/login')} style={{ padding: '0.85rem', borderRadius: '12px' }}>
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
