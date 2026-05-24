import { motion } from 'framer-motion';
import { Plane, MapPin, Compass } from 'lucide-react';

const tips = [
  'Finding the best local spots...',
  'Calculating optimal routes...',
  'Checking restaurant reviews...',
  'Planning your perfect schedule...',
  'Curating hidden gems...',
];

export function LoadingState() {
  return (
    <motion.div
      className="w-full max-w-lg mx-auto text-center py-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="relative mb-8">
        <motion.div
          className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-sky-100 to-teal-100 flex items-center justify-center"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Plane className="h-9 w-9 text-sky-600" />
        </motion.div>

        <motion.div
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
        >
          <MapPin className="h-4 w-4 text-amber-600" />
        </motion.div>

        <motion.div
          className="absolute -bottom-2 -left-2 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
        >
          <Compass className="h-4 w-4 text-emerald-600" />
        </motion.div>
      </div>

      <h3 className="text-xl font-bold text-gray-800 mb-2">Crafting Your Itinerary</h3>
      <p className="text-gray-500 text-sm mb-8">This usually takes 10-20 seconds</p>

      <div className="space-y-2 mb-8">
        {tips.map((tip, i) => (
          <motion.div
            key={tip}
            className="text-sm text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{
              duration: 4,
              delay: i * 4,
              repeat: Infinity,
              repeatDelay: tips.length * 4 - 4,
            }}
          >
            {tip}
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-sky-400"
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
