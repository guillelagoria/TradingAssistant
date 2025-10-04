/**
 * ResetPasswordPage Component
 * Reset password with token from email
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { AuthLayout, PasswordStrength } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/\d/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword, isLoading } = useAuthStore();
  const [token, setToken] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      // No token, redirect to forgot password page
      navigate('/forgot-password', { replace: true });
    }
  }, [searchParams, navigate]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      return;
    }

    try {
      await resetPassword(token, data.password);
      setResetSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (error) {
      // Error handling done in store with toast
      console.error('Password reset error:', error);
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Invalid Link" subtitle="">
        <div className="text-center py-8">
          <XCircle className="w-16 h-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Invalid or expired link
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            This password reset link is invalid or has expired.
          </p>
          <Button onClick={() => navigate('/forgot-password')}>Request new link</Button>
        </div>
      </AuthLayout>
    );
  }

  if (resetSuccess) {
    return (
      <AuthLayout title="Password reset successful" subtitle="">
        <div className="text-center py-8">
          <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Password changed!
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Your password has been successfully reset. Redirecting to login...
          </p>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset password" subtitle="Enter your new password below">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* New Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="password"
              type="password"
              placeholder="Enter new password"
              className="pl-10"
              {...register('password')}
              disabled={isLoading}
              onFocus={() => setShowPasswordStrength(true)}
              autoFocus
            />
          </div>
          {errors.password && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
          )}
          {showPasswordStrength && <PasswordStrength password={password || ''} />}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              className="pl-10"
              {...register('confirmPassword')}
              disabled={isLoading}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting password...
            </>
          ) : (
            'Reset password'
          )}
        </Button>

        {/* Back to Login */}
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Remember your password?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Sign in
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
