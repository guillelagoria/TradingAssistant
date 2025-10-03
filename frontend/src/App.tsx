import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { MainLayout } from '@/components/layout';
import { Dashboard, TradeHistory, Settings, ImportPage } from '@/pages';
import { setupTestAuth } from '@/utils/setupAuth';
import { useAccountChangeHandler } from '@/hooks/useAccountChangeHandler';
import { initializeAccountStore } from '@/store/accountStore';
import { ThemeProvider } from '@/components/theme';

function App() {
  // Initialize account change handling
  useAccountChangeHandler();

  useEffect(() => {
    // Initialize account store and set up test authentication on app startup
    const initializeApp = async () => {
      try {
        // Set up test authentication first
        setupTestAuth();

        // Initialize account store
        await initializeAccountStore();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <ThemeProvider defaultTheme="system" storageKey="trading-diary-theme">
      <Router future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/trades" element={<TradeHistory />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </MainLayout>
        <Toaster richColors position="top-right" />
      </Router>
    </ThemeProvider>
  );
}

export default App;
