import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { MainLayout } from '@/components/layout';
import { Dashboard, TradeHistory, Settings, ImportPage } from '@/pages';
import {
  LoginPage,
  RegisterPage,
  VerifyEmailPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from '@/pages/auth';
import { ProtectedRoute } from '@/components/auth';
import { useAccountChangeHandler } from '@/hooks/useAccountChangeHandler';
import { initializeAccountStore } from '@/store/accountStore';
import { ThemeProvider } from '@/components/theme';
import { useAuthStore } from '@/store/authStore';

function App() {
  const { loadUserFromToken } = useAuthStore();

  // Initialize account change handling
  useAccountChangeHandler();

  useEffect(() => {
    // Initialize app on startup
    const initializeApp = async () => {
      try {
        // Load user from stored token if available
        const user = await loadUserFromToken();

        // Only initialize account store if user is authenticated
        if (user) {
          await initializeAccountStore();
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, [loadUserFromToken]);

  return (
    <ThemeProvider defaultTheme="system" storageKey="trading-diary-theme">
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected App Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trades"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <TradeHistory />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/import"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ImportPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Settings />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        <Toaster richColors position="top-right" />
      </Router>
    </ThemeProvider>
  );
}

export default App;
