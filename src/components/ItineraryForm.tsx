import React, { useState } from 'react';
import { MapPin, Clock, Wallet, Compass, Users, FileText, Plane } from 'lucide-react';
import { motion } from 'framer-motion';
import type { TripFormData } from '../types/itinerary';
import {
  DURATION_OPTIONS,
  BUDGET_OPTIONS,
  TRIP_TYPE_OPTIONS,
  TRAVELER_OPTIONS,
} from '../types/itinerary';

interface ItineraryFormProps {
  onSubmit: (data: TripFormData) => void;
  loading: boolean;
}

export function ItineraryForm({ onSubmit, loading }: ItineraryFormProps) {
  const [form, setForm] = useState<TripFormData>({
    destination: '',
    duration: '3 days',
    budget: 'mid-range',
    tripType: 'cultural',
    travelers: 'couple',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.destination.trim()) return;
    onSubmit(form);
  };

  const update = (field: keyof TripFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      className="w-full max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-sky-600 to-teal-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Plane className="h-6 w-6" />
            Plan Your Trip
          </h2>
          <p className="text-sky-100 mt-1 text-sm">
            Fill in the details and let AI craft your perfect itinerary
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Destination */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <MapPin className="h-4 w-4 text-sky-600" />
              Destination
            </label>
            <input
              type="text"
              value={form.destination}
              onChange={(e) => update('destination', e.target.value)}
              placeholder="e.g., Tokyo, Japan"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all bg-gray-50 focus:bg-white"
            />
          </div>

          {/* Duration + Budget row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Clock className="h-4 w-4 text-sky-600" />
                Trip Duration
              </label>
              <select
                value={form.duration}
                onChange={(e) => update('duration', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all bg-gray-50 focus:bg-white appearance-none"
              >
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Wallet className="h-4 w-4 text-sky-600" />
                Budget
              </label>
              <select
                value={form.budget}
                onChange={(e) => update('budget', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all bg-gray-50 focus:bg-white appearance-none"
              >
                {BUDGET_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Trip Type + Travelers row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Compass className="h-4 w-4 text-sky-600" />
                Trip Type
              </label>
              <select
                value={form.tripType}
                onChange={(e) => update('tripType', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all bg-gray-50 focus:bg-white appearance-none"
              >
                {TRIP_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Users className="h-4 w-4 text-sky-600" />
                Travelers
              </label>
              <select
                value={form.travelers}
                onChange={(e) => update('travelers', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all bg-gray-50 focus:bg-white appearance-none"
              >
                {TRAVELER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FileText className="h-4 w-4 text-sky-600" />
              Special Interests or Notes
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="e.g., vegetarian food, accessibility needs, must-see landmarks..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all bg-gray-50 focus:bg-white resize-none"
            />
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading || !form.destination.trim()}
            className="w-full bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
            whileHover={!loading ? { scale: 1.01 } : {}}
            whileTap={!loading ? { scale: 0.99 } : {}}
          >
            {loading ? (
              <>
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating Itinerary...</span>
              </>
            ) : (
              <>
                <Plane className="h-5 w-5" />
                <span>Generate Itinerary</span>
              </>
            )}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
