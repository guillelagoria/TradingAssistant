/**
 * Test script for NinjaTrader 8 Import V2
 * Tests parsing, validation, and import functionality
 */

import { parseEuropeanNumber } from '../utils/numberParser';
import { parseNT8DateTime } from '../utils/dateParser';
import { parseNT8CSV } from '../utils/csvParser';

// Test data - sample NT8 CSV content
const testCSV = `Trade number;Instrument;Account;Strategy;Market pos.;Qty;Entry price;Exit price;Entry time;Exit time;Entry name;Exit name;Profit;Cum. net profit;Commission;Clearing Fee;Exchange Fee;IP Fee;NFA Fee;MAE;MFE;ETD;Bars;
1;ES SEP25;PA-LL024095-010!NaturalTrading!NaturalTrading;4 - 6p - 1C;Long;1;6387,50;6383,50;2/9/2025 12:18:21;2/9/2025 12:35:29;Entry;Stop1;-$ 200,00;-$ 200,00;$ 0,00;$ 0,00;$ 0,00;$ 0,00;$ 0,00;$ 200,00;$ 175,00;$ 375,00;0;
2;ES SEP25;PA-LL024095-010!NaturalTrading!NaturalTrading;4 - 6p - 1C;Short;1;6445,00;6449,00;3/9/2025 16:46:10;3/9/2025 16:50:00;Entry;Stop1;-$ 200,00;-$ 400,00;$ 0,00;$ 0,00;$ 0,00;$ 0,00;$ 0,00;$ 200,00;$ 37,50;$ 237,50;0;
3;NQ DEC25;PA-LL024095-010!NaturalTrading!NaturalTrading;Test Strategy;Long;2;21225,25;21240,50;4/9/2025 09:30:00;4/9/2025 10:15:30;Entry;Target1;$ 610,00;$ 210,00;$ 5,00;$ 0,00;$ 0,00;$ 0,00;$ 0,00;$ 50,00;$ 625,00;$ 675,00;0;`;

console.log('=== NinjaTrader 8 Import V2 Test ===\n');

// Test 1: European Number Parsing
console.log('Test 1: European Number Parsing');
console.log('-----------------------------------');
const testNumbers = [
  '6387,50',
  '-$ 200,00',
  '$ 175,00',
  '21225,25',
  '',
  'invalid'
];

testNumbers.forEach(num => {
  const parsed = parseEuropeanNumber(num);
  console.log(`  "${num}" → ${parsed}`);
});

// Test 2: Date Parsing
console.log('\nTest 2: Date Parsing');
console.log('-----------------------------------');
const testDates = [
  '2/9/2025 12:18:21',
  '3/9/2025 16:46:10',
  '4/9/2025 09:30:00',
  '15/12/2025 23:59:59',
  '',
  'invalid'
];

testDates.forEach(dateStr => {
  const parsed = parseNT8DateTime(dateStr);
  console.log(`  "${dateStr}" → ${parsed ? parsed.toISOString() : null}`);
});

// Test 3: CSV Parsing
console.log('\nTest 3: CSV Parsing');
console.log('-----------------------------------');
const rows = parseNT8CSV(testCSV);
console.log(`  Total rows parsed: ${rows.length}`);

if (rows.length > 0) {
  console.log('\n  First row details:');
  const firstRow = rows[0];
  Object.keys(firstRow).slice(0, 5).forEach(key => {
    console.log(`    ${key}: "${firstRow[key]}"`);
  });
}

// Test 4: Symbol Extraction
console.log('\nTest 4: Symbol Extraction');
console.log('-----------------------------------');
const instruments = ['ES SEP25', 'NQ DEC25', 'CL NOV25', 'GC FEB26'];
instruments.forEach(inst => {
  const symbol = inst.split(' ')[0];
  console.log(`  "${inst}" → "${symbol}"`);
});

// Test 5: Direction Parsing
console.log('\nTest 5: Direction Parsing');
console.log('-----------------------------------');
const directions = ['Long', 'Short', 'LONG', 'short'];
directions.forEach(dir => {
  const parsed = dir.trim().toUpperCase() === 'LONG' ? 'LONG' : 'SHORT';
  console.log(`  "${dir}" → "${parsed}"`);
});

// Test 6: Full Row Processing
console.log('\nTest 6: Full Row Processing');
console.log('-----------------------------------');
if (rows.length > 0) {
  const row = rows[0];
  const trade = {
    symbol: row['Instrument']?.split(' ')[0] || '',
    direction: row['Market pos.']?.trim().toUpperCase() === 'LONG' ? 'LONG' : 'SHORT',
    quantity: parseEuropeanNumber(row['Qty']),
    entryPrice: parseEuropeanNumber(row['Entry price']),
    exitPrice: parseEuropeanNumber(row['Exit price']),
    entryDate: parseNT8DateTime(row['Entry time']),
    exitDate: parseNT8DateTime(row['Exit time']),
    pnl: parseEuropeanNumber(row['Profit']),
    mae: parseEuropeanNumber(row['MAE']),
    mfe: parseEuropeanNumber(row['MFE'])
  };

  console.log('  Parsed Trade:');
  Object.entries(trade).forEach(([key, value]) => {
    if (value instanceof Date) {
      console.log(`    ${key}: ${value.toISOString()}`);
    } else {
      console.log(`    ${key}: ${value}`);
    }
  });
}

console.log('\n=== Test Complete ===');