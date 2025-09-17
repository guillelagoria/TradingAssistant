# ImageViewer Component

A modern, full-screen image viewer component built with React, TypeScript, and Framer Motion for the Trading Diary application.

## Features

### 🖼️ Full-Screen Display
- **Dark overlay background** for optimal image viewing
- **Maximum image size** utilization while maintaining aspect ratio
- **Responsive design** that works on desktop and mobile

### 🧭 Navigation & Controls
- **Keyboard navigation**: Arrow keys for next/previous, Escape to close
- **Mouse/touch navigation**: Click buttons or swipe gestures
- **Image counter**: Shows "1 of 3" when multiple images
- **Navigation arrows**: Previous/Next buttons with disabled states

### 🔍 Zoom & Manipulation
- **Zoom controls**: Zoom in/out with +/- keys or buttons
- **Pan when zoomed**: Drag to move around zoomed images
- **Rotation**: Rotate images 90 degrees
- **Reset view**: Quickly reset zoom and position with '0' key

### 📱 User Experience
- **Smooth animations** with Framer Motion
- **Loading states** with spinner
- **Error handling** with fallback display
- **Download functionality** to save images
- **Glass morphism UI** with backdrop blur effects

### ⌨️ Keyboard Shortcuts
- `Escape` - Close viewer
- `Arrow Left/Right` - Navigate between images
- `+/=` - Zoom in
- `-` - Zoom out
- `0` - Reset zoom and position

## Usage

### Basic Usage

```tsx
import React from 'react';
import ImageViewer from '@/components/shared/ImageViewer';
import { useImageViewer } from '@/hooks/useImageViewer';

const MyComponent = () => {
  const {
    isOpen,
    currentIndex,
    openViewer,
    closeViewer,
    setCurrentIndex,
  } = useImageViewer();

  const images = [
    'path/to/image1.jpg',
    'path/to/image2.jpg',
    'path/to/image3.jpg',
  ];

  return (
    <>
      <img
        src={images[0]}
        onClick={() => openViewer(0)}
        className="cursor-pointer"
      />

      <ImageViewer
        images={images}
        currentIndex={currentIndex}
        isOpen={isOpen}
        onClose={closeViewer}
        onIndexChange={setCurrentIndex}
        altText="My images"
      />
    </>
  );
};
```

### With Trade Details Integration

The ImageViewer is already integrated into the TradeDetails component:

```tsx
// In TradeDetails.tsx
const {
  isOpen: imageViewerOpen,
  currentIndex: currentImageIndex,
  openViewer: handleImageClick,
  closeViewer: handleImageViewerClose,
  setCurrentIndex: handleImageIndexChange,
} = useImageViewer();

// Click on trade image opens full-screen viewer
<img
  src={trade.imageUrl}
  onClick={() => handleImageClick(0)}
  className="cursor-pointer hover:scale-105 transition-transform"
/>
```

## Props

### ImageViewer Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `images` | `string[]` | Required | Array of image URLs |
| `currentIndex` | `number` | Required | Current image index |
| `isOpen` | `boolean` | Required | Whether viewer is open |
| `onClose` | `() => void` | Required | Close callback |
| `onIndexChange` | `(index: number) => void` | Required | Index change callback |
| `altText` | `string` | `'Trade image'` | Alt text for accessibility |
| `showNavigation` | `boolean` | `true` | Show nav arrows |
| `showCounter` | `boolean` | `true` | Show image counter |
| `showZoomControls` | `boolean` | `true` | Show zoom controls |

### useImageViewer Hook

The `useImageViewer` hook provides convenient state management:

```tsx
const {
  isOpen,           // boolean - viewer open state
  currentIndex,     // number - current image index
  openViewer,       // (index?: number) => void
  closeViewer,      // () => void
  setCurrentIndex,  // (index: number) => void
  nextImage,        // (totalImages: number) => void
  previousImage,    // () => void
} = useImageViewer({ initialIndex: 0 });
```

## Implementation Details

### Animations
- Entry/exit animations with opacity and scale
- Staggered animations for controls
- Smooth transitions between images
- Spring-based zoom and pan animations

### Accessibility
- Proper ARIA labels
- Keyboard navigation
- Focus management
- Screen reader support

### Performance
- Lazy loading of images
- Efficient event handling
- Minimal re-renders
- Optimized animations

### Mobile Support
- Touch gesture support
- Responsive controls
- Mobile-optimized sizing
- Touch-friendly buttons

## Files

- `/src/components/shared/ImageViewer.tsx` - Main component
- `/src/hooks/useImageViewer.ts` - State management hook
- `/src/components/demo/ImageViewerDemo.tsx` - Demo component
- `/src/components/trades/TradeDetails.tsx` - Integration example

## Dependencies

- `framer-motion` - Animations
- `lucide-react` - Icons
- `@/components/ui/*` - shadcn/ui components
- `@/lib/utils` - Utility functions

---

Built with ❤️ for the Trading Diary application using React 18 + TypeScript + Framer Motion.