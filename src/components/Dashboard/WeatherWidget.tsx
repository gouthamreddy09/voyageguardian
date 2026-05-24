import React from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets } from 'lucide-react';
import { WeatherData } from '../../types';
import { motion } from 'framer-motion';

interface WeatherWidgetProps {
  weather: WeatherData[];
  loading: boolean;
}

export function WeatherWidget({ weather, loading }: WeatherWidgetProps) {
  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
        return <Sun className="h-5 w-5 text-yellow-500" />;
      case 'cloudy':
      case 'partly cloudy':
        return <Cloud className="h-5 w-5 text-gray-500" />;
      case 'light rain':
      case 'rain':
        return <CloudRain className="h-5 w-5 text-blue-500" />;
      default:
        return <Sun className="h-5 w-5 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Weather Forecast</h3>
        <div className="animate-pulse space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg p-4 border border-gray-100/50"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center space-x-3 mb-4">
        <div className="bg-gradient-to-br from-blue-500 to-teal-500 p-2 rounded-xl shadow-md">
          <Cloud className="h-4 w-4 text-white" />
        </div>
        <h3 className="text-base font-bold text-gray-900">Weather Forecast</h3>
      </div>
      
      <div className="space-y-3">
        {weather.map((day, index) => (
          <motion.div
            key={day.date}
            className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-lg hover:from-blue-50 hover:to-teal-50/50 transition-all duration-200 border border-gray-100/50"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="flex items-center space-x-3">
              <div className="bg-white p-1.5 rounded-lg shadow-sm">
                <div className="h-4 w-4">
                  {getWeatherIcon(day.condition)}
                </div>
              </div>
              <div>
                <div className="font-bold text-gray-900 text-sm">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div className="text-xs text-gray-600 font-medium">{day.condition}</div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-bold text-gray-900 text-sm">
                {day.temperature.max}°/{day.temperature.min}°C
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-600 mt-1">
                <div className="flex items-center space-x-1 bg-blue-100 px-2 py-0.5 rounded-full">
                  <Droplets className="h-3 w-3" />
                  <span>{day.humidity}%</span>
                </div>
                <div className="flex items-center space-x-1 bg-gray-100 px-2 py-0.5 rounded-full">
                  <Wind className="h-3 w-3" />
                  <span>{day.wind_speed}km/h</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}