import * as dayjs from 'dayjs';

/**
 * Formats a date to the specified format
 * @param date - Date string or Date object
 * @param format - Output format (e.g., 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY')
 * @returns Formatted date string in the specified format
 */
export const formatDate = (date: string | Date, format: string): string => {
  if (!date) {
    throw new Error('Date is required');
  }

  if (!format) {
    throw new Error('Format is required');
  }

  const dayjsDate = dayjs(date);

  if (!dayjsDate.isValid()) {
    throw new Error('Invalid date format');
  }

  return dayjsDate.format(format);
};
