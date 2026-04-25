import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'like', user: 'foodie.tpe', avatar: 'F', color: '#ec4899', content: 'liked your itinerary "Rainy Day Taipei"', time: '2m ago', read: false },
  { id: 2, type: 'follow', user: 'taipei.vibe', avatar: 'T', color: '#6366f1', content: 'started following you', time: '15m ago', read: false },
  { id: 3, type: 'ai', user: 'AI Agent', avatar: '✨', color: '#10b981', content: 'New personalized route suggestion ready based on your saved spots', time: '1h ago', read: false, link: '/planner' },
  { id: 4, type: 'comment', user: 'legal.stay.tw', avatar: 'L', color: '#f59e0b', content: 'commented on your Shilin Night Market reel: "Great picks! 🍜"', time: '2h ago', read: true },
  { id: 5, type: 'like', user: 'taipei.vibe', avatar: 'T', color: '#6366f1', content: 'liked your Jiufen route post', time: '3h ago', read: true },
  { id: 6, type: 'system', user: 'SnapTravel', avatar: '🗺️', color: '#94a3b8', content: 'Welcome to SnapTravel! Your AI travel companion is ready to plan your perfect Taipei trip.', time: '1d ago', read: true, link: '/planner' },
  { id: 7, type: 'like', user: 'foodie.tpe', avatar: 'F', color: '#ec4899', content: 'saved your "Elephant Mountain Sunset" route to their wishlist', time: '2d ago', read: true },
  { id: 8, type: 'ai', user: 'AI Agent', avatar: '✨', color: '#10b981', content: '🌧️ Rain alert for Taipei this weekend — indoor alternatives suggested', time: '2d ago', read: true, link: '/planner' },
];

const TYPE_ICONS = {
  like: '❤️',
  follow: '👤',
  comment: '💬',
  ai: '✨',
  system: '🗺️',
};

export default function Notifications() {
  const navigate = useNavigate();
  const { setFlashMessage } = useAppContext();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setFlashMessage('All notifications marked as read ✓');
  };

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Notifications</h2>
          {unreadCount > 0 && (
            <p style={{ margin: '0.3rem 0 0', color: '#94a3b8' }}>{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notification Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => {
              markRead(notif.id);
              if (notif.link) navigate(notif.link);
            }}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: '1rem',
              padding: '1rem 1.2rem', borderRadius: '14px', cursor: 'pointer',
              background: notif.read ? 'rgba(255,255,255,0.02)' : 'rgba(99,102,241,0.08)',
              border: `1px solid ${notif.read ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.2)'}`,
              transition: 'background 0.2s, transform 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
            onMouseOut={e => { e.currentTarget.style.background = notif.read ? 'rgba(255,255,255,0.02)' : 'rgba(99,102,241,0.08)'; e.currentTarget.style.transform = ''; }}
          >
            {/* Avatar */}
            <div style={{
              width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
              background: `${notif.color}22`, border: `1px solid ${notif.color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', color: notif.color, fontWeight: '700',
            }}>
              {notif.avatar}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.4 }}>
                <strong style={{ color: 'var(--text)' }}>{notif.user}</strong>{' '}
                <span style={{ color: '#cbd5e1' }}>{notif.content}</span>
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{notif.time}</span>
                {notif.link && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>→ View</span>
                )}
              </div>
            </div>

            {/* Type icon + unread dot */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
              <span style={{ fontSize: '1.1rem' }}>{TYPE_ICONS[notif.type]}</span>
              {!notif.read && (
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />
              )}
            </div>
          </div>
        ))}
      </div>

      {notifications.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
          <p style={{ fontSize: '3rem', margin: '0 0 1rem' }}>🔔</p>
          <h3>All caught up!</h3>
          <p>No new notifications.</p>
        </div>
      )}
    </div>
  );
}
