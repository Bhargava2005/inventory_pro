import React from 'react';
import { motion } from 'framer-motion';

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-gray-900">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 0.8,
          ease: "easeOut"
        }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative">
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ 
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut"
            }}
            className="w-32 h-32 md:w-40 md:h-40 bg-primary-500/10 rounded-[2.5rem] flex items-center justify-center p-6 shadow-2xl shadow-primary-500/20"
          >
            <img 
              src="/logo.png" 
              alt="Inventory Pro" 
              className="w-full h-full object-contain filter drop-shadow-lg"
            />
          </motion.div>
          
          {/* Decorative rings */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 border-2 border-dashed border-primary-500/20 rounded-[3rem]"
          />
        </div>
        
        <div className="text-center space-y-2">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl font-black tracking-tighter text-gray-900 dark:text-white"
          >
            Inventory <span className="text-primary-600">Pro</span>
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm font-medium text-gray-400 tracking-widest uppercase"
          >
            Smart Management
          </motion.p>
        </div>
      </motion.div>
      
      {/* Footer loading indicator */}
      <div className="absolute bottom-12 w-48 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="h-full bg-primary-600"
        />
      </div>
    </div>
  );
}
