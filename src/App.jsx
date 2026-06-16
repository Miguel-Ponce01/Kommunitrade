import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './hooks/useLanguage.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import { lazy, Suspense } from 'react';

// Lazy-loaded pages — each is its own JS chunk, only downloaded when navigated to
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Home = lazy(() => import('./pages/Home'));
const PostItem = lazy(() => import('./pages/PostItem'));
const EditItem = lazy(() => import('./pages/EditItem'));
const ItemDetails = lazy(() => import('./pages/ItemDetails'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Messages = lazy(() => import('./pages/Messages'));
const TransactionHistory = lazy(() => import('./pages/TransactionHistory'));
const Verification = lazy(() => import('./pages/Verification'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminPortal = lazy(() => import('./pages/AdminPortal'));
const DeveloperOptions = lazy(() => import('./pages/DeveloperOptions'));
const AuthAction = lazy(() => import('./pages/AuthAction'));

// Lightweight full-screen loader shown while a lazy chunk downloads
function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--bg-color, #0a0a0a)'
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid rgba(16,185,129,0.2)',
        borderTopColor: '#10b981',
        animation: 'spin 0.7s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/auth/action" element={<AuthAction />} />

              {/* Protected Admin routes (No Layout) */}
              <Route
                path="/admin/*"
                element={
                  <AdminRoute>
                    <Routes>
                      <Route path="portal" element={<AdminPortal />} />
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="developer" element={<DeveloperOptions />} />
                    </Routes>
                  </AdminRoute>
                }
              />

              {/* Protected app routes */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Home />} />
                <Route path="post" element={<PostItem />} />
                <Route path="edit-item/:id" element={<EditItem />} />
                <Route path="item/:id" element={<ItemDetails />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="messages" element={<Messages />} />
                <Route path="transactions" element={<TransactionHistory />} />
                <Route path="verification" element={<Verification />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
