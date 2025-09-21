/**
 * Test script for NT8 import workflow
 * Tests the session-based import flow
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3001/api';

// Test user credentials (update with actual test user)
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123'
};

// Test CSV content
const TEST_CSV_CONTENT = `Trade number;Instrument;Account;Strategy;Market pos.;Qty;Entry time;Entry price;Exit time;Exit price;Exit name;Entry name;Profit;Cum. profit;Commission;Description;Connection;Trade duration
1;ES SEP25;Sim101;MySampleStrategy;Long;1;2/9/2025 12:18:21;5987,25;2/9/2025 12:21:15;5992,50;;Entry 1;$ 262,50;$ 262,50;$ 2,00;;Continuum;00:02:54
2;ES SEP25;Sim101;MySampleStrategy;Short;1;2/9/2025 14:05:33;5995,75;2/9/2025 14:10:45;5990,25;;Entry 2;$ 225,00;$ 487,50;$ 2,00;;Continuum;00:05:12
3;NQ DEC25;Sim101;MySampleStrategy;Long;2;3/9/2025 09:30:15;21250,50;3/9/2025 09:45:30;21275,25;;Entry 3;$ 495,00;$ 982,50;$ 4,00;;Continuum;00:15:15`;

async function createTestFile() {
  const testFilePath = path.join(__dirname, 'test-nt8-import.csv');
  fs.writeFileSync(testFilePath, TEST_CSV_CONTENT);
  return testFilePath;
}

async function login() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    return response.data.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testUpload(token, filePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  try {
    const response = await axios.post(`${API_URL}/import/nt8/upload`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Upload successful:', response.data);
    return response.data.data.sessionId;
  } catch (error) {
    console.error('❌ Upload failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testPreview(token, sessionId) {
  try {
    const response = await axios.post(`${API_URL}/import/nt8/preview`, {
      sessionId,
      skipDuplicates: true,
      defaultCommission: 2.0
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Preview successful:');
    console.log('  - Total trades:', response.data.data.summary.total);
    console.log('  - Valid trades:', response.data.data.summary.imported);
    console.log('  - Errors:', response.data.data.summary.errors);
    return response.data;
  } catch (error) {
    console.error('❌ Preview failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testExecute(token, sessionId) {
  try {
    const response = await axios.post(`${API_URL}/import/nt8/execute`, {
      sessionId,
      skipDuplicates: true,
      defaultCommission: 2.0
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Import executed successfully:');
    console.log('  - Imported:', response.data.data.summary.imported);
    console.log('  - Skipped:', response.data.data.summary.skipped);
    console.log('  - Duplicates:', response.data.data.summary.duplicates);
    return response.data;
  } catch (error) {
    console.error('❌ Execute failed:', error.response?.data || error.message);
    throw error;
  }
}

async function runTests() {
  console.log('🚀 Starting NT8 Import Workflow Tests\n');

  let testFilePath;
  let token;
  let sessionId;

  try {
    // Create test file
    console.log('📄 Creating test CSV file...');
    testFilePath = await createTestFile();
    console.log('   File created:', testFilePath);

    // Login
    console.log('\n🔐 Logging in...');
    token = await login();
    console.log('   Token received');

    // Test Upload
    console.log('\n📤 Testing upload endpoint...');
    sessionId = await testUpload(token, testFilePath);
    console.log('   Session ID:', sessionId);

    // Test Preview
    console.log('\n👁️  Testing preview endpoint...');
    await testPreview(token, sessionId);

    // Test Execute
    console.log('\n✨ Testing execute endpoint...');
    await testExecute(token, sessionId);

    console.log('\n🎉 All tests passed successfully!');

  } catch (error) {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    if (testFilePath && fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('\n🧹 Test file cleaned up');
    }
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };