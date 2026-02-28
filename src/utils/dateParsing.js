/**
 * Utility functions for parsing dates from various formats.
 */

export const parseAnyDate = (input, isSwapMonthDay = false) => {
    if (!input) return null;
    if (input instanceof Date) return input;
    if (typeof input === 'number') {
        // Excel date serial number (days since 1900-01-01)
        const jsDate = new Date(Math.round((input - 25569) * 86400 * 1000));
        return new Date(jsDate.getUTCFullYear(), jsDate.getUTCMonth(), jsDate.getUTCDate(), jsDate.getUTCHours(), jsDate.getUTCMinutes(), jsDate.getUTCSeconds());
    }
    if (typeof input === 'string') {
        const cleanStr = input.trim();
        if (cleanStr.includes('T') && cleanStr.includes(':')) {
            const d = new Date(cleanStr);
            if (!isNaN(d.getTime())) return d;
        }
        if (isSwapMonthDay && cleanStr.includes('-')) {
            const parts = cleanStr.split(' ');
            const datePart = parts[0];
            const separator = datePart.includes('-') ? '-' : '/';
            const dParts = datePart.split(separator);
            if (dParts.length === 3) {
                let y, m, d;
                if (dParts[0].length === 4) { y = parseInt(dParts[0]); d = parseInt(dParts[1]); m = parseInt(dParts[2]) - 1; }
                else { d = parseInt(dParts[0]); m = parseInt(dParts[1]) - 1; y = parseInt(dParts[2]); }
                let hour = 0, minute = 0;
                if (parts[1]) {
                    const tParts = parts[1].split(':');
                    hour = parseInt(tParts[0]) || 0; minute = parseInt(tParts[1]) || 0;
                }
                return new Date(y, m, d, hour, minute);
            }
        }
        let d = new Date(cleanStr);
        if (!isNaN(d.getTime())) return d;
        try {
            const parts = cleanStr.split(' ');
            if (parts.length < 2) return null;
            const datePart = parts[0]; const timePart = parts[1];
            let day, month, year;
            if (datePart.includes('/')) {
                const dp = datePart.split('/');
                if (dp[0].length === 4) { year = parseInt(dp[0]); month = parseInt(dp[1]) - 1; day = parseInt(dp[2]); }
                else { day = parseInt(dp[0]); month = parseInt(dp[1]) - 1; year = parseInt(dp[2]); }
            } else if (datePart.includes('-')) {
                const dp = datePart.split('-');
                if (dp[0].length === 4) { year = parseInt(dp[0]); month = parseInt(dp[1]) - 1; day = parseInt(dp[2]); }
                else { day = parseInt(dp[0]); month = parseInt(dp[1]) - 1; year = parseInt(dp[2]); }
            }
            let hour = 0, minute = 0;
            if (timePart) {
                const timeParts = timePart.split(':').map(n => parseInt(n));
                hour = timeParts[0] || 0; minute = timeParts[1] || 0;
            }
            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) return new Date(year, month, day, hour, minute);
        } catch (e) { return null; }
    }
    return null;
};
