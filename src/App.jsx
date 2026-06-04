import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './hooks/useAuth.jsx';
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Teams = lazy(() => import('./pages/Teams'));
const Players = lazy(() => import('./pages/Players'));
const Community = lazy(() => import('./pages/Community'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));
const DiscordCallback = lazy(() => import('./pages/DiscordCallback'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="bg-[#0a0a0a] text-gray-300 font-sans min-h-screen flex flex-col w-full">
          <Header />

          <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/teams" element={<Teams />} />
                <Route path="/players" element={<Players />} />
                <Route path="/community" element={<Community />} />
                <Route path="/login" element={<Login />} />
                {/* Discord is the only auth method; registration === login */}
                <Route path="/register" element={<Navigate to="/login" replace />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/auth/discord/callback" element={<DiscordCallback />} />
              </Routes>
            </Suspense>
          </main>

          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;