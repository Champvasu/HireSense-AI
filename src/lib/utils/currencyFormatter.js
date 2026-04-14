/**
 * Format stipend amount in Indian Rupees (INR)
 * @param {string|number} stipend - The stipend value (can be numeric string with /month or raw number)
 * @returns {string} Formatted stipend string with INR symbol and /month suffix
 */
export function formatStipend(stipend) {
  if (!stipend || stipend === 'Unpaid') {
    return 'Unpaid';
  }

  // Remove any existing currency symbols, /month, and other formatting
  let cleanValue = String(stipend)
    .replace(/[₹$€£¥]/g, '') // Remove currency symbols
    .replace(/\/month|\/week|\/day/gi, '') // Remove period suffixes
    .replace(/,/g, '') // Remove commas
    .trim();

  // If it's a numeric value, format it with INR
  const numericValue = parseFloat(cleanValue);
  
  if (isNaN(numericValue)) {
    return stipend; // Return original if not numeric
  }

  // Format with Indian locale for proper comma placement
  const formattedNumber = numericValue.toLocaleString('en-IN');
  
  return `₹${formattedNumber}/month`;
}

/**
 * Extract numeric value from stipend string for storage
 * @param {string|number} stipend - The stipend value
 * @returns {number|null} Numeric value or null
 */
export function extractStipendValue(stipend) {
  if (!stipend || stipend === 'Unpaid') {
    return null;
  }

  const cleanValue = String(stipend)
    .replace(/[₹$€£¥]/g, '')
    .replace(/\/month|\/week|\/day/gi, '')
    .replace(/,/g, '')
    .trim();

  const numericValue = parseFloat(cleanValue);
  return isNaN(numericValue) ? null : numericValue;
}
