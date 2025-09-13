import { format, parseISO, isValid } from 'date-fns';

const dateHelpers = {
  formatDate: (date: Date | string): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return isValid(d) ? format(d, 'MMM dd, yyyy') : 'Invalid date';
  },
  
  formatDateTime: (date: Date | string): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return isValid(d) ? format(d, 'MMM dd, yyyy HH:mm') : 'Invalid date';
  },
  
  formatTime: (date: Date | string): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return isValid(d) ? format(d, 'HH:mm') : 'Invalid time';
  },
  
  isValidDate: (date: Date | string): boolean => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return isValid(d);
  }
};

export default dateHelpers;