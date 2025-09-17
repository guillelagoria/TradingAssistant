import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Plus,
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  useActiveAccount,
  useAccounts,
  useAccountStats,
  useAccountActions,
  useAccountLoading,
  useAccountError
} from '@/store/accountStore';
import { useTradeStore } from '@/store/tradeStore';
import { AccountType, SUPPORTED_CURRENCIES } from '@/types/account';

interface AccountSelectorProps {
  className?: string;
  showBalance?: boolean;
  showCreateButton?: boolean;
  onCreateAccount?: () => void;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({
  className,
  showBalance = true,
  showCreateButton = true,
  onCreateAccount
}) => {
  const activeAccount = useActiveAccount();
  const accounts = useAccounts();
  const accountStats = useAccountStats();
  const { switchAccount } = useAccountActions();
  const loading = useAccountLoading();
  const error = useAccountError();
  const { stats: tradeStats } = useTradeStore(); // Use trade stats instead

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.value === currency);
    const symbol = currencyInfo?.symbol || '$';

    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

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
      <Circle className="h-3 w-3 text-blue-500" />
    ) : (
      <CheckCircle className="h-3 w-3 text-green-500" />
    );
  };

  const getAccountTypeColor = (accountType: AccountType) => {
    return accountType === AccountType.DEMO ? 'blue' : 'green';
  };

  const handleAccountChange = async (accountId: string) => {
    if (accountId === 'create-new') {
      onCreateAccount?.();
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

  const renderAccountOption = (account: any) => {
    const stats = tradeStats; // Use trade stats
    const currentBalance = account.initialBalance + (stats?.totalPnl || 0);
    const pnl = stats?.totalPnl || 0;
    const pnlPercentage = stats?.totalPnl ? ((stats.totalPnl / account.initialBalance) * 100) : 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center justify-between w-full p-2"
      >
        <div className="flex items-center gap-3 flex-1">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
              {account.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{account.name}</span>
              {getAccountIcon(account.accountType)}
            </div>

            {showBalance && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">
                  {formatBalance(currentBalance, account.currency)}
                </span>
                {pnl !== 0 && (
                  <span className={cn('flex items-center gap-1', getPnLColor(pnl))}>
                    {pnl > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {pnlPercentage > 0 ? '+' : ''}{pnlPercentage.toFixed(1)}%
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
    );
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Select
        value={activeAccount?.id || ''}
        onValueChange={handleAccountChange}
        disabled={loading}
      >
        <SelectTrigger className="w-[280px] h-12 bg-card border-border hover:bg-accent/50 transition-colors">
          <SelectValue asChild>
            <div className="flex items-center gap-3 flex-1">
              {activeAccount ? (
                <>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                      {activeAccount.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{activeAccount.name}</span>
                      {getAccountIcon(activeAccount.accountType)}
                    </div>

                    {showBalance && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">
                          {formatBalance((activeAccount.initialBalance + (tradeStats?.totalPnl || 0)), activeAccount.currency)}
                        </span>
                        {tradeStats && tradeStats.totalPnl !== 0 && (
                          <span className={cn('flex items-center gap-1', getPnLColor(tradeStats.totalPnl))}>
                            {tradeStats.totalPnl > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {tradeStats.totalPnl > 0 ? '+' : ''}{((tradeStats.totalPnl / activeAccount.initialBalance) * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Select Account</span>
                </div>
              )}
            </div>
          </SelectValue>
        </SelectTrigger>

        <SelectContent className="w-[280px] max-h-[400px]">
          <AnimatePresence>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id} className="p-0">
                {renderAccountOption(account)}
              </SelectItem>
            ))}
          </AnimatePresence>

          {showCreateButton && accounts.length > 0 && (
            <>
              <Separator className="my-2" />
              <SelectItem value="create-new" className="p-0">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 w-full p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm">Create New Account</span>
                </motion.div>
              </SelectItem>
            </>
          )}

          {accounts.length === 0 && !loading && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No accounts found</p>
              {showCreateButton && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={onCreateAccount}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Account
                </Button>
              )}
            </div>
          )}

          {loading && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p>Loading accounts...</p>
            </div>
          )}

          {error && (
            <div className="p-4 text-center text-red-600 text-sm">
              <p>{error}</p>
            </div>
          )}
        </SelectContent>
      </Select>

      {showCreateButton && accounts.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={onCreateAccount}
          className="shrink-0"
          disabled={loading}
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default AccountSelector;