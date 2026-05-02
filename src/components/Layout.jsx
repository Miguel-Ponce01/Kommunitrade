import { Outlet, NavLink } from 'react-router-dom';
import { Home, Plus, MessageCircle, User, MapPin } from 'lucide-react';

export default function Layout() {
  return (
    <div className="app-container">
      {/* Top Nav */}
      <header className="top-nav glass">
        <div className="logo">
          <MapPin size={24} color="var(--primary)" />
          KomuniTrade
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav glass">
        <NavLink to="/" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Home />
          <span>Home</span>
        </NavLink>
        
        <NavLink to="/messages" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <MessageCircle />
          <span>Chat</span>
        </NavLink>
        
        <NavLink to="/post" className="nav-item post-btn">
          <Plus size={32} />
        </NavLink>

        <NavLink to="/profile" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <User />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
}
