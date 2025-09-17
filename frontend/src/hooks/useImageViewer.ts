import { useState, useCallback } from 'react';

interface UseImageViewerOptions {
  /** Initial image index */
  initialIndex?: number;
}

interface UseImageViewerReturn {
  /** Whether the image viewer is open */
  isOpen: boolean;
  /** Current image index */
  currentIndex: number;
  /** Open the image viewer at a specific index */
  openViewer: (index?: number) => void;
  /** Close the image viewer */
  closeViewer: () => void;
  /** Change the current image index */
  setCurrentIndex: (index: number) => void;
  /** Go to the next image */
  nextImage: (totalImages: number) => void;
  /** Go to the previous image */
  previousImage: () => void;
}

/**
 * Custom hook for managing image viewer state
 *
 * @param options Configuration options
 * @returns Image viewer state and controls
 *
 * @example
 * ```tsx
 * const {
 *   isOpen,
 *   currentIndex,
 *   openViewer,
 *   closeViewer,
 *   setCurrentIndex
 * } = useImageViewer();
 *
 * return (
 *   <>
 *     <img
 *       src={image}
 *       onClick={() => openViewer(0)}
 *       className="cursor-pointer"
 *     />
 *     <ImageViewer
 *       images={images}
 *       currentIndex={currentIndex}
 *       isOpen={isOpen}
 *       onClose={closeViewer}
 *       onIndexChange={setCurrentIndex}
 *     />
 *   </>
 * );
 * ```
 */
export const useImageViewer = (options: UseImageViewerOptions = {}): UseImageViewerReturn => {
  const { initialIndex = 0 } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const openViewer = useCallback((index: number = 0) => {
    setCurrentIndex(index);
    setIsOpen(true);
  }, []);

  const closeViewer = useCallback(() => {
    setIsOpen(false);
  }, []);

  const nextImage = useCallback((totalImages: number) => {
    setCurrentIndex(prev => (prev + 1) % totalImages);
  }, []);

  const previousImage = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + Number.MAX_SAFE_INTEGER) % Number.MAX_SAFE_INTEGER);
  }, []);

  return {
    isOpen,
    currentIndex,
    openViewer,
    closeViewer,
    setCurrentIndex,
    nextImage,
    previousImage,
  };
};

export default useImageViewer;