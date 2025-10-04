/**
 * VerifyEmailPage Component
 * Email verification page that handles token from URL params
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import { AuthLayout } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { resendVerificationEmail } from '@/services/auth.service';
import { toast } from 'sonner';

type VerificationStatus = 'pending' | 'success' | 'error';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyEmail, user } = useAuthStore();
  const [status, setStatus] = useState<VerificationStatus>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // Auto-verify if token in URL
      handleVerification(token);
    } else if (user?.emailVerified) {
      // Already verified, redirect to dashboard
      navigate('/', { replace: true });
    }
  }, [searchParams, user, navigate]);

  const handleVerification = async (token: string) => {
    try {
      setStatus('pending');
      await verifyEmail(token);
      setStatus('success');

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.response?.data?.message || 'Verification failed. Please try again.');
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      await resendVerificationEmail();
      toast.success('Verification email sent! Check your inbox.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend email');
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'pending':
        return (
          <div className="text-center py-8">
            <Loader2 className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Verifying your email
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Please wait while we verify your email address...
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Email verified!
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Your email has been successfully verified. Redirecting to dashboard...
            </p>
            <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <XCircle className="w-16 h-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Verification failed
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{errorMessage}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleResendEmail} disabled={isResending}>
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend email
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => navigate('/login')}>
                Back to login
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // If no token in URL and user not logged in, show resend option
  if (!searchParams.get('token') && !user) {
    return (
      <AuthLayout title="Verify your email" subtitle="Check your inbox for the verification link">
        <div className="text-center py-8">
          <Mail className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Check your email
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            We've sent a verification link to your email address. Click the link to verify your
            account.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Didn't receive the email?
            </p>
            <Button onClick={handleResendEmail} disabled={isResending} variant="outline">
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend verification email'
              )}
            </Button>
            <div className="pt-4">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Back to login
              </Button>
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Email Verification" subtitle="">
      {renderContent()}
    </AuthLayout>
  );
}
