import React, { useState, useEffect } from 'react';
import { useMail } from './hooks/useMail';
import Header from './components/Header';
import Inbox from './components/Inbox';
import MessageViewer from './components/MessageViewer';
import LandingPage from './components/LandingPage';
import AdminDashboard from './components/AdminDashboard';
import PremiumAuth from './components/PremiumAuth';
import ProfilePage from './components/ProfilePage';

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
    recoverAccount
  } = useMail();

  const [showViewerOnMobile, setShowViewerOnMobile] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [page, setPage] = useState('landing'); // 'landing' | 'email' | 'admin' | 'premium' | 'profile'
  // Check URL for /admin and /premium routes
  useEffect(() => {
    if (window.location.pathname === '/admin') {
      setPage('admin');
    } else if (window.location.pathname === '/premium') {
      setPage('premium');
    } else if (window.location.pathname === '/profile') {
      setPage('profile');
    }
  }, []);


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
    setPage('email');
  };

  const handleGoHome = () => {
    goHome();
    setPage('landing');
    window.history.pushState({}, '', '/');
  };

  // If user already has an active session, show email on page load
  if (started && page === 'landing') {
    setPage('email');
  }

  // Admin Dashboard
  if (page === 'admin') {
    return <AdminDashboard onBack={handleGoHome} />;
  }

  // Premium Auth
  if (page === 'premium') {
    return (
      <PremiumAuth
        onBack={() => { setPage('email'); window.history.pushState({}, '', '/'); }}
        onSuccess={(user) => {
          setPage('profile');
          window.history.pushState({}, '', '/profile');
        }}
      />
    );
  }

  // Profile Page
  if (page === 'profile') {
    return (
      <ProfilePage
        onBack={() => { setPage('email'); window.history.pushState({}, '', '/'); }}
        onLogout={() => { setPage('email'); window.history.pushState({}, '', '/'); }}
      />
    );
  }

  // Show landing page if no active session
  if (page === 'landing' && !started) {
    return (
      <LandingPage
        onGetStarted={handleGetStarted}
        loading={mailLoading}
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
          <p className="text-text-muted mb-8 leading-relaxed font-medium">{error}</p>
          <button onClick={generateAccount} className="glass-button w-full px-6 py-3 font-semibold tracking-wide text-lg shadow-lg">
            Retry Connection
          </button>
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
        onProfileClick={() => {
          const premiumUser = localStorage.getItem('premium_user');
          if (premiumUser) {
            setPage('profile');
            window.history.pushState({}, '', '/profile');
          } else {
            setPage('premium');
            window.history.pushState({}, '', '/premium');
          }
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-6 lg:p-10 relative z-10 flex flex-col h-full">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px] h-[calc(100vh-160px)] relative">
          {/* Inbox List */}
          <div className={`lg:col-span-4 xl:col-span-3 h-full ${showViewerOnMobile ? 'hidden lg:block' : 'block'}`}>
            <Inbox
              messages={messages}
              selectedId={selectedMessage?.id}
              onSelect={handleSelectMessage}
              loading={mailLoading && !selectedMessage && !isInitializing}
              currentAddress={account?.address}
            />
          </div>

          {/* Message Viewer */}
          <div className={`lg:col-span-8 xl:col-span-9 h-full ${!showViewerOnMobile ? 'hidden lg:block' : 'block'}`}>
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
      </main>
    </div>
  );
}

export default App;
