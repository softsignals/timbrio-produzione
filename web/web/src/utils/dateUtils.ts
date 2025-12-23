import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

export const formatDate = (date: string | Date, formatStr = 'dd MMM yyyy'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: it });
  } catch (error) {
    return '';
  }
};

export const formatTime = (time: string): string => {
  return time;
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'dd MMM yyyy HH:mm');
};

export const getCurrentTime = (): string => {
  const now = new Date();
  return format(now, 'HH:mm');
};

export const getToday = (): Date => {
  return new Date();
};

