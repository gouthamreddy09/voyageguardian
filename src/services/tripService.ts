import { supabase, isSupabaseReady } from '../lib/supabase';
import { SavedTrip, ItineraryDay } from '../types';
import { TripFormData } from '../components/Planning/TripPlanningForm';

export class TripService {
  static async saveTrip(
    userId: string, 
    tripData: TripFormData, 
    itinerary: ItineraryDay[], 
    totalCost: number
  ): Promise<{ data: SavedTrip | null; error: any }> {
    if (!isSupabaseReady || !supabase) {
      // Store in localStorage as fallback
      const trip: SavedTrip = {
        id: Date.now().toString(),
        user_id: userId,
        title: `Trip to ${tripData.destination}`,
        destination: tripData.destination,
        start_date: tripData.startDate,
        end_date: tripData.endDate,
        budget: tripData.budget,
        budget_currency: tripData.budgetCurrency,
        travel_style: tripData.travelStyle,
        travelers: tripData.travelers,
        interests: tripData.interests,
        itinerary: itinerary,
        total_cost: totalCost,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const savedTrips = this.getSavedTripsFromStorage();
      savedTrips.push(trip);
      localStorage.setItem('savedTrips', JSON.stringify(savedTrips));
      
      return { data: trip, error: null };
    }

    try {
      console.log('Saving trip to Supabase:', {
        user_id: userId,
        title: `Trip to ${tripData.destination}`,
        destination: tripData.destination,
        start_date: tripData.startDate,
        end_date: tripData.endDate,
        budget: tripData.budget,
        budget_currency: tripData.budgetCurrency,
        travel_style: tripData.travelStyle,
        travelers: tripData.travelers,
        interests: tripData.interests,
        total_cost: totalCost
      });

      const { data, error } = await supabase
        .from('saved_trips')
        .insert([
          {
            user_id: userId,
            title: `Trip to ${tripData.destination}`,
            destination: tripData.destination,
            start_date: tripData.startDate,
            end_date: tripData.endDate,
            budget: tripData.budget,
            budget_currency: tripData.budgetCurrency,
            travel_style: tripData.travelStyle,
            travelers: tripData.travelers,
            interests: tripData.interests,
            itinerary: itinerary,
            total_cost: totalCost
          }
        ])
        .select()
        .single();

      console.log('Supabase save result:', { data, error });
      return { data, error };
    } catch (error) {
      console.error('Error saving trip:', error);
      return { data: null, error };
    }
  }

  static async getUserTrips(userId: string): Promise<{ data: SavedTrip[]; error: any }> {
    if (!isSupabaseReady || !supabase) {
      // Get from localStorage as fallback
      const savedTrips = this.getSavedTripsFromStorage();
      const userTrips = savedTrips.filter(trip => trip.user_id === userId);
      return { data: userTrips, error: null };
    }

    try {
      console.log('Fetching trips for user:', userId);
      
      const { data, error } = await supabase
        .from('saved_trips')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      console.log('Supabase fetch result:', { data, error, count: data?.length });
      return { data: data || [], error };
    } catch (error) {
      console.error('Error fetching trips:', error);
      return { data: [], error };
    }
  }

  static async deleteTrip(tripId: string, userId: string): Promise<{ error: any }> {
    if (!isSupabaseReady || !supabase) {
      // Remove from localStorage as fallback
      const savedTrips = this.getSavedTripsFromStorage();
      const filteredTrips = savedTrips.filter(trip => !(trip.id === tripId && trip.user_id === userId));
      localStorage.setItem('savedTrips', JSON.stringify(filteredTrips));
      return { error: null };
    }

    try {
      const { error } = await supabase
        .from('saved_trips')
        .delete()
        .eq('id', tripId)
        .eq('user_id', userId);

      return { error };
    } catch (error) {
      console.error('Error deleting trip:', error);
      return { error };
    }
  }

  static async updateTripTitle(tripId: string, userId: string, newTitle: string): Promise<{ error: any }> {
    if (!isSupabaseReady || !supabase) {
      // Update in localStorage as fallback
      const savedTrips = this.getSavedTripsFromStorage();
      const tripIndex = savedTrips.findIndex(trip => trip.id === tripId && trip.user_id === userId);
      if (tripIndex !== -1) {
        savedTrips[tripIndex].title = newTitle;
        savedTrips[tripIndex].updated_at = new Date().toISOString();
        localStorage.setItem('savedTrips', JSON.stringify(savedTrips));
      }
      return { error: null };
    }

    try {
      const { error } = await supabase
        .from('saved_trips')
        .update({ 
          title: newTitle,
          updated_at: new Date().toISOString()
        })
        .eq('id', tripId)
        .eq('user_id', userId);

      return { error };
    } catch (error) {
      console.error('Error updating trip title:', error);
      return { error };
    }
  }

  private static getSavedTripsFromStorage(): SavedTrip[] {
    try {
      const saved = localStorage.getItem('savedTrips');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }
}