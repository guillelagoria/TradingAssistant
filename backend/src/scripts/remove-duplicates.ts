import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeDuplicates() {
  console.log('\n🔍 Starting duplicate removal process...\n');

  try {
    // Get all trades grouped by potential duplicate criteria
    const allTrades = await prisma.trade.findMany({
      orderBy: [
        { symbol: 'asc' },
        { entryDate: 'asc' },
        { entryPrice: 'asc' }
      ]
    });

    console.log(`📊 Total trades found: ${allTrades.length}`);

    // Group trades by duplicate criteria
    const groups = new Map<string, typeof allTrades>();

    for (const trade of allTrades) {
      // Create a unique key based on duplicate criteria
      const key = `${trade.symbol}|${trade.direction}|${trade.entryPrice}|${trade.quantity}|${trade.entryDate.toISOString()}`;

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(trade);
    }

    // Find duplicates and keep only the oldest one
    let duplicatesFound = 0;
    const toDelete: string[] = [];

    for (const [key, trades] of groups.entries()) {
      if (trades.length > 1) {
        duplicatesFound++;
        console.log(`\n🔍 Found ${trades.length} duplicates for: ${key.split('|')[0]}`);

        // Sort by creation date, keep the oldest (first created)
        trades.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

        // Mark all except the first one for deletion
        for (let i = 1; i < trades.length; i++) {
          toDelete.push(trades[i].id);
          console.log(`   ❌ Marking for deletion: ${trades[i].id} (created: ${trades[i].createdAt})`);
        }

        console.log(`   ✅ Keeping: ${trades[0].id} (created: ${trades[0].createdAt})`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Unique trade groups: ${groups.size}`);
    console.log(`   Duplicate groups found: ${duplicatesFound}`);
    console.log(`   Trades to delete: ${toDelete.length}`);

    if (toDelete.length === 0) {
      console.log('\n✅ No duplicates found!\n');
      return;
    }

    // Delete duplicates
    console.log(`\n🗑️  Deleting ${toDelete.length} duplicate trades...`);
    const result = await prisma.trade.deleteMany({
      where: {
        id: { in: toDelete }
      }
    });

    console.log(`✅ Successfully deleted ${result.count} duplicate trades`);

    // Show final count
    const finalCount = await prisma.trade.count();
    console.log(`📊 Final trade count: ${finalCount}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeDuplicates();
