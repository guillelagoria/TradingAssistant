import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Target,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import AccountSelector from './AccountSelector';
import {
  useActiveAccount,
  useAccounts,
  useAccountStats,
  useAccountActions,
  useAccountLoading,
  useAccountError,
  initializeAccountStore
} from '@/store/accountStore';
import { AccountType, ACCOUNT_TYPE_OPTIONS } from '@/types/account';

/**
 * Demo component showing how to use the multi-account system
 * This demonstrates:
 * 1. Account selector usage
 * 2. Account store hooks
 * 3. Account statistics display
 * 4. Error handling
 * 5. Loading states
 */
const AccountDemo: React.FC = () => {
  const activeAccount = useActiveAccount();
  const accounts = useAccounts();
  const accountStats = useAccountStats();
  const {
    fetchAccounts,
    createAccount,
    switchAccount,
    refreshAccountStats,
    setError
  } = useAccountActions();
  const loading = useAccountLoading();
  const error = useAccountError();

  // Initialize account store on component mount
  useEffect(() => {
    initializeAccountStore();
  }, []);

  const handleCreateDemoAccount = async () => {
    try {
      await createAccount({
        name: `Demo Account ${accounts.length + 1}`,
        accountType: AccountType.DEMO,
        currency: 'USD',
        creationDate: new Date(),
        initialBalance: 100000,
        currentBalance: 100000
      });
    } catch (error) {
      console.error('Failed to create demo account:', error);
    }
  };

  const handleCreateLiveAccount = async () => {
    try {
      await createAccount({
        name: `Live Account ${accounts.filter(a => a.accountType === AccountType.LIVE).length + 1}`,
        accountType: AccountType.LIVE,
        currency: 'USD',
        creationDate: new Date(),
        initialBalance: 50000,
        currentBalance: 50000
      });
    } catch (error) {
      console.error('Failed to create live account:', error);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return 'text-green-600 dark:text-green-400';
    if (pnl < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-3xl font-bold">Multi-Account System Demo</h1>
        <p className="text-muted-foreground">
          Demonstration of the comprehensive multi-account trading system
        </p>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Account Selector Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Account Selector Component
          </CardTitle>
          <CardDescription>
            The main account selector with balance display and create account functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <AccountSelector
              showBalance={true}
              showCreateButton={true}
              onCreateAccount={() => console.log('Create account clicked')}
              className="w-full sm:w-auto"
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateDemoAccount}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Demo Account
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateLiveAccount}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Live Account
              </Button>
            </div>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading accounts...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Account Info */}
      {activeAccount && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Active Account Details
                </div>
                <Badge
                  variant="outline"
                  className={
                    activeAccount.accountType === AccountType.DEMO
                      ? 'border-blue-200 text-blue-700'
                      : 'border-green-200 text-green-700'
                  }
                >
                  {activeAccount.accountType}
                </Badge>
              </CardTitle>
              <CardDescription>
                Currently selected account information and statistics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Account Name</p>
                  <p className="text-2xl font-bold">{activeAccount.name}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Current Balance</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      activeAccount.currentBalance || activeAccount.initialBalance,
                      activeAccount.currency
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Currency</p>
                  <p className="text-lg">{activeAccount.currency}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Status</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Active</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Account Statistics */}
              {accountStats && (
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Performance Statistics
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Total P&L</p>
                      <p className={`text-xl font-bold ${getPnLColor(accountStats.totalPnL)}`}>
                        {formatCurrency(accountStats.totalPnL, activeAccount.currency)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">P&L %</p>
                      <div className={`flex items-center gap-1 ${getPnLColor(accountStats.totalPnL)}`}>
                        {accountStats.totalPnL > 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span className="font-bold">
                          {accountStats.totalPnLPercentage > 0 ? '+' : ''}
                          {accountStats.totalPnLPercentage.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Win Rate</p>
                      <p className="text-xl font-bold">
                        {accountStats.winRate.toFixed(1)}%
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Total Trades</p>
                      <p className="text-xl font-bold">{accountStats.totalTrades}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshAccountStats()}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Stats
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* All Accounts Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            All Accounts Overview
          </CardTitle>
          <CardDescription>
            List of all available accounts with quick switch functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <div>
                <p className="text-muted-foreground">No accounts found</p>
                <p className="text-sm text-muted-foreground">Create your first account to get started</p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleCreateDemoAccount} disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Demo Account
                </Button>
                <Button onClick={handleCreateLiveAccount} disabled={loading} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Live Account
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account, index) => (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      activeAccount?.id === account.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => switchAccount(account.id)}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{account.name}</h4>
                        <Badge
                          variant="outline"
                          className={
                            account.accountType === AccountType.DEMO
                              ? 'border-blue-200 text-blue-700'
                              : 'border-green-200 text-green-700'
                          }
                        >
                          {account.accountType}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Balance:</span>
                          <span className="font-medium">
                            {formatCurrency(
                              account.currentBalance || account.initialBalance,
                              account.currency
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Currency:</span>
                          <span>{account.currency}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Status:</span>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-green-600">Active</span>
                          </div>
                        </div>
                      </div>

                      {activeAccount?.id === account.id && (
                        <Badge variant="secondary" className="w-full justify-center">
                          Current Account
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Instructions</CardTitle>
          <CardDescription>
            How to integrate the multi-account system into your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">1. Initialize the Account Store</h4>
            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`import { initializeAccountStore } from '@/store/accountStore';

// In your app's main component or root
useEffect(() => {
  initializeAccountStore();
}, []);`}
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">2. Use Account Hooks</h4>
            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`import {
  useActiveAccount,
  useAccounts,
  useAccountStats,
  useAccountActions
} from '@/store/accountStore';

const MyComponent = () => {
  const activeAccount = useActiveAccount();
  const accounts = useAccounts();
  const { switchAccount, createAccount } = useAccountActions();

  // Your component logic...
};`}
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">3. Add Account Selector to Layout</h4>
            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`import AccountSelector from '@/components/layout/AccountSelector';

<AccountSelector
  showBalance={true}
  showCreateButton={true}
  onCreateAccount={handleCreateAccount}
/>`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountDemo;