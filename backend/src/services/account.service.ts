import { PrismaClient, Account, SubscriptionTier, AccountType } from '@prisma/client';

const prisma = new PrismaClient();

// Subscription tier account limits
const ACCOUNT_LIMITS = {
  [SubscriptionTier.FREE]: 1,
  [SubscriptionTier.TIER1]: 5,
  [SubscriptionTier.TIER2]: 10,
  [SubscriptionTier.ULTIMATE]: 100
};

// Types
export interface CreateAccountData {
  name: string;
  accountType?: AccountType;
  currency?: string;
  creationDate: Date | string;
  initialBalance: number;
  currentBalance?: number;
  maxDrawdown?: number;
  profitTarget?: number;
  dataInfoName?: string;
  dataInfoPassword?: string;
  dataInfoNotes?: string;
}

export interface UpdateAccountData {
  name?: string;
  accountType?: AccountType;
  currency?: string;
  creationDate?: Date | string;
  initialBalance?: number;
  currentBalance?: number;
  maxDrawdown?: number;
  profitTarget?: number;
  dataInfoName?: string;
  dataInfoPassword?: string;
  dataInfoNotes?: string;
  isActive?: boolean;
}

export interface AccountStats {
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  totalPnL: number;
  totalNetPnL: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  currentBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  roi: number;
  maxDrawdown: number;
  currentDrawdown: number;
}

class AccountService {
  /**
   * Create a new account for a user
   */
  async createAccount(userId: string, data: CreateAccountData): Promise<Account> {
    // Check if user can create more accounts
    const canCreate = await this.canCreateAccount(userId);
    if (!canCreate) {
      throw new Error('Account limit reached for your subscription tier');
    }

    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Account name is required');
    }

    if (data.initialBalance === undefined || data.initialBalance < 0) {
      throw new Error('Initial balance must be a positive number');
    }

    if (!data.creationDate) {
      throw new Error('Creation date is required');
    }

    // Check for duplicate account name
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId,
        name: data.name.trim()
      }
    });

    if (existingAccount) {
      throw new Error('An account with this name already exists');
    }

    // Create the account
    const account = await prisma.account.create({
      data: {
        userId,
        name: data.name.trim(),
        accountType: data.accountType || AccountType.DEMO,
        currency: data.currency || 'USD',
        creationDate: new Date(data.creationDate),
        initialBalance: data.initialBalance,
        currentBalance: data.currentBalance ?? data.initialBalance,
        maxDrawdown: data.maxDrawdown,
        profitTarget: data.profitTarget,
        dataInfoName: data.dataInfoName,
        dataInfoPassword: data.dataInfoPassword,
        dataInfoNotes: data.dataInfoNotes,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    // If this is the user's first account, set it as active
    const userAccountCount = await prisma.account.count({
      where: { userId }
    });

    if (userAccountCount === 1) {
      await this.setActiveAccount(userId, account.id);
    }

    return account;
  }

  /**
   * Get a single account by ID
   */
  async getAccountById(accountId: string, userId: string): Promise<Account | null> {
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId
      },
      include: {
        _count: {
          select: {
            trades: true
          }
        }
      }
    });

    if (!account) {
      throw new Error('Account not found or access denied');
    }

    return account;
  }

  /**
   * Get all accounts for a user
   */
  async getUserAccounts(userId: string): Promise<Account[]> {
    const accounts = await prisma.account.findMany({
      where: {
        userId
      },
      include: {
        _count: {
          select: {
            trades: true
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return accounts;
  }

  /**
   * Update an account
   */
  async updateAccount(accountId: string, userId: string, data: UpdateAccountData): Promise<Account> {
    // Verify ownership
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId
      }
    });

    if (!account) {
      throw new Error('Account not found or access denied');
    }

    // If updating name, check for duplicates
    if (data.name && data.name !== account.name) {
      const duplicateName = await prisma.account.findFirst({
        where: {
          userId,
          name: data.name.trim(),
          id: {
            not: accountId
          }
        }
      });

      if (duplicateName) {
        throw new Error('An account with this name already exists');
      }
    }

    // Validate balance if provided
    if (data.initialBalance !== undefined && data.initialBalance < 0) {
      throw new Error('Initial balance must be a positive number');
    }

    if (data.currentBalance !== undefined && data.currentBalance < 0) {
      throw new Error('Current balance must be a positive number');
    }

    // Update the account
    const updatedAccount = await prisma.account.update({
      where: {
        id: accountId
      },
      data: {
        name: data.name ? data.name.trim() : undefined,
        accountType: data.accountType,
        currency: data.currency,
        creationDate: data.creationDate ? new Date(data.creationDate) : undefined,
        initialBalance: data.initialBalance,
        currentBalance: data.currentBalance,
        maxDrawdown: data.maxDrawdown,
        profitTarget: data.profitTarget,
        dataInfoName: data.dataInfoName,
        dataInfoPassword: data.dataInfoPassword,
        dataInfoNotes: data.dataInfoNotes,
        isActive: data.isActive
      },
      include: {
        _count: {
          select: {
            trades: true
          }
        }
      }
    });

    return updatedAccount;
  }

  /**
   * Delete an account and all related trades
   */
  async deleteAccount(accountId: string, userId: string): Promise<void> {
    // Verify ownership
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId
      }
    });

    if (!account) {
      throw new Error('Account not found or access denied');
    }

    // Check if this is the user's active account
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { activeAccountId: true }
    });

    // Begin transaction to delete account and update user if needed
    await prisma.$transaction(async (tx) => {
      // Delete the account (cascade will delete trades)
      await tx.account.delete({
        where: {
          id: accountId
        }
      });

      // If this was the active account, clear the activeAccountId
      if (user?.activeAccountId === accountId) {
        await tx.user.update({
          where: { id: userId },
          data: { activeAccountId: null }
        });

        // Set another account as active if available
        const remainingAccount = await tx.account.findFirst({
          where: {
            userId,
            isActive: true
          }
        });

        if (remainingAccount) {
          await tx.user.update({
            where: { id: userId },
            data: { activeAccountId: remainingAccount.id }
          });
        }
      }
    });
  }

  /**
   * Set the active account for a user
   */
  async setActiveAccount(userId: string, accountId: string): Promise<Account> {
    // Verify the account belongs to the user
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId
      }
    });

    if (!account) {
      throw new Error('Account not found or access denied');
    }

    // Update user's active account
    await prisma.$transaction(async (tx) => {
      // Set all user's accounts to inactive
      await tx.account.updateMany({
        where: { userId },
        data: { isActive: false }
      });

      // Set the selected account as active
      await tx.account.update({
        where: { id: accountId },
        data: { isActive: true }
      });

      // Update user's activeAccountId
      await tx.user.update({
        where: { id: userId },
        data: { activeAccountId: accountId }
      });
    });

    // Return the updated account
    const updatedAccount = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        _count: {
          select: {
            trades: true
          }
        }
      }
    });

    if (!updatedAccount) {
      throw new Error('Failed to set active account');
    }

    return updatedAccount;
  }

  /**
   * Get account statistics
   */
  async getAccountStats(accountId: string, userId: string): Promise<AccountStats> {
    // Verify ownership
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId
      },
      include: {
        trades: {
          select: {
            pnl: true,
            netPnl: true,
            result: true,
            exitDate: true
          }
        }
      }
    });

    if (!account) {
      throw new Error('Account not found or access denied');
    }

    const trades = account.trades;
    const closedTrades = trades.filter(t => t.exitDate !== null);
    const openTrades = trades.filter(t => t.exitDate === null);

    // Calculate win/loss stats
    const winningTrades = closedTrades.filter(t => t.result === 'WIN');
    const losingTrades = closedTrades.filter(t => t.result === 'LOSS');

    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalNetPnL = closedTrades.reduce((sum, t) => sum + (t.netPnl || 0), 0);

    const winRate = closedTrades.length > 0
      ? (winningTrades.length / closedTrades.length) * 100
      : 0;

    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length
      : 0;

    const avgLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length)
      : 0;

    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;

    // Calculate current balance
    const currentBalance = account.currentBalance ||
      (account.initialBalance + totalNetPnL);

    // Calculate ROI
    const roi = account.initialBalance > 0
      ? ((currentBalance - account.initialBalance) / account.initialBalance) * 100
      : 0;

    // Calculate drawdown
    let maxBalance = account.initialBalance;
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    let runningBalance = account.initialBalance;

    // Sort closed trades by date to calculate drawdown
    const sortedTrades = [...closedTrades]
      .filter(t => t.exitDate !== null)
      .sort((a, b) => new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime());

    for (const trade of sortedTrades) {
      runningBalance += (trade.netPnl || 0);
      if (runningBalance > maxBalance) {
        maxBalance = runningBalance;
      }
      const drawdown = ((maxBalance - runningBalance) / maxBalance) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    currentDrawdown = maxBalance > 0
      ? ((maxBalance - currentBalance) / maxBalance) * 100
      : 0;

    return {
      totalTrades: trades.length,
      closedTrades: closedTrades.length,
      openTrades: openTrades.length,
      totalPnL,
      totalNetPnL,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      currentBalance,
      totalDeposited: account.initialBalance,
      totalWithdrawn: 0, // Can be extended in future
      roi,
      maxDrawdown: account.maxDrawdown || maxDrawdown,
      currentDrawdown
    };
  }

  /**
   * Check if user can create more accounts based on subscription
   */
  async canCreateAccount(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        _count: {
          select: {
            accounts: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const limit = ACCOUNT_LIMITS[user.subscriptionTier];
    return user._count.accounts < limit;
  }

  /**
   * Get user's default/active account
   */
  async getDefaultAccount(userId: string): Promise<Account | null> {
    // First try to get the account set as active in user record
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { activeAccountId: true }
    });

    if (user?.activeAccountId) {
      const activeAccount = await prisma.account.findFirst({
        where: {
          id: user.activeAccountId,
          userId
        },
        include: {
          _count: {
            select: {
              trades: true
            }
          }
        }
      });

      if (activeAccount) {
        return activeAccount;
      }
    }

    // Fallback to any account marked as active
    const activeAccount = await prisma.account.findFirst({
      where: {
        userId,
        isActive: true
      },
      include: {
        _count: {
          select: {
            trades: true
          }
        }
      }
    });

    if (activeAccount) {
      return activeAccount;
    }

    // Fallback to the first account
    const firstAccount = await prisma.account.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: {
            trades: true
          }
        }
      }
    });

    return firstAccount;
  }

  /**
   * Get remaining account slots for user
   */
  async getRemainingAccountSlots(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        _count: {
          select: {
            accounts: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const limit = ACCOUNT_LIMITS[user.subscriptionTier];
    return Math.max(0, limit - user._count.accounts);
  }

  /**
   * Update account balance based on trades
   */
  async recalculateAccountBalance(accountId: string, userId: string): Promise<Account> {
    // Verify ownership
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId
      },
      include: {
        trades: {
          where: {
            exitDate: { not: null }
          },
          select: {
            netPnl: true
          }
        }
      }
    });

    if (!account) {
      throw new Error('Account not found or access denied');
    }

    // Calculate total P&L from all closed trades
    const totalNetPnL = account.trades.reduce((sum, trade) => sum + (trade.netPnl || 0), 0);
    const newBalance = account.initialBalance + totalNetPnL;

    // Update the account balance
    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: { currentBalance: newBalance },
      include: {
        _count: {
          select: {
            trades: true
          }
        }
      }
    });

    return updatedAccount;
  }

  /**
   * Get account by name for a user
   */
  async getAccountByName(userId: string, name: string): Promise<Account | null> {
    const account = await prisma.account.findFirst({
      where: {
        userId,
        name: name.trim()
      },
      include: {
        _count: {
          select: {
            trades: true
          }
        }
      }
    });

    return account;
  }

  /**
   * Validate account ownership
   */
  async validateAccountOwnership(accountId: string, userId: string): Promise<boolean> {
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId
      }
    });

    return !!account;
  }
}

// Export singleton instance
export const accountService = new AccountService();

// Export class for testing
export default AccountService;