import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    // Count trades
    const tradeCount = await prisma.trade.count();
    console.log(`\n📊 Total trades in database: ${tradeCount}`);

    // Get recent trades
    const recentTrades = await prisma.trade.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        symbol: true,
        direction: true,
        entryPrice: true,
        exitPrice: true,
        pnl: true,
        createdAt: true,
      },
    });

    console.log('\n📝 Recent trades:');
    if (recentTrades.length === 0) {
      console.log('   No trades found');
    } else {
      recentTrades.forEach((trade) => {
        console.log(
          `   - ${trade.symbol} ${trade.direction} | Entry: ${trade.entryPrice} | Exit: ${trade.exitPrice} | P&L: ${trade.pnl} | Date: ${trade.createdAt}`
        );
      });
    }

    // Count accounts
    const accountCount = await prisma.tradingAccount.count();
    console.log(`\n💰 Total accounts in database: ${accountCount}`);

    // Get accounts
    const accounts = await prisma.tradingAccount.findMany({
      select: {
        id: true,
        name: true,
        balance: true,
        isActive: true,
      },
    });

    console.log('\n💳 Accounts:');
    if (accounts.length === 0) {
      console.log('   No accounts found');
    } else {
      accounts.forEach((account) => {
        console.log(
          `   - ${account.name} | Balance: $${account.balance} | Active: ${account.isActive}`
        );
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
