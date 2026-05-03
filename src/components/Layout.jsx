import { Outlet, NavLink } from 'react-router-dom';
import { Home, Plus, MessageCircle, User, MapPin } from 'lucide-react';

export default function Layout() {
  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <nav className="app-sidebar">
        <div className="sidebar-logo">
          <MapPin size={28} color="var(--primary)" />
          <span className="logo-text">KomuniTrade</span>
        </div>
        
        <div className="sidebar-links">
          <NavLink to="/app" end className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <div className="active-pill"></div>
            <Home className="nav-icon" />
            <span className="nav-label">Home</span>
          </NavLink>
          
          <NavLink to="/app/messages" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <div className="active-pill"></div>
            <MessageCircle className="nav-icon" />
            <span className="nav-label">Chat</span>
          </NavLink>
          
          <NavLink to="/app/profile" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <div className="active-pill"></div>
            <User className="nav-icon" />
            <span className="nav-label">Profile</span>
          </NavLink>
        </div>

        {/* Global Action Button inside Sidebar for Desktop */}
        <div className="sidebar-action">
          <NavLink to="/app/post" className="nav-item post-btn">
            <Plus size={24} />
            <span className="nav-label">New Listing</span>
          </NavLink>
        </div>
      </nav>

      {/* Main Content Stage */}
      <main className="main-content">
        <header className="mobile-header">
          <MapPin size={24} color="var(--primary)" />
          <span className="logo-text">KomuniTrade</span>
        </header>
        <div className="content-scroll">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation (Visible only on small screens) */}
      <nav className="mobile-bottom-nav">
        <NavLink to="/app" end className={({isActive}) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Home />
        </NavLink>
        
        <NavLink to="/app/messages" className={({isActive}) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <MessageCircle />
        </NavLink>
        
        <NavLink to="/app/post" className="mobile-nav-item mobile-post-btn">
          <Plus size={24} />
        </NavLink>

        <NavLink to="/app/profile" className={({isActive}) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <User />
        </NavLink>
      </nav>
    </div>
  );
}
