/**
 * Parse European number format and currency values
 * Examples:
 * - "6387,50" → 6387.50
 * - "-$ 200,00" → -200.00
 * - "$ 212,50" → 212.50
 */
export function parseEuropeanNumber(value: string | undefined | null): number {
  if (!value || value.trim() === '') {
    return 0;
  }

  // Remove currency symbols and spaces
  let cleanValue = value
    .replace(/\$/g, '')
    .replace(/\s+/g, '')
    .trim();

  // Handle empty result
  if (!cleanValue || cleanValue === '-') {
    return 0;
  }

  // Replace comma with period for decimal separator
  cleanValue = cleanValue.replace(',', '.');

  // Parse to number
  const parsed = parseFloat(cleanValue);

  // Return 0 for invalid numbers
  if (isNaN(parsed)) {
    return 0;
  }

  return parsed;
}