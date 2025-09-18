import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  Account,
  AccountState,
  CreateAccountRequest,
  UpdateAccountRequest,
  AccountStats,
  AccountType,
} from '@/types/account';
import { accountService } from '@/services/accountService';

const useAccountStore = create<AccountState>()(
  devtools(
    (set, get) => ({
      // Initial state
      accounts: [],
      activeAccount: null,
      accountStats: {},
      loading: false,
      error: null,

      // Basic state setters
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // Fetch all accounts
      fetchAccounts: async () => {
        set({ loading: true, error: null });

        try {
          const accounts = await accountService.getAccounts();
          set({ accounts, loading: false });

          // Set the first active account if none is set
          const currentActiveAccount = get().activeAccount;
          if (!currentActiveAccount && accounts.length > 0) {
            const activeAccount = accounts.find(acc => acc.isActive) || accounts[0];
            if (activeAccount) {
              set({ activeAccount });
            }
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch accounts',
            loading: false
          });
        }
      },

      // Create new account
      createAccount: async (accountData) => {
        set({ loading: true, error: null });

        try {
          const newAccount = await accountService.createAccount(accountData);

          set(state => ({
            accounts: [...state.accounts, newAccount],
            loading: false
          }));

          // Set as active account if it's the first one
          const currentAccounts = get().accounts;
          if (currentAccounts.length === 1) {
            get().setActiveAccount(newAccount);
          }

          return newAccount;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create account',
            loading: false
          });
          throw error;
        }
      },

      // Update existing account
      updateAccount: async (id, accountData) => {
        set({ loading: true, error: null });

        try {
          const updatedAccount = await accountService.updateAccount(id, accountData);

          set(state => ({
            accounts: state.accounts.map(account =>
              account.id === id ? updatedAccount : account
            ),
            activeAccount: state.activeAccount?.id === id ? updatedAccount : state.activeAccount,
            loading: false
          }));

          return updatedAccount;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update account',
            loading: false
          });
          throw error;
        }
      },

      // Delete account
      deleteAccount: async (id) => {
        set({ loading: true, error: null });

        try {
          await accountService.deleteAccount(id);

          const currentState = get();
          const remainingAccounts = currentState.accounts.filter(account => account.id !== id);

          set({
            accounts: remainingAccounts,
            loading: false
          });

          // If deleted account was active, switch to another one
          if (currentState.activeAccount?.id === id) {
            const newActiveAccount = remainingAccounts.find(acc => acc.isActive) || remainingAccounts[0] || null;
            if (newActiveAccount) {
              await get().switchAccount(newActiveAccount.id);
            } else {
              set({ activeAccount: null });
            }
          }

          // Remove stats for deleted account
          const { [id]: removedStats, ...remainingStats } = currentState.accountStats;
          set({ accountStats: remainingStats });

        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete account',
            loading: false
          });
          throw error;
        }
      },

      // Get individual account
      getAccount: async (id) => {
        const existingAccount = get().accounts.find(acc => acc.id === id);
        if (existingAccount) {
          return existingAccount;
        }

        set({ loading: true, error: null });

        try {
          const account = await accountService.getAccount(id);

          // Add to accounts array if not already there
          set(state => {
            const existsInArray = state.accounts.some(acc => acc.id === id);
            if (!existsInArray) {
              return {
                accounts: [...state.accounts, account],
                loading: false
              };
            }
            return { loading: false };
          });

          return account;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch account',
            loading: false
          });
          return null;
        }
      },

      // Set active account (local state only)
      setActiveAccount: (account) => {
        set({ activeAccount: account });

        // Save to localStorage for persistence
        if (account) {
          localStorage.setItem('activeAccountId', account.id);
        } else {
          localStorage.removeItem('activeAccountId');
        }
      },

      // Switch account (server call + local state update)
      switchAccount: async (accountId) => {
        set({ loading: true, error: null });

        try {
          await accountService.setActiveAccount(accountId);

          const account = get().accounts.find(acc => acc.id === accountId);
          if (account) {
            set({
              activeAccount: account,
              loading: false
            });

            // Save to localStorage for persistence
            localStorage.setItem('activeAccountId', accountId);

            // Refresh stats for new active account
            get().refreshAccountStats(accountId);
          } else {
            throw new Error('Account not found in local state');
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to switch account',
            loading: false
          });
          throw error;
        }
      },

      // Fetch account statistics
      fetchAccountStats: async (accountId) => {
        try {
          const stats = await accountService.getAccountStats(accountId);

          set(state => ({
            accountStats: {
              ...state.accountStats,
              [accountId]: stats
            }
          }));

          return stats;
        } catch (error) {
          console.error(`Failed to fetch stats for account ${accountId}:`, error);
          throw error;
        }
      },

      // Refresh account statistics
      refreshAccountStats: async (accountId) => {
        const targetAccountId = accountId || get().activeAccount?.id;
        if (!targetAccountId) return;

        try {
          await get().fetchAccountStats(targetAccountId);
        } catch (error) {
          console.error('Failed to refresh account stats:', error);
        }
      },

      // Refresh account data (balance and info)
      refreshAccount: async (accountId) => {
        const targetAccountId = accountId || get().activeAccount?.id;
        if (!targetAccountId) return;

        try {
          const updatedAccount = await accountService.getAccount(targetAccountId);

          // Update the account in both accounts array and activeAccount if it's the current one
          set(state => ({
            accounts: state.accounts.map(account =>
              account.id === targetAccountId ? updatedAccount : account
            ),
            activeAccount: state.activeAccount?.id === targetAccountId ? updatedAccount : state.activeAccount
          }));

          // Also refresh stats for this account
          await get().refreshAccountStats(targetAccountId);

          return updatedAccount;
        } catch (error) {
          console.error('Failed to refresh account:', error);
          throw error;
        }
      },

      // Utility functions
      getActiveAccountId: () => {
        return get().activeAccount?.id || null;
      },

      getAccountById: (id) => {
        return get().accounts.find(account => account.id === id);
      },

      getAccountsByType: (type) => {
        return get().accounts.filter(account => account.accountType === type);
      }
    }),
    {
      name: 'account-store',
      partialize: (state) => ({
        activeAccount: state.activeAccount,
        // Don't persist full accounts array to avoid stale data
        // accounts will be fetched fresh on app load
      })
    }
  )
);

// Initialize store on app load
export const initializeAccountStore = async () => {
  const store = useAccountStore.getState();
  console.log('AccountStore: Starting initialization...');

  try {
    // Fetch accounts first
    console.log('AccountStore: Fetching accounts...');
    await store.fetchAccounts();

    const accounts = store.accounts;
    console.log('AccountStore: Fetched accounts:', { count: accounts.length, accounts });

    // Try to restore active account from localStorage
    const savedActiveAccountId = localStorage.getItem('activeAccountId');
    console.log('AccountStore: Saved active account ID from localStorage:', savedActiveAccountId);

    if (savedActiveAccountId) {
      const account = store.getAccountById(savedActiveAccountId);
      console.log('AccountStore: Found account by saved ID:', account);
      if (account) {
        store.setActiveAccount(account);
        // Fetch stats for active account
        store.refreshAccountStats(savedActiveAccountId);
        console.log('AccountStore: Set active account from localStorage:', account);
      }
    } else {
      // Try to get current active account from server
      try {
        console.log('AccountStore: Trying to get active account from server...');
        const activeAccount = await accountService.getActiveAccount();
        console.log('AccountStore: Active account from server:', activeAccount);
        if (activeAccount) {
          store.setActiveAccount(activeAccount);
          store.refreshAccountStats(activeAccount.id);
          console.log('AccountStore: Set active account from server:', activeAccount);
        }
      } catch (error) {
        console.log('AccountStore: No active account set on server:', error);
      }
    }

    const finalActiveAccount = store.activeAccount;
    console.log('AccountStore: Final active account after initialization:', finalActiveAccount);
  } catch (error) {
    console.error('Failed to initialize account store:', error);
    store.setError('Failed to load accounts. Please refresh the page.');
  }
};

// Selectors for common use cases
export const useActiveAccount = () => useAccountStore(state => state.activeAccount);
export const useAccounts = () => useAccountStore(state => state.accounts);
export const useAccountStats = (accountId?: string) =>
  useAccountStore(state => {
    const targetId = accountId || state.activeAccount?.id;
    return targetId ? state.accountStats[targetId] : undefined;
  });
export const useAccountLoading = () => useAccountStore(state => state.loading);
export const useAccountError = () => useAccountStore(state => state.error);

// Actions selectors
export const useAccountActions = () => useAccountStore(state => ({
  fetchAccounts: state.fetchAccounts,
  createAccount: state.createAccount,
  updateAccount: state.updateAccount,
  deleteAccount: state.deleteAccount,
  switchAccount: state.switchAccount,
  setActiveAccount: state.setActiveAccount,
  fetchAccountStats: state.fetchAccountStats,
  refreshAccountStats: state.refreshAccountStats,
  setError: state.setError,
  setLoading: state.setLoading
}));

export default useAccountStore;