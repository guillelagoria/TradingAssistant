#!/usr/bin/env ts-node

/**
 * Script to recalculate commissions and netPnL for all existing trades
 * This fixes trades that were created before proper commission calculation was implemented
 */

import { PrismaClient } from '@prisma/client';
import { calculateTradeMetrics } from '../utils/calculations';
import { accountService } from '../services/account.service';

const prisma = new PrismaClient();

interface TradeUpdate {
  id: string;
  oldCommission: number;
  newCommission: number;
  oldNetPnL: number;
  newNetPnL: number;
  accountId: string;
}

async function recalculateCommissions() {
  console.log('🔄 Starting commission recalculation for all existing trades...');

  try {
    // Get all trades that need commission recalculation
    const trades = await prisma.trade.findMany({
      where: {
        exitPrice: { not: null }, // Only completed trades
      },
      orderBy: { entryDate: 'asc' }
    });

    console.log(`📊 Found ${trades.length} completed trades to process`);

    if (trades.length === 0) {
      console.log('✅ No trades found to update');
      return;
    }

    const updates: TradeUpdate[] = [];
    const affectedAccounts = new Set<string>();

    // Process each trade
    for (const trade of trades) {
      try {
        // Recalculate metrics with proper commission
        const metrics = calculateTradeMetrics({
          direction: trade.direction,
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          quantity: trade.quantity,
          stopLoss: trade.stopLoss,
          maxFavorablePrice: trade.maxFavorablePrice,
          maxAdversePrice: trade.maxAdversePrice,
          market: trade.market || trade.symbol || 'ES', // Default to ES if no market specified
        });

        // Check if commission changed
        const oldCommission = trade.commission || 0;
        const newCommission = metrics.commission || 0;
        const oldNetPnL = trade.netPnl || trade.pnl || 0;
        const newNetPnL = metrics.netPnl || 0;

        if (oldCommission !== newCommission || oldNetPnL !== newNetPnL) {
          updates.push({
            id: trade.id,
            oldCommission,
            newCommission,
            oldNetPnL,
            newNetPnL,
            accountId: trade.accountId
          });

          affectedAccounts.add(trade.accountId);

          console.log(`📝 Trade ${trade.id} (${trade.symbol}): Commission ${oldCommission} → ${newCommission}, NetPnL ${oldNetPnL} → ${newNetPnL}`);
        }
      } catch (error) {
        console.error(`❌ Error processing trade ${trade.id}:`, error);
      }
    }

    if (updates.length === 0) {
      console.log('✅ All trades already have correct commission calculations');
      return;
    }

    console.log(`\n🔄 Updating ${updates.length} trades...`);

    // Update trades in batches for better performance
    const batchSize = 50;
    let updatedCount = 0;

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);

      await Promise.all(batch.map(async (update) => {
        await prisma.trade.update({
          where: { id: update.id },
          data: {
            commission: update.newCommission,
            netPnl: update.newNetPnL,
          }
        });
      }));

      updatedCount += batch.length;
      console.log(`✅ Updated ${updatedCount}/${updates.length} trades`);
    }

    console.log(`\n🔄 Recalculating account balances for ${affectedAccounts.size} affected accounts...`);

    // Recalculate account balances for all affected accounts
    let balanceUpdatedCount = 0;
    for (const accountId of affectedAccounts) {
      try {
        // Find the user ID for this account (we need it for the service)
        const account = await prisma.account.findUnique({
          where: { id: accountId },
          select: { userId: true, name: true }
        });

        if (account) {
          await accountService.recalculateAccountBalance(accountId, account.userId);
          balanceUpdatedCount++;
          console.log(`✅ Updated balance for account: ${account.name}`);
        }
      } catch (error) {
        console.error(`❌ Error updating balance for account ${accountId}:`, error);
      }
    }

    // Summary
    console.log(`\n📊 COMMISSION RECALCULATION COMPLETE`);
    console.log(`📈 Trades updated: ${updatedCount}`);
    console.log(`💰 Account balances updated: ${balanceUpdatedCount}`);

    // Calculate total commission impact
    const totalOldCommission = updates.reduce((sum, u) => sum + u.oldCommission, 0);
    const totalNewCommission = updates.reduce((sum, u) => sum + u.newCommission, 0);
    const commissionDifference = totalNewCommission - totalOldCommission;

    console.log(`💵 Total commission change: $${commissionDifference.toFixed(2)}`);
    console.log(`   Old total: $${totalOldCommission.toFixed(2)}`);
    console.log(`   New total: $${totalNewCommission.toFixed(2)}`);

    if (commissionDifference > 0) {
      console.log(`⚠️  Account balances decreased by $${commissionDifference.toFixed(2)} due to added commissions`);
    }

  } catch (error) {
    console.error('❌ Fatal error during commission recalculation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  recalculateCommissions()
    .then(() => {
      console.log('✅ Commission recalculation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Commission recalculation failed:', error);
      process.exit(1);
    });
}

export { recalculateCommissions };