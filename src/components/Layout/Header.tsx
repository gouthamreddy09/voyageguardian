import React from 'react';
import { Plane, User, LogOut, Home, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';

interface HeaderProps {
  onAuthClick: () => void;
  onHomeClick?: () => void;
  onDashboardClick?: () => void;
  showNavigation?: boolean;
}

export function Header({ onAuthClick, onHomeClick, onDashboardClick, showNavigation = false }: HeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <motion.header 
      className="bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-100/50 fixed top-0 left-0 right-0 z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="bg-gradient-to-br from-blue-600 to-teal-600 p-2 rounded-xl shadow-lg">
              <Plane className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">Voyage Guardian</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {showNavigation && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onHomeClick}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200 font-medium text-base"
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </button>
                {user && (
                  <button
                    onClick={onDashboardClick}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-all duration-200 font-medium text-base"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>My Trips</span>
                  </button>
                )}
              </div>
            )}
            
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-200">
                  <div className="bg-gradient-to-br from-blue-500 to-teal-500 p-1.5 rounded-full">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onAuthClick}
                className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-6 py-2.5 rounded-full font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-base"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}