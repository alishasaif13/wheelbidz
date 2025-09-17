export function getTimeDifference(start, end = new Date()) {
  const startTime = new Date(start);
  const endTime = new Date(end);

  // Format both in Asia/Karachi as `YYYY-MM-DDTHH:mm`
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  function formatKarachiTime(date) {
    const parts = formatter.formatToParts(date);
    const dateParts = {};
    parts.forEach(({ type, value }) => {
      dateParts[type] = value;
    });
    return `${dateParts.year}-${dateParts.month}-${dateParts.day}T${dateParts.hour}:${dateParts.minute}`;
  }

  const startFormatted = formatKarachiTime(startTime);
  const endFormatted = formatKarachiTime(endTime);

  console.log("Start (PK):", startFormatted);
  console.log("End   (PK):", endFormatted);

  // Difference in milliseconds
  const diffInMs = startTime - endTime;

  if (diffInMs <= 0) return "Time expired";

  const totalSeconds = Math.floor(diffInMs / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const totalSecond = totalSeconds;
  const officalTimeFormat = `${days}d ${hours}h ${minutes}m ${seconds}s`;

  return {
    totalSecond,
    officalTimeFormat,
    startFormatted,
    endFormatted,
  };
}
