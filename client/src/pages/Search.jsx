import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const VIBE_CHIPS = [
  { label: 'All', icon: '🗺️' },
  { label: '古蹟', icon: '🗿' },
  { label: '夜市', icon: '🍜' },
  { label: '自然景觀', icon: '🌿' },
  { label: '博物館', icon: '🏛️' },
  { label: '文創園區', icon: '🎨' },
  { label: '溫泉', icon: '♨️' },
  { label: '觀光工廠', icon: '🏭' },
];

const TONE_GRADIENTS = [
  'linear-gradient(160deg, #312e81, #1e1b4b)',
  'linear-gradient(160deg, #7f1d1d, #3f1a1a)',
  'linear-gradient(160deg, #065f46, #064e3b)',
  'linear-gradient(160deg, #701a75, #4a044e)',
  'linear-gradient(160deg, #1e40af, #1e3a5f)',
  'linear-gradient(160deg, #0e7490, #083344)',
];

export default function Search() {
  const { spots, setForm, setFlashMessage } = useAppContext();
  const navigate = useNavigate();

  // Mode: 'dataset' | 'text' | 'images'
  const [mode, setMode] = useState('dataset');
  const [activeVibe, setActiveVibe] = useState('All');
  const [query, setQuery] = useState('');
  const [inputValue, setInputValue] = useState('');

  // SerpAPI results
  const [textResults, setTextResults] = useState([]);
  const [imageResults, setImageResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // ── Local dataset filtering ──────────────────────────────────────────────
  const filteredSpots = useMemo(() => {
    return spots.filter(spot => {
      const matchesVibe = activeVibe === 'All' || spot.category?.includes(activeVibe);
      const matchesQuery = !query || 
        spot.name?.toLowerCase().includes(query.toLowerCase()) || 
        spot.location?.toLowerCase().includes(query.toLowerCase()) ||
        spot.category?.toLowerCase().includes(query.toLowerCase());
      return matchesVibe && matchesQuery;
    });
  }, [spots, activeVibe, query]);

  // ── SerpAPI calls ─────────────────────────────────────────────────────────
  const runSearch = useCallback(async (searchMode, q) => {
    if (!q.trim()) return;
    setSearching(true);
    setSearchError('');
    setTextResults([]);
    setImageResults([]);

    const endpoint = searchMode === 'images'
      ? `/api/search/images?q=${encodeURIComponent(q)}`
      : `/api/search/text?q=${encodeURIComponent(q)}`;

    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');

      if (searchMode === 'images') {
        setImageResults(data.images || []);
      } else {
        setTextResults(data.results || []);
      }
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setQuery(inputValue);
    if (mode === 'text' || mode === 'images') {
      runSearch(mode, inputValue);
    }
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setTextResults([]);
    setImageResults([]);
    setSearchError('');
    if (newMode !== 'dataset' && inputValue.trim()) {
      runSearch(newMode, inputValue);
    }
  };

  const handleSurpriseMe = () => {
    if (!spots.length) return;
    const randomSpot = spots[Math.floor(Math.random() * spots.length)];
    setInputValue(randomSpot.name);
    setQuery(randomSpot.name);
    setFlashMessage(`✨ Surprise! ${randomSpot.name} — ${randomSpot.location}`);
    if (mode !== 'dataset') {
      runSearch(mode, randomSpot.name);
    }
  };

  return (
    <div className="search-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Hero Search Header */}
      <div className="glass-effect" style={{
        padding: '2rem', textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))',
        borderTop: '3px solid rgba(139,92,246,0.5)',
      }}>
        <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem', letterSpacing: '-0.03em' }}>
          Find Your Next Spot
        </h2>
        <p style={{ color: '#94a3b8', margin: '0 0 1.5rem', fontSize: '0.95rem' }}>
          Search our dataset, the web, or Google Images — all in one place
        </p>

        {/* Mode Tabs */}
        <div style={{ display: 'inline-flex', gap: 0, borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: '1.5rem' }}>
          {[
            { key: 'dataset', label: '📊 Dataset', title: 'Local Taipei data' },
            { key: 'text', label: '🌐 Web Search', title: 'Google text results via SerpAPI' },
            { key: 'images', label: '🖼️ Image Search', title: 'Google Images via SerpAPI' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => handleModeSwitch(tab.key)}
              title={tab.title}
              style={{
                padding: '0.7rem 1.4rem', border: 'none', cursor: 'pointer', fontSize: '0.88rem',
                background: mode === tab.key ? 'rgba(139,92,246,0.4)' : 'rgba(0,0,0,0.3)',
                color: mode === tab.key ? 'white' : '#94a3b8',
                fontWeight: mode === tab.key ? '600' : '400',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.8rem', maxWidth: '640px', margin: '0 auto' }}>
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder={
              mode === 'dataset' ? '🔍  Filter local dataset…' :
              mode === 'text' ? '🔍  Search the web for Taipei spots…' :
              '🖼️  Search Google Images…'
            }
            style={{
              flex: 1, padding: '0.9rem 1.4rem', borderRadius: '30px',
              border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.5)',
              color: 'white', fontSize: '1rem', outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={searching}
            style={{
              padding: '0 1.5rem', borderRadius: '30px',
              background: searching ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', color: 'white', fontWeight: '600', cursor: 'pointer',
              whiteSpace: 'nowrap', fontSize: '0.9rem',
            }}
          >
            {searching ? 'Searching…' : 'Search'}
          </button>
          <button
            type="button"
            onClick={handleSurpriseMe}
            style={{
              padding: '0 1.2rem', borderRadius: '30px',
              background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
              border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.9rem',
            }}
          >
            🎲
          </button>
        </form>

        {/* Vibe Cloud - only in dataset mode */}
        {mode === 'dataset' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'center', marginTop: '1.2rem' }}>
            {VIBE_CHIPS.map(chip => (
              <button
                key={chip.label}
                onClick={() => setActiveVibe(chip.label)}
                style={{
                  padding: '0.5rem 1.1rem', borderRadius: '20px', border: '1px solid',
                  background: activeVibe === chip.label ? 'white' : 'rgba(255,255,255,0.05)',
                  color: activeVibe === chip.label ? '#0f172a' : '#cbd5e1',
                  borderColor: activeVibe === chip.label ? 'white' : 'rgba(255,255,255,0.12)',
                  cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem', fontWeight: '500',
                }}
              >
                {chip.icon} {chip.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error State */}
      {searchError && (
        <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
          ⚠️ {searchError}
        </div>
      )}

      {/* ── DATASET MODE ─────────────────────────────────────────────────────── */}
      {mode === 'dataset' && (
        <>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
            {filteredSpots.length} spots found in local dataset
          </p>
          {filteredSpots.length > 0 ? (
            <div style={{ columnCount: 3, columnGap: '1rem' }}>
              {filteredSpots.map((spot, idx) => (
                <div
                  key={spot.id || idx}
                  onClick={() => {
                    setForm(prev => ({ ...prev, mustVisit: spot.name }));
                    setFlashMessage(`${spot.name} added to planner!`);
                    setTimeout(() => navigate('/planner'), 800);
                  }}
                  style={{
                    breakInside: 'avoid', marginBottom: '1rem', borderRadius: '12px',
                    overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.07)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.4)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  <div style={{ height: `${140 + (idx % 3) * 55}px`, background: TONE_GRADIENTS[idx % TONE_GRADIENTS.length], position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
                    <div style={{ position: 'absolute', bottom: '0.8rem', left: '0.8rem', right: '0.8rem', color: 'white' }}>
                      <span style={{ background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem' }}>{spot.category}</span>
                      <h3 style={{ margin: '0.3rem 0 0.1rem', fontSize: '0.95rem', lineHeight: 1.2, fontWeight: '700' }}>{spot.name}</h3>
                      <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8 }}>📍 {spot.location?.slice(0, 22)}</p>
                    </div>
                  </div>
                  {spot.description && (
                    <div style={{ padding: '0.8rem', background: 'rgba(15,23,42,0.9)' }}>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                        {spot.description.slice(0, 90)}{spot.description.length > 90 ? '…' : ''}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              <p style={{ fontSize: '2.5rem', margin: '0 0 1rem' }}>🕵️</p>
              <p>No spots found. Try a different vibe or clear the filter.</p>
            </div>
          )}
        </>
      )}

      {/* ── TEXT SEARCH MODE ──────────────────────────────────────────────────── */}
      {mode === 'text' && (
        <>
          {searching && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="glass-effect" style={{ height: '90px', opacity: 0.4, animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          )}
          {!searching && textResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                {textResults.length} web results for "{inputValue}"
              </p>
              {textResults.map((result, idx) => (
                <a
                  key={idx}
                  href={result.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className="glass-effect"
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', cursor: 'pointer' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    onMouseOut={e => e.currentTarget.style.background = ''}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {result.favicon && (
                        <img src={result.favicon} alt="" style={{ width: '16px', height: '16px', borderRadius: '2px' }} onError={e => e.target.style.display = 'none'} />
                      )}
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{result.displayed_link}</span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#a5b4fc', fontWeight: '600', lineHeight: 1.3 }}>
                      {result.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                      {result.snippet}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
          {!searching && textResults.length === 0 && !searchError && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              <p style={{ fontSize: '2.5rem', margin: '0 0 1rem' }}>🌐</p>
              <p>Enter a query above and hit Search to find web results.</p>
            </div>
          )}
        </>
      )}

      {/* ── IMAGE SEARCH MODE ─────────────────────────────────────────────────── */}
      {mode === 'images' && (
        <>
          {searching && (
            <div style={{ columnCount: 4, columnGap: '0.8rem' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} style={{ breakInside: 'avoid', marginBottom: '0.8rem', height: `${120 + (i % 3) * 40}px`, borderRadius: '8px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          )}
          {!searching && imageResults.length > 0 && (
            <>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                {imageResults.length} images for "{inputValue}"
              </p>
              <div style={{ columnCount: 4, columnGap: '0.8rem' }}>
                {imageResults.map((img, idx) => (
                  <a key={idx} href={img.link} target="_blank" rel="noopener noreferrer">
                    <div
                      style={{
                        breakInside: 'avoid', marginBottom: '0.8rem', borderRadius: '10px',
                        overflow: 'hidden', cursor: 'pointer', position: 'relative',
                        border: '1px solid rgba(255,255,255,0.08)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                      }}
                      onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)'; }}
                      onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                    >
                      <img
                        src={img.thumbnail}
                        alt={img.title}
                        loading="lazy"
                        style={{ width: '100%', display: 'block', objectFit: 'cover' }}
                        onError={e => { e.target.parentElement.style.display = 'none'; }}
                      />
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                        padding: '1.5rem 0.6rem 0.6rem',
                        opacity: 0, transition: 'opacity 0.2s',
                      }}
                        onMouseOver={e => e.currentTarget.style.opacity = '1'}
                        onMouseOut={e => e.currentTarget.style.opacity = '0'}
                      >
                        <p style={{ margin: 0, color: 'white', fontSize: '0.72rem', lineHeight: 1.3 }}>{img.title}</p>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.65rem' }}>{img.source}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </>
          )}
          {!searching && imageResults.length === 0 && !searchError && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              <p style={{ fontSize: '2.5rem', margin: '0 0 1rem' }}>🖼️</p>
              <p>Enter a query above to search Google Images for Taipei spots.</p>
            </div>
          )}
        </>
      )}

    </div>
  );
}
