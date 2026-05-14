import { format } from 'date-fns';
import type { Visit } from '@/types/portal';

export function formatVisitDate(visit: Visit): string {
  if (visit.completedAt && typeof visit.completedAt.toDate === 'function') {
    return format(visit.completedAt.toDate(), 'MMM d, yyyy');
  }
  // scheduledDate is YYYY-MM-DD — parse manually to avoid tz drift.
  const [y, m, d] = visit.scheduledDate.split('-').map(Number);
  if (!y || !m || !d) return visit.scheduledDate;
  return format(new Date(y, m - 1, d), 'MMM d, yyyy');
}
