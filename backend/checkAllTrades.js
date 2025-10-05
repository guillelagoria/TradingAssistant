const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTrades() {
  const trades = await prisma.trade.findMany({
    select: {
      id: true,
      symbol: true,
      pnl: true,
      netPnl: true,
      commission: true,
      entryDate: true
    },
    orderBy: {
      entryDate: 'asc'
    }
  });

  console.log('Total trades:', trades.length);
  console.log('\nAll trades:');
  trades.forEach((t, n) => {
    console.log((n+1) + '. ' + t.symbol + ': pnl=' + t.pnl + ', netPnl=' + t.netPnl + ', commission=' + t.commission);
  });

  const sumPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const sumNetPnl = trades.reduce((sum, t) => sum + (t.netPnl || 0), 0);
  const sumCommission = trades.reduce((sum, t) => sum + (t.commission || 0), 0);

  console.log('\nTotals:');
  console.log('Sum of pnl:', sumPnl);
  console.log('Sum of netPnl:', sumNetPnl);
  console.log('Sum of commission:', sumCommission);

  await prisma.$disconnect();
}

checkTrades();
