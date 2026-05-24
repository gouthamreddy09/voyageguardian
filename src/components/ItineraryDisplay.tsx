import React, { useState } from 'react';
import {
  Calendar,
  LayoutGrid,
  List,
  Sun,
  CloudSun,
  Moon,
  UtensilsCrossed,
  Hotel,
  Bus,
  DollarSign,
  Luggage,
  Lightbulb,
  ArrowLeft,
  MapPin,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Itinerary, ViewMode, DayPlan, DayActivity } from '../types/itinerary';

interface ItineraryDisplayProps {
  itinerary: Itinerary;
  onBack: () => void;
}

export function ItineraryDisplay({ itinerary, onBack }: ItineraryDisplayProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-sky-600 to-teal-600 px-6 sm:px-8 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sky-100 hover:text-white text-sm font-medium mb-3 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                New itinerary
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                <MapPin className="h-6 w-6 flex-shrink-0" />
                {itinerary.destination}
              </h1>
              <p className="text-sky-100 mt-2 text-sm leading-relaxed max-w-xl">
                {itinerary.summary}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-right flex-shrink-0 hidden sm:block">
              <div className="text-xs text-sky-200">Estimated Total</div>
              <div className="text-lg font-bold text-white">{itinerary.totalEstimatedCost}</div>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="px-6 sm:px-8 py-4 border-b border-gray-100 flex items-center gap-2">
          <span className="text-sm text-gray-500 font-medium mr-2">View:</span>
          <ViewToggle mode="timeline" current={viewMode} onClick={setViewMode} icon={<Calendar className="h-4 w-4" />} label="Timeline" />
          <ViewToggle mode="cards" current={viewMode} onClick={setViewMode} icon={<LayoutGrid className="h-4 w-4" />} label="Cards" />
          <ViewToggle mode="compact" current={viewMode} onClick={setViewMode} icon={<List className="h-4 w-4" />} label="Compact" />
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {viewMode === 'timeline' && <TimelineView days={itinerary.days} />}
          {viewMode === 'cards' && <CardsView days={itinerary.days} />}
          {viewMode === 'compact' && <CompactView days={itinerary.days} />}
        </motion.div>
      </AnimatePresence>

      {/* Tips Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <TipsCard
          title="Packing Tips"
          icon={<Luggage className="h-5 w-5 text-sky-600" />}
          items={itinerary.packingTips}
        />
        <TipsCard
          title="Travel Advice"
          icon={<Lightbulb className="h-5 w-5 text-amber-500" />}
          items={itinerary.travelAdvice}
        />
      </div>
    </motion.div>
  );
}

function ViewToggle({
  mode,
  current,
  onClick,
  icon,
  label,
}: {
  mode: ViewMode;
  current: ViewMode;
  onClick: (m: ViewMode) => void;
  icon: React.ReactNode;
  label: string;
}) {
  const active = mode === current;
  return (
    <button
      onClick={() => onClick(mode)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-sky-100 text-sky-700'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function TimelineView({ days }: { days: DayPlan[] }) {
  return (
    <div className="space-y-6">
      {days.map((day, idx) => (
        <motion.div
          key={day.day}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.08 }}
        >
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Day {day.day}</h3>
              <p className="text-slate-300 text-sm">{day.title}</p>
            </div>
            <div className="bg-white/10 px-3 py-1 rounded-lg">
              <span className="text-sm font-semibold text-white">{day.estimatedCost}</span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <TimeBlock icon={<Sun className="h-4 w-4 text-amber-500" />} label="Morning" activities={day.morning} />
            <TimeBlock icon={<CloudSun className="h-4 w-4 text-orange-500" />} label="Afternoon" activities={day.afternoon} />
            <TimeBlock icon={<Moon className="h-4 w-4 text-indigo-400" />} label="Evening" activities={day.evening} />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <InfoPill icon={<UtensilsCrossed className="h-3.5 w-3.5" />} label="Meals" items={day.meals} />
              <InfoPill icon={<Hotel className="h-3.5 w-3.5" />} label="Stay" items={[day.accommodation]} />
              <InfoPill icon={<Bus className="h-3.5 w-3.5" />} label="Transport" items={[day.transport]} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function TimeBlock({ icon, label, activities }: { icon: React.ReactNode; label: string; activities: DayActivity[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-sm font-semibold text-gray-700">{label}</span>
      </div>
      <div className="ml-6 space-y-3">
        {activities.map((act, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xs text-gray-400 font-mono">{act.time}</span>
                <span className="text-sm font-semibold text-gray-800">{act.activity}</span>
                {act.cost && <span className="text-xs text-emerald-600 font-medium">{act.cost}</span>}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{act.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoPill({ icon, label, items }: { icon: React.ReactNode; label: string; items: string[] }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-gray-500 mb-1.5">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className="space-y-1">
        {items.map((item, i) => (
          <p key={i} className="text-xs text-gray-600 leading-relaxed">{item}</p>
        ))}
      </div>
    </div>
  );
}

function CardsView({ days }: { days: DayPlan[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {days.map((day, idx) => (
        <motion.div
          key={day.day}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.06 }}
        >
          <div className="bg-gradient-to-br from-sky-50 to-teal-50 px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-sky-600 uppercase tracking-wide">Day {day.day}</div>
                <h4 className="text-base font-bold text-gray-900 mt-0.5">{day.title}</h4>
              </div>
              <div className="flex items-center gap-1 text-emerald-600">
                <DollarSign className="h-3.5 w-3.5" />
                <span className="text-sm font-bold">{day.estimatedCost}</span>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <CardSection icon={<Sun className="h-3.5 w-3.5 text-amber-500" />} label="Morning" activities={day.morning} />
            <CardSection icon={<CloudSun className="h-3.5 w-3.5 text-orange-500" />} label="Afternoon" activities={day.afternoon} />
            <CardSection icon={<Moon className="h-3.5 w-3.5 text-indigo-400" />} label="Evening" activities={day.evening} />

            <div className="pt-3 border-t border-gray-100 space-y-2">
              <div className="flex items-start gap-2">
                <Hotel className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600">{day.accommodation}</p>
              </div>
              <div className="flex items-start gap-2">
                <Bus className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600">{day.transport}</p>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function CardSection({ icon, label, activities }: { icon: React.ReactNode; label: string; activities: DayActivity[] }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-xs font-semibold text-gray-500">{label}</span>
      </div>
      <div className="space-y-1 ml-5">
        {activities.map((act, i) => (
          <p key={i} className="text-sm text-gray-700">
            <span className="font-medium">{act.activity}</span>
            {act.cost && <span className="text-emerald-600 text-xs ml-1">{act.cost}</span>}
          </p>
        ))}
      </div>
    </div>
  );
}

function CompactView({ days }: { days: DayPlan[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="divide-y divide-gray-100">
        {days.map((day, idx) => (
          <motion.div
            key={day.day}
            className="px-6 py-4 hover:bg-gray-50/50 transition-colors"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {day.day}
                </div>
                <h4 className="font-semibold text-gray-900">{day.title}</h4>
              </div>
              <span className="text-sm font-semibold text-emerald-600">{day.estimatedCost}</span>
            </div>
            <div className="ml-11 flex flex-wrap gap-2">
              {[...day.morning, ...day.afternoon, ...day.evening].map((act, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium"
                >
                  {act.activity}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TipsCard({ title, icon, items }: { title: string; icon: React.ReactNode; items: string[] }) {
  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-base font-bold text-gray-800">{title}</h3>
      </div>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0" />
            <span className="text-sm text-gray-600 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
