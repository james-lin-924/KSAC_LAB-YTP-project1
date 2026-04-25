import React, { useState, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

// SVG icon components
const Icons = {
  Home: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Planner: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="9" y1="16" x2="15" y2="16"/></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Explore: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
  Reels: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  Messages: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Notifications: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Profile: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Login: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>,
};

export default function Layout() {
  const { user, setUser, flashMessage, setFlashMessage, parseJsonSafely } = useAppContext();

  const navigate = useNavigate();
  const location = useLocation();

  const [showAuth, setShowAuth] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authData, setAuthData] = useState({ username: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');

  const navItems = [
    { name: 'Home', path: '/home', Icon: Icons.Home },
    { name: 'Planner', path: '/planner', Icon: Icons.Planner },
    { name: 'Search', path: '/search', Icon: Icons.Search },
    { name: 'Explore', path: '/explore', Icon: Icons.Explore },
    { name: 'Reels', path: '/reels', Icon: Icons.Reels },
    { name: 'Messages', path: '/messages', Icon: Icons.Messages },
    { name: 'Notifications', path: '/notifications', Icon: Icons.Notifications },
    { name: 'Profile', path: '/profile', Icon: Icons.Profile },
  ];

  const handleAuth = async () => {
    setAuthError('');
    const endpoint = isRegistering ? '/api/register' : '/api/login';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData),
      });
      const data = await parseJsonSafely(response);
      if (response.ok) {
        setUser(authData.username);
        setShowAuth(false);
        setFlashMessage(`Welcome, ${authData.username}! 👋`);
      } else {
        setAuthError(data.message || 'Authentication failed. Please try again.');
      }
    } catch {
      setAuthError('Network error. Please try again.');
    }
  };

  const AuthModal = () => (
    <div className="auth-modal" onClick={(e) => { if (e.target === e.currentTarget) setShowAuth(false); }}>
      <div className="auth-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3 style={{ margin: 0 }}>{isRegistering ? 'Create Account' : 'Welcome Back'}</h3>
          <button onClick={() => setShowAuth(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1 }}>✕</button>
        </div>
        <p style={{ margin: '0 0 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {isRegistering ? 'Join SnapTravel to plan unforgettable Taipei trips.' : 'Sign in to continue your Taipei journey.'}
        </p>
        {authError && <p style={{ color: '#fca5a5', fontSize: '0.85rem', margin: '0 0 0.5rem', padding: '0.6rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>{authError}</p>}
        <input
          placeholder="Username"
          value={authData.username}
          onChange={(e) => setAuthData({ ...authData, username: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
        />
        {isRegistering && (
          <input
            placeholder="Email"
            type="email"
            value={authData.email}
            onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
          />
        )}
        <input
          placeholder="Password"
          type="password"
          value={authData.password}
          onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
        />
        <button onClick={handleAuth} style={{ marginTop: '0.5rem' }}>
          {isRegistering ? 'Create Account' : 'Sign In'}
        </button>
        <button
          onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }}
          style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem', padding: '0.5rem' }}
        >
          {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );

  const isHome = location.pathname.startsWith('/home');

  return (
    <main className={`ig-layout ${isHome ? 'has-right-rail' : ''}`}>
      {showAuth && <AuthModal />}

      {/* Left Navigation */}
      <aside className="left-nav">
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h1 className="brand">SnapTravel</h1>
          <nav style={{ flex: 1 }}>
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    if (item.name === 'Profile' && !user) {
                      setShowAuth(true);
                    } else {
                      navigate(item.path);
                    }
                  }}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  title={item.name}
                >
                  <item.Icon />
                  <span className="nav-label">{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom user section */}
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginTop: '1rem' }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.5rem' }}>
                <div className="avatar" style={{ background: 'linear-gradient(135deg, var(--primary), #8b5cf6)', fontSize: '0.85rem' }}>
                  {user.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user}</div>
                  <div style={{ fontSize: '0.75rem', color: '#10b981' }}>● Online</div>
                </div>
              </div>
            ) : (
              <button className="nav-item" onClick={() => setShowAuth(true)} style={{ width: '100%' }}>
                <Icons.Login />
                <span className="nav-label">Login / Sign Up</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Feed Outlet */}
      <section className="main-feed">
        {flashMessage && <p className="flash-banner">{flashMessage}</p>}
        <Outlet />
      </section>

      {/* Right Rail - Only on Home */}
      {isHome && (
        <aside className="right-rail">
          <article className="profile-card">
            <div className="avatar large" style={{ background: 'linear-gradient(135deg, var(--primary), #8b5cf6)' }}>
              {user ? user.slice(0, 2).toUpperCase() : 'GS'}
            </div>
            <div>
              <h3>{user || 'Guest'}</h3>
              <p style={{ color: user ? '#10b981' : 'var(--text-muted)' }}>{user ? '● Online' : 'Not logged in'}</p>
            </div>
          </article>

          <section className="metrics-box">
            <h4>✨ AI Suggested Routes</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem' }}>
              {[
                { emoji: '☕', title: 'Dadaocheng Retro Walk', desc: 'Half-day route · historic cafes & tea houses', color: '#f59e0b' },
                { emoji: '🌲', title: 'Elephant Mountain Sunset', desc: 'Evening hike · Taipei 101 views · night market', color: '#10b981' },
                { emoji: '🎨', title: 'Huashan Culture Trail', desc: '文創 art hub · independent brands · exhibitions', color: '#8b5cf6' },
              ].map(route => (
                <button
                  key={route.title}
                  onClick={() => navigate('/planner')}
                  style={{ background: 'rgba(255,255,255,0.04)', padding: '0.8rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'left', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>{route.emoji}</span>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text)' }}>{route.title}</strong>
                  </div>
                  <small style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{route.desc}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="suggestions-box">
            <h4>🔥 Friends' Hot Routes</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem' }}>
              {[
                { initial: 'F', name: 'foodie.tpe', route: "Midnight Snack Run", saves: '2.1k', color: '#ec4899' },
                { initial: 'T', name: 'taipei.vibe', route: "Hidden Speakeasies", saves: '1.5k', color: '#6366f1' },
                { initial: 'L', name: 'luke', route: "Temple Hopping", saves: '987', color: '#10b981' },
              ].map(friend => (
                <div key={friend.name} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.4rem 0' }}>
                  <div className="avatar mini" style={{ margin: 0, background: `${friend.color}33`, border: `1px solid ${friend.color}66`, color: friend.color, fontWeight: '700' }}>
                    {friend.initial}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: '600' }}>{friend.route}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>by {friend.name} · {friend.saves} saves</div>
                  </div>
                  <button
                    onClick={() => navigate('/planner')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap' }}
                  >
                    Try →
                  </button>
                </div>
              ))}
            </div>
          </section>
        </aside>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        {navItems.slice(0, 5).map((item) => (
          <button
            key={`mobile-${item.name}`}
            type="button"
            onClick={() => navigate(item.path)}
            className={`nav-item mobile-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
            title={item.name}
          >
            <item.Icon />
          </button>
        ))}
      </nav>
    </main>
  );
}
