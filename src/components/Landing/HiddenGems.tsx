import React, { useState, useEffect } from 'react';
import { MapPin, Eye, Star, ArrowRight, Globe, Clock, ChevronLeft, ChevronRight, Plus, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, isSupabaseReady } from '../../lib/supabase';
import { AddGemModal } from './AddGemModal';

interface HiddenGem {
  id: string;
  name: string;
  location: string;
  country: string;
  image: string;
  description: string;
  whyHidden: string;
  bestFor: string[];
  bestTime: string;
  avgBudget: string;
  rating: number;
  region: string;
  isUserSubmitted?: boolean;
}

const curatedGems: HiddenGem[] = [
  {
    id: 'curated-1',
    name: 'Chefchaouen',
    location: 'Chefchaouen, Morocco',
    country: 'Morocco',
    image: 'https://images.pexels.com/photos/3889843/pexels-photo-3889843.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'A dreamlike blue-washed mountain town nestled in the Rif Mountains. Every building, alley, and stairway is painted in shades of blue, creating one of the most photogenic towns on Earth.',
    whyHidden: 'Overshadowed by Marrakech and Fez, most travelers skip this northern gem entirely.',
    bestFor: ['Photography', 'Culture & History', 'Shopping'],
    bestTime: 'March - May',
    avgBudget: '$40-60/day',
    rating: 4.8,
    region: 'Africa',
  },
  {
    id: 'curated-2',
    name: 'Kotor',
    location: 'Kotor, Montenegro',
    country: 'Montenegro',
    image: 'https://images.pexels.com/photos/2044434/pexels-photo-2044434.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'A medieval walled city tucked into a dramatic fjord-like bay. Ancient Venetian architecture meets crystal-clear Adriatic waters, with a fortress hike offering jaw-dropping panoramic views.',
    whyHidden: 'Montenegro remains under the radar compared to neighboring Croatia and Greece.',
    bestFor: ['Adventure Sports', 'Culture & History', 'Nature & Wildlife'],
    bestTime: 'May - September',
    avgBudget: '$50-80/day',
    rating: 4.7,
    region: 'Europe',
  },
  {
    id: 'curated-3',
    name: 'Luang Prabang',
    location: 'Luang Prabang, Laos',
    country: 'Laos',
    image: 'https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'A UNESCO World Heritage city where golden temples meet French colonial charm along the Mekong River. Watch saffron-robed monks collect alms at dawn in a centuries-old tradition.',
    whyHidden: 'Laos is often skipped in favor of Thailand and Vietnam on Southeast Asian itineraries.',
    bestFor: ['Culture & History', 'Food & Dining', 'Photography'],
    bestTime: 'November - March',
    avgBudget: '$25-45/day',
    rating: 4.9,
    region: 'Asia',
  },
  {
    id: 'curated-4',
    name: 'Colonia del Sacramento',
    location: 'Colonia del Sacramento, Uruguay',
    country: 'Uruguay',
    image: 'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'A perfectly preserved Portuguese colonial town on the banks of the Rio de la Plata. Cobblestone streets, vintage cars, and stunning sunsets over the water make this a time-capsule destination.',
    whyHidden: 'Uruguay is overshadowed by its neighbors Argentina and Brazil.',
    bestFor: ['Culture & History', 'Photography', 'Art & Museums'],
    bestTime: 'October - March',
    avgBudget: '$45-70/day',
    rating: 4.6,
    region: 'Americas',
  },
  {
    id: 'curated-5',
    name: 'Hallstatt',
    location: 'Hallstatt, Austria',
    country: 'Austria',
    image: 'https://images.pexels.com/photos/3408354/pexels-photo-3408354.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'A fairy-tale lakeside village surrounded by towering Alps. Pastel-colored houses reflect in mirror-still waters, and a 7,000-year-old salt mine reveals fascinating prehistoric history.',
    whyHidden: 'While Instagram-famous, most visitors only day-trip -- staying overnight reveals the real magic.',
    bestFor: ['Nature & Wildlife', 'Photography', 'Culture & History'],
    bestTime: 'June - September',
    avgBudget: '$80-120/day',
    rating: 4.8,
    region: 'Europe',
  },
  {
    id: 'curated-6',
    name: 'Galle',
    location: 'Galle, Sri Lanka',
    country: 'Sri Lanka',
    image: 'https://images.pexels.com/photos/3566187/pexels-photo-3566187.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'A 16th-century Dutch fort city where colonial architecture blends with tropical vibrancy. Walk the ramparts at sunset, explore boutique cafes, and discover a thriving local art scene.',
    whyHidden: 'Sri Lanka is gaining popularity but Galle remains quieter than Colombo and Kandy.',
    bestFor: ['Culture & History', 'Food & Dining', 'Art & Museums'],
    bestTime: 'December - March',
    avgBudget: '$30-55/day',
    rating: 4.7,
    region: 'Asia',
  },
];

const regions = ['All', 'Europe', 'Asia', 'Africa', 'Americas'];

interface HiddenGemsProps {
  onExplore: (destination: string) => void;
  user: SupabaseUser | null;
  onAuthRequired: () => void;
}

export function HiddenGems({ onExplore, user, onAuthRequired }: HiddenGemsProps) {
  const [activeRegion, setActiveRegion] = useState('All');
  const [expandedGem, setExpandedGem] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [userGems, setUserGems] = useState<HiddenGem[]>([]);
  const [loadingGems, setLoadingGems] = useState(true);

  useEffect(() => {
    fetchUserGems();
  }, []);

  const fetchUserGems = async () => {
    if (!isSupabaseReady || !supabase) {
      setLoadingGems(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('hidden_gems')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: HiddenGem[] = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        location: row.location,
        country: row.country,
        image: row.image_url || 'https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&cs=tinysrgb&w=800',
        description: row.description,
        whyHidden: row.why_hidden || '',
        bestFor: Array.isArray(row.best_for) ? row.best_for : [],
        bestTime: row.best_time || '',
        avgBudget: row.avg_budget || '',
        rating: 0,
        region: row.region || 'Other',
        isUserSubmitted: true,
      }));
      setUserGems(mapped);
    } catch (err) {
      console.error('Failed to fetch user gems:', err);
    } finally {
      setLoadingGems(false);
    }
  };

  const handleAddGem = async (formData: {
    name: string;
    location: string;
    country: string;
    region: string;
    description: string;
    whyHidden: string;
    bestFor: string[];
    bestTime: string;
    avgBudget: string;
    imageUrl: string;
  }) => {
    if (!isSupabaseReady || !supabase || !user) return;

    const { error } = await supabase.from('hidden_gems').insert({
      user_id: user.id,
      name: formData.name,
      location: formData.location,
      country: formData.country,
      region: formData.region,
      description: formData.description,
      why_hidden: formData.whyHidden,
      best_for: formData.bestFor,
      best_time: formData.bestTime,
      avg_budget: formData.avgBudget,
      image_url: formData.imageUrl,
      status: 'approved',
    });

    if (error) throw error;
    await fetchUserGems();
  };

  const handleAddClick = () => {
    if (user) {
      setShowAddModal(true);
    } else {
      onAuthRequired();
    }
  };

  const allGems = [...curatedGems, ...userGems];
  const filtered = activeRegion === 'All' ? allGems : allGems.filter(g => g.region === activeRegion);
  const gemsPerPage = 3;
  const totalPages = Math.ceil(filtered.length / gemsPerPage);
  const paginatedGems = filtered.slice(currentPage * gemsPerPage, (currentPage + 1) * gemsPerPage);

  const handleRegionChange = (region: string) => {
    setActiveRegion(region);
    setCurrentPage(0);
    setExpandedGem(null);
  };

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.02%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full px-5 py-2 mb-6">
            <Eye className="h-4 w-4 text-amber-400" />
            <span className="text-amber-300 text-sm font-semibold tracking-wide uppercase">Hidden Gems</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Destinations Most Travelers Miss
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-6">
            Curated off-the-beaten-path locations handpicked for authentic experiences. Click any destination to start planning your trip there.
          </p>
          <button
            onClick={handleAddClick}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/40 hover:border-amber-400/60 text-amber-300 hover:text-amber-200 px-6 py-3 rounded-full font-semibold transition-all duration-300 group"
          >
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            <span>Share Your Own Hidden Gem</span>
          </button>
        </motion.div>

        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-slate-800/60 backdrop-blur-sm rounded-full p-1 border border-slate-700/50">
            {regions.map(region => (
              <button
                key={region}
                onClick={() => handleRegionChange(region)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeRegion === region
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        {loadingGems ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="wait">
                {paginatedGems.map((gem, index) => (
                  <motion.div
                    key={gem.id}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="group"
                  >
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700/50 hover:border-amber-500/30 transition-all duration-500 hover:shadow-xl hover:shadow-amber-500/5 h-full flex flex-col">
                      <div className="relative h-52 overflow-hidden">
                        <img
                          src={gem.image}
                          alt={gem.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <div className="flex items-center space-x-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                            <Eye className="h-3 w-3" />
                            <span>Hidden Gem</span>
                          </div>
                          {gem.isUserSubmitted && (
                            <div className="flex items-center space-x-1 bg-teal-500/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                              <Users className="h-3 w-3" />
                              <span>Community</span>
                            </div>
                          )}
                        </div>
                        {gem.rating > 0 && (
                          <div className="absolute top-3 right-3 flex items-center space-x-1 bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-medium">
                            <Star className="h-3 w-3 text-amber-400 fill-current" />
                            <span>{gem.rating}</span>
                          </div>
                        )}
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">{gem.name}</h3>
                          <div className="flex items-center space-x-1 text-slate-300 text-sm">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{gem.country}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 flex flex-col flex-1">
                        <p className="text-slate-300 text-sm leading-relaxed mb-4 line-clamp-3">{gem.description}</p>

                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {gem.bestFor.map(tag => (
                            <span key={tag} className="bg-slate-700/60 text-slate-300 px-2.5 py-1 rounded-full text-xs font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>

                        <AnimatePresence>
                          {expandedGem === gem.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-slate-700/30 rounded-xl p-4 mb-4 space-y-3 border border-slate-600/30">
                                {gem.whyHidden && (
                                  <div>
                                    <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">Why It's Hidden</p>
                                    <p className="text-slate-300 text-sm">{gem.whyHidden}</p>
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                  {gem.bestTime && (
                                    <div className="flex items-center space-x-2">
                                      <Clock className="h-4 w-4 text-teal-400" />
                                      <div>
                                        <p className="text-slate-500 text-xs">Best Time</p>
                                        <p className="text-white text-sm font-medium">{gem.bestTime}</p>
                                      </div>
                                    </div>
                                  )}
                                  {gem.avgBudget && (
                                    <div className="flex items-center space-x-2">
                                      <Globe className="h-4 w-4 text-teal-400" />
                                      <div>
                                        <p className="text-slate-500 text-xs">Avg Budget</p>
                                        <p className="text-white text-sm font-medium">{gem.avgBudget}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="mt-auto flex items-center gap-3">
                          <button
                            onClick={() => setExpandedGem(expandedGem === gem.id ? null : gem.id)}
                            className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                          >
                            {expandedGem === gem.id ? 'Less info' : 'More info'}
                          </button>
                          <button
                            onClick={() => onExplore(gem.location)}
                            className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-amber-500/25 group/btn"
                          >
                            <span>Plan This Trip</span>
                            <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-10">
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="p-2 rounded-full bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white hover:border-amber-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex space-x-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        i === currentPage ? 'bg-amber-500 w-7' : 'bg-slate-600 hover:bg-slate-500'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="p-2 rounded-full bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white hover:border-amber-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <AddGemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddGem}
      />
    </section>
  );
}
