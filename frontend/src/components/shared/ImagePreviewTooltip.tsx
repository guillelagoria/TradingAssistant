import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImagePreviewTooltipProps {
  imageUrl?: string | null;
  className?: string;
  onImageClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function ImagePreviewTooltip({
  imageUrl,
  className,
  onImageClick,
  size = 'sm'
}: ImagePreviewTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const iconRef = useRef<HTMLDivElement>(null);

  if (!imageUrl) return null;

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = iconRef.current?.getBoundingClientRect();
    if (rect) {
      // Position tooltip to the right of the icon, or left if not enough space
      const spaceOnRight = window.innerWidth - rect.right;
      const tooltipWidth = 320; // Preview image width

      const x = spaceOnRight >= tooltipWidth + 20
        ? rect.right + 10
        : rect.left - tooltipWidth - 10;

      const y = Math.max(20, rect.top - 100); // Position above, with margin

      setPreviewPosition({ x, y });
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageClick?.();
  };

  const iconSize = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <>
      <div
        ref={iconRef}
        className={cn(
          "inline-flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer",
          "hover:bg-blue-100 hover:text-blue-600",
          "text-blue-500 bg-blue-50",
          size === 'sm' && "p-1",
          size === 'md' && "p-1.5",
          size === 'lg' && "p-2",
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        title="View trade screenshot"
      >
        <ImageIcon className={iconSize[size]} />
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed z-50 pointer-events-none"
            style={{
              left: previewPosition.x,
              top: previewPosition.y,
            }}
          >
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 max-w-xs">
              <div className="relative">
                <img
                  src={imageUrl}
                  alt="Trade screenshot preview"
                  className="w-full h-48 object-cover rounded-md"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 rounded-md flex items-center justify-center">
                  <ZoomIn className="h-6 w-6 text-white opacity-0 hover:opacity-100 transition-opacity duration-200" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2 text-center">
                Click to view full size
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}