// public/workers/DescriptiveStatistics/Frequencies/spssDateConverter.js

// SPSS Epoch: 14 October 1582, 00:00:00 UTC.
// Date.UTC is used for consistent millisecond timestamps from the JavaScript epoch (1 Jan 1970 UTC).
// Months in Date.UTC/Date objects are 0-indexed (e.g., 9 for October).
const SPSS_EPOCH_MILLIS = Date.UTC(1582, 9, 14, 0, 0, 0);

/**
 * Converts SPSS seconds (seconds since 14 Oct 1582 00:00:00 UTC)
 * to a 'dd-mm-yyyy' formatted date string.
 * Returns null if the input results in an invalid date.
 *
 * @param {number} spssSeconds - Seconds since SPSS epoch.
 * @returns {string | null} Formatted date string or null.
 */
function spssSecondsToDateString(spssSeconds) {
    if (typeof spssSeconds !== 'number' || !Number.isFinite(spssSeconds)) {
        return null;
    }

    const targetMillis = SPSS_EPOCH_MILLIS + spssSeconds * 1000;
    const date = new Date(targetMillis);

    if (isNaN(date.getTime())) {
        return null;
    }

    // Extract date components using UTC methods to align with UTC epoch definition.
    const day = date.getUTCDate();
    // Month is 0-indexed, so add 1.
    const month = date.getUTCMonth() + 1;
    const year = date.getUTCFullYear();

    const dayString = String(day).padStart(2, '0');
    const monthString = String(month).padStart(2, '0');

    return `${dayString}-${monthString}-${year}`;
}

/**
 * Converts a 'dd-mm-yyyy' date string to SPSS seconds
 * (seconds since 14 Oct 1582 00:00:00 UTC).
 * Returns null for invalid input string or date.
 *
 * @param {string} dateString - Date string in 'dd-mm-yyyy' format.
 * @returns {number | null} SPSS seconds or null.
 */
function dateStringToSpssSeconds(dateString) {
    if (typeof dateString !== 'string') {
        return null;
    }

    const parts = dateString.split('-');
    if (parts.length !== 3) {
        return null; // Invalid format.
    }

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year) || month < 1 || month > 12 || day < 1 || day > 31) {
        return null;
    }

    // Calculate target timestamp in milliseconds from JavaScript epoch (use UTC).
    // Month must be 0-indexed for Date.UTC.
    const targetMillis = Date.UTC(year, month - 1, day, 0, 0, 0);

    // Validate if Date.UTC produced a valid timestamp (handles dates like Feb 30).
    // Re-validate components as Date.UTC can "overflow" (e.g., month 13 becomes next year).
    const validationDate = new Date(targetMillis);
    if (
        isNaN(targetMillis) ||
        validationDate.getUTCFullYear() !== year ||
        validationDate.getUTCMonth() !== month - 1 ||
        validationDate.getUTCDate() !== day
    ) {
        return null; // Invalid date components or parsing issue.
    }

    if (isNaN(SPSS_EPOCH_MILLIS)) {
        // This should not happen in modern JS environments.
        console.error("SPSS Epoch calculation resulted in NaN.");
        return null;
    }

    const diffMillis = targetMillis - SPSS_EPOCH_MILLIS;
    // Convert difference to seconds; use Math.round for precision.
    const spssSeconds = Math.round(diffMillis / 1000);

    // Optional: Check if the date is before the SPSS epoch.
    // if (spssSeconds < 0) return null;

    return spssSeconds;
}

/**
 * Converts a duration in seconds to an "X days HH:MM" string format.
 * @param {number | null | undefined} totalSeconds - Total duration in seconds.
 * @returns {string | null} Formatted duration string or null for invalid input.
 */
function secondsToDaysHoursMinutesString(totalSeconds) {
    if (totalSeconds === null || totalSeconds === undefined || typeof totalSeconds !== 'number' || !Number.isFinite(totalSeconds) || totalSeconds < 0) {
        return null;
    }

    const secondsPerMinute = 60;
    const secondsPerHour = 3600;
    const secondsPerDay = 86400;

    const days = Math.floor(totalSeconds / secondsPerDay);
    const remainingSecondsAfterDays = totalSeconds % secondsPerDay;
    const hours = Math.floor(remainingSecondsAfterDays / secondsPerHour);
    const remainingSecondsAfterHours = remainingSecondsAfterDays % secondsPerHour;
    const minutes = Math.floor(remainingSecondsAfterHours / secondsPerMinute);
    // Remaining seconds are ignored for this "X days HH:MM" format.

    const hoursString = String(hours).padStart(2, '0');
    const minutesString = String(minutes).padStart(2, '0');

    return `${days} days ${hoursString}:${minutesString}`;
}

// Expose functions to the global worker scope.
self.spssSecondsToDateString = spssSecondsToDateString;
self.dateStringToSpssSeconds = dateStringToSpssSeconds;
self.secondsToDaysHoursMinutesString = secondsToDaysHoursMinutesString; 