export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface TripPlan {
  id: string;
  user_id: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  budget_currency: string;
  travel_style: string;
  interests: string[];
  itinerary: ItineraryDay[];
  created_at: string;
}

export interface ItineraryDay {
  day: number;
  date: string;
  activities: Activity[];
  total_cost: number;
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  duration: string;
  cost: number;
  category: 'attraction' | 'restaurant' | 'activity' | 'transport' | 'accommodation';
  is_hidden_gem: boolean;
  time_slot: string;
}

export interface WeatherData {
  date: string;
  temperature: {
    min: number;
    max: number;
  };
  condition: string;
  icon: string;
  humidity: number;
  wind_speed: number;
}

export interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
  last_updated: string;
}

export interface SavedTrip {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  budget_currency: string;
  travel_style: string;
  travelers: number;
  interests: string[];
  itinerary: ItineraryDay[];
  total_cost: number;
  created_at: string;
  updated_at: string;
}