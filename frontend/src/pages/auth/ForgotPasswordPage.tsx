/**
 * ForgotPasswordPage Component
 * Request password reset email
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const { requestPasswordReset, isLoading } = useAuthStore();
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await requestPasswordReset(data.email);
      setSubmittedEmail(data.email);
      setEmailSent(true);
    } catch (error) {
      // Error handling done in store with toast
      console.error('Password reset request error:', error);
    }
  };

  if (emailSent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We've sent you password reset instructions"
      >
        <div className="text-center py-8">
          <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            If an account exists for <span className="font-medium">{submittedEmail}</span>, you
            will receive password reset instructions shortly.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <Button variant="outline" onClick={() => setEmailSent(false)}>
              Try another email
            </Button>
            <div className="pt-4">
              <Link
                to="/login"
                className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email to receive reset instructions"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="pl-10"
              {...register('email')}
              disabled={isLoading}
              autoFocus
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Send reset instructions'
          )}
        </Button>

        {/* Back to Login */}
        <div className="text-center pt-4">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
