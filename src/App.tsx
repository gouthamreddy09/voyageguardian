import React, { useState, useEffect } from 'react';
import { Header } from './components/Layout/Header';
import { Hero } from './components/Landing/Hero';
import { HiddenGems } from './components/Landing/HiddenGems';
import { AuthModal } from './components/Auth/AuthModal';
import { ResetPasswordPage } from './components/Auth/ResetPasswordPage';
import { TripPlanningForm, TripFormData } from './components/Planning/TripPlanningForm';
import { Dashboard } from './components/Dashboard/Dashboard';
import { TripsOverview } from './components/Dashboard/TripsOverview';
import { ChatSupport } from './components/Chat/ChatSupport';
import { APIKeySettings } from './components/AI/APIKeySettings';
import { SavedTrip } from './types';
import { useAuth } from './hooks/useAuth';
import { loadUserApiKey, decryptApiKey } from './services/aiService';

type AppState = 'landing' | 'planning' | 'dashboard' | 'trips' | 'reset-password';

function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [planningLoading, setPlanningLoading] = useState(false);
  const [tripData, setTripData] = useState<TripFormData | null>(null);
  const [savedFormData, setSavedFormData] = useState<TripFormData | null>(null);
  const [currentSavedTrip, setCurrentSavedTrip] = useState<SavedTrip | null>(null);
  const [apiKey, setApiKey] = useState('');

  const { user, loading } = useAuth();

  useEffect(() => {
    if (user) {
      loadUserApiKey(user.id).then((encrypted) => {
        if (encrypted) {
          const decrypted = decryptApiKey(encrypted);
          if (decrypted) setApiKey(decrypted);
        }
      });
    } else {
      setApiKey('');
    }
  }, [user]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (window.location.pathname === '/reset-password' || urlParams.get('type') === 'recovery') {
      setAppState('reset-password');
    }
  }, []);

  const handleGetStarted = () => {
    if (user) {
      setAppState('planning');
    } else {
      setAuthModalOpen(true);
    }
  };

  const handleTripSubmit = (formData: TripFormData) => {
    setPlanningLoading(true);
    setTripData(formData);
    setSavedFormData(formData);

    setTimeout(() => {
      setPlanningLoading(false);
      setAppState('dashboard');
    }, 3000);
  };

  const handleHomeClick = () => {
    setAppState('landing');
    setTripData(null);
    setSavedFormData(null);
  };

  const handleDashboardClick = () => {
    if (user) {
      setAppState('trips');
    } else {
      setAuthModalOpen(true);
    }
  };

  const handleViewTrip = (savedTrip: SavedTrip) => {
    const formData: TripFormData = {
      destination: savedTrip.destination,
      startDate: savedTrip.start_date,
      endDate: savedTrip.end_date,
      budget: savedTrip.budget,
      budgetCurrency: savedTrip.budget_currency,
      travelers: savedTrip.travelers,
      travelStyle: savedTrip.travel_style,
      interests: savedTrip.interests
    };

    setTripData(formData);
    setCurrentSavedTrip(savedTrip);
    setAppState('dashboard');
  };

  const handlePlanNewTrip = () => {
    setTripData(null);
    setSavedFormData(null);
    setCurrentSavedTrip(null);
    setAppState('planning');
  };

  const handleExploreGem = (destination: string) => {
    if (user) {
      setSavedFormData({ destination, startDate: '', endDate: '', budget: 1000, budgetCurrency: 'USD', travelers: 1, travelStyle: 'balanced', interests: [] });
      setAppState('planning');
    } else {
      setSavedFormData({ destination, startDate: '', endDate: '', budget: 1000, budgetCurrency: 'USD', travelers: 1, travelStyle: 'balanced', interests: [] });
      setAuthModalOpen(true);
    }
  };

  const handleBackFromDashboard = () => {
    if (currentSavedTrip) {
      setAppState('trips');
      setCurrentSavedTrip(null);
    } else {
      setAppState('planning');
    }
  };

  const handleNeedApiKey = () => {
    setSettingsOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        onAuthClick={() => setAuthModalOpen(true)}
        onHomeClick={handleHomeClick}
        onDashboardClick={handleDashboardClick}
        onSettingsClick={user ? () => setSettingsOpen(true) : undefined}
        showNavigation={appState !== 'landing' && !!user}
      />

      {appState === 'landing' && (
        <>
          <Hero onGetStarted={handleGetStarted} />
          <div id="hidden-gems">
            <HiddenGems onExplore={handleExploreGem} user={user} onAuthRequired={() => setAuthModalOpen(true)} />
          </div>
        </>
      )}

      {appState === 'planning' && (
        <div className="pt-16">
          <TripPlanningForm
            onSubmit={handleTripSubmit}
            loading={planningLoading}
            initialData={savedFormData}
          />
        </div>
      )}

      {appState === 'trips' && user && (
        <TripsOverview
          onViewTrip={handleViewTrip}
          onPlanNewTrip={handlePlanNewTrip}
        />
      )}

      {appState === 'dashboard' && tripData && (
        <div className="pt-16">
          <Dashboard
            tripData={tripData}
            onBack={handleBackFromDashboard}
            savedTripId={currentSavedTrip?.id}
            apiKey={apiKey}
            onNeedApiKey={handleNeedApiKey}
          />
        </div>
      )}

      {appState === 'reset-password' && (
        <ResetPasswordPage
          onSuccess={() => {
            setAppState('landing');
            setAuthModalOpen(true);
          }}
          onCancel={() => setAppState('landing')}
        />
      )}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          if (user) {
            if (appState === 'landing') {
              setAppState('planning');
            }
          }
        }}
      />

      {user && (
        <APIKeySettings
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          user={user}
          onKeyChange={setApiKey}
          currentKey={apiKey}
        />
      )}

      <ChatSupport />
    </div>
  );
}

export default App;
