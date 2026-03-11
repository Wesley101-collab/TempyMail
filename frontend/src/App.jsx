import React, { useState, useEffect, useRef } from 'react';
import { useMail } from './hooks/useMail';
import Header from './components/Header';
import { Home } from 'lucide-react';
import Inbox from './components/Inbox';
import MessageViewer from './components/MessageViewer';
import LandingPage from './components/LandingPage';
import AdminDashboard from './components/AdminDashboard';
import PremiumAuth from './components/PremiumAuth';
import ProfilePage from './components/ProfilePage';
import TempNumbers from './components/TempNumbers';
import AdBanner from './components/AdBanner';

function App() {
  const {
    account,
    messages,
    selectedMessage,
    loading: mailLoading,
    error,
    started,
    generateAccount,
    refreshInbox,
    getMessageDetails,
    deleteMessage,
    setSelectedMessage,
    goHome,
    history,
    recoverAccount,
    clearError,
    markAllAsSeen
  } = useMail();

  const [showViewerOnMobile, setShowViewerOnMobile] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const didInitialRedirect = useRef(false);

  // Determine initial page from URL
  const getPageFromPath = (pathname) => {
    if (pathname === '/admin') return 'admin';
    if (pathname === '/premium') return 'premium';
    if (pathname === '/profile') return 'profile';
    if (pathname === '/numbers') return 'numbers';
    return 'landing';
  };

  const [page, setPage] = useState(() => getPageFromPath(window.location.pathname));

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const newPage = getPageFromPath(window.location.pathname);
      setPage(newPage);
      setShowViewerOnMobile(false);
      setSelectedMessage(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (newPage, path) => {
    setPage(newPage);
    window.history.pushState({ page: newPage }, '', path);
  };

  const handleSelectMessage = async (id) => {
    setIsInitializing(true);
    await getMessageDetails(id);
    setIsInitializing(false);
    setShowViewerOnMobile(true);
  };

  const handleBackToInbox = () => {
    setShowViewerOnMobile(false);
    setSelectedMessage(null);
  };

  const handleGetStarted = async () => {
    await generateAccount();
    navigateTo('email', '/');
  };

  const handleGoHome = () => {
    goHome();
    navigateTo('landing', '/');
  };

  // Navigate to landing without clearing temp mail session (used after premium logout)
  const handleGoToLanding = () => {
    navigateTo('landing', '/');
  };

  const handleGoToEmail = () => {
    navigateTo('email', '/');
  };

  // On initial mount only: if user has an active session and is on landing, redirect to email
  if (!didInitialRedirect.current && started && page === 'landing') {
    didInitialRedirect.current = true;
    // Use setTimeout to avoid state update during render
    setTimeout(() => setPage('email'), 0);
  } else if (started) {
    didInitialRedirect.current = true;
  }

  // Admin Dashboard
  if (page === 'admin') {
    return <AdminDashboard onBack={handleGoToEmail} />;
  }

  // Premium Auth — back goes to landing (not dashboard)
  if (page === 'premium') {
    return (
      <PremiumAuth
        onBack={handleGoToLanding}
        onSuccess={(user) => navigateTo('profile', '/profile')}
      />
    );
  }

  // Profile Page
  if (page === 'profile') {
    return (
      <ProfilePage
        onBack={handleGoToEmail}
        onLogout={handleGoToLanding}
      />
    );
  }

  // Temp Numbers Page
  if (page === 'numbers') {
    return (
      <TempNumbers
        onBack={handleGoToEmail}
      />
    );
  }

  // Landing page
  if (page === 'landing' && !started) {
    return (
      <LandingPage
        onGetStarted={handleGetStarted}
        loading={mailLoading}
        onGoToPremium={() => navigateTo('premium', '/premium')}
        onNumbersClick={() => navigateTo('numbers', '/numbers')}
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="glass-panel p-10 max-w-md text-center border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
          <div className="bg-red-500/10 p-4 rounded-full mx-auto w-fit mb-6">
            <div className="w-10 h-10 border-4 border-red-500 rounded-full flex items-center justify-center pb-1 text-red-400 font-bold text-xl">!</div>
          </div>
          <h2 className="text-2xl font-bold text-red-400 mb-4 tracking-tight">API Connection Error</h2>
          <p className="text-textMuted mb-6 leading-relaxed font-medium">{error}</p>
          <div className="flex flex-col gap-3">
            <button onClick={generateAccount} className="glass-button w-full px-6 py-3 font-semibold tracking-wide text-lg shadow-lg">
              Retry Connection
            </button>
            <button
              onClick={() => { clearError(); handleGoToEmail(); }}
              className="w-full px-6 py-3 rounded-xl border border-border bg-surface hover:bg-surfaceHover text-textMain font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-bg flex flex-col overflow-hidden text-textMain">
      {/* Top Header/Navbar */}
      <Header
        account={account}
        generateAccount={generateAccount}
        refreshInbox={refreshInbox}
        onLogoClick={handleGoHome}
        history={history}
        recoverAccount={recoverAccount}
        messages={messages}
        markAllAsSeen={markAllAsSeen}
        onProfileClick={() => {
          const premiumUser = localStorage.getItem('premium_user');
          if (premiumUser) {
            navigateTo('profile', '/profile');
          } else {
            navigateTo('premium', '/premium');
          }
        }}
        onNumbersClick={() => navigateTo('numbers', '/numbers')}
      />

      {/* Main Content Area - Fixed mobile layout */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto p-3 sm:p-4 md:p-6 lg:p-10 relative z-10 flex flex-col overflow-hidden">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 overflow-hidden" style={{ height: 'calc(100vh - 80px)' }}>
          {/* Inbox List */}
          <div className={`lg:col-span-4 xl:col-span-3 overflow-hidden ${showViewerOnMobile ? 'hidden lg:block' : 'block'}`}>
            <Inbox
              messages={messages}
              selectedId={selectedMessage?.id}
              onSelect={handleSelectMessage}
              loading={mailLoading && !selectedMessage && !isInitializing}
              currentAddress={account?.address}
            />
          </div>

          {/* Message Viewer */}
          <div className={`lg:col-span-8 xl:col-span-9 overflow-hidden ${!showViewerOnMobile ? 'hidden lg:block' : 'block'}`}>
            <MessageViewer
              message={selectedMessage}
              loading={isInitializing}
              onDelete={(id) => {
                deleteMessage(id);
                setShowViewerOnMobile(false);
              }}
              onBack={handleBackToInbox}
            />
          </div>
        </div>

        {/* Ad Banner */}
        <AdBanner position="footer" className="mt-2 sm:mt-4" />
      </main>
    </div>
  );
}

export default App;
