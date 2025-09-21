import React, { useMemo, useCallback, useEffect } from 'react';
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

interface ActiveAccountBalanceProps {
  activeAccount: any;
  accountStats: any;
  formatBalance: (balance: number, currency: string) => string;
  getPnLColor: (pnl: number) => string;
}

// Separate component for active account balance with enhanced animations
const ActiveAccountBalance: React.FC<ActiveAccountBalanceProps> = ({
  activeAccount,
  accountStats,
  formatBalance,
  getPnLColor
}) => {
  // Use real backend data instead of local tradeStats
  const currentBalance = activeAccount.initialBalance + (accountStats?.totalNetPnL || accountStats?.totalPnL || 0);
  const pnl = accountStats?.totalNetPnL || accountStats?.totalPnL || 0;
  const pnlPercentage = pnl && activeAccount.initialBalance ? ((pnl / activeAccount.initialBalance) * 100) : 0;

  return (
    <motion.div
      className="flex items-center gap-2 text-xs"
      layout
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <motion.span
        className="text-muted-foreground font-medium"
        key={`balance-${currentBalance}`} // Force re-animation when balance changes
        initial={{ opacity: 0, scale: 0.9, y: 5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {formatBalance(currentBalance, activeAccount.currency)}
      </motion.span>
      {pnl !== 0 && (
        <motion.span
          className={cn('flex items-center gap-1', getPnLColor(pnl))}
          key={`pnl-${pnl}`} // Force re-animation when P&L changes
          initial={{ opacity: 0, x: -10, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        >
          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }}
          >
            {pnl > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
          </motion.div>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            {pnlPercentage > 0 ? '+' : ''}{pnlPercentage.toFixed(1)}%
          </motion.span>
        </motion.span>
      )}
    </motion.div>
  );
};

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
  const { trades } = useTradeStore(); // Use trades for reactivity
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  // Effect to trigger re-render when trades change (for real-time balance updates)
  useEffect(() => {
    // This effect ensures the component re-renders when trades are modified
    // The dependency on trades.length and accountStats ensures real-time updates
    if (accountStats) {
      // Force a subtle re-calculation when account stats change
      const hasAccountStatsChanged = true;
    }
  }, [trades, accountStats]);

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

  const handleAccountChange = useCallback(async (accountId: string) => {
    if (accountId === 'create-new') {
      onCreateAccount?.();
      return;
    }

    if (activeAccount?.id === accountId) {
      return; // Already on this account
    }

    setIsTransitioning(true);

    try {
      await switchAccount(accountId);
      // Small delay to show the transition effect
      setTimeout(() => setIsTransitioning(false), 300);
    } catch (error) {
      console.error('Failed to switch account:', error);
      setIsTransitioning(false);
    }
  }, [activeAccount?.id, switchAccount, onCreateAccount]);

  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return 'text-green-600 dark:text-green-400';
    if (pnl < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  // Memoize balance calculations to prevent unnecessary re-renders
  const getBalanceData = useCallback((account: any) => {
    const stats = accountStats;
    const currentBalance = account.initialBalance + (stats?.totalNetPnL || stats?.totalPnL || 0);
    const pnl = stats?.totalNetPnL || stats?.totalPnL || 0;
    const pnlPercentage = pnl && account.initialBalance ? ((pnl / account.initialBalance) * 100) : 0;

    return { currentBalance, pnl, pnlPercentage };
  }, [accountStats]);

  // Track previous balance for transition effects
  const [prevBalance, setPrevBalance] = React.useState<number | null>(null);
  const currentActiveBalance = useMemo(() => {
    if (!activeAccount) return 0;
    return activeAccount.initialBalance + (accountStats?.totalNetPnL || accountStats?.totalPnL || 0);
  }, [activeAccount, accountStats]);

  useEffect(() => {
    if (prevBalance !== null && currentActiveBalance !== prevBalance) {
      // Balance changed - could add additional visual feedback here if needed
      console.log('Balance updated:', { from: prevBalance, to: currentActiveBalance });
    }
    setPrevBalance(currentActiveBalance);
  }, [currentActiveBalance, prevBalance]);

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      setIsTransitioning(false);
    };
  }, []);

  const renderAccountOption = (account: any) => {
    const { currentBalance, pnl, pnlPercentage } = getBalanceData(account);

    return (
      <motion.div
        whileHover={{
          scale: 1.02,
          transition: { duration: 0.2, ease: "easeOut" },
          backgroundColor: "rgba(var(--accent) / 0.1)"
        }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center justify-between w-full p-2 rounded-md transition-colors cursor-pointer"
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
              <motion.div
                className="flex items-center gap-2 text-xs"
                layout
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <motion.span
                  className="text-muted-foreground font-medium"
                  key={currentBalance} // Force re-animation when balance changes
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {formatBalance(currentBalance, account.currency)}
                </motion.span>
                {pnl !== 0 && (
                  <motion.span
                    className={cn('flex items-center gap-1', getPnLColor(pnl))}
                    key={pnl} // Force re-animation when P&L changes
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                  >
                    <motion.div
                      initial={{ rotate: -180, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      {pnl > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                    </motion.div>
                    {pnlPercentage > 0 ? '+' : ''}{pnlPercentage.toFixed(1)}%
                  </motion.span>
                )}
              </motion.div>
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
        disabled={loading || isTransitioning}
      >
        <SelectTrigger className={cn(
          "w-[280px] h-12 bg-card border-border transition-all duration-300",
          isTransitioning
            ? "opacity-60 cursor-not-allowed"
            : "hover:bg-accent/50 hover:border-accent-foreground/20 hover:shadow-sm"
        )}>
          <SelectValue asChild>
            <div className="flex items-center gap-3 flex-1">
              {activeAccount ? (
                <>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                      {activeAccount.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <motion.div
                    className="flex-1 min-w-0 text-left"
                    animate={isTransitioning ? { opacity: 0.6, scale: 0.98 } : { opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      className="flex items-center gap-2"
                      layout
                    >
                      <span className="font-medium text-sm truncate">{activeAccount.name}</span>
                      <motion.div
                        whileHover={{ scale: 1.2 }}
                        transition={{ duration: 0.2 }}
                      >
                        {getAccountIcon(activeAccount.accountType)}
                      </motion.div>
                    </motion.div>

                    {showBalance && (
                      <ActiveAccountBalance
                        key={`active-balance-${activeAccount.id}-${currentActiveBalance}`}
                        activeAccount={activeAccount}
                        accountStats={accountStats}
                        formatBalance={formatBalance}
                        getPnLColor={getPnLColor}
                      />
                    )}
                  </motion.div>
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
          <AnimatePresence mode="popLayout">
            {accounts.map((account, index) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  duration: 0.2,
                  delay: index * 0.05, // Stagger effect
                  ease: "easeOut"
                }}
              >
                <SelectItem value={account.id} className="p-0">
                  {renderAccountOption(account)}
                </SelectItem>
              </motion.div>
            ))}
          </AnimatePresence>

          {showCreateButton && accounts.length > 0 && (
            <>
              <Separator className="my-2" />
              <SelectItem value="create-new" className="p-0">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{
                    scale: 1.02,
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-3 w-full p-2 rounded-md text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
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

          {(loading || isTransitioning) && (
            <motion.div
              className="p-4 text-center text-muted-foreground text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p>{isTransitioning ? 'Switching account...' : 'Loading accounts...'}</p>
            </motion.div>
          )}

          {error && (
            <div className="p-4 text-center text-red-600 text-sm">
              <p>{error}</p>
            </div>
          )}
        </SelectContent>
      </Select>

      {showCreateButton && accounts.length > 0 && (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateAccount}
            className="shrink-0 transition-all duration-200 hover:shadow-md"
            disabled={loading || isTransitioning}
          >
            <motion.div
              animate={isTransitioning ? { rotate: 180, opacity: 0.5 } : { rotate: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Plus className="h-4 w-4" />
            </motion.div>
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default AccountSelector;