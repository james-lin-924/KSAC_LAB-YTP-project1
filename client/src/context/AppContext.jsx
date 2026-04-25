import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [health, setHealth] = useState(null);
  const [overview, setOverview] = useState(null);
  const [spots, setSpots] = useState([]);
  const [socialPosts, setSocialPosts] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState('luke');

  const [flashMessage, setFlashMessage] = useState('');

  // Shared plan result
  const [planResult, setPlanResult] = useState(null);
  const [form, setForm] = useState({
    style: '文青探索',
    budget: '中等',
    duration: '1 day',
    mustVisit: '台北101',
    weather: '晴天',
  });
  const [planning, setPlanning] = useState(false);

  // Spot image map: spotName → thumbnail URL
  const [spotImages, setSpotImages] = useState({});
  const [imagesLoading, setImagesLoading] = useState(false);

  const parseJsonSafely = async (response) => {
    const raw = await response.text();
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return { message: raw };
    }
  };

  const loadDashboard = useCallback(async () => {
    setError('');
    try {
      const [healthResponse, overviewResponse, spotsResponse, postsResponse] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/datasets/overview'),
        fetch('/api/spots?limit=20'),
        fetch('/api/posts'),
      ]);

      if (!healthResponse.ok || !overviewResponse.ok || !spotsResponse.ok) {
        throw new Error('Unable to initialize from backend services.');
      }

      const [healthJson, overviewJson, spotsJson, postsJson] = await Promise.all([
        parseJsonSafely(healthResponse),
        parseJsonSafely(overviewResponse),
        parseJsonSafely(spotsResponse),
        postsResponse ? parseJsonSafely(postsResponse) : { posts: [] },
      ]);

      setHealth(healthJson);
      setOverview(overviewJson);
      const loadedSpots = spotsJson.spots || [];
      setSpots(loadedSpots);
      setSocialPosts(postsJson.posts || []);

      // After spots load, kick off background image preloading
      if (loadedSpots.length > 0) {
        loadSpotImages(loadedSpots);
      }
    } catch (bootError) {
      setError(bootError.message);
    } finally {
      setLoadingInit(false);
    }
  }, []); // eslint-disable-line

  const loadSpotImages = async (loadedSpots) => {
    setImagesLoading(true);
    try {
      const names = loadedSpots.map(s => s.name).filter(Boolean);
      if (!names.length) return;
      const res = await fetch(`/api/spots/images?names=${encodeURIComponent(names.join(','))}`);
      if (!res.ok) return;
      const data = await res.json();
      setSpotImages(data.images || {});
    } catch (e) {
      console.warn('Image preload failed:', e.message);
    } finally {
      setImagesLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!flashMessage) return undefined;
    const timer = setTimeout(() => setFlashMessage(''), 3000);
    return () => clearTimeout(timer);
  }, [flashMessage]);

  return (
    <AppContext.Provider value={{
      health, overview, spots, socialPosts, loadingInit,
      error, setError, user, setUser,
      flashMessage, setFlashMessage,
      planResult, setPlanResult,
      form, setForm,
      planning, setPlanning,
      spotImages, imagesLoading,
      loadDashboard, parseJsonSafely,
    }}>
      {children}
    </AppContext.Provider>
  );
};
