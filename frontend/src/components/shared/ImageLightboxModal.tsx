import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  downloadFilename?: string;
}

export function ImageLightboxModal({
  isOpen,
  onClose,
  imageUrl,
  title = "Trade Screenshot",
  downloadFilename = "trade-screenshot.jpg"
}: ImageLightboxModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
          onClick={handleBackdropClick}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          {/* Header */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between"
          >
            <h3 className="text-white text-lg font-medium">{title}</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsZoomed(!isZoomed)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/20"
              >
                {isZoomed ? (
                  <ZoomOut className="h-4 w-4" />
                ) : (
                  <ZoomIn className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownload}
                className="bg-white/20 hover:bg-white/30 text-white border-white/20"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                className="bg-white/20 hover:bg-white/30 text-white border-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {/* Image Container */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "relative max-w-7xl max-h-[85vh] overflow-hidden rounded-lg",
              "transition-all duration-300 ease-in-out",
              isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
            )}
            onClick={() => setIsZoomed(!isZoomed)}
          >
            <img
              src={imageUrl}
              alt={title}
              className={cn(
                "w-full h-full object-contain transition-transform duration-300",
                isZoomed ? "scale-150" : "scale-100"
              )}
              style={{
                maxWidth: isZoomed ? 'none' : '90vw',
                maxHeight: isZoomed ? 'none' : '85vh'
              }}
            />

            {/* Zoom indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isZoomed ? 0 : 1 }}
              className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-2 rounded-md text-sm pointer-events-none"
            >
              Click to zoom
            </motion.div>
          </motion.div>

          {/* Bottom hint */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/80 text-sm"
          >
            Press ESC or click outside to close
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}