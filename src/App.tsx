import React, { useState } from 'react';
import { Header } from './components/Layout/Header';
import { Hero } from './components/Landing/Hero';
import { HiddenGems } from './components/Landing/HiddenGems';
import { AuthModal } from './components/Auth/AuthModal';
import { ResetPasswordPage } from './components/Auth/ResetPasswordPage';
import { TripPlanningForm, TripFormData } from './components/Planning/TripPlanningForm';
import { Dashboard } from './components/Dashboard/Dashboard';
import { TripsOverview } from './components/Dashboard/TripsOverview';
import { ChatSupport } from './components/Chat/ChatSupport';
import { SavedTrip } from './types';
import { useAuth } from './hooks/useAuth';

type AppState = 'landing' | 'planning' | 'dashboard' | 'trips' | 'reset-password';

function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [planningLoading, setPlanningLoading] = useState(false);
  const [tripData, setTripData] = useState<TripFormData | null>(null);
  const [savedFormData, setSavedFormData] = useState<TripFormData | null>(null);
  const [currentSavedTrip, setCurrentSavedTrip] = useState<SavedTrip | null>(null);
  
  const { user, loading } = useAuth();

  // Check if we're on the reset password page
  React.useEffect(() => {
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
    setSavedFormData(formData); // Save form data for back navigation
    
    // Simulate API call
    setTimeout(() => {
      setPlanningLoading(false);
      setAppState('dashboard');
    }, 3000);
  };

  const handleBackToPlanning = () => {
    setAppState('planning');
    // Don't reset tripData so form can be pre-filled
  };

  const handleHomeClick = () => {
    setAppState('landing');
    setTripData(null);
    setSavedFormData(null); // Clear saved form data when going home
  };

  const handleDashboardClick = () => {
    if (user) {
      setAppState('trips');
    } else {
      setAuthModalOpen(true);
    }
  };

  const handleViewTrip = (savedTrip: SavedTrip) => {
    // Convert SavedTrip to TripFormData format
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
    setSavedFormData(null); // Clear saved form data for new trip
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
      // If viewing a saved trip, go back to trips overview
      setAppState('trips');
      setCurrentSavedTrip(null);
    } else {
      // If viewing a new trip, go back to planning
      setAppState('planning');
    }
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
        showNavigation={appState !== 'landing' && user}
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

      <ChatSupport />
    </div>
  );
}

export default App;