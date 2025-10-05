const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTrades() {
  const trades = await prisma.trade.findMany({
    select: {
      id: true,
      symbol: true,
      exitPrice: true,
      netPnl: true,
      pnl: true,
      entryDate: true,
      exitDate: true
    },
    orderBy: {
      entryDate: 'asc'
    }
  });

  console.log('Total trades in DB:', trades.length);
  
  const closedTrades = trades.filter(t => t.exitPrice && (t.netPnl !== undefined || t.pnl !== undefined));
  console.log('Closed trades:', closedTrades.length);
  
  const openTrades = trades.filter(t => !t.exitPrice);
  console.log('Open trades:', openTrades.length);

  if (openTrades.length > 0) {
    console.log('\nOpen trades (no exit price):');
    openTrades.forEach(t => {
      console.log('- ' + t.symbol + ' (id: ' + t.id.substring(0, 8) + ')');
    });
  }

  const missingPnl = trades.filter(t => t.exitPrice && !t.netPnl && !t.pnl);
  if (missingPnl.length > 0) {
    console.log('\nTrades with exit but no PnL:');
    missingPnl.forEach(t => {
      console.log('- ' + t.symbol + ' (id: ' + t.id.substring(0, 8) + ')');
    });
  }

  await prisma.$disconnect();
}

checkTrades();
