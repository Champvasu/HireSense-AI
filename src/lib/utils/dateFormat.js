/**
 * Format date consistently for SSR/CSR hydration compatibility
 * Uses ISO format that renders the same on server and client
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Use a consistent format: YYYY-MM-DD
  return date.toISOString().split('T')[0];
}

/**
 * Format date for display with locale (client-side only)
 */
export function formatDateLocale(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
