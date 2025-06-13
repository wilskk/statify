const SPSS_EPOCH_MILLIS = Date.UTC(1582, 9, 14, 0, 0, 0);

/**
 * Converts a 'dd-mm-yyyy' date string to SPSS seconds
 * (seconds since 14 Oct 1582 00:00:00 UTC).
 * Returns null for invalid input string or date.
 *
 * @param dateString Date string in 'dd-mm-yyyy' format.
 * @returns SPSS seconds or null.
 */
export function dateStringToSpssSeconds(dateString: string): number | null {
  if (typeof dateString !== 'string') return null;
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year) || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const targetMillis = Date.UTC(year, month - 1, day, 0, 0, 0);
  const validationDate = new Date(targetMillis);
  if (
    isNaN(targetMillis) ||
    validationDate.getUTCFullYear() !== year ||
    validationDate.getUTCMonth() !== month - 1 ||
    validationDate.getUTCDate() !== day
  ) {
    return null;
  }
  const diffMillis = targetMillis - SPSS_EPOCH_MILLIS;
  const spssSeconds = Math.round(diffMillis / 1000);
  return spssSeconds;
}
