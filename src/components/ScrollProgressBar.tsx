import React from 'react';
import { motion, useScroll, useSpring } from 'motion/react';

interface ScrollProgressBarProps {
  className?: string;
}

export const ScrollProgressBar: React.FC<ScrollProgressBarProps> = ({ className = '' }) => {
  const { scrollYProgress } = useScroll();

  // Smooth spring physics for silky, non-stuttering tracking
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.0005
  });

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      {/* Subtle background hairline track */}
      <div className="w-full h-[2px] bg-transparent" />
      
      {/* Active Champagne Gold Progress Bar */}
      <motion.div
        style={{ scaleX }}
        className={`absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#B08D57] via-[#C6A66B] to-[#B08D57] origin-left shadow-[0_1px_8px_rgba(176,141,87,0.45)] ${className}`}
        aria-hidden="true"
      />
    </div>
  );
};
