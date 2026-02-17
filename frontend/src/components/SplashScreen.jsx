import { motion } from 'framer-motion'
import { Home } from 'lucide-react'

const SplashScreen = () => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated Background Gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600"
        animate={{
          background: [
            'linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%)',
            'linear-gradient(135deg, #ea580c 0%, #fb923c 50%, #f97316 100%)',
            'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #fb923c 100%)',
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Content Container */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center text-center px-4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Logo Icon */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Home className="w-24 h-24 text-white mb-6" strokeWidth={1.5} />
        </motion.div>

        {/* App Name */}
        <motion.h1
          className="text-6xl md:text-7xl font-bold text-white mb-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          House Hunt
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="text-xl md:text-2xl text-white/90 mb-8 font-light"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          Find Your Perfect Home in Kenya
        </motion.p>



        {/* Loading Bar Container */}
        <motion.div
          className="w-64 md:w-80 h-1 bg-white/20 rounded-full overflow-hidden"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '16rem', opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <motion.div
            className="h-full bg-white rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{
              duration: 2,
              delay: 1.2,
              ease: 'easeInOut',
            }}
          />
        </motion.div>

        {/* Loading Text */}
        <motion.p
          className="text-white/90 mt-6 text-sm md:text-base font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{
            delay: 1.4,
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          Loading...
        </motion.p>
      </motion.div>

      {/* Floating Particles Animation */}
      {typeof window !== 'undefined' && [...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white/30 rounded-full"
          initial={{
            x: Math.random() * (window.innerWidth || 1920),
            y: Math.random() * (window.innerHeight || 1080),
            opacity: 0,
          }}
          animate={{
            y: [null, -100],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 3,
            delay: i * 0.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </motion.div>
  )
}

export default SplashScreen

