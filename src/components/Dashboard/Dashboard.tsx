import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, DollarSign, ArrowLeft, Save, Check } from 'lucide-react';
import { TripFormData } from '../Planning/TripPlanningForm';
import { ItineraryCard } from './ItineraryCard';
import { WeatherWidget } from './WeatherWidget';
import { CurrencyWidget } from './CurrencyWidget';
import { SaveTripModal } from './SaveTripModal';
import { ItineraryDay, WeatherData, Activity } from '../../types';
import { APIService } from '../../services/api';
import { TripService } from '../../services/tripService';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';

interface DashboardProps {
  tripData: TripFormData;
  onBack: () => void;
  savedTripId?: string;
}

export function Dashboard({ tripData, onBack, savedTripId }: DashboardProps) {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [weather, setWeather] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(!!savedTripId);
  
  const { user } = useAuth();

  useEffect(() => {
    loadTripData();
  }, [tripData]);

  const loadTripData = async () => {
    setLoading(true);
    try {
      const startDate = new Date(tripData.startDate);
      const endDate = new Date(tripData.endDate);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
      
      const dates = Array.from({ length: days }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        return date.toISOString().split('T')[0];
      });

      const [itineraryData, weatherData] = await Promise.all([
        APIService.generateItinerary(tripData.destination, days, tripData.budget, tripData.interests, dates, tripData.travelStyle),
        APIService.getWeatherForecast(tripData.destination, dates)
      ]);

      setItinerary(itineraryData);
      
      // Fix any inconsistent daily totals by recalculating from activity costs
      const correctedItinerary = itineraryData.map(day => ({
        ...day,
        total_cost: day.activities.reduce((sum, activity) => sum + activity.cost, 0)
      }));
      
      setItinerary(correctedItinerary);
      setWeather(weatherData);
    } catch (error) {
      console.error('Failed to load trip data:', error);
    } finally {
      setLoading(false);
    }
  };

  const allActivities = itinerary.flatMap(day => day.activities);
  const totalCost = itinerary.reduce((sum, day) => sum + day.total_cost, 0);

  // Fix potential division by zero and NaN issues
  const safeTotalCost = isNaN(totalCost) ? 0 : Math.round(totalCost);

  const handleSaveTrip = async (title: string) => {
    if (!user) return;
    
    console.log('handleSaveTrip called with:', { title, userId: user.id, tripData, totalCost });
    
    setSaving(true);
    try {
      const { data, error } = await TripService.saveTrip(user.id, tripData, itinerary, safeTotalCost);
      console.log('Save trip result:', { data, error });
      
      if (!error && data) {
        console.log('Trip saved successfully:', data);
        setIsSaved(true);
        setSaveModalOpen(false);
        // Show success message
        setTimeout(() => setIsSaved(false), 3000);
      } else {
        console.error('Failed to save trip:', error);
      }
    } catch (error) {
      console.error('Failed to save trip:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Creating your perfect itinerary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80")'
        }}
      />
      
      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-blue-800/20 to-teal-700/30" />
      
      {/* Header */}
      <motion.div
        className="relative z-10 bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-100/50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-full transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              
              {user && !savedTripId && (
                <button
                  onClick={() => setSaveModalOpen(true)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-all duration-200 text-sm ${
                    isSaved 
                      ? 'bg-green-100 text-green-700 border-2 border-green-200'
                      : 'bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  }`}
                  disabled={saving}
                >
                  {isSaved ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Trip</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              Your Trip to {tripData.destination}
            </h1>
          </div>
          
          <div className="mt-4 grid grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 bg-blue-50 px-4 py-3 rounded-xl border border-blue-100">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium">Dates</div>
                <div className="text-sm font-semibold text-gray-900">
                  {new Date(tripData.startDate).toLocaleDateString()} - {new Date(tripData.endDate).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-teal-50 px-4 py-3 rounded-xl border border-teal-100">
              <div className="bg-teal-100 p-2 rounded-lg">
                <Users className="h-4 w-4 text-teal-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium">Travelers</div>
                <div className="text-sm font-semibold text-gray-900">{tripData.travelers} traveler{tripData.travelers > 1 ? 's' : ''}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-green-50 px-4 py-3 rounded-xl border border-green-100">
              <div className="bg-green-100 p-2 rounded-lg">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium">Budget</div>
                <div className="text-sm font-semibold text-gray-900">{tripData.budgetCurrency} {tripData.budget}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-orange-50 px-4 py-3 rounded-xl border border-orange-100">
              <div className="bg-orange-100 p-2 rounded-lg">
                <MapPin className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium">Estimated</div>
                <div className="text-sm font-semibold text-gray-900">{tripData.budgetCurrency} {safeTotalCost}</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Itinerary */}
            <div className="space-y-4">
              {itinerary.map((day, dayIndex) => (
                <motion.div
                  key={day.day}
                  className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: dayIndex * 0.1 }}
                >
                  <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 text-white p-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-teal-600/20" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-bold mb-1">Day {day.day}</h2>
                          <p className="text-blue-100 text-sm">
                            {new Date(day.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold mb-1">{tripData.budgetCurrency} {day.total_cost}</div>
                          <div className="text-blue-100 text-xs">Daily budget</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {day.activities.map((activity, activityIndex) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: activityIndex * 0.1 }}
                      >
                        <ItineraryCard 
                          activity={activity} 
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <WeatherWidget 
              weather={weather} 
              loading={false}
            />
            
            <CurrencyWidget 
              baseCurrency={tripData.budgetCurrency}
            />
          </div>
        </div>
      </div>
      
      <SaveTripModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={handleSaveTrip}
        defaultTitle={`Trip to ${tripData.destination}`}
        loading={saving}
      />
    </div>
  );
}