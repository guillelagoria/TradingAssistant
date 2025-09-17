/**
 * Hook that handles automatic data refresh when the active account changes
 * This provides a centralized way to ensure all data is updated when switching accounts
 */

import { useEffect } from 'react';
import { useActiveAccount, useAccountActions } from '@/store/accountStore';
import { useTradeStore } from '@/store/tradeStore';

export function useAccountChangeHandler() {
  const activeAccount = useActiveAccount();
  const { refreshAccountStats } = useAccountActions();
  const { refreshTradesForAccount } = useTradeStore();

  // Effect to handle account changes
  useEffect(() => {
    if (activeAccount) {
      // Refresh all account-related data when the active account changes
      const refreshAllData = async () => {
        try {
          // Refresh trades for the new account
          await refreshTradesForAccount(activeAccount.id);

          // Refresh account statistics
          await refreshAccountStats(activeAccount.id);

          // Log the account switch for debugging
          console.log(`Switched to account: ${activeAccount.name} (${activeAccount.id})`);
        } catch (error) {
          console.error('Error refreshing data for account change:', error);
        }
      };

      refreshAllData();
    } else {
      // Clear data when no account is active
      refreshTradesForAccount();
    }
  }, [activeAccount, refreshTradesForAccount, refreshAccountStats]);

  return {
    activeAccount,
    isAccountActive: !!activeAccount
  };
}

/**
 * Enhanced hook that provides account change handling with additional utilities
 */
export function useAccountIntegration() {
  const { activeAccount, isAccountActive } = useAccountChangeHandler();
  const { switchAccount, createAccount, updateAccount } = useAccountActions();

  const handleAccountSwitch = async (accountId: string) => {
    try {
      await switchAccount(accountId);
    } catch (error) {
      console.error('Failed to switch account:', error);
      throw error;
    }
  };

  const handleAccountCreate = async (accountData: any) => {
    try {
      const newAccount = await createAccount(accountData);
      return newAccount;
    } catch (error) {
      console.error('Failed to create account:', error);
      throw error;
    }
  };

  const handleAccountUpdate = async (accountId: string, updates: any) => {
    try {
      const updatedAccount = await updateAccount(accountId, updates);
      return updatedAccount;
    } catch (error) {
      console.error('Failed to update account:', error);
      throw error;
    }
  };

  return {
    // Current state
    activeAccount,
    isAccountActive,

    // Actions
    switchAccount: handleAccountSwitch,
    createAccount: handleAccountCreate,
    updateAccount: handleAccountUpdate
  };
}

/**
 * Hook for components that need to check if they should render based on account state
 */
export function useAccountGuard() {
  const activeAccount = useActiveAccount();

  const shouldRender = !!activeAccount;
  const accountMessage = activeAccount
    ? null
    : 'Please select an account to view this data.';

  return {
    shouldRender,
    accountMessage,
    activeAccount
  };
}