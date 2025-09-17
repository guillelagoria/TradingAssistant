import React, { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageViewerProps {
  /** Array of image URLs to display */
  images: string[];
  /** Current image index */
  currentIndex: number;
  /** Whether the viewer is open */
  isOpen: boolean;
  /** Callback when viewer should close */
  onClose: () => void;
  /** Callback when image index changes */
  onIndexChange: (index: number) => void;
  /** Optional alt text for accessibility */
  altText?: string;
  /** Whether to show navigation controls */
  showNavigation?: boolean;
  /** Whether to show image counter */
  showCounter?: boolean;
  /** Whether to show zoom controls */
  showZoomControls?: boolean;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onIndexChange,
  altText = 'Trade image',
  showNavigation = true,
  showCounter = true,
  showZoomControls = true,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  const currentImage = images[currentIndex];
  const hasMultipleImages = images.length > 1;

  // Reset state when viewer opens/closes or image changes
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setImagePosition({ x: 0, y: 0 });
      setIsLoading(true);
      setHasError(false);
    }
  }, [isOpen, currentIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (hasMultipleImages && currentIndex > 0) {
          onIndexChange(currentIndex - 1);
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (hasMultipleImages && currentIndex < images.length - 1) {
          onIndexChange(currentIndex + 1);
        }
        break;
      case '+':
      case '=':
        event.preventDefault();
        setZoom(prev => Math.min(prev + 0.5, 5));
        break;
      case '-':
        event.preventDefault();
        setZoom(prev => Math.max(prev - 0.5, 0.5));
        break;
      case '0':
        event.preventDefault();
        setZoom(1);
        setImagePosition({ x: 0, y: 0 });
        break;
    }
  }, [isOpen, onClose, hasMultipleImages, currentIndex, images.length, onIndexChange]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when viewer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Touch/mouse gesture handling
  const handleMouseDown = (event: React.MouseEvent) => {
    if (zoom > 1) {
      setDragStart({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (dragStart && zoom > 1) {
      const deltaX = event.clientX - dragStart.x;
      const deltaY = event.clientY - dragStart.y;
      setImagePosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
      setDragStart({ x: event.clientX, y: event.clientY });
    }
  }, [dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setDragStart(null);
  }, []);

  useEffect(() => {
    if (dragStart) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragStart, handleMouseMove, handleMouseUp]);

  // Navigation functions
  const goToPrevious = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  };

  // Zoom functions
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.5, 5));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.5));
  const resetZoom = () => {
    setZoom(1);
    setImagePosition({ x: 0, y: 0 });
  };

  // Rotation
  const rotate = () => setRotation(prev => prev + 90);

  // Download function
  const downloadImage = async () => {
    try {
      const response = await fetch(currentImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trade-image-${currentIndex + 1}.${blob.type.split('/')[1]}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* Header Controls */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            {showCounter && hasMultipleImages && (
              <div className="bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm font-medium">
                {currentIndex + 1} of {images.length}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showZoomControls && (
              <>
                <Button
                  onClick={zoomOut}
                  size="icon"
                  variant="secondary"
                  className="bg-black/50 hover:bg-black/70 border-0 backdrop-blur-md text-white"
                  disabled={zoom <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <div className="bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-md text-sm font-medium min-w-[60px] text-center">
                  {Math.round(zoom * 100)}%
                </div>
                <Button
                  onClick={zoomIn}
                  size="icon"
                  variant="secondary"
                  className="bg-black/50 hover:bg-black/70 border-0 backdrop-blur-md text-white"
                  disabled={zoom >= 5}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  onClick={rotate}
                  size="icon"
                  variant="secondary"
                  className="bg-black/50 hover:bg-black/70 border-0 backdrop-blur-md text-white"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  onClick={downloadImage}
                  size="icon"
                  variant="secondary"
                  className="bg-black/50 hover:bg-black/70 border-0 backdrop-blur-md text-white"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              onClick={onClose}
              size="icon"
              variant="secondary"
              className="bg-black/50 hover:bg-black/70 border-0 backdrop-blur-md text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Navigation Controls */}
        {showNavigation && hasMultipleImages && (
          <>
            <motion.button
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 z-10",
                "bg-black/50 hover:bg-black/70 backdrop-blur-md",
                "p-3 rounded-full transition-all duration-200",
                "disabled:opacity-30 disabled:cursor-not-allowed",
                "text-white hover:scale-110"
              )}
            >
              <ChevronLeft className="h-6 w-6" />
            </motion.button>

            <motion.button
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              onClick={goToNext}
              disabled={currentIndex === images.length - 1}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 z-10",
                "bg-black/50 hover:bg-black/70 backdrop-blur-md",
                "p-3 rounded-full transition-all duration-200",
                "disabled:opacity-30 disabled:cursor-not-allowed",
                "text-white hover:scale-110"
              )}
            >
              <ChevronRight className="h-6 w-6" />
            </motion.button>
          </>
        )}

        {/* Main Image Container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative w-full h-full flex items-center justify-center p-16"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-full max-h-full overflow-hidden transition-transform duration-200 ease-out"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                cursor: zoom > 1 ? 'move' : 'default',
              }}
              onMouseDown={handleMouseDown}
            >
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {hasError && (
                <div className="flex items-center justify-center w-96 h-96 bg-gray-900 rounded-lg">
                  <div className="text-center text-white">
                    <div className="text-4xl mb-2">📷</div>
                    <div className="text-lg font-medium">Failed to load image</div>
                    <div className="text-sm text-gray-400 mt-1">
                      The image could not be displayed
                    </div>
                  </div>
                </div>
              )}

              <img
                src={currentImage}
                alt={`${altText} ${currentIndex + 1}`}
                className={cn(
                  "max-w-full max-h-full object-contain select-none",
                  "transition-opacity duration-300",
                  isLoading || hasError ? "opacity-0" : "opacity-100"
                )}
                onLoad={() => {
                  setIsLoading(false);
                  setHasError(false);
                }}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Bottom Quick Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
        >
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full px-4 py-2">
            <Button
              onClick={resetZoom}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 text-xs"
              disabled={zoom === 1 && imagePosition.x === 0 && imagePosition.y === 0}
            >
              Reset View
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default ImageViewer;