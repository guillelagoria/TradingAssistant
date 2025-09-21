/**
 * Test script for NT8 Import Service
 * Run with: npx ts-node src/scripts/testNT8Import.ts
 */

import { PrismaClient } from '@prisma/client';
import { NT8ImportService } from '../services/nt8Import.service';
import * as fs from 'fs/promises';
import * as path from 'path';

// Create a sample CSV file for testing with actual NT8 format
const createSampleCSV = async (): Promise<string> => {
  const csvContent = `Trade number;Instrument;Account;Strategy;Market pos.;Qty;Entry price;Exit price;Entry time;Exit time;Entry name;Exit name;Profit;Cum. net profit;Commission;MAE;MFE;ETD;Bars;
1;ES SEP25;PA-LL024095-010!NaturalTrading!NaturalTrading;4 - 6p - 1C;Long;1;6387,50;6383,50;2/9/2025 12:18:21;2/9/2025 12:35:29;Entry;Stop1;-$ 200,00;-$ 200,00;$ 0,00;$ 200,00;$ 175,00;$ 375,00;0;
2;ES SEP25;PA-LL024095-010!NaturalTrading!NaturalTrading;4 - 6p - 1C;Short;2;6380,25;6390,75;3/9/2025 09:45:12;3/9/2025 10:20:33;Entry;Target;-$ 420,00;-$ 620,00;$ 0,00;$ 420,00;$ 315,00;$ 735,00;0;
3;NQ DEC25;PA-LL024095-010!NaturalTrading!NaturalTrading;Scalping System;Long;1;21250,75;21275,50;4/9/2025 14:30:45;4/9/2025 14:35:12;Entry;Target;$ 1237,50;$ 617,50;$ 2,50;$ 50,00;$ 1250,00;$ 1300,00;0;
4;ES SEP25;PA-LL024095-010!NaturalTrading!NaturalTrading;Breakout Strategy;Short;3;6395,00;6385,25;5/9/2025 11:15:33;5/9/2025 12:00:18;Entry;Target;$ 1462,50;$ 2080,00;$ 0,00;$ 150,00;$ 1500,00;$ 1650,00;0;
5;NQ DEC25;PA-LL024095-010!NaturalTrading!NaturalTrading;Mean Reversion;Long;2;21180,00;21195,25;6/9/2025 16:45:21;6/9/2025 17:10:55;Entry;Target;$ 1525,00;$ 3605,00;$ 5,00;$ 200,00;$ 1600,00;$ 1800,00;0;`;

  const tempDir = path.join(__dirname, '../../temp');
  await fs.mkdir(tempDir, { recursive: true });
  const filePath = path.join(tempDir, 'nt8_test_trades.csv');
  await fs.writeFile(filePath, csvContent);
  return filePath;
};

// Create a sample Excel file for testing
const createSampleExcel = async (): Promise<string> => {
  const XLSX = await import('xlsx');

  const data = [
    {
      'Entry Time': '2024-01-20 09:30:00',
      'Exit Time': '2024-01-20 10:45:00',
      'Instrument': 'ES 03-24',
      'Quantity': 2,
      'Entry Price': 5030.50,
      'Exit Price': 5040.25,
      'Direction': 'Long',
      'P&L': 97.50,
      'Commission': 4.00,
      'MAE': 5,
      'MFE': 12,
      'Strategy': 'Breakout Strategy',
      'Account': 'SIM102',
      'Trade #': '006',
      'Notes': 'Morning breakout'
    },
    {
      'Entry Time': '2024-01-21 14:00:00',
      'Exit Time': '2024-01-21 15:30:00',
      'Instrument': 'NQ 03-24',
      'Quantity': 1,
      'Entry Price': 17550.00,
      'Exit Price': 17500.00,
      'Direction': 'Short',
      'P&L': 50.00,
      'Commission': 2.00,
      'MAE': 30,
      'MFE': 8,
      'Strategy': 'Scalping',
      'Account': 'SIM102',
      'Trade #': '007',
      'Notes': 'Quick scalp'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Trades');

  const tempDir = path.join(__dirname, '../../temp');
  await fs.mkdir(tempDir, { recursive: true });
  const filePath = path.join(tempDir, 'nt8_test_trades.xlsx');
  XLSX.writeFile(wb, filePath);
  return filePath;
};

const testImport = async () => {
  const prisma = new PrismaClient();
  const importService = new NT8ImportService(prisma);

  try {
    console.log('🚀 Starting NT8 Import Service Test\n');

    // Create or find test user
    let testUser = await prisma.user.findUnique({
      where: { email: 'test@nt8import.com' }
    });

    if (!testUser) {
      console.log('Creating test user...');
      testUser = await prisma.user.create({
        data: {
          email: 'test@nt8import.com',
          password: 'testpassword', // In production, this should be hashed
          name: 'NT8 Test User',
          commission: 2.0
        }
      });
    }

    // Create or find test account
    let testAccount = await prisma.account.findFirst({
      where: {
        userId: testUser.id,
        name: 'NT8 Test Account'
      }
    });

    if (!testAccount) {
      console.log('Creating test account...');
      testAccount = await prisma.account.create({
        data: {
          userId: testUser.id,
          name: 'NT8 Test Account',
          accountType: 'DEMO',
          currency: 'USD',
          creationDate: new Date(),
          initialBalance: 100000,
          currentBalance: 100000,
          isActive: true
        }
      });

      // Set as active account
      await prisma.user.update({
        where: { id: testUser.id },
        data: { activeAccountId: testAccount.id }
      });
    }

    console.log(`User: ${testUser.email}`);
    console.log(`Account: ${testAccount.name}\n`);

    // Test CSV Import
    console.log('📄 Testing CSV Import...');
    console.log('Creating sample CSV file...');
    const csvPath = await createSampleCSV();
    console.log(`CSV file created at: ${csvPath}\n`);

    console.log('Importing CSV file...');
    const csvResult = await importService.importNT8File(csvPath, {
      userId: testUser.id,
      skipDuplicates: true,
      dryRun: false,
      timezone: 'America/New_York',
      defaultCommission: 2.0
    });

    console.log('\n✅ CSV Import Results:');
    console.log(`Session ID: ${csvResult.sessionId}`);
    console.log(`Status: ${csvResult.status}`);
    console.log(`Total Rows: ${csvResult.summary.total}`);
    console.log(`Imported: ${csvResult.summary.imported}`);
    console.log(`Skipped: ${csvResult.summary.skipped}`);
    console.log(`Errors: ${csvResult.summary.errors}`);
    console.log(`Duplicates: ${csvResult.summary.duplicates}`);
    console.log(`Duration: ${csvResult.duration}ms`);

    if (csvResult.errors.length > 0) {
      console.log('\n⚠️ Errors:');
      csvResult.errors.forEach(error => console.log(`  - ${error}`));
    }

    if (csvResult.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      csvResult.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    // Test Excel Import
    console.log('\n\n📊 Testing Excel Import...');
    console.log('Creating sample Excel file...');
    const excelPath = await createSampleExcel();
    console.log(`Excel file created at: ${excelPath}\n`);

    console.log('Importing Excel file...');
    const excelResult = await importService.importNT8File(excelPath, {
      userId: testUser.id,
      skipDuplicates: true,
      dryRun: false,
      timezone: 'America/New_York',
      defaultCommission: 2.0
    });

    console.log('\n✅ Excel Import Results:');
    console.log(`Session ID: ${excelResult.sessionId}`);
    console.log(`Status: ${excelResult.status}`);
    console.log(`Total Rows: ${excelResult.summary.total}`);
    console.log(`Imported: ${excelResult.summary.imported}`);
    console.log(`Skipped: ${excelResult.summary.skipped}`);
    console.log(`Errors: ${excelResult.summary.errors}`);
    console.log(`Duplicates: ${excelResult.summary.duplicates}`);
    console.log(`Duration: ${excelResult.duration}ms`);

    if (excelResult.errors.length > 0) {
      console.log('\n⚠️ Errors:');
      excelResult.errors.forEach(error => console.log(`  - ${error}`));
    }

    if (excelResult.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      excelResult.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    // Get import history
    console.log('\n\n📚 Import History:');
    const history = await importService.getImportHistory(testUser.id, 5);
    history.forEach((session, index) => {
      console.log(`\n${index + 1}. Session ${session.id}`);
      console.log(`   Source: ${session.source}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   File: ${session.fileName}`);
      console.log(`   Imported: ${session.importedRows}/${session.totalRows}`);
      console.log(`   Date: ${session.createdAt}`);
    });

    // Query imported trades
    console.log('\n\n💼 Imported Trades:');
    const trades = await prisma.trade.findMany({
      where: {
        userId: testUser.id,
        source: 'NT8_IMPORT'
      },
      orderBy: { entryDate: 'desc' },
      take: 10
    });

    trades.forEach((trade, index) => {
      console.log(`\n${index + 1}. ${trade.symbol} - ${trade.direction}`);
      console.log(`   Entry: ${trade.entryPrice} @ ${trade.entryDate}`);
      console.log(`   Exit: ${trade.exitPrice} @ ${trade.exitDate}`);
      console.log(`   P&L: $${trade.pnl?.toFixed(2) || 'N/A'}`);
      console.log(`   Net P&L: $${trade.netPnl?.toFixed(2) || 'N/A'}`);
    });

    // Clean up temp files
    console.log('\n\n🧹 Cleaning up temp files...');
    await fs.unlink(csvPath);
    await fs.unlink(excelPath);

    console.log('\n✅ NT8 Import Service test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
};

// Run the test
testImport().catch(console.error);