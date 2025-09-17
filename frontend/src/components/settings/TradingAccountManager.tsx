import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit3,
  Trash2,
  Wallet,
  TrendingUp,
  TrendingDown,
  Circle,
  CheckCircle,
  DollarSign,
  Calendar,
  Target,
  Shield,
  AlertTriangle,
  Save,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Store hooks
import {
  useAccounts,
  useActiveAccount,
  useAccountStats,
  useAccountActions,
  useAccountLoading,
  useAccountError
} from '@/store/accountStore';

// Types
import {
  Account,
  AccountType,
  CreateAccountRequest,
  UpdateAccountRequest,
  SUPPORTED_CURRENCIES,
  ACCOUNT_TYPE_OPTIONS
} from '@/types/account';

interface AccountFormData {
  name: string;
  accountType: AccountType;
  currency: string;
  creationDate: string;
  initialBalance: string;
  currentBalance: string;
  maxDrawdown: string;
  profitTarget: string;
  dataInfoName: string;
  dataInfoPassword: string;
  dataInfoNotes: string;
}

const TradingAccountManager: React.FC = () => {
  const accounts = useAccounts();
  const activeAccount = useActiveAccount();
  const loading = useAccountLoading();
  const error = useAccountError();
  const {
    createAccount,
    updateAccount,
    deleteAccount,
    switchAccount,
    fetchAccounts,
    setError
  } = useAccountActions();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    accountType: AccountType.DEMO,
    currency: 'USD',
    creationDate: new Date().toISOString().split('T')[0],
    initialBalance: '10000',
    currentBalance: '',
    maxDrawdown: '',
    profitTarget: '',
    dataInfoName: '',
    dataInfoPassword: '',
    dataInfoNotes: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load accounts on mount
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Clear error when dialog closes
  useEffect(() => {
    if (!showCreateDialog && !editingAccount) {
      setError(null);
      setFormErrors({});
    }
  }, [showCreateDialog, editingAccount, setError]);

  const resetForm = () => {
    setFormData({
      name: '',
      accountType: AccountType.DEMO,
      currency: 'USD',
      creationDate: new Date().toISOString().split('T')[0],
      initialBalance: '10000',
      currentBalance: '',
      maxDrawdown: '',
      profitTarget: '',
      dataInfoName: '',
      dataInfoPassword: '',
      dataInfoNotes: ''
    });
    setFormErrors({});
  };

  const populateForm = (account: Account) => {
    setFormData({
      name: account.name,
      accountType: account.accountType,
      currency: account.currency,
      creationDate: new Date(account.creationDate).toISOString().split('T')[0],
      initialBalance: account.initialBalance.toString(),
      currentBalance: account.currentBalance?.toString() || '',
      maxDrawdown: account.maxDrawdown?.toString() || '',
      profitTarget: account.profitTarget?.toString() || '',
      dataInfoName: account.dataInfoName || '',
      dataInfoPassword: account.dataInfoPassword || '',
      dataInfoNotes: account.dataInfoNotes || ''
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Account name is required';
    }

    if (!formData.currency) {
      errors.currency = 'Currency is required';
    }

    const initialBalance = parseFloat(formData.initialBalance);
    if (isNaN(initialBalance) || initialBalance <= 0) {
      errors.initialBalance = 'Initial balance must be a positive number';
    }

    if (formData.currentBalance) {
      const currentBalance = parseFloat(formData.currentBalance);
      if (isNaN(currentBalance) || currentBalance < 0) {
        errors.currentBalance = 'Current balance must be a non-negative number';
      }
    }

    if (formData.maxDrawdown) {
      const maxDrawdown = parseFloat(formData.maxDrawdown);
      if (isNaN(maxDrawdown) || maxDrawdown < 0) {
        errors.maxDrawdown = 'Max drawdown must be a non-negative number';
      }
    }

    if (formData.profitTarget) {
      const profitTarget = parseFloat(formData.profitTarget);
      if (isNaN(profitTarget) || profitTarget <= 0) {
        errors.profitTarget = 'Profit target must be a positive number';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const accountData: CreateAccountRequest | UpdateAccountRequest = {
        name: formData.name.trim(),
        accountType: formData.accountType,
        currency: formData.currency,
        creationDate: new Date(formData.creationDate),
        initialBalance: parseFloat(formData.initialBalance),
        currentBalance: formData.currentBalance ? parseFloat(formData.currentBalance) : undefined,
        maxDrawdown: formData.maxDrawdown ? parseFloat(formData.maxDrawdown) : undefined,
        profitTarget: formData.profitTarget ? parseFloat(formData.profitTarget) : undefined,
        dataInfoName: formData.dataInfoName || undefined,
        dataInfoPassword: formData.dataInfoPassword || undefined,
        dataInfoNotes: formData.dataInfoNotes || undefined
      };

      if (editingAccount) {
        await updateAccount(editingAccount.id, accountData);
        toast.success('Account updated successfully');
        setEditingAccount(null);
      } else {
        await createAccount(accountData as CreateAccountRequest);
        toast.success('Account created successfully');
        setShowCreateDialog(false);
      }

      resetForm();
    } catch (error) {
      toast.error(editingAccount ? 'Failed to update account' : 'Failed to create account');
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    populateForm(account);
  };

  const handleDelete = async (accountId: string) => {
    try {
      await deleteAccount(accountId);
      toast.success('Account deleted successfully');
      setShowDeleteConfirm(null);
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  const handleSwitchAccount = async (accountId: string) => {
    if (accountId === activeAccount?.id) return;

    try {
      await switchAccount(accountId);
      toast.success('Account switched successfully');
    } catch (error) {
      toast.error('Failed to switch account');
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.value === currency);
    const symbol = currencyInfo?.symbol || '$';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const getAccountTypeIcon = (accountType: AccountType) => {
    return accountType === AccountType.DEMO ? (
      <Circle className="h-4 w-4 text-blue-500" />
    ) : (
      <CheckCircle className="h-4 w-4 text-green-500" />
    );
  };

  const AccountCard: React.FC<{ account: Account }> = ({ account }) => {
    const stats = useAccountStats(account.id);
    const isActive = activeAccount?.id === account.id;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          'relative',
          isActive && 'ring-2 ring-primary ring-offset-2'
        )}
      >
        <Card className={cn(
          'transition-all duration-200 hover:shadow-md cursor-pointer',
          isActive && 'border-primary bg-primary/5'
        )}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-sm bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                    {account.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base truncate">{account.name}</h3>
                    {getAccountTypeIcon(account.accountType)}
                    {isActive && (
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
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
                    <span className="text-xs text-muted-foreground">
                      {SUPPORTED_CURRENCIES.find(c => c.value === account.currency)?.symbol}
                      {account.currency}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(account);
                  }}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(account.id);
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent
            className="pt-0 cursor-pointer"
            onClick={() => handleSwitchAccount(account.id)}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Current Balance</Label>
                <p className="text-sm font-medium">
                  {formatCurrency(account.currentBalance || account.initialBalance, account.currency)}
                </p>
              </div>
              {stats && (
                <div>
                  <Label className="text-xs text-muted-foreground">Total P&L</Label>
                  <div className="flex items-center gap-1">
                    <p className={cn(
                      'text-sm font-medium',
                      stats.totalPnL > 0 ? 'text-green-600' :
                      stats.totalPnL < 0 ? 'text-red-600' : 'text-muted-foreground'
                    )}>
                      {stats.totalPnL > 0 && '+'}
                      {formatCurrency(stats.totalPnL, account.currency)}
                    </p>
                    {stats.totalPnL !== 0 && (
                      <>
                        {stats.totalPnL > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {account.profitTarget && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Profit Target</span>
                  <span className="font-medium">
                    {formatCurrency(account.profitTarget, account.currency)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const AccountForm: React.FC = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Account Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="My Trading Account"
            className={formErrors.name ? 'border-red-500' : ''}
          />
          {formErrors.name && (
            <p className="text-sm text-red-600">{formErrors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountType">Account Type *</Label>
          <Select
            value={formData.accountType}
            onValueChange={(value: AccountType) => setFormData({ ...formData, accountType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACCOUNT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.value === AccountType.DEMO ? (
                      <Circle className="h-4 w-4 text-blue-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency *</Label>
          <Select
            value={formData.currency}
            onValueChange={(value) => setFormData({ ...formData, currency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_CURRENCIES.map((currency) => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.symbol} {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="creationDate">Creation Date</Label>
          <Input
            id="creationDate"
            type="date"
            value={formData.creationDate}
            onChange={(e) => setFormData({ ...formData, creationDate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="initialBalance">Initial Balance *</Label>
          <Input
            id="initialBalance"
            type="number"
            step="0.01"
            value={formData.initialBalance}
            onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
            placeholder="10000"
            className={formErrors.initialBalance ? 'border-red-500' : ''}
          />
          {formErrors.initialBalance && (
            <p className="text-sm text-red-600">{formErrors.initialBalance}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentBalance">Current Balance</Label>
          <Input
            id="currentBalance"
            type="number"
            step="0.01"
            value={formData.currentBalance}
            onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })}
            placeholder="Optional"
            className={formErrors.currentBalance ? 'border-red-500' : ''}
          />
          {formErrors.currentBalance && (
            <p className="text-sm text-red-600">{formErrors.currentBalance}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxDrawdown">Max Drawdown</Label>
          <Input
            id="maxDrawdown"
            type="number"
            step="0.01"
            value={formData.maxDrawdown}
            onChange={(e) => setFormData({ ...formData, maxDrawdown: e.target.value })}
            placeholder="Optional"
            className={formErrors.maxDrawdown ? 'border-red-500' : ''}
          />
          {formErrors.maxDrawdown && (
            <p className="text-sm text-red-600">{formErrors.maxDrawdown}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="profitTarget">Profit Target</Label>
          <Input
            id="profitTarget"
            type="number"
            step="0.01"
            value={formData.profitTarget}
            onChange={(e) => setFormData({ ...formData, profitTarget: e.target.value })}
            placeholder="Optional"
            className={formErrors.profitTarget ? 'border-red-500' : ''}
          />
          {formErrors.profitTarget && (
            <p className="text-sm text-red-600">{formErrors.profitTarget}</p>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Account Information (Optional)</Label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dataInfoName">Account Login/Name</Label>
            <Input
              id="dataInfoName"
              value={formData.dataInfoName}
              onChange={(e) => setFormData({ ...formData, dataInfoName: e.target.value })}
              placeholder="Login or account identifier"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataInfoPassword">Password</Label>
            <div className="relative">
              <Input
                id="dataInfoPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.dataInfoPassword}
                onChange={(e) => setFormData({ ...formData, dataInfoPassword: e.target.value })}
                placeholder="Account password"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dataInfoNotes">Notes</Label>
          <Textarea
            id="dataInfoNotes"
            value={formData.dataInfoNotes}
            onChange={(e) => setFormData({ ...formData, dataInfoNotes: e.target.value })}
            placeholder="Additional notes about this account..."
            className="min-h-[80px]"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (editingAccount) {
              setEditingAccount(null);
            } else {
              setShowCreateDialog(false);
            }
            resetForm();
          }}
          disabled={loading}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : editingAccount ? 'Update Account' : 'Create Account'}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Your Trading Accounts</h3>
          <p className="text-sm text-muted-foreground">
            Manage your demo and live trading accounts
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Trading Account</DialogTitle>
              <DialogDescription>
                Add a new demo or live trading account to track your performance
              </DialogDescription>
            </DialogHeader>
            <AccountForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Display */}
      {error && !showCreateDialog && !editingAccount && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Accounts Grid */}
      <AnimatePresence mode="popLayout">
        {loading && accounts.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Wallet className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Trading Accounts</h3>
            <p className="text-muted-foreground mb-4">
              Create your first trading account to start tracking your performance
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Account
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Edit Dialog */}
      <Dialog open={!!editingAccount} onOpenChange={(open) => !open && setEditingAccount(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Trading Account</DialogTitle>
            <DialogDescription>
              Update your trading account details and settings
            </DialogDescription>
          </DialogHeader>
          <AccountForm />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Trading Account
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this account? This action cannot be undone and will
              permanently remove all associated trading data.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(null)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TradingAccountManager;