import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initAnonymousAuth } from './firebase';
import Landing from './pages/Landing';
import Home from './pages/Home';
import PostItem from './pages/PostItem';
import ItemDetails from './pages/ItemDetails';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import { LanguageProvider } from './hooks/useLanguage.jsx';

function App() {
  useEffect(() => {
    // Automatically sign in anonymously on app startup
    initAnonymousAuth().catch(err => console.error("Initial Auth Failed:", err));
  }, []);

  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          
          {/* Protected App Routes */}
          <Route path="/app" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="post" element={<PostItem />} />
            <Route path="item/:id" element={<ItemDetails />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  )
}

export default App;
