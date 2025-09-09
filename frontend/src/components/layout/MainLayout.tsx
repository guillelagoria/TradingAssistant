import { type ReactNode, useState } from 'react';
import { Menu, X } from 'lucide-react';
import Header from './Header';
import Sidebar from './Sidebar';
import { Button } from '@/components/ui/button';

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      
      {/* Mobile sidebar overlay */}
      <div className="lg:hidden">
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Mobile sidebar */}
        <div className={`
          fixed top-16 left-0 z-50 h-[calc(100vh-64px)] w-72 transform bg-background border-r transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between p-4 border-b">
            <span className="font-semibold">Navigation</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Sidebar />
        </div>
        
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          className="fixed top-20 left-4 z-30 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full">
            {/* Content container with proper spacing */}
            <div className="h-full px-4 py-6 lg:px-8">
              <div className="mx-auto max-w-7xl">
                <div className="rounded-xl bg-background/60 backdrop-blur-sm border shadow-sm min-h-[calc(100vh-140px)]">
                  <div className="p-6 lg:p-8">
                    {children}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;