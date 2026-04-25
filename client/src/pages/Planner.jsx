import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import MapComponent from '../MapComponent';

const TONE_GRADIENTS = [
  'linear-gradient(160deg, #312e81, #1e1b4b)',
  'linear-gradient(160deg, #7f1d1d, #3f1a1a)',
  'linear-gradient(160deg, #064e3b, #065f46)',
  'linear-gradient(160deg, #4a044e, #701a75)',
  'linear-gradient(160deg, #1e3a5f, #1e40af)',
  'linear-gradient(160deg, #083344, #0e7490)',
];

const CATEGORY_ICONS = {
  '觀光工廠': '🏭', '歷史建築': '🏛️', '古蹟': '🗿', '博物館': '🏛️',
  '藝文空間': '🎨', '自然景觀': '🌿', '主題公園': '🎡', '夜市': '🍜',
  '購物': '🛍️', '宗教場所': '⛩️', '溫泉': '♨️', '海洋休閒': '🌊',
  '登山步道': '⛰️', '文創園區': '✨', '農場體驗': '🌾', '旅遊景點': '📍',
};

export default function Planner() {
  const {
    spots, planning, setPlanning,
    planResult, setPlanResult, parseJsonSafely, setFlashMessage,
    spotImages, imagesLoading,
  } = useAppContext();

  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isFetchingModels, setIsFetchingModels] = useState(true);
  const [cartSpots, setCartSpots] = useState([]);
  const [draggedSpot, setDraggedSpot] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch('/api/models');
        const data = await parseJsonSafely(res);
        if (data.models?.length > 0) {
          setModels(data.models);
          setSelectedModel(data.models[0]);
        } else {
          setModels(['gemini-1.5-flash']);
          setSelectedModel('gemini-1.5-flash');
        }
      } catch {
        setModels(['gemini-1.5-flash']);
        setSelectedModel('gemini-1.5-flash');
      } finally {
        setIsFetchingModels(false);
      }
    };
    fetchModels();
  }, [parseJsonSafely]);

  const handleDragStart = (e, spot) => {
    setDraggedSpot(spot);
    e.dataTransfer.effectAllowed = 'copyMove';
    e.currentTarget.style.opacity = '0.4';
    e.currentTarget.style.transform = 'scale(0.95)';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    e.currentTarget.style.transform = '';
    setDraggedSpot(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (draggedSpot && !cartSpots.find(s => s.id === draggedSpot.id)) {
      setCartSpots(prev => [...prev, draggedSpot]);
      setFlashMessage(`✅ ${draggedSpot.name} added to itinerary!`);
    } else if (draggedSpot) {
      setFlashMessage(`${draggedSpot.name} is already in the cart.`);
    }
  };

  const removeFromCart = (spotId) => {
    setCartSpots(prev => prev.filter(s => s.id !== spotId));
  };

  const addToCart = (spot) => {
    if (!cartSpots.find(s => s.id === spot.id)) {
      setCartSpots(prev => [...prev, spot]);
      setFlashMessage(`✅ ${spot.name} added!`);
    }
  };

  const onOptimizeRoute = async () => {
    if (cartSpots.length === 0) {
      setFlashMessage('Please add at least one spot to your cart first!');
      return;
    }
    setPlanning(true);
    try {
      const mustVisitString = cartSpots.map(s => s.name).join(', ');
      const payload = {
        style: 'Custom Route',
        budget: 'Flexible',
        duration: cartSpots.length > 3 ? '1 day' : 'half day',
        weather: '晴天',
        mustVisit: mustVisitString,
        model: selectedModel,
      };
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await parseJsonSafely(response);
      if (!response.ok) {
        setPlanResult({ source: 'gateway-fallback', plan: data.fallback || null, reason: data.error || 'Planner request failed.' });
        setFlashMessage('Failed to get smart route, using fallback.');
      } else {
        setPlanResult(data);
        setFlashMessage('✨ Route optimized successfully!');
      }
    } catch (err) {
      setFlashMessage(err.message);
    } finally {
      setPlanning(false);
    }
  };

  const plan = planResult?.plan;
  const popularSpots = spots.slice(0, 18);

  return (
    <div
      className="planner-interactive-container"
      style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start', minHeight: 'calc(100vh - 5rem)' }}
    >
      {/* Left: Discover Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'calc(100vh - 5rem)', overflowY: 'auto', paddingRight: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Discover & Drag</h2>
            <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              {imagesLoading ? '🔄 Loading real photos…' : `${popularSpots.length} spots · drag into cart →`}
            </p>
          </div>
          {!isFetchingModels && models.length > 0 && (
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              style={{ padding: '0.4rem 1rem', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.85rem' }}
            >
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
        </div>

        {/* Spot Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
          {popularSpots.map((spot, idx) => {
            const imgUrl = spotImages[spot.name];
            const gradient = TONE_GRADIENTS[idx % TONE_GRADIENTS.length];
            const catIcon = CATEGORY_ICONS[spot.category] || '📍';
            const inCart = cartSpots.find(s => s.id === spot.id);

            return (
              <div
                key={spot.id || idx}
                draggable
                onDragStart={e => handleDragStart(e, spot)}
                onDragEnd={handleDragEnd}
                onClick={() => addToCart(spot)}
                style={{
                  cursor: 'grab', borderRadius: '14px', overflow: 'hidden',
                  border: inCart ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  background: 'rgba(15,23,42,0.8)',
                  opacity: inCart ? 0.6 : 1,
                  userSelect: 'none',
                }}
                onMouseOver={e => { if (!inCart) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.5)'; } }}
                onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                {/* Image / Gradient Area */}
                <div style={{ height: '120px', position: 'relative', overflow: 'hidden', background: gradient }}>
                  {imgUrl && (
                    <img
                      src={imgUrl}
                      alt={spot.name}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)' }} />
                  <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem' }}>
                    <span style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', padding: '2px 7px', borderRadius: '10px', fontSize: '0.68rem', color: 'rgba(255,255,255,0.9)' }}>
                      {catIcon} {spot.category}
                    </span>
                  </div>
                  {inCart && (
                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: '#6366f1', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                      ✓
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: '0.75rem' }}>
                  <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.88rem', fontWeight: '700', lineHeight: 1.2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {spot.name}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>📍 {spot.location?.slice(0, 18)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Generated Plan */}
        {plan && (
          <article className="post-card" style={{ borderTop: '3px solid #10b981', marginTop: '1rem' }}>
            <div className="post-header">
              <div className="avatar alt">✨</div>
              <div>
                <h2>{plan.title}</h2>
                <p>AI Generated · {planResult?.source}</p>
              </div>
            </div>
            <p className="post-summary">{plan.summary}</p>
            <ul className="timeline-list">
              {(plan.steps || []).map((step, index) => (
                <li key={`${step.time || 'time'}-${index}`}>
                  <strong>{step.time}</strong>
                  <span>{step.activity}</span>
                  <small>{step.transport} · {step.note}</small>
                </li>
              ))}
            </ul>
            <MapComponent steps={plan.steps || []} />
          </article>
        )}
      </div>

      {/* Right: Cart (Drop Zone) */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          position: 'sticky', top: 0, height: 'calc(100vh - 5rem)',
          display: 'flex', flexDirection: 'column', gap: '1rem',
          borderRadius: '20px', padding: '1.2rem',
          border: isDragOver ? '2px dashed #8b5cf6' : '2px dashed rgba(139,92,246,0.4)',
          background: isDragOver ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.03)',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ paddingBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ margin: '0 0 0.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
            🛒 Itinerary Cart
            {cartSpots.length > 0 && (
              <span style={{ background: '#6366f1', color: 'white', fontSize: '0.75rem', padding: '1px 8px', borderRadius: '10px' }}>
                {cartSpots.length}
              </span>
            )}
          </h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
            {isDragOver ? '✨ Drop here!' : 'Drag cards or click to add spots'}
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {cartSpots.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.25)', gap: '0.5rem', textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem' }}>🗺️</div>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Your itinerary is empty</p>
              <p style={{ margin: 0, fontSize: '0.78rem' }}>Drag or click spots to add them</p>
            </div>
          ) : (
            cartSpots.map((spot, idx) => {
              const imgUrl = spotImages[spot.name];
              return (
                <div
                  key={spot.id || idx}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(0,0,0,0.3)', padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div style={{ width: '42px', height: '42px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: TONE_GRADIENTS[idx % TONE_GRADIENTS.length] }}>
                    {imgUrl && <img src={imgUrl} alt={spot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{spot.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{spot.category}</div>
                  </div>
                  <button onClick={() => removeFromCart(spot.id)} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1rem', padding: '4px', flexShrink: 0 }}>✕</button>
                </div>
              );
            })
          )}
        </div>

        <button
          onClick={onOptimizeRoute}
          disabled={planning || cartSpots.length === 0}
          style={{
            background: planning || cartSpots.length === 0 ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
            color: 'white', border: 'none', padding: '1rem', borderRadius: '12px',
            fontWeight: '700', fontSize: '1rem', cursor: cartSpots.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {planning ? '⏳ Computing Route…' : `✨ Optimize Smart Route (${cartSpots.length})`}
        </button>
      </div>
    </div>
  );
}
