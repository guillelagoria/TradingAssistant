/**
 * Parse NinjaTrader 8 date format
 * Format: D/M/YYYY HH:mm:ss or DD/MM/YYYY HH:mm:ss
 * Example: "2/9/2025 12:18:21" → Date object for Sept 2, 2025
 */
export function parseNT8DateTime(dateStr: string | undefined | null): Date | null {
  if (!dateStr || dateStr.trim() === '') {
    return null;
  }

  try {
    // Split date and time parts
    const [datePart, timePart] = dateStr.trim().split(' ');

    if (!datePart || !timePart) {
      return null;
    }

    // Parse date (D/M/YYYY or DD/MM/YYYY)
    const [day, month, year] = datePart.split('/').map(p => parseInt(p, 10));

    // Parse time (HH:mm:ss)
    const [hours, minutes, seconds] = timePart.split(':').map(p => parseInt(p, 10));

    // Validate parsed values
    if (isNaN(day) || isNaN(month) || isNaN(year) ||
        isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
      return null;
    }

    // Create date (month is 0-indexed in JavaScript)
    const date = new Date(year, month - 1, day, hours, minutes, seconds);

    // Validate the date is valid
    if (isNaN(date.getTime())) {
      return null;
    }

    return date;
  } catch (error) {
    return null;
  }
}