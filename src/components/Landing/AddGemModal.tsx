import React, { useState } from 'react';
import { X, MapPin, Globe, Clock, DollarSign, FileText, Eye, Loader, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddGemFormData {
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
}

interface AddGemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddGemFormData) => Promise<void>;
}

const regionOptions = ['Europe', 'Asia', 'Africa', 'Americas', 'Oceania', 'Other'];

const interestTags = [
  'Culture & History', 'Food & Dining', 'Adventure Sports', 'Nature & Wildlife',
  'Art & Museums', 'Photography', 'Shopping', 'Local Markets', 'Architecture', 'Nightlife',
];

export function AddGemModal({ isOpen, onClose, onSubmit }: AddGemModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<AddGemFormData>({
    name: '',
    location: '',
    country: '',
    region: 'Europe',
    description: '',
    whyHidden: '',
    bestFor: [],
    bestTime: '',
    avgBudget: '',
    imageUrl: '',
  });

  const toggleTag = (tag: string) => {
    setForm(prev => ({
      ...prev,
      bestFor: prev.bestFor.includes(tag)
        ? prev.bestFor.filter(t => t !== tag)
        : [...prev.bestFor, tag],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim() || !form.country.trim() || !form.description.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setForm({
          name: '', location: '', country: '', region: 'Europe',
          description: '', whyHidden: '', bestFor: [], bestTime: '', avgBudget: '', imageUrl: '',
        });
        onClose();
      }, 2000);
    } catch {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
          <motion.div
            className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-2 rounded-lg">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Share a Hidden Gem</h2>
                  <p className="text-slate-400 text-sm">Help fellow travelers discover something special</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {success ? (
              <div className="p-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Eye className="h-8 w-8 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">Gem Added!</h3>
                <p className="text-slate-400">Your hidden gem is now visible to the community.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-slate-300">
                      <MapPin className="h-4 w-4 text-amber-400" />
                      <span>Place Name</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g., Chefchaouen"
                      required
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-slate-300">
                      <Globe className="h-4 w-4 text-amber-400" />
                      <span>Country</span>
                    </label>
                    <input
                      type="text"
                      value={form.country}
                      onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                      placeholder="e.g., Morocco"
                      required
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Full Location</label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                      placeholder="e.g., Chefchaouen, Morocco"
                      required
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Region</label>
                    <select
                      value={form.region}
                      onChange={e => setForm(p => ({ ...p, region: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-sm"
                    >
                      {regionOptions.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-slate-300">
                    <FileText className="h-4 w-4 text-amber-400" />
                    <span>Description</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="What makes this place special? Describe the experience..."
                    required
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-sm resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Why is it a hidden gem?</label>
                  <textarea
                    value={form.whyHidden}
                    onChange={e => setForm(p => ({ ...p, whyHidden: e.target.value }))}
                    placeholder="Why do most travelers miss this place?"
                    rows={2}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-sm resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Best For</label>
                  <div className="flex flex-wrap gap-2">
                    {interestTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                          form.bestFor.includes(tag)
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-300'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-slate-300">
                      <Clock className="h-4 w-4 text-teal-400" />
                      <span>Best Time to Visit</span>
                    </label>
                    <input
                      type="text"
                      value={form.bestTime}
                      onChange={e => setForm(p => ({ ...p, bestTime: e.target.value }))}
                      placeholder="e.g., March - May"
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-slate-300">
                      <DollarSign className="h-4 w-4 text-teal-400" />
                      <span>Avg Daily Budget</span>
                    </label>
                    <input
                      type="text"
                      value={form.avgBudget}
                      onChange={e => setForm(p => ({ ...p, avgBudget: e.target.value }))}
                      placeholder="e.g., $40-60/day"
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Image URL (optional)</label>
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))}
                    placeholder="https://images.pexels.com/..."
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-sm"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-amber-500/25"
                  >
                    {submitting ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-5 w-5" />
                        <span>Share This Gem</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
