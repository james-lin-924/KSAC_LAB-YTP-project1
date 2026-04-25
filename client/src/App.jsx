import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './pages/Layout';
import Home from './pages/Home';
import Messages from './pages/Messages';
import Planner from './pages/Planner';
import Reels from './pages/Reels';
import Search from './pages/Search';
import Explore from './pages/Explore';
import Notifications from './pages/Notifications';
import './App.css';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="home" element={<Home />} />
            <Route path="planner" element={<Planner />} />
            <Route path="search" element={<Search />} />
            <Route path="explore" element={<Explore />} />
            <Route path="reels" element={<Reels />} />
            <Route path="messages" element={<Messages />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<div className="status-panel" style={{ textAlign: 'center', padding: '3rem' }}><p style={{ fontSize: '3rem' }}>👤</p><h2>Profile</h2><p style={{ color: '#94a3b8' }}>Profile page coming soon.</p></div>} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
