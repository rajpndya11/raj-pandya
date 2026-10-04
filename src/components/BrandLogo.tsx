import React from 'react';

interface MonogramProps {
  className?: string;
  color?: string;
}

/**
 * Authentic Raj Pandya RP Interlocking Serif Monogram
 * Precision-replicated from the official brand mark in Image 1
 * Features the Didone serif R and P with the iconic razor-sharp diagonal slash
 */
export const RpMonogram: React.FC<MonogramProps> = ({ 
  className = 'w-12 h-12', 
  color = 'currentColor'
}) => {
  return (
    <svg
      viewBox="280 250 445 450"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Raj Pandya Monogram"
    >
      <g fill={color}>
        {/* Letter R Stem & Serifs */}
        <path d="M 295 265 L 372 265 L 372 432 L 372 546 Q 372 576, 408 580 L 295 580 Q 330 576, 330 546 L 330 305 Q 330 265, 295 265 Z" />
        
        {/* Letter R Bowl Outer & Inner Counter */}
        <path fillRule="evenodd" clipRule="evenodd" d="M 372 265 C 458 265, 542 285, 542 348 C 542 412, 458 432, 372 432 Z M 372 295 C 428 295, 488 310, 488 348 C 488 388, 428 402, 372 402 Z" />
        
        {/* Letter R Leg (parallel to razor slash) */}
        <path d="M 400 426 C 420 426, 442 434, 456 450 L 488 518 C 492 526, 486 534, 474 534 L 452 534 L 420 472 C 412 456, 400 448, 385 448 L 372 448 L 372 426 Z" />
        
        {/* Razor Diagonal Slash */}
        <path d="M 416 644 L 570 384 L 577 388 L 423 648 Z" />
        
        {/* Letter P Stem & Serif */}
        <path d="M 508 492 L 555 412 L 555 650 Q 555 680, 588 685 L 480 685 Q 508 680, 508 650 Z" />
        
        {/* Letter P Bowl Outer & Inner Counter */}
        <path fillRule="evenodd" clipRule="evenodd" d="M 555 385 C 638 385, 710 405, 710 468 C 710 530, 638 550, 555 550 Z M 555 415 C 612 415, 656 430, 656 468 C 656 505, 612 520, 555 520 Z" />
      </g>
    </svg>
  );
};

interface BrandLogoProps {
  className?: string;
  showSubtitle?: boolean;
  layout?: 'horizontal' | 'vertical' | 'stacked';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  monogramSize?: string;
  withBadge?: boolean;
  variant?: 'light' | 'dark' | 'auto';
}

/**
 * Full Raj Pandya Brand Logo
 * Exactly reflects the brand logo in Image 1:
 * - Pure Didone RP monogram with the diagonal slash
 * - "RAJ PANDYA" in bold geometric uppercase with wide letter-spacing
 * - "PRODUCT MANAGER" in refined uppercase with expanded tracking
 * - Clean presentation without artificial box cards or borders
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  showSubtitle = true,
  layout = 'horizontal',
  size = 'lg',
  monogramSize,
  withBadge = false,
  variant = 'auto'
}) => {
  const sizeConfig = {
    sm: {
      icon: 'w-8 h-8 sm:w-9 sm:h-9',
      title: 'text-sm sm:text-base font-bold tracking-[0.24em]',
      subtitle: 'text-[9px] font-normal tracking-[0.38em]'
    },
    md: {
      icon: 'w-10 h-10 sm:w-11 sm:h-11',
      title: 'text-base sm:text-lg font-bold tracking-[0.26em]',
      subtitle: 'text-[10px] font-normal tracking-[0.40em]'
    },
    lg: {
      icon: 'w-12 h-12 sm:w-14 sm:h-14',
      title: 'text-xl sm:text-2xl font-bold tracking-[0.26em]',
      subtitle: 'text-[10.5px] sm:text-xs font-normal tracking-[0.42em]'
    },
    xl: {
      icon: 'w-16 h-16 sm:w-20 sm:h-20',
      title: 'text-2xl sm:text-4xl font-extrabold tracking-[0.28em]',
      subtitle: 'text-xs sm:text-sm font-normal tracking-[0.48em]'
    }
  }[size];

  const isExplicitDark = variant === 'dark';
  const textColor = isExplicitDark 
    ? 'text-[#F7F4ED]' 
    : variant === 'light' 
      ? 'text-[#171A18]' 
      : 'text-[#171A18] dark:text-[#F7F4ED]';
  const subColor = isExplicitDark 
    ? 'text-[#A39D91]' 
    : variant === 'light' 
      ? 'text-[#77736B]' 
      : 'text-[#77736B] dark:text-[#A39D91]';
  const monogramColor = isExplicitDark 
    ? '#F7F4ED' 
    : variant === 'light' 
      ? '#171A18' 
      : undefined;

  if (layout === 'vertical' || layout === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center group cursor-pointer select-none ${className}`}>
        <div className="relative mb-3 transition-transform duration-300 group-hover:scale-105">
          {withBadge ? (
            <div className="p-3 rounded-2xl bg-white dark:bg-[#1F2421] border border-[#DED8CC] dark:border-[#2A2E2C] shadow-sm flex items-center justify-center">
              <RpMonogram className={`${monogramSize || sizeConfig.icon} ${textColor}`} color={monogramColor} />
            </div>
          ) : (
            <RpMonogram className={`${monogramSize || sizeConfig.icon} ${textColor}`} color={monogramColor} />
          )}
        </div>
        <div className="flex flex-col items-center">
          <span className={`font-sans ${sizeConfig.title} ${textColor} uppercase leading-tight group-hover:opacity-85 transition-opacity`}>
            RAJ PANDYA
          </span>
          {showSubtitle && (
            <span className={`font-sans ${sizeConfig.subtitle} ${subColor} uppercase mt-1`}>
              PRODUCT MANAGER
            </span>
          )}
        </div>
      </div>
    );
  }

  // Default horizontal layout (prominent, high-impact branding for Navbar and Header)
  return (
    <div className={`flex items-center gap-3.5 sm:gap-4.5 group cursor-pointer select-none ${className}`}>
      {/* Authentic Monogram without constraining boxes */}
      <div className="relative flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
        {withBadge ? (
          <div className="p-2 rounded-2xl bg-white dark:bg-[#1F2421] border border-[#DED8CC] dark:border-[#2A2E2C] shadow-sm flex items-center justify-center">
            <RpMonogram className={`${monogramSize || sizeConfig.icon} ${textColor}`} color={monogramColor} />
          </div>
        ) : (
          <RpMonogram className={`${monogramSize || sizeConfig.icon} ${textColor}`} color={monogramColor} />
        )}
      </div>

      {/* Brand Typography with Exact Geometry */}
      <div className="flex flex-col justify-center">
        <span className={`font-sans ${sizeConfig.title} ${textColor} uppercase leading-none group-hover:opacity-85 transition-opacity`}>
          RAJ PANDYA
        </span>
        {showSubtitle && (
          <span className={`font-sans ${sizeConfig.subtitle} ${subColor} uppercase mt-1 sm:mt-1.5`}>
            PRODUCT MANAGER
          </span>
        )}
      </div>
    </div>
  );
};
