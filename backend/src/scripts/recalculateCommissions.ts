/**
 * Script to recalculate commissions for existing trades
 * Run with: npx ts-node src/scripts/recalculateCommissions.ts
 */

import { PrismaClient } from '@prisma/client';
import { calculateCommission } from '../config/commissions';

const prisma = new PrismaClient();

async function recalculateCommissions() {
  console.log('🔄 Starting commission recalculation...\n');

  try {
    // Get all trades with commission = 0
    const trades = await prisma.trade.findMany({
      where: {
        commission: 0
      },
      select: {
        id: true,
        symbol: true,
        quantity: true,
        commission: true,
        pnl: true,
        netPnl: true
      }
    });

    console.log(`📊 Found ${trades.length} trades with commission = 0\n`);

    if (trades.length === 0) {
      console.log('✅ No trades need commission recalculation');
      return;
    }

    let updated = 0;
    let errors = 0;

    for (const trade of trades) {
      try {
        // Calculate correct commission based on symbol and quantity
        const newCommission = calculateCommission(trade.symbol, trade.quantity);

        // Recalculate netPnl = pnl - commission
        // Note: pnl field contains profit in DOLLARS (not points)
        const newNetPnl = (trade.pnl || 0) - newCommission;

        // Update trade
        await prisma.trade.update({
          where: { id: trade.id },
          data: {
            commission: newCommission,
            netPnl: newNetPnl
          }
        });

        console.log(`✅ Updated trade ${trade.id}:`, {
          symbol: trade.symbol,
          quantity: trade.quantity,
          oldCommission: trade.commission,
          newCommission,
          oldNetPnl: trade.netPnl,
          newNetPnl
        });

        updated++;
      } catch (error) {
        console.error(`❌ Error updating trade ${trade.id}:`, error);
        errors++;
      }
    }

    console.log(`\n📈 Commission recalculation complete:`);
    console.log(`   ✅ Updated: ${updated} trades`);
    console.log(`   ❌ Errors: ${errors} trades`);

  } catch (error) {
    console.error('❌ Error during recalculation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
recalculateCommissions()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
