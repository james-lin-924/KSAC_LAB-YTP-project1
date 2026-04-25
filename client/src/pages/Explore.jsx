import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const TONE_GRADIENTS = [
  'linear-gradient(160deg, #312e81, #1e1b4b)',
  'linear-gradient(160deg, #7f1d1d, #3f1a1a)',
  'linear-gradient(160deg, #065f46, #064e3b)',
  'linear-gradient(160deg, #701a75, #4a044e)',
  'linear-gradient(160deg, #1e40af, #1e3a5f)',
  'linear-gradient(160deg, #0e7490, #083344)',
];

const CATEGORY_ICONS = {
  '觀光工廠': '🏭', '歷史建築': '🏛️', '古蹟': '🗿', '博物館': '🏛️',
  '藝文空間': '🎨', '自然景觀': '🌿', '主題公園': '🎡', '夜市': '🍜',
  '購物': '🛍️', '宗教場所': '⛩️', '溫泉': '♨️', '海洋休閒': '🌊',
  '登山步道': '⛰️', '文創園區': '✨', '農場體驗': '🌾', '旅遊景點': '📍',
};

const TRENDING_TAGS = ['All', '夜市', '古蹟', '自然景觀', '博物館', '文創園區', '溫泉'];

export default function Explore() {
  const { spots, setForm, setFlashMessage } = useAppContext();
  const navigate = useNavigate();
  const [activeTag, setActiveTag] = useState('All');

  const filtered = useMemo(() => {
    if (activeTag === 'All') return spots.slice(0, 18);
    return spots.filter(s => s.category?.includes(activeTag)).slice(0, 18);
  }, [spots, activeTag]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Explore Taipei 🗺️</h2>
          <p style={{ margin: '0.3rem 0 0', color: '#94a3b8' }}>Trending destinations and curated collections</p>
        </div>
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        {TRENDING_TAGS.map(tag => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            style={{
              padding: '0.5rem 1.2rem', borderRadius: '20px', border: '1px solid',
              background: activeTag === tag ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              color: activeTag === tag ? 'white' : 'var(--text-muted)',
              borderColor: activeTag === tag ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
              cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.88rem', fontWeight: '500'
            }}
          >
            {CATEGORY_ICONS[tag] || '🗺️'} {tag}
          </button>
        ))}
      </div>

      {/* Masonry Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
          <p style={{ fontSize: '2.5rem' }}>🌐</p>
          <p>No spots found for this category</p>
        </div>
      ) : (
        <div style={{ columnCount: 3, columnGap: '1rem', columnFill: 'balance' }}>
          {filtered.map((spot, idx) => {
            const gradient = TONE_GRADIENTS[idx % TONE_GRADIENTS.length];
            const catIcon = CATEGORY_ICONS[spot.category] || '📍';
            const tileHeight = 140 + (idx % 3) * 60;

            return (
              <div
                key={spot.id || idx}
                onClick={() => {
                  setForm(prev => ({ ...prev, mustVisit: spot.name }));
                  setFlashMessage(`${spot.name} added to planner!`);
                  setTimeout(() => navigate('/planner'), 800);
                }}
                style={{
                  breakInside: 'avoid', marginBottom: '1rem', borderRadius: '12px',
                  overflow: 'hidden', cursor: 'pointer', position: 'relative',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.4)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                {/* Image area */}
                <div style={{ height: `${tileHeight}px`, background: gradient, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
                  <div style={{ position: 'absolute', top: '0.6rem', left: '0.6rem' }}>
                    <span style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.9)' }}>
                      {catIcon} {spot.category}
                    </span>
                  </div>
                </div>
                {/* Info area */}
                <div style={{ padding: '0.8rem', background: 'rgba(15,23,42,0.9)' }}>
                  <h3 style={{ margin: '0 0 0.3rem', fontSize: '0.9rem', fontWeight: '700', lineHeight: 1.2 }}>{spot.name}</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>📍 {spot.location?.slice(0, 25)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
