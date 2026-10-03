import React, { useState, useEffect, useRef } from 'react';
import { ImageOff } from 'lucide-react';
import { normalizeImageUrl } from '../utils/imageCompressor';

interface BlurImageProps {
  src: string;
  alt: string;
  lowResSrc?: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: string; // e.g. "aspect-[16/9]", "aspect-[4/5]"
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  objectFit?: 'cover' | 'contain';
  hoverZoom?: boolean;
  priority?: boolean;
}

export const BlurImage: React.FC<BlurImageProps> = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  aspectRatio = 'aspect-[16/9]',
  loading = 'lazy',
  decoding = 'async',
  objectFit = 'cover',
  hoverZoom = false,
  priority = false,
}) => {
  const cleanSrc = normalizeImageUrl(src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Sync state on src change or if image is already cached
  useEffect(() => {
    setHasError(false);
    if (!cleanSrc) {
      setHasError(true);
      return;
    }
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setIsLoaded(true);
      } else {
        setHasError(true);
      }
    } else {
      setIsLoaded(false);
    }
  }, [cleanSrc]);

  return (
    <div 
      className={`relative overflow-hidden bg-[#EFE9DC] ${aspectRatio} ${containerClassName}`}
    >
      {/* Target Image with direct display and graceful error fallback */}
      {!hasError && cleanSrc ? (
        <img
          key={cleanSrc}
          ref={imgRef}
          src={cleanSrc}
          alt={alt}
          loading={priority ? 'eager' : loading}
          decoding={decoding}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full ${objectFit === 'contain' ? 'object-contain' : 'object-cover'} transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-90'
          } ${hoverZoom ? 'group-hover:scale-105 duration-500 transition-transform' : ''} ${className}`}
        />
      ) : (
        /* Fallback Container if URL fails */
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#EFE9DC] border border-[#DED8CC]">
          <div className="w-10 h-10 rounded-full bg-[#171A18]/5 border border-[#DED8CC] flex items-center justify-center text-[#B08D57] mb-2">
            <ImageOff className="w-4 h-4" />
          </div>
          <span className="font-serif text-xs font-semibold text-[#171A18] line-clamp-1 max-w-[80%]">
            {alt || 'Preview Unavailable'}
          </span>
          <span className="text-[10px] text-[#77736B] uppercase tracking-wider mt-0.5">
            Verified Project Asset
          </span>
        </div>
      )}
    </div>
  );
};
