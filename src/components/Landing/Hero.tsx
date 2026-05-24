import React from 'react';
import { MapPin, Sparkles, Globe, Play, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroProps {
  onGetStarted: () => void;
}

export function Hero({ onGetStarted }: HeroProps) {
  return (
    <div className="relative min-h-screen flex items-start justify-center overflow-y-auto pt-20 pb-8">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2835&q=80")'
        }}
      />
      
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40 hero-overlay" />
      
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-blue-800/40 to-teal-700/50" />
      
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.03%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
      
      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-xl"
          animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-3/4 right-1/4 w-24 h-24 bg-teal-300/20 rounded-full blur-xl"
          animate={{ y: [20, -20, 20], x: [10, -10, 10] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight drop-shadow-2xl hero-text" style={{ 
            textShadow: '3px 3px 6px rgba(0,0,0,0.9), 0 0 20px rgba(255,255,255,0.5), 2px 2px 4px rgba(0,0,0,0.8)',
            WebkitTextStroke: '2px rgba(255,255,255,0.4)'
          }}>
            Plan Your Perfect
            <span className="block bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent mt-1 sm:mt-2 drop-shadow-2xl" style={{ 
              WebkitTextStroke: '2px rgba(255,255,255,0.4)', 
              textShadow: '3px 3px 6px rgba(0,0,0,0.9), 0 0 20px rgba(255,255,255,0.5), 2px 2px 4px rgba(0,0,0,0.8)' 
            }}>
              Adventure
            </span>
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4 drop-shadow-lg font-medium" style={{
            textShadow: '2px 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(255,255,255,0.3)'
          }}>
            AI-powered itineraries, hidden gems, real-time weather, and smart budget planning—all in one beautiful app.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center items-center mb-6 sm:mb-8 md:mb-12 px-4">
            <button
              onClick={onGetStarted}
              className="group bg-white hover:bg-gray-50 text-blue-600 px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-full font-semibold text-sm sm:text-base md:text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2 w-full sm:w-auto justify-center"
            >
              <span>Start Planning</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
            <button className="group text-white hover:text-white/90 px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 font-semibold text-sm sm:text-base md:text-lg transition-all duration-200 flex items-center space-x-2 border-2 border-white/30 hover:border-white/50 rounded-full backdrop-blur-sm w-full sm:w-auto justify-center">
              <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors">
                <Play className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />
              </div>
              <span>Watch Demo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto px-4">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 hover:bg-white/30 transition-all duration-300 border border-white/30 shadow-2xl hover:shadow-3xl transform hover:scale-105">
                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-2 sm:p-3 rounded-xl sm:rounded-2xl w-fit mx-auto mb-4 sm:mb-6 shadow-lg">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white" />
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-2 drop-shadow-lg" style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(255,255,255,0.3)'
                }}>AI-Powered Planning</h3>
                <p className="text-xs sm:text-sm md:text-base text-white leading-relaxed drop-shadow-md" style={{
                  textShadow: '1px 1px 3px rgba(0,0,0,0.8)'
                }}>Get personalized itineraries crafted by advanced AI that learns your preferences.</p>
              </div>
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <button
                onClick={() => document.getElementById('hidden-gems')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full text-left bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 hover:bg-white/30 transition-all duration-300 border border-white/30 shadow-2xl hover:shadow-3xl transform hover:scale-105 cursor-pointer"
              >
                <div className="bg-gradient-to-br from-green-400 to-teal-500 p-2 sm:p-3 rounded-xl sm:rounded-2xl w-fit mx-auto mb-4 sm:mb-6 shadow-lg">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white" />
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-2 drop-shadow-lg text-center" style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(255,255,255,0.3)'
                }}>Hidden Gems</h3>
                <p className="text-xs sm:text-sm md:text-base text-white leading-relaxed drop-shadow-md text-center" style={{
                  textShadow: '1px 1px 3px rgba(0,0,0,0.8)'
                }}>Discover local secrets and authentic experiences beyond typical tourist spots.</p>
              </button>
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 hover:bg-white/30 transition-all duration-300 border border-white/30 shadow-2xl hover:shadow-3xl transform hover:scale-105">
                <div className="bg-gradient-to-br from-blue-400 to-purple-500 p-2 sm:p-3 rounded-xl sm:rounded-2xl w-fit mx-auto mb-4 sm:mb-6 shadow-lg">
                  <Globe className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white" />
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-2 drop-shadow-lg" style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(255,255,255,0.3)'
                }}>Smart Integration</h3>
                <p className="text-xs sm:text-sm md:text-base text-white leading-relaxed drop-shadow-md" style={{
                  textShadow: '1px 1px 3px rgba(0,0,0,0.8)'
                }}>Weather forecasts, currency conversion, and maps—everything you need in one place.</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}