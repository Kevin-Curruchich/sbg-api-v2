/**
 * Formats a number as currency with GTQ (Guatemalan Quetzal)
 * @param amount The amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  const formatter = new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2,
  });

  return formatter.format(amount);
};
