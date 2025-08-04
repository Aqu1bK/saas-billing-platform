// frontend/src/components/ui/AnimatedPageWrapper.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';

const AnimatedPageWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }} // For exit animations if using AnimatePresence
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPageWrapper;