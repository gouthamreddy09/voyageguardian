import React from 'react';
import { MapPin, Clock, DollarSign, Star, Eye } from 'lucide-react';
import { Activity } from '../../types';
import { motion } from 'framer-motion';

interface ItineraryCardProps {
  activity: Activity;
}

export function ItineraryCard({ activity }: ItineraryCardProps) {
  return (
    <motion.div
      className="bg-gradient-to-br from-white to-gray-50/50 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group border border-gray-100/50 hover:border-gray-200/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01 }}
    >
      <div className="p-4 relative">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-50 to-teal-50 rounded-full -translate-y-10 translate-x-10 opacity-50 group-hover:opacity-70 transition-opacity" />
        
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-start flex-col space-y-2 mb-3">
              <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">{activity.name}</h3>
              {activity.is_hidden_gem && (
                <div className="flex items-center space-x-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md w-fit">
                  <Eye className="h-3 w-3" />
                  <span>Hidden Gem</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">{activity.description}</p>
          </div>
          <div className={`px-2 py-1 rounded-lg text-xs font-bold shadow-sm ml-3 flex-shrink-0 ${
            activity.category === 'attraction' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
            activity.category === 'restaurant' ? 'bg-green-100 text-green-800 border border-green-200' :
            activity.category === 'activity' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
            activity.category === 'transport' ? 'bg-gray-100 text-gray-800 border border-gray-200' :
            'bg-orange-100 text-orange-800 border border-orange-200'
          }`}>
            {activity.category}
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center space-x-2 text-gray-600 group-hover:text-gray-700">
            <div className="bg-gray-100 p-1.5 rounded-lg group-hover:bg-blue-100 transition-colors">
              <MapPin className="h-4 w-4 group-hover:text-blue-600" />
            </div>
            <span className="font-medium text-sm truncate">{activity.location}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <div className="bg-gray-100 p-1.5 rounded-md">
                  <Clock className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{activity.duration}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <div className="bg-green-100 p-1.5 rounded-md">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm font-bold text-green-700">${activity.cost}</span>
              </div>
            </div>
            <div className="bg-blue-50 px-3 py-1 rounded-full text-xs text-blue-700 font-bold border border-blue-200">{activity.time_slot}</div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center space-x-1">
            <div className="flex items-center space-x-0.5">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <Star className="h-4 w-4 text-gray-300 fill-current" />
            </div>
            <span className="text-xs text-gray-600 ml-2 font-medium">4.2 (128 reviews)</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}