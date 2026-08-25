/**
 * Returns YYYY-MM-DD in local time (or target timezone) rather than UTC.
 * Prevents midnight UTC date offset bugs (e.g. 00:30 AM IST showing yesterday's UTC date).
 */
export function getLocalDateISOString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parses a local YYYY-MM-DD date string and HH:mm time string in the user's target timezone
 * into an absolute JavaScript Date object (UTC).
 */
export function parseLocalISOToDate(
  dateStr: string,
  timeStr: string,
  userTimezone: string = "Asia/Kolkata"
): Date {
  const cleanDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr.trim();
  const cleanTime = timeStr.trim();
  const localIso = `${cleanDate}T${cleanTime.length === 5 ? `${cleanTime}:00` : cleanTime}`;

  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: userTimezone || "Asia/Kolkata",
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value;

    let formattedOffset = "+05:30"; // default IST offset
    if (offsetPart && offsetPart.startsWith("GMT")) {
      const rawOffset = offsetPart.replace("GMT", "");
      if (rawOffset === "" || rawOffset === "Z") {
        formattedOffset = "+00:00";
      } else {
        const sign = rawOffset[0];
        const numbers = rawOffset.slice(1).split(":");
        const hours = numbers[0].padStart(2, "0");
        const minutes = numbers[1] ? numbers[1].padStart(2, "0") : "00";
        formattedOffset = `${sign}${hours}:${minutes}`;
      }
    }

    return new Date(`${localIso}${formattedOffset}`);
  } catch {
    // Fallback to IST +05:30 offset
    return new Date(`${localIso}+05:30`);
  }
}
