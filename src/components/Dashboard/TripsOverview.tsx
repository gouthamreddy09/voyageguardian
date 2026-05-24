import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, DollarSign, Users, Trash2, Edit3, Eye, Plus } from 'lucide-react';
import { SavedTrip } from '../../types';
import { TripService } from '../../services/tripService';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';

interface TripsOverviewProps {
  onViewTrip: (trip: SavedTrip) => void;
  onPlanNewTrip: () => void;
}

export function TripsOverview({ onViewTrip, onPlanNewTrip }: TripsOverviewProps) {
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadTrips();
  }, [user]);

  const loadTrips = async () => {
    if (!user) return;
    
    console.log('Loading trips for user:', user.id);
    setLoading(true);
    try {
      const { data } = await TripService.getUserTrips(user.id);
      console.log('Loaded trips:', data);
      setTrips(data);
    } catch (error) {
      console.error('Failed to load trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!user || !confirm('Are you sure you want to delete this trip?')) return;

    try {
      await TripService.deleteTrip(tripId, user.id);
      setTrips(trips.filter(trip => trip.id !== tripId));
    } catch (error) {
      console.error('Failed to delete trip:', error);
    }
  };

  const handleEditTitle = (trip: SavedTrip) => {
    setEditingId(trip.id);
    setEditTitle(trip.title);
  };

  const handleSaveTitle = async (tripId: string) => {
    if (!user || !editTitle.trim()) return;

    try {
      await TripService.updateTripTitle(tripId, user.id, editTitle.trim());
      setTrips(trips.map(trip => 
        trip.id === tripId 
          ? { ...trip, title: editTitle.trim() }
          : trip
      ));
      setEditingId(null);
    } catch (error) {
      console.error('Failed to update trip title:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your trips...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pt-16">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2946&q=80")'
        }}
      />
      
      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-black/25" />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-blue-800/30 to-teal-700/40" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              My Trips
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Manage and view your saved travel itineraries</p>
          </div>
          <button
            onClick={onPlanNewTrip}
            className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2 text-sm sm:text-base"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">Plan New Trip</span>
            <span className="sm:hidden">New Trip</span>
          </button>
        </div>

        {trips.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-8 sm:p-12 max-w-md mx-auto border border-gray-100/50">
              <div className="bg-gradient-to-br from-blue-100 to-teal-100 p-4 rounded-2xl w-fit mx-auto mb-6">
                <MapPin className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">No trips yet</h3>
              <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">Start planning your first adventure!</p>
              <button
                onClick={onPlanNewTrip}
                className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
              >
                Plan Your First Trip
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {trips.map((trip, index) => (
              <motion.div
                key={trip.id}
                className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-gray-100/50 hover:shadow-2xl transition-all duration-300 group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 text-white p-4 sm:p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-teal-600/20" />
                  <div className="relative z-10">
                    {editingId === trip.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm sm:text-base"
                          placeholder="Trip title"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSaveTitle(trip.id)}
                            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs sm:text-sm transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs sm:text-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg sm:text-xl font-bold mb-2 group-hover:text-blue-100 transition-colors">
                            {trip.title}
                          </h3>
                          <p className="text-blue-100 text-base sm:text-lg">{trip.destination}</p>
                        </div>
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditTitle(trip)}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTrip(trip.id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs sm:text-sm">{new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Users className="h-4 w-4" />
                      <span className="text-xs sm:text-sm">{trip.travelers} traveler{trip.travelers > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-xs sm:text-sm">{trip.budget_currency} {trip.budget}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-green-600">
                      <span className="text-xs bg-green-100 px-2 py-1 rounded-full font-medium truncate">
                        Est: {trip.budget_currency} {trip.total_cost}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500 flex-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          trip.travel_style === 'budget' ? 'bg-blue-100 text-blue-800' :
                          trip.travel_style === 'balanced' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {trip.travel_style} style
                        </span>
                      </div>
                      <button
                        onClick={() => onViewTrip(trip)}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium transition-colors text-sm"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}