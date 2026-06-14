import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { ChatProvider } from './components/ChatContext';
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import TournamentsPage from './pages/TournamentsPage';
import PlayerPage from './pages/PlayerPage';

// Lazy load pages...
const Home = lazy(() => import('./pages/Home'));
const Teams = lazy(() => import('./pages/Teams'));
const Players = lazy(() => import('./pages/Players'));
const Community = lazy(() => import('./pages/Community'));
const News = lazy(() => import('./pages/News'));
const Login = lazy(() => import('./pages/Login'));
const Directory = lazy(() => import('./pages/Directory'));
const ProfileView = lazy(() => import('./pages/ProfileView'));
const ProfileEdit = lazy(() => import('./pages/ProfileEdit'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TeamManage = lazy(() => import('./pages/TeamManage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const DiscordCallback = lazy(() => import('./pages/DiscordCallback'));

const queryClient = new QueryClient();

function HomeRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  return isAuthenticated ? <Dashboard /> : <Home />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ChatProvider>   {/* ✅ Must be inside AuthProvider but outside Router */}
          <Router>
            <div className="bg-[#0a0a0a] text-gray-300 font-sans min-h-screen flex flex-col w-full">
              <Header />
              <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/" element={<HomeRoute />} />
                    <Route path="/teams" element={<Teams />} />
                    <Route path="/players" element={<Players />} />
                    <Route path="/community" element={<Community />} />
                    <Route path="/news" element={<News />} />
                    <Route path="/directory" element={<Directory />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Navigate to="/login" replace />} />
                    <Route path="/onboarding" element={<ProfileEdit />} />
                    <Route path="/profile/edit" element={<ProfileEdit />} />
                    <Route path="/profile" element={<ProfileView />} />
                    <Route path="/profile/:id" element={<ProfileView />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/tournaments" element={<TournamentsPage />} />
                    <Route path="/team/:id" element={<TeamManage />} />
                    <Route path="/player/:id" element={<PlayerPage />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/auth/discord/callback" element={<DiscordCallback />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
            </div>
          </Router>
        </ChatProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;