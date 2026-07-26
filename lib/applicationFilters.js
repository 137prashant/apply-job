/**
 * Returns true if the application has no applied date filter active,
 * or its appliedDate falls within [from, to] (inclusive, calendar days).
 */
export function matchesAppliedDateRange(app, from, to) {
  if (!from && !to) return true;
  if (!app.appliedDate) return false;

  const applied = new Date(app.appliedDate);

  if (from) {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    if (applied < start) return false;
  }

  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (applied > end) return false;
  }

  return true;
}
