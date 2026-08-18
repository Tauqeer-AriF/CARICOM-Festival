// Date utility functions for Grenada CARICOM Festival

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Parses YYYY-MM-DD string into a safe Date object in UTC to prevent timezone offsets
 */
export const parseIsoDate = (isoStr?: string): Date | null => {
  if (!isoStr) return null;
  const parts = isoStr.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(Date.UTC(year, month, day));
};

/**
 * Formats a single ISO date 'YYYY-MM-DD' into 'Month DD, YYYY' (e.g. 'May 22, 2027')
 */
export const formatIsoDate = (isoStr?: string): string => {
  if (!isoStr) return '';
  const d = parseIsoDate(isoStr);
  if (!d) return isoStr;
  const monthName = MONTH_NAMES[d.getUTCMonth()];
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  return `${monthName} ${day}, ${year}`;
};

/**
 * Formats start and end dates into an elegant readable range string.
 * Supports:
 * - One-day event: 'May 22, 2027'
 * - Same month multi-day: 'May 22 – 25, 2027'
 * - Multi-month multi-day: 'May 30 – June 2, 2027'
 * - Multi-year multi-day: 'Dec 30, 2026 – Jan 2, 2027'
 */
export const formatEventDateRange = (
  startDate?: string,
  endDate?: string,
  fallbackDate?: string
): string => {
  if (!startDate) return fallbackDate || '';

  const start = parseIsoDate(startDate);
  if (!start) return fallbackDate || startDate;

  // Single-day event or no end date specified
  if (!endDate || endDate === startDate) {
    return formatIsoDate(startDate);
  }

  const end = parseIsoDate(endDate);
  if (!end) return formatIsoDate(startDate);

  const startYear = start.getUTCFullYear();
  const endYear = end.getUTCFullYear();
  const startMonth = start.getUTCMonth();
  const endMonth = end.getUTCMonth();
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();

  if (startYear === endYear) {
    if (startMonth === endMonth) {
      // Same month: "May 22 – 25, 2027"
      return `${MONTH_NAMES[startMonth]} ${startDay} – ${endDay}, ${startYear}`;
    } else {
      // Different month, same year: "May 30 – June 2, 2027"
      return `${MONTH_NAMES[startMonth]} ${startDay} – ${MONTH_NAMES[endMonth]} ${endDay}, ${startYear}`;
    }
  } else {
    // Different years: "Dec 30, 2026 – Jan 2, 2027"
    return `${MONTH_NAMES[startMonth]} ${startDay}, ${startYear} – ${MONTH_NAMES[endMonth]} ${endDay}, ${endYear}`;
  }
};

/**
 * Calculates duration in days between startDate and endDate (inclusive)
 */
export const calculateDurationDays = (startDate?: string, endDate?: string): number => {
  if (!startDate) return 1;
  if (!endDate || endDate === startDate) return 1;
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  if (!start || !end) return 1;
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
};

/**
 * Shifts an ISO date 'YYYY-MM-DD' by N days
 */
export const shiftIsoDate = (isoStr: string, daysDiff: number): string => {
  const d = parseIsoDate(isoStr);
  if (!d) return isoStr;
  d.setUTCDate(d.getUTCDate() + daysDiff);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Converts a text date like 'May 22, 2027' or 'May 22 - 25, 2027' into a start ISO date '2027-05-22'
 */
export const parseTextDateToIso = (textDate?: string): string | null => {
  if (!textDate) return null;
  // If already ISO:
  if (/^\d{4}-\d{2}-\d{2}$/.test(textDate.trim())) {
    return textDate.trim();
  }
  // Try matching "May 22, 2027" or "May 22 2027"
  const match = textDate.match(/([a-zA-Z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:[,\s]+)(\d{4})/);
  if (match) {
    const monthIndex = MONTH_NAMES.findIndex(m => m.toLowerCase().startsWith(match[1].toLowerCase().slice(0, 3)));
    if (monthIndex !== -1) {
      const year = match[3];
      const month = String(monthIndex + 1).padStart(2, '0');
      const day = String(parseInt(match[2], 10)).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  return null;
};

/**
 * Computes overall start and end dates from a list of events
 */
export const getFestivalDatesFromEvents = (
  eventsList?: Array<{ startDate?: string; endDate?: string; date?: string }>
): { startDate: string; endDate: string } | null => {
  if (!eventsList || eventsList.length === 0) return null;
  const validDates: string[] = [];
  eventsList.forEach(e => {
    const s = e.startDate || parseTextDateToIso(e.date);
    const end = e.endDate || s;
    if (s && /^\d{4}-\d{2}-\d{2}$/.test(s)) validDates.push(s);
    if (end && /^\d{4}-\d{2}-\d{2}$/.test(end)) validDates.push(end);
  });
  if (validDates.length === 0) return null;
  validDates.sort();
  return {
    startDate: validDates[0],
    endDate: validDates[validDates.length - 1]
  };
};

/**
 * Returns the effective formatted date range string from siteConfig or events fallback
 */
export const getEffectiveFestivalDateRange = (
  siteConfig?: { festivalDates?: { startDate?: string; endDate?: string; rangeText?: string; label?: string } } | null,
  eventsList?: Array<{ startDate?: string; endDate?: string; date?: string }>
): string => {
  if (siteConfig?.festivalDates?.startDate) {
    return formatEventDateRange(
      siteConfig.festivalDates.startDate,
      siteConfig.festivalDates.endDate,
      siteConfig.festivalDates.rangeText || siteConfig.festivalDates.label || 'May 22 – 31, 2027'
    );
  }
  if (eventsList && eventsList.length > 0) {
    const fromEvents = getFestivalDatesFromEvents(eventsList);
    if (fromEvents) {
      return formatEventDateRange(fromEvents.startDate, fromEvents.endDate);
    }
  }
  return 'May 22 – 31, 2027';
};

