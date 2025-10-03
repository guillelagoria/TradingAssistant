import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Circle,
  CheckCircle,
  Wallet
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  useActiveAccount,
  useAccounts,
  useAccountStats,
  useAccountActions,
  useAccountLoading
} from '@/store/accountStore';
import { AccountType, SUPPORTED_CURRENCIES } from '@/types/account';

interface CompactAccountSelectorProps {
  className?: string;
  onCreateAccount?: () => void;
}

const CompactAccountSelector: React.FC<CompactAccountSelectorProps> = ({
  className,
  onCreateAccount
}) => {
  const activeAccount = useActiveAccount();
  const accounts = useAccounts();
  const accountStats = useAccountStats();
  const { switchAccount } = useAccountActions();
  const loading = useAccountLoading();

  const formatBalance = (balance: number, currency: string = 'USD') => {
    const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.value === currency);
    const symbol = currencyInfo?.symbol || '$';

    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(balance).replace(/^/, symbol);
  };

  const getAccountIcon = (accountType: AccountType) => {
    return accountType === AccountType.DEMO ? (
      <Circle className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
    ) : (
      <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
    );
  };

  const handleAccountChange = async (accountId: string) => {
    if (accountId === 'create-new') {
      onCreateAccount?.();
      return;
    }

    if (activeAccount?.id === accountId) {
      return;
    }

    try {
      await switchAccount(accountId);
    } catch (error) {
      console.error('Failed to switch account:', error);
    }
  };

  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return 'text-green-600 dark:text-green-400';
    if (pnl < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  // Calculate current balance and P&L
  const balanceData = useMemo(() => {
    if (!activeAccount || !accountStats) return null;

    const currentBalance = activeAccount.initialBalance + (accountStats?.totalNetPnL || 0);
    const pnl = accountStats?.totalNetPnL || 0;
    const pnlPercentage = pnl && activeAccount.initialBalance ? ((pnl / activeAccount.initialBalance) * 100) : 0;

    return { currentBalance, pnl, pnlPercentage };
  }, [activeAccount, accountStats]);

  if (!activeAccount) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Wallet className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No Account</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center', className)}>
      <Select
        value={activeAccount?.id || ''}
        onValueChange={handleAccountChange}
        disabled={loading}
      >
        <SelectTrigger className="w-[230px] h-11 bg-card border-border hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200">
          <SelectValue asChild>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-7 w-7 flex-shrink-0">
                <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                  {activeAccount.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate">
                    {activeAccount.name}
                  </span>
                  {getAccountIcon(activeAccount.accountType)}
                </div>

                {balanceData && (
                  <div className="flex items-center gap-2 text-xs mt-0.5">
                    <span className="text-foreground/80 font-semibold">
                      {formatBalance(balanceData.currentBalance, activeAccount.currency)}
                    </span>
                    {balanceData.pnl !== 0 && (
                      <span className={cn(
                        'flex items-center gap-1 px-1.5 py-0.5 rounded-md font-semibold',
                        balanceData.pnl > 0
                          ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
                      )}>
                        {balanceData.pnl > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {balanceData.pnlPercentage > 0 ? '+' : ''}{balanceData.pnlPercentage.toFixed(1)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </SelectValue>
        </SelectTrigger>

        <SelectContent className="w-[230px] max-h-[300px]">
          {accounts.map((account, index) => {
            const accountBalanceData = (() => {
              if (!accountStats) return null;
              const currentBalance = account.initialBalance + (accountStats?.totalNetPnL || 0);
              const pnl = accountStats?.totalNetPnL || 0;
              const pnlPercentage = pnl && account.initialBalance ? ((pnl / account.initialBalance) * 100) : 0;
              return { currentBalance, pnl, pnlPercentage };
            })();

            return (
              <SelectItem key={account.id} value={account.id} className="p-0">
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between w-full p-2 rounded-md"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                        {account.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{account.name}</span>
                        {getAccountIcon(account.accountType)}
                      </div>

                      {accountBalanceData && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground font-medium">
                            {formatBalance(accountBalanceData.currentBalance, account.currency)}
                          </span>
                          {accountBalanceData.pnl !== 0 && (
                            <span className={cn('flex items-center gap-1', getPnLColor(accountBalanceData.pnl))}>
                              {accountBalanceData.pnl > 0 ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              {accountBalanceData.pnlPercentage > 0 ? '+' : ''}{accountBalanceData.pnlPercentage.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      account.accountType === AccountType.DEMO
                        ? 'border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300'
                        : 'border-green-200 text-green-700 dark:border-green-800 dark:text-green-300'
                    )}
                  >
                    {account.accountType}
                  </Badge>
                </motion.div>
              </SelectItem>
            );
          })}

          {loading && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              <motion.div
                className="rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p>Loading accounts...</p>
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CompactAccountSelector;