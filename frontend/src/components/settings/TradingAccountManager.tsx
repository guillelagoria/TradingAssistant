import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

interface AccountFormProps {
  formData: AccountFormData;
  formErrors: Record<string, string>;
  error: string | null;
  loading: boolean;
  showPassword: boolean;
  editingAccount: Account | null;
  onFormDataChange: (data: AccountFormData) => void;
  onPasswordToggle: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const AccountFormComponent: React.FC<AccountFormProps> = ({
  formData,
  formErrors,
  error,
  loading,
  showPassword,
  editingAccount,
  onFormDataChange,
  onPasswordToggle,
  onSubmit,
  onCancel
}) => {
  const handleInputChange = (field: keyof AccountFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onFormDataChange({ ...formData, [field]: e.target.value });
    };

  const handleSelectChange = (field: keyof AccountFormData) =>
    (value: string) => {
      onFormDataChange({ ...formData, [field]: value });
    };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="account-name">Account Name *</Label>
          <Input
            id="account-name"
            name="name"
            value={formData.name}
            onChange={handleInputChange('name')}
            placeholder="My Trading Account"
            className={formErrors.name ? 'border-red-500' : ''}
            autoComplete="off"
          />
          {formErrors.name && (
            <p className="text-sm text-red-600">{formErrors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="account-type">Account Type *</Label>
          <Select
            value={formData.accountType}
            onValueChange={handleSelectChange('accountType')}
          >
            <SelectTrigger id="account-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACCOUNT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.value === AccountType.DEMO ? (
                      <Circle className="h-4 w-4 text-primary" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
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
            onValueChange={handleSelectChange('currency')}
          >
            <SelectTrigger id="currency">
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
            onChange={handleInputChange('creationDate')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="initial-balance">Initial Balance *</Label>
          <Input
            id="initial-balance"
            name="initialBalance"
            type="number"
            step="0.01"
            value={formData.initialBalance}
            onChange={handleInputChange('initialBalance')}
            placeholder="10000"
            className={formErrors.initialBalance ? 'border-red-500' : ''}
            autoComplete="off"
          />
          {formErrors.initialBalance && (
            <p className="text-sm text-red-600">{formErrors.initialBalance}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="current-balance">Current Balance</Label>
          <Input
            id="current-balance"
            name="currentBalance"
            type="number"
            step="0.01"
            value={formData.currentBalance}
            onChange={handleInputChange('currentBalance')}
            placeholder="Optional"
            className={formErrors.currentBalance ? 'border-red-500' : ''}
            autoComplete="off"
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
            onChange={handleInputChange('maxDrawdown')}
            placeholder="Optional"
            className={formErrors.maxDrawdown ? 'border-red-500' : ''}
            autoComplete="off"
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
            onChange={handleInputChange('profitTarget')}
            placeholder="Optional"
            className={formErrors.profitTarget ? 'border-red-500' : ''}
            autoComplete="off"
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
              onChange={handleInputChange('dataInfoName')}
              placeholder="Login or account identifier"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataInfoPassword">Password</Label>
            <div className="relative">
              <Input
                id="dataInfoPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.dataInfoPassword}
                onChange={handleInputChange('dataInfoPassword')}
                placeholder="Account password"
                className="pr-10"
                autoComplete="off"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={onPasswordToggle}
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
            onChange={handleInputChange('dataInfoNotes')}
            placeholder="Additional notes about this account..."
            className="min-h-[80px]"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
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
};

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

  const resetForm = useCallback(() => {
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
  }, []);

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

  const validateForm = useCallback((): boolean => {
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
  }, [formData]);


  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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

      // Refresh accounts list to ensure UI is updated
      await fetchAccounts();
    } catch (error) {
      toast.error(editingAccount ? 'Failed to update account' : 'Failed to create account');
    }
  }, [
    formData,
    editingAccount,
    updateAccount,
    createAccount,
    resetForm,
    validateForm,
    fetchAccounts
  ]);

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    populateForm(account);
  };

  const handleDelete = async (accountId: string) => {
    try {
      await deleteAccount(accountId);
      toast.success('Account deleted successfully');
      setShowDeleteConfirm(null);

      // Refresh accounts list to ensure UI is updated
      await fetchAccounts();
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  const handleSwitchAccount = async (accountId: string) => {
    if (accountId === activeAccount?.id) return;

    try {
      await switchAccount(accountId);
      toast.success('Account switched successfully');

      // Refresh accounts list to ensure UI is updated
      await fetchAccounts();
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
      <Circle className="h-4 w-4 text-primary" />
    ) : (
      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
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
      >
        <Card className={cn(
          'transition-all duration-200 hover:shadow-md cursor-pointer',
          isActive && 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2'
        )}>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarFallback className="text-sm bg-primary/10 text-primary">
                    {account.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-base truncate">{account.name}</h3>
                    {isActive && (
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        account.accountType === AccountType.DEMO
                          ? 'border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300'
                          : 'border-green-200 text-green-700 dark:border-green-800 dark:text-green-300'
                      )}
                    >
                      {getAccountTypeIcon(account.accountType)}
                      <span className="ml-1">{account.accountType}</span>
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {SUPPORTED_CURRENCIES.find(c => c.value === account.currency)?.symbol}
                      {account.currency}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(account);
                  }}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(account.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent
            className="pt-4 pb-4 cursor-pointer"
            onClick={() => handleSwitchAccount(account.id)}
          >
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Current Balance
                </Label>
                <p className="text-base font-semibold">
                  {formatCurrency(account.currentBalance || account.initialBalance, account.currency)}
                </p>
              </div>
              {stats && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Total P&L
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <p className={cn(
                      'text-base font-semibold',
                      stats.totalPnL > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                      stats.totalPnL < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
                    )}>
                      {stats.totalPnL > 0 && '+'}
                      {formatCurrency(stats.totalPnL, account.currency)}
                    </p>
                    {stats.totalPnL !== 0 && (
                      <>
                        {stats.totalPnL > 0 ? (
                          <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {account.profitTarget && (
              <>
                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Profit Target</Label>
                  <span className="text-sm font-semibold">
                    {formatCurrency(account.profitTarget, account.currency)}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const handleFormCancel = useCallback(() => {
    if (editingAccount) {
      setEditingAccount(null);
    } else {
      setShowCreateDialog(false);
    }
    resetForm();
  }, [editingAccount, resetForm]);

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Your Trading Accounts</CardTitle>
                <CardDescription>
                  Manage your demo and live trading accounts
                </CardDescription>
              </div>
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
                <AccountFormComponent
                  formData={formData}
                  formErrors={formErrors}
                  error={error}
                  loading={loading}
                  showPassword={showPassword}
                  editingAccount={editingAccount}
                  onFormDataChange={setFormData}
                  onPasswordToggle={() => setShowPassword(!showPassword)}
                  onSubmit={handleSubmit}
                  onCancel={handleFormCancel}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

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
          <AccountFormComponent
            formData={formData}
            formErrors={formErrors}
            error={error}
            loading={loading}
            showPassword={showPassword}
            editingAccount={editingAccount}
            onFormDataChange={setFormData}
            onPasswordToggle={() => setShowPassword(!showPassword)}
            onSubmit={handleSubmit}
            onCancel={handleFormCancel}
          />
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