import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ImageViewer from '@/components/shared/ImageViewer';
import { useImageViewer } from '@/hooks/useImageViewer';
import { Image as ImageIcon } from 'lucide-react';

const ImageViewerDemo: React.FC = () => {
  const {
    isOpen: isViewerOpen,
    currentIndex,
    openViewer,
    closeViewer,
    setCurrentIndex,
  } = useImageViewer();

  // Sample images for demo (using placeholder images)
  const sampleImages = [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60',
  ];


  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Image Viewer Demo</h1>
        <p className="text-muted-foreground">
          Test the full-screen image viewer with keyboard navigation, zoom controls, and smooth animations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Image Gallery Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sampleImages.map((image, index) => (
              <div
                key={index}
                onClick={() => openViewer(index)}
                className="relative group cursor-pointer overflow-hidden rounded-lg border border-border hover:border-primary/50 transition-all duration-200"
              >
                <img
                  src={image}
                  alt={`Demo image ${index + 1}`}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/50 backdrop-blur-sm rounded-full p-2">
                    <ImageIcon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Features to Test:</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li><strong>Navigation:</strong> Use arrow keys or click the navigation buttons</li>
              <li><strong>Zoom:</strong> Use + / - keys or click zoom buttons</li>
              <li><strong>Reset:</strong> Press '0' to reset zoom and position</li>
              <li><strong>Rotate:</strong> Click the rotate button to rotate the image</li>
              <li><strong>Download:</strong> Click download button to save the image</li>
              <li><strong>Close:</strong> Press Escape, click outside, or click the X button</li>
              <li><strong>Drag:</strong> When zoomed in, drag to pan around the image</li>
            </ul>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => openViewer(0)} variant="outline">
              Open First Image
            </Button>
            <Button onClick={() => openViewer(1)} variant="outline">
              Open Second Image
            </Button>
            <Button onClick={() => openViewer(2)} variant="outline">
              Open Third Image
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Image Viewer */}
      <ImageViewer
        images={sampleImages}
        currentIndex={currentIndex}
        isOpen={isViewerOpen}
        onClose={closeViewer}
        onIndexChange={setCurrentIndex}
        altText="Demo trading chart"
        showNavigation={true}
        showCounter={true}
        showZoomControls={true}
      />

      <Card>
        <CardHeader>
          <CardTitle>Single Image Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Test with a single image (navigation controls should be hidden)
          </p>
          <div
            onClick={() => openViewer(0)}
            className="relative group cursor-pointer overflow-hidden rounded-lg border border-border hover:border-primary/50 transition-all duration-200 w-64 mx-auto"
          >
            <img
              src={sampleImages[0]}
              alt="Single demo image"
              className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/50 backdrop-blur-sm rounded-full p-2">
                <ImageIcon className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageViewerDemo;