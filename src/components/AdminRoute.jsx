import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminRoute({ children }) {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
        Loading Admin Portal...
      </div>
    );
  }

  if (!userProfile || userProfile.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
