// Helper function to parse date and return start/end of period
export const parseDateRange = (dateStr?: string) => {
  if (!dateStr) return null;

  // Check if dateStr is year-only (e.g., "2024")
  if (/^\d{4}$/.test(dateStr)) {
    return {
      start: new Date(`${dateStr}-01-01T00:00:00.000Z`),
      end: new Date(`${dateStr}-12-31T23:59:59.999Z`),
    };
  }
  // Check if dateStr is year-month (e.g., "2025-02")
  else if (/^\d{4}-\d{2}$/.test(dateStr)) {
    const [year, month] = dateStr.split("-");
    const start = new Date(`${year}-${month}-01T00:00:00.000Z`);
    const end = new Date(
      new Date(`${year}-${month}-01T23:59:59.999Z`).setMonth(
        parseInt(month) - 1 + 1 // Move to the end of the month
      )
    );
    end.setDate(0); // Set to last day of the month
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  // Full date (e.g., "2025-07-23")
  else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return {
      start: new Date(`${dateStr}T00:00:00.000Z`),
      end: new Date(`${dateStr}T23:59:59.999Z`),
    };
  }
  return null;
};
