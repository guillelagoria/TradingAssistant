import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create a demo user
  const hashedPassword = await bcrypt.hash('demo123', 10);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@tradingdiary.com' },
    update: {},
    create: {
      email: 'demo@tradingdiary.com',
      password: hashedPassword,
      name: 'Demo User',
      commission: 5.0,
      timezone: 'UTC'
    }
  });

  console.log('Created demo user:', demoUser.email);

  // Create some demo strategies
  const strategies = await Promise.all([
    prisma.strategy.upsert({
      where: { name_userId: { name: 'Breakout Strategy', userId: demoUser.id } },
      update: {},
      create: {
        name: 'Breakout Strategy',
        description: 'Trading breakouts from consolidation patterns',
        userId: demoUser.id
      }
    }),
    prisma.strategy.upsert({
      where: { name_userId: { name: 'Swing Trading', userId: demoUser.id } },
      update: {},
      create: {
        name: 'Swing Trading',
        description: 'Medium-term trades based on swing patterns',
        userId: demoUser.id
      }
    }),
    prisma.strategy.upsert({
      where: { name_userId: { name: 'Scalping', userId: demoUser.id } },
      update: {},
      create: {
        name: 'Scalping',
        description: 'Quick trades for small profits',
        userId: demoUser.id
      }
    })
  ]);

  console.log('Created strategies:', strategies.map(s => s.name));

  // Create some demo trades
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const trades = await Promise.all([
    // Winning trade
    prisma.trade.create({
      data: {
        userId: demoUser.id,
        strategyId: strategies[0].id,
        symbol: 'AAPL',
        direction: 'LONG',
        orderType: 'MARKET',
        entryDate: lastWeek,
        entryPrice: 150.00,
        quantity: 100,
        exitDate: yesterday,
        exitPrice: 155.00,
        stopLoss: 145.00,
        takeProfit: 160.00,
        maxFavorablePrice: 157.50,
        maxAdversePrice: 148.00,
        timeframe: '1D',
        notes: 'Strong breakout above resistance',
        commission: 5.0,
        pnl: 500.00,
        pnlPercentage: 3.33,
        netPnl: 495.00,
        efficiency: 66.67,
        rMultiple: 1.0,
        result: 'WIN'
      }
    }),
    // Losing trade
    prisma.trade.create({
      data: {
        userId: demoUser.id,
        strategyId: strategies[1].id,
        symbol: 'TSLA',
        direction: 'SHORT',
        orderType: 'LIMIT',
        entryDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        entryPrice: 200.00,
        quantity: 50,
        exitDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        exitPrice: 205.00,
        stopLoss: 210.00,
        takeProfit: 180.00,
        maxFavorablePrice: 195.00,
        maxAdversePrice: 208.00,
        timeframe: '4H',
        notes: 'False breakdown, stopped out',
        commission: 5.0,
        pnl: -250.00,
        pnlPercentage: -2.50,
        netPnl: -255.00,
        efficiency: 25.00,
        rMultiple: -0.5,
        result: 'LOSS'
      }
    }),
    // Open trade
    prisma.trade.create({
      data: {
        userId: demoUser.id,
        strategyId: strategies[2].id,
        symbol: 'SPY',
        direction: 'LONG',
        orderType: 'MARKET',
        entryDate: now,
        entryPrice: 420.00,
        quantity: 10,
        stopLoss: 415.00,
        takeProfit: 430.00,
        timeframe: '15M',
        notes: 'Quick scalp on SPY bounce',
        commission: 2.5
      }
    })
  ]);

  console.log('Created demo trades:', trades.length);
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });