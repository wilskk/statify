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

/**
 * Converts SPSS seconds back to a 'dd-mm-yyyy' date string.
 * Returns null for invalid input.
 *
 * @param spssSeconds The number of seconds since 14 Oct 1582.
 * @returns A date string in 'dd-mm-yyyy' format or null.
 */
export function spssSecondsToDateString(spssSeconds: number): string | null {
  if (typeof spssSeconds !== 'number' || isNaN(spssSeconds)) {
    return null;
  }

  const targetMillis = SPSS_EPOCH_MILLIS + (spssSeconds * 1000);
  const date = new Date(targetMillis);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return null;
  }

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const year = date.getUTCFullYear();

  return `${day}-${month}-${year}`;
}
