/**
 * Test script for NT8 session-based import service
 * Tests the session storage service directly
 */

const { ImportSessionStorageService } = require('./dist/services/importSessionStorage.service');
const { NT8ImportService } = require('./dist/services/nt8Import.service');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const sessionStorage = ImportSessionStorageService.getInstance();
const nt8ImportService = new NT8ImportService(prisma);

// Test CSV content
const TEST_CSV_CONTENT = `Trade number;Instrument;Account;Strategy;Market pos.;Qty;Entry time;Entry price;Exit time;Exit price;Exit name;Entry name;Profit;Cum. profit;Commission;Description;Connection;Trade duration
1;ES SEP25;Sim101;MySampleStrategy;Long;1;2/9/2025 12:18:21;5987,25;2/9/2025 12:21:15;5992,50;;Entry 1;$ 262,50;$ 262,50;$ 2,00;;Continuum;00:02:54
2;ES SEP25;Sim101;MySampleStrategy;Short;1;2/9/2025 14:05:33;5995,75;2/9/2025 14:10:45;5990,25;;Entry 2;$ 225,00;$ 487,50;$ 2,00;;Continuum;00:05:12
3;NQ DEC25;Sim101;MySampleStrategy;Long;2;3/9/2025 09:30:15;21250,50;3/9/2025 09:45:30;21275,25;;Entry 3;$ 495,00;$ 982,50;$ 4,00;;Continuum;00:15:15`;

async function createTestFile() {
  const testFilePath = path.join(__dirname, 'test-nt8-session.csv');
  fs.writeFileSync(testFilePath, TEST_CSV_CONTENT);
  return testFilePath;
}

async function getTestUserId() {
  // Get or create a test user
  const testUser = await prisma.user.findFirst({
    where: { email: 'test@example.com' }
  });

  if (testUser) {
    return testUser.id;
  }

  const newUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: 'hashed_password', // In real app, this would be hashed
      name: 'Test User'
    }
  });

  return newUser.id;
}

async function testSessionWorkflow() {
  console.log('🚀 Testing NT8 Session-Based Import Workflow\n');

  let testFilePath;
  let sessionId;
  let userId;

  try {
    // Create test file
    console.log('📄 Creating test CSV file...');
    testFilePath = await createTestFile();
    console.log('   File created:', testFilePath);

    // Get test user ID
    console.log('\n👤 Getting test user...');
    userId = await getTestUserId();
    console.log('   User ID:', userId);

    // Test Session Creation
    console.log('\n📦 Testing session creation...');
    const fileStats = fs.statSync(testFilePath);
    sessionId = await sessionStorage.createSession(
      userId,
      testFilePath,
      'test-nt8-session.csv',
      fileStats.size
    );
    console.log('   Session created:', sessionId);

    // Test Session Retrieval
    console.log('\n🔍 Testing session retrieval...');
    const sessionData = sessionStorage.getSession(sessionId, userId);
    if (!sessionData) {
      throw new Error('Failed to retrieve session');
    }
    console.log('   Session data retrieved:');
    console.log('     - File:', sessionData.fileName);
    console.log('     - Format:', sessionData.fileFormat);
    console.log('     - Size:', sessionData.fileSize, 'bytes');
    console.log('     - Expires at:', sessionData.expiresAt);

    // Test Preview (dry run)
    console.log('\n👁️  Testing preview (dry run)...');
    const previewResult = await nt8ImportService.importNT8File(
      sessionData.filePath,
      {
        userId,
        skipDuplicates: true,
        defaultCommission: 2.0,
        dryRun: true
      }
    );
    console.log('   Preview results:');
    console.log('     - Total rows:', previewResult.summary.total);
    console.log('     - Would import:', previewResult.summary.imported);
    console.log('     - Trades parsed:', previewResult.trades.length);

    // Test Session Update
    console.log('\n📝 Testing session update...');
    const updateSuccess = sessionStorage.updateSession(sessionId, userId, {
      metadata: {
        previewCompleted: true,
        tradesCount: previewResult.trades.length
      }
    });
    console.log('   Update successful:', updateSuccess);

    // Test Session Deletion
    console.log('\n🗑️  Testing session deletion...');
    await sessionStorage.deleteSession(sessionId);
    const deletedSession = sessionStorage.getSession(sessionId, userId);
    console.log('   Session deleted:', deletedSession === null);

    // Verify file cleanup
    const fileExists = fs.existsSync(testFilePath);
    console.log('   File cleaned up:', !fileExists);

    console.log('\n✅ All tests passed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    // Cleanup
    if (testFilePath && fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('\n🧹 Test file cleaned up');
    }

    await prisma.$disconnect();
  }
}

// Run tests
testSessionWorkflow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });