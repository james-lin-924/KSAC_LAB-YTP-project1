import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';

const TONE_GRADIENTS = [
  'linear-gradient(160deg, #0f172a 0%, #312e81 40%, #1e1b4b 100%)',
  'linear-gradient(160deg, #1c0707 0%, #7f1d1d 40%, #3f1a1a 100%)',
  'linear-gradient(160deg, #022c22 0%, #065f46 40%, #064e3b 100%)',
  'linear-gradient(160deg, #2d0036 0%, #701a75 40%, #4a044e 100%)',
  'linear-gradient(160deg, #0c1a33 0%, #1e40af 40%, #1e3a5f 100%)',
  'linear-gradient(160deg, #0f1623 0%, #0e7490 40%, #083344 100%)',
];

const CATEGORY_ICONS = {
  '觀光工廠': '🏭', '歷史建築': '🏛️', '古蹟': '🗿', '博物館': '🏛️',
  '藝文空間': '🎨', '自然景觀': '🌿', '主題公園': '🎡', '夜市': '🍜',
  '購物': '🛍️', '宗教場所': '⛩️', '溫泉': '♨️', '海洋休閒': '🌊',
  '登山步道': '⛰️', '文創園區': '✨', '農場體驗': '🌾', '旅遊景點': '📍',
};

function stableCount(seed, base, range) {
  return base + ((seed * 7919) % range);
}

export default function Reels() {
  const { spots, spotImages, setFlashMessage } = useAppContext();
  const [likedPosts, setLikedPosts] = useState({});
  const [savedPosts, setSavedPosts] = useState({});

  const reelsData = useMemo(() => spots.slice(0, 15), [spots]);

  const toggleLike = (id) => setLikedPosts(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleSave = (id) => setSavedPosts(prev => ({ ...prev, [id]: !prev[id] }));

  if (reelsData.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 6rem)', color: '#94a3b8', gap: '1rem' }}>
        <div style={{ fontSize: '3rem' }}>🎬</div>
        <p>Loading reels…</p>
      </div>
    );
  }

  return (
    <div
      className="reels-container"
      style={{
        height: 'calc(100vh - 4rem)',
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        background: '#000',
        borderRadius: '16px',
        margin: '0 auto',
        maxWidth: '480px',
        position: 'relative',
        scrollbarWidth: 'none',
      }}
    >
      <style>{`.reels-container::-webkit-scrollbar { display: none; }`}</style>

      {reelsData.map((spot, index) => {
        const gradient = TONE_GRADIENTS[index % TONE_GRADIENTS.length];
        const catIcon = CATEGORY_ICONS[spot.category] || '📍';
        const likes = stableCount(spot.id || index, 200, 9800);
        const comments = stableCount((spot.id || index) + 1, 50, 950);
        const imgUrl = spotImages[spot.name];

        return (
          <div
            key={spot.id || index}
            style={{
              height: '100%',
              width: '100%',
              scrollSnapAlign: 'start',
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {/* Real photo background when available, else gradient */}
            {imgUrl ? (
              <img
                src={imgUrl}
                alt={spot.name}
                style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  objectFit: 'cover', zIndex: 0,
                }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, background: gradient, zIndex: 0 }} />
            )}

            {/* Decorative blobs */}
            {!imgUrl && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 0,
                backgroundImage: `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.07) 0%, transparent 50%),
                                  radial-gradient(circle at 80% 70%, rgba(255,255,255,0.05) 0%, transparent 40%)`,
              }} />
            )}

            {/* Dark overlay for readability */}
            <div style={{
              position: 'absolute', inset: 0, zIndex: 1,
              background: imgUrl
                ? 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.15) 70%)'
                : 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)',
            }} />

            {/* Category badge */}
            <div style={{
              position: 'absolute', top: '1.5rem', left: '1rem', zIndex: 3,
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
              padding: '4px 12px', borderRadius: '20px',
              fontSize: '0.78rem', color: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              {catIcon} {spot.category}
            </div>

            {/* Bottom info */}
            <div style={{
              position: 'absolute', bottom: '2rem', left: '1rem', right: '5rem',
              zIndex: 3, color: 'white',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                <div
                  className="avatar mini"
                  style={{
                    margin: 0, border: '2px solid rgba(255,255,255,0.6)',
                    overflow: 'hidden', flexShrink: 0,
                    background: gradient,
                  }}
                >
                  {imgUrl ? (
                    <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                  ) : (
                    spot.name?.charAt(0) || 'T'
                  )}
                </div>
                <span style={{ fontWeight: '700', fontSize: '0.9rem', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                  taipei.vibe
                </span>
                <button style={{
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.6)',
                  borderRadius: '4px', padding: '2px 10px', fontSize: '0.75rem', color: 'white', cursor: 'pointer'
                }}>
                  Follow
                </button>
              </div>

              <h3 style={{
                margin: '0 0 0.4rem', fontSize: '1.2rem', fontWeight: '800',
                textShadow: '0 2px 8px rgba(0,0,0,0.9)', lineHeight: 1.2
              }}>
                {spot.name}
              </h3>

              <p style={{
                fontSize: '0.88rem', margin: '0 0 0.5rem', opacity: 0.9,
                textShadow: '0 1px 4px rgba(0,0,0,0.8)', lineHeight: 1.4,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
              }}>
                {spot.description || 'Discover this amazing spot in Taipei!'}
              </p>

              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
                padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem',
                border: '1px solid rgba(255,255,255,0.15)'
              }}>
                📍 {spot.location?.slice(0, 22)}
              </span>
            </div>

            {/* Right action bar */}
            <div style={{
              position: 'absolute', bottom: '2rem', right: '0.8rem',
              zIndex: 3, display: 'flex', flexDirection: 'column', gap: '1.2rem', alignItems: 'center'
            }}>
              <ActionBtn onClick={() => toggleLike(spot.id)} active={likedPosts[spot.id]} activeColor="rgba(239,68,68,0.35)" activeBorder="rgba(239,68,68,0.5)">
                <span style={{ fontSize: '1.3rem' }}>{likedPosts[spot.id] ? '❤️' : '🤍'}</span>
                <span style={{ color: 'white', fontSize: '0.72rem', fontWeight: '600' }}>{likes + (likedPosts[spot.id] ? 1 : 0)}</span>
              </ActionBtn>

              <ActionBtn onClick={() => setFlashMessage('💬 Comment feature coming soon!')}>
                <span style={{ fontSize: '1.3rem' }}>💬</span>
                <span style={{ color: 'white', fontSize: '0.72rem', fontWeight: '600' }}>{comments}</span>
              </ActionBtn>

              <ActionBtn onClick={() => toggleSave(spot.id)} active={savedPosts[spot.id]} activeColor="rgba(99,102,241,0.35)" activeBorder="rgba(99,102,241,0.5)">
                <span style={{ fontSize: '1.1rem' }}>🔖</span>
              </ActionBtn>

              <ActionBtn onClick={() => setFlashMessage('📤 Shared to story!')}>
                <span style={{ fontSize: '1.1rem' }}>↗️</span>
              </ActionBtn>

              {/* Mini avatar */}
              <div className="avatar mini" style={{ border: '2px solid white', marginTop: '0.5rem', overflow: 'hidden', background: gradient }}>
                {imgUrl ? (
                  <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                ) : spot.name?.charAt(0) || 'T'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActionBtn({ onClick, active, activeColor, activeBorder, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
      }}
    >
      <div style={{
        width: '44px', height: '44px', borderRadius: '50%',
        background: active ? activeColor : 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
        border: active ? `1px solid ${activeBorder}` : '1px solid rgba(255,255,255,0.2)',
      }}>
        {children[0]}
      </div>
      {children[1]}
    </button>
  );
}
