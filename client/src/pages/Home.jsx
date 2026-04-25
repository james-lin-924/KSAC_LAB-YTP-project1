import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import MapComponent from '../MapComponent';

const CATEGORY_ICONS = {
  '觀光工廠': '🏭', '歷史建築': '🏛️', '古蹟': '🗿', '博物館': '🏛️', '藝文空間': '🎨',
  '自然景觀': '🌿', '主題公園': '🎡', '夜市': '🍜', '購物': '🛍️', '宗教場所': '⛩️',
  '溫泉': '♨️', '海洋休閒': '🌊', '登山步道': '⛰️', '文創園區': '✨', '農場體驗': '🌾',
  '旅遊景點': '📍',
};

export default function Home() {
  const { spots, socialPosts, planResult, setForm, setFlashMessage, spotImages } = useAppContext();
  const navigate = useNavigate();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStory, setSelectedStory] = useState(null);
  const [likedPosts, setLikedPosts] = useState({});
  const [savedPosts, setSavedPosts] = useState({});

  const stories = spots.slice(0, 10);

  const filteredSpots = useMemo(() => {
    const query = searchKeyword.trim().toLowerCase();
    if (!query) return spots;
    return spots.filter((spot) => {
      const target = `${spot.name || ''} ${spot.category || ''} ${spot.location || ''}`.toLowerCase();
      return target.includes(query);
    });
  }, [searchKeyword, spots]);

  const toggleAction = (setter, id) => setter(prev => ({ ...prev, [id]: !prev[id] }));

  const handleVibeClone = (post) => {
    setForm(prev => ({ ...prev, style: 'Vibe Clone', mustVisit: post.location || 'Taipei' }));
    setFlashMessage(`✨ Cloning ${post.username}'s vibe — open Planner to generate!`);
    setTimeout(() => navigate('/planner'), 1200);
  };

  const compactDescription = (description) => {
    if (!description) return '';
    const c = description.replace(/\s+/g, ' ').trim();
    return c.length > 160 ? `${c.slice(0, 160)}…` : c;
  };

  const plan = planResult?.plan;

  return (
    <>
      {/* Search Bar */}
      <section className="utility-bar">
        <input
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="search-input"
          placeholder="🔍  Search spots, categories, districts…"
        />
        {searchKeyword && (
          <button className="action-btn" onClick={() => setSearchKeyword('')}>Clear</button>
        )}
      </section>

      {/* Stories Row */}
      <header className="stories-row">
        <button
          type="button"
          className="story-item button-reset active"
          onClick={() => { setSelectedStory(null); setSearchKeyword(''); }}
        >
          <span className="story-ring"><span>✨</span></span>
          <p>All</p>
        </button>
        {stories.map((story, index) => (
          <button
            type="button"
            key={`${story.id}-${index}`}
            className={`story-item button-reset ${selectedStory === story.name ? 'active' : ''}`}
            onClick={() => {
              setSelectedStory(story.name);
              setSearchKeyword(story.name);
            }}
          >
            <span className="story-ring">
              {spotImages[story.name] ? (
                <img src={spotImages[story.name]} alt={story.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} onError={e => e.target.style.display = 'none'} />
              ) : (
                <span>{CATEGORY_ICONS[story.category] || story.name?.slice(0, 1) || '📍'}</span>
              )}
            </span>
            <p>{story.name?.length > 6 ? story.name.slice(0, 6) + '…' : story.name}</p>
          </button>
        ))}
      </header>

      {/* Generated Plan Card */}
      {plan && (
        <article className="post-card" style={{ borderTop: '3px solid #10b981' }}>
          <div className="post-header">
            <div className="avatar alt">✨</div>
            <div>
              <h2>{plan.title}</h2>
              <p>AI Generated · {planResult?.source}</p>
            </div>
          </div>
          <p className="post-summary">{plan.summary}</p>
          <div className="post-actions">
            <button type="button" className={`action-btn ${likedPosts.plan ? 'on' : ''}`} onClick={() => toggleAction(setLikedPosts, 'plan')}>
              {likedPosts.plan ? '❤️ Liked' : '🤍 Like'}
            </button>
            <button type="button" className={`action-btn ${savedPosts.plan ? 'on' : ''}`} onClick={() => toggleAction(setSavedPosts, 'plan')}>
              {savedPosts.plan ? '🔖 Saved' : '🔖 Save'}
            </button>
            <button type="button" className="action-btn" onClick={() => navigate('/planner')}>
              🗺️ View Full Plan
            </button>
          </div>
          <ul className="timeline-list" style={{ marginTop: '1rem' }}>
            {(plan.steps || []).slice(0, 4).map((step, index) => (
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

      {/* Social Posts */}
      {socialPosts.map((post) => (
        <article key={`post-${post.id}`} className="post-card glass-effect">
          <div className="post-header">
            <div className="avatar alt" style={{ background: `hsl(${(post.id * 47) % 360}, 60%, 40%)` }}>
              {post.username?.slice(0, 1).toUpperCase() || 'U'}
            </div>
            <div>
              <h2>{post.username}</h2>
              <p>{post.location} · {new Date(post.created_at).toLocaleDateString('zh-TW')}</p>
            </div>
          </div>
          {post.image_url ? (
            <img src={post.image_url} alt="Post" className="post-image" />
          ) : (
            <div className="post-image" data-tone={post.id % 4} />
          )}
          <p className="post-summary">{post.content}</p>
          <div className="post-actions">
            <button
              type="button"
              className={`action-btn ${likedPosts[`s-${post.id}`] ? 'on' : ''}`}
              onClick={() => toggleAction(setLikedPosts, `s-${post.id}`)}
            >
              {likedPosts[`s-${post.id}`] ? '❤️ Liked' : '🤍 Like'}
            </button>
            <button type="button" className="action-btn clone-btn" onClick={() => handleVibeClone(post)}>
              🪄 Vibe Clone
            </button>
          </div>
        </article>
      ))}

      {/* Spot Cards */}
      {filteredSpots.map((spot, index) => {
        const postId = `spot-${spot.id || index}`;
        const catIcon = CATEGORY_ICONS[spot.category] || '📍';
        return (
          <article key={spot.id || `${spot.name}-${index}`} className="post-card glass-effect">
            <div className="post-header">
              <div className="avatar" style={{ background: `hsl(${(index * 67) % 360}, 50%, 25%)`, fontSize: '1.1rem' }}>
                {catIcon}
              </div>
              <div>
                <h2>{spot.name}</h2>
                <p>
                  <span style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', padding: '1px 8px', borderRadius: '10px', fontSize: '0.78rem', marginRight: '0.4rem' }}>
                    {spot.category}
                  </span>
                  {spot.location}
                </p>
              </div>
            </div>
            {spotImages[spot.name] ? (
              <img src={spotImages[spot.name]} alt={spot.name} className="post-image" style={{ objectFit: 'cover' }} onError={e => { e.target.style.display='none'; }} />
            ) : (
              <div className="post-image" data-tone={index % 4} />
            )}
            {spot.description && (
              <p className="post-summary">{compactDescription(spot.description)}</p>
            )}
            <div className="post-actions">
              <button
                type="button"
                className={`action-btn ${likedPosts[postId] ? 'on' : ''}`}
                onClick={() => toggleAction(setLikedPosts, postId)}
              >
                {likedPosts[postId] ? '❤️ Liked' : '🤍 Like'}
              </button>
              <button
                type="button"
                className="action-btn"
                onClick={() => {
                  setForm(prev => ({ ...prev, mustVisit: spot.name }));
                  navigate('/planner');
                }}
              >
                🗺️ Plan Visit
              </button>
            </div>
          </article>
        );
      })}

      {!filteredSpots.length && (
        <article className="post-card status-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: '3rem', margin: '0 0 1rem' }}>🕵️</p>
          <h3>No matches found</h3>
          <p>Try a different keyword or clear the search.</p>
        </article>
      )}
    </>
  );
}
