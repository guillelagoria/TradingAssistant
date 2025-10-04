/**
 * PasswordStrength Component
 * Displays password strength indicator and requirements checklist
 */

import { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  {
    label: 'At least 8 characters',
    test: (pwd) => pwd.length >= 8,
  },
  {
    label: 'Contains uppercase letter',
    test: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    label: 'Contains lowercase letter',
    test: (pwd) => /[a-z]/.test(pwd),
  },
  {
    label: 'Contains a number',
    test: (pwd) => /\d/.test(pwd),
  },
  {
    label: 'Contains special character',
    test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
  },
];

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };

    const passedRequirements = requirements.filter((req) => req.test(password)).length;
    const score = (passedRequirements / requirements.length) * 100;

    if (score < 40) {
      return { score, label: 'Weak', color: 'bg-red-500' };
    } else if (score < 80) {
      return { score, label: 'Medium', color: 'bg-yellow-500' };
    } else {
      return { score, label: 'Strong', color: 'bg-green-500' };
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength Meter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400">Password strength</span>
          {strength.label && (
            <span
              className={cn(
                'font-medium',
                strength.score < 40 && 'text-red-600 dark:text-red-400',
                strength.score >= 40 && strength.score < 80 && 'text-yellow-600 dark:text-yellow-400',
                strength.score >= 80 && 'text-green-600 dark:text-green-400'
              )}
            >
              {strength.label}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all duration-300 rounded-full', strength.color)}
            style={{ width: `${strength.score}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-1.5">
        {requirements.map((requirement, index) => {
          const passed = requirement.test(password);
          return (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div
                className={cn(
                  'flex items-center justify-center w-4 h-4 rounded-full transition-colors',
                  passed
                    ? 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                )}
              >
                {passed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              </div>
              <span
                className={cn(
                  'transition-colors',
                  passed
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-slate-600 dark:text-slate-500'
                )}
              >
                {requirement.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
