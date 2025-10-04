import Papa from 'papaparse';

/**
 * Parse NinjaTrader 8 CSV file content
 * Uses semicolon delimiter and handles European formatting
 */
export function parseNT8CSV(fileContent: string): any[] {
  if (!fileContent || fileContent.trim() === '') {
    return [];
  }

  const result = Papa.parse(fileContent, {
    delimiter: ';',
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (result.errors && result.errors.length > 0) {
    console.warn('CSV parsing warnings:', result.errors);
  }

  return result.data || [];
}