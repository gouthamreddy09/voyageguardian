import React, { useState } from 'react';
import { Calendar, MapPin, DollarSign, Users, Heart, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

interface TripPlanningFormProps {
  onSubmit: (formData: TripFormData) => void;
  loading: boolean;
  initialData?: TripFormData | null;
}

export interface TripFormData {
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  budgetCurrency: string;
  travelers: number;
  travelStyle: string;
  interests: string[];
}

export function TripPlanningForm({ onSubmit, loading, initialData }: TripPlanningFormProps) {
  const [formData, setFormData] = useState<TripFormData>({
    destination: '',
    startDate: '',
    endDate: '',
    budget: 1000,
    budgetCurrency: 'USD',
    travelers: 1,
    travelStyle: 'balanced',
    interests: []
  });

  // Pre-fill form with initial data when component mounts or initialData changes
  React.useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const travelStyles = [
    { id: 'budget', name: 'Budget Traveler', description: 'Affordable options and local experiences' },
    { id: 'balanced', name: 'Balanced Explorer', description: 'Mix of comfort and adventure' },
    { id: 'luxury', name: 'Luxury Seeker', description: 'Premium experiences and accommodations' }
  ];

  const interestOptions = [
    'Culture & History', 'Food & Dining', 'Adventure Sports', 'Nature & Wildlife',
    'Art & Museums', 'Nightlife', 'Photography', 'Shopping', 'Local Markets', 'Architecture'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data before submission
    if (!formData.destination.trim()) {
      alert('Please enter a destination');
      return;
    }
    
    if (!formData.startDate || !formData.endDate) {
      alert('Please select both start and end dates');
      return;
    }
    
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      alert('End date must be after start date');
      return;
    }
    
    if (formData.budget <= 0) {
      alert('Please enter a valid budget amount');
      return;
    }
    
    onSubmit(formData);
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2874&q=80")'
        }}
      />
      
      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-blue-800/30 to-teal-700/40" />
      
      <motion.div
        className="relative z-10 max-w-5xl mx-auto p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-12 border border-white/20">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-4">Plan Your Dream Trip</h2>
          <p className="text-gray-600 text-lg">Tell us about your travel preferences and we'll create the perfect itinerary</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Destination */}
          <div className="space-y-3">
            <label className="flex items-center space-x-3 text-base font-bold text-gray-700">
              <div className="bg-blue-100 p-2 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <span>Where do you want to go?</span>
            </label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
              className="w-full px-6 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg bg-gray-50 focus:bg-white shadow-sm"
              placeholder="e.g., Paris, France"
              required
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="flex items-center space-x-3 text-base font-bold text-gray-700">
                <div className="bg-teal-100 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-teal-600" />
                </div>
                <span>Start Date</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-6 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 text-lg bg-gray-50 focus:bg-white shadow-sm"
                required
              />
            </div>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 text-base font-bold text-gray-700">
                <div className="bg-teal-100 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-teal-600" />
                </div>
                <span>End Date</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-6 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 text-lg bg-gray-50 focus:bg-white shadow-sm"
                required
              />
            </div>
          </div>

          {/* Budget and Currency */}
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-3">
              <label className="flex items-center space-x-3 text-base font-bold text-gray-700">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                </div>
                <span>Budget</span>
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
                className="w-full px-6 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-lg bg-gray-50 focus:bg-white shadow-sm"
                placeholder="1000"
                min="1"
                required
              />
            </div>
            <div className="space-y-3">
              <label className="block text-base font-bold text-gray-700">
                Budget Currency
                <span className="text-sm font-normal text-gray-500 block">Your trip costs will be shown in this currency</span>
              </label>
              <select
                value={formData.budgetCurrency}
                onChange={(e) => setFormData(prev => ({ ...prev, budgetCurrency: e.target.value }))}
                className="w-full px-6 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-base bg-gray-50 focus:bg-white shadow-sm"
              >
                <option value="USD">🇺🇸 USD - US Dollar</option>
                <option value="EUR">🇪🇺 EUR - Euro</option>
                <option value="GBP">🇬🇧 GBP - British Pound</option>
                <option value="JPY">🇯🇵 JPY - Japanese Yen</option>
                <option value="CAD">🇨🇦 CAD - Canadian Dollar</option>
                <option value="AUD">🇦🇺 AUD - Australian Dollar</option>
                <option value="CHF">🇨🇭 CHF - Swiss Franc</option>
                <option value="CNY">🇨🇳 CNY - Chinese Yuan</option>
                <option value="INR">🇮🇳 INR - Indian Rupee</option>
                <option value="KRW">🇰🇷 KRW - South Korean Won</option>
                <option value="SGD">🇸🇬 SGD - Singapore Dollar</option>
                <option value="HKD">🇭🇰 HKD - Hong Kong Dollar</option>
                <option value="NOK">🇳🇴 NOK - Norwegian Krone</option>
                <option value="SEK">🇸🇪 SEK - Swedish Krona</option>
                <option value="DKK">🇩🇰 DKK - Danish Krone</option>
                <option value="PLN">🇵🇱 PLN - Polish Zloty</option>
                <option value="CZK">🇨🇿 CZK - Czech Koruna</option>
                <option value="HUF">🇭🇺 HUF - Hungarian Forint</option>
                <option value="RUB">🇷🇺 RUB - Russian Ruble</option>
                <option value="BRL">🇧🇷 BRL - Brazilian Real</option>
                <option value="MXN">🇲🇽 MXN - Mexican Peso</option>
                <option value="ZAR">🇿🇦 ZAR - South African Rand</option>
                <option value="TRY">🇹🇷 TRY - Turkish Lira</option>
                <option value="AED">🇦🇪 AED - UAE Dirham</option>
                <option value="SAR">🇸🇦 SAR - Saudi Riyal</option>
                <option value="THB">🇹🇭 THB - Thai Baht</option>
                <option value="MYR">🇲🇾 MYR - Malaysian Ringgit</option>
                <option value="IDR">🇮🇩 IDR - Indonesian Rupiah</option>
                <option value="PHP">🇵🇭 PHP - Philippine Peso</option>
                <option value="VND">🇻🇳 VND - Vietnamese Dong</option>
                <option value="TWD">🇹🇼 TWD - Taiwan Dollar</option>
                <option value="NZD">🇳🇿 NZD - New Zealand Dollar</option>
              </select>
            </div>
          </div>

          {/* Number of Travelers */}
          <div className="space-y-3">
            <label className="flex items-center space-x-3 text-base font-bold text-gray-700">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <span>Number of Travelers</span>
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.travelers}
              onChange={(e) => setFormData(prev => ({ ...prev, travelers: parseInt(e.target.value) || 1 }))}
              className="w-full px-6 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-lg bg-gray-50 focus:bg-white shadow-sm"
            />
          </div>

          {/* Travel Style */}
          <div className="space-y-4">
            <label className="block text-base font-bold text-gray-700">Travel Style</label>
            <div className="grid grid-cols-3 gap-6">
              {travelStyles.map((style) => (
                <label
                  key={style.id}
                  className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-200 hover:scale-105 ${
                    formData.travelStyle === style.id
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 bg-white shadow-md hover:shadow-lg'
                  }`}
                >
                  <input
                    type="radio"
                    name="travelStyle"
                    value={style.id}
                    checked={formData.travelStyle === style.id}
                    onChange={(e) => setFormData(prev => ({ ...prev, travelStyle: e.target.value }))}
                    className="sr-only"
                  />
                  <div className="font-bold text-gray-900 mb-2 text-base">{style.name}</div>
                  <div className="text-sm text-gray-600">{style.description}</div>
                </label>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="space-y-4">
            <label className="flex items-center space-x-3 text-base font-bold text-gray-700">
              <div className="bg-red-100 p-2 rounded-lg">
                <Heart className="h-5 w-5 text-red-600" />
              </div>
              <span>What interests you? (Select all that apply)</span>
            </label>
            <div className="grid grid-cols-5 gap-3">
              {interestOptions.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-105 ${
                    formData.interests.includes(interest)
                      ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 disabled:opacity-50 text-white py-5 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-3"
            >
              {loading ? (
                <>
                  <Loader className="h-6 w-6 animate-spin" />
                  <span className="text-lg">Creating Your Perfect Itinerary...</span>
                </>
              ) : (
                <span className="text-lg">Generate My Itinerary</span>
              )}
            </button>
          </div>
        </form>
      </div>
      </motion.div>
    </div>
  );
}