export interface TripFormData {
  destination: string;
  duration: string;
  budget: string;
  tripType: string;
  travelers: string;
  notes: string;
}

export interface DayActivity {
  time: string;
  activity: string;
  description: string;
  cost?: string;
}

export interface DayPlan {
  day: number;
  title: string;
  morning: DayActivity[];
  afternoon: DayActivity[];
  evening: DayActivity[];
  meals: string[];
  accommodation: string;
  transport: string;
  estimatedCost: string;
}

export interface Itinerary {
  destination: string;
  summary: string;
  days: DayPlan[];
  packingTips: string[];
  travelAdvice: string[];
  totalEstimatedCost: string;
}

export type ViewMode = 'timeline' | 'cards' | 'compact';

export const DURATION_OPTIONS = [
  { value: '1 day', label: '1 Day' },
  { value: '2 days', label: '2 Days' },
  { value: '3 days', label: '3 Days' },
  { value: '5 days', label: '5 Days' },
  { value: '1 week', label: '1 Week' },
  { value: '2 weeks', label: '2 Weeks' },
];

export const BUDGET_OPTIONS = [
  { value: 'budget', label: 'Budget / Backpacker' },
  { value: 'mid-range', label: 'Mid-Range' },
  { value: 'luxury', label: 'Luxury' },
];

export const TRIP_TYPE_OPTIONS = [
  { value: 'adventure', label: 'Adventure' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'relaxation', label: 'Relaxation' },
  { value: 'family', label: 'Family' },
  { value: 'romantic', label: 'Romantic' },
  { value: 'business', label: 'Business' },
];

export const TRAVELER_OPTIONS = [
  { value: 'solo', label: 'Solo' },
  { value: 'couple', label: 'Couple' },
  { value: 'small group', label: 'Small Group (3-5)' },
  { value: 'large group', label: 'Large Group (6+)' },
];
