import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Quiz from './pages/Quiz';
import Result from './pages/Result';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { useAppStore } from './store';
import ThemeToggle from './components/ThemeToggle';

function ProtectedRoute({ children, requirePremium = false }: { children: React.ReactNode, requirePremium?: boolean }) {
  const user = useAppStore((state) => state.user);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requirePremium && !user.premium) {
    return <Navigate to="/result" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  const theme = useAppStore((state) => state.theme);
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);

  useEffect(() => {
    if (user) {
      fetch(`/api/user/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user.premium !== user.premium) {
            setUser(data.user);
          }
        })
        .catch(console.error);
    }
  }, []);

  return (
    <Router>
      <div className={`${theme === 'dark' ? 'dark' : ''}`}>
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white font-sans selection:bg-green-500/30 transition-colors duration-300">
          <ThemeToggle />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/result" element={<Result />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
