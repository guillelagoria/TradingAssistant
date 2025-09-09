import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { Dashboard, TradeHistory, Settings, TradeForm } from '@/pages';
import { setupTestAuth } from '@/utils/setupAuth';

function App() {
  useEffect(() => {
    // Set up test authentication on app startup
    // In production, this would be replaced with proper auth flow
    setupTestAuth();
  }, []);

  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trades" element={<TradeHistory />} />
          <Route path="/trades/new" element={<TradeForm />} />
          <Route path="/trades/:id/edit" element={<TradeForm />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
