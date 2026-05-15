import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { CalendarEvent } from '@/types/portal';

const COL = 'calendarEvents';

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

function fromSnap(id: string, data: Record<string, unknown>): CalendarEvent {
  return { id, ...(data as Omit<CalendarEvent, 'id'>) };
}

/**
 * Real-time stream of events whose `date` falls inside [startISO, endISO]
 * inclusive. Returns the unsubscribe function. Events are sorted by date
 * then start time client-side because Firestore can't order on a
 * potentially-missing field cleanly.
 */
export function listenEventsInRange(
  startISO: string,
  endISO: string,
  cb: (events: CalendarEvent[]) => void,
): () => void {
  const q = query(
    collection(db, COL),
    where('date', '>=', startISO),
    where('date', '<=', endISO),
    orderBy('date', 'asc'),
  );
  return onSnapshot(
    q,
    (snap) => {
      const events = snap.docs.map((d) => fromSnap(d.id, d.data() as Record<string, unknown>));
      events.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        const at = a.allDay ? '' : a.startTime ?? '';
        const bt = b.allDay ? '' : b.startTime ?? '';
        return at.localeCompare(bt);
      });
      cb(events);
    },
    () => {
      cb([]);
    },
  );
}

export type CalendarEventInput = Omit<CalendarEvent, 'id' | 'createdAt'>;

export async function createCalendarEvent(input: CalendarEventInput): Promise<string> {
  const ref = await addDoc(
    collection(db, COL),
    stripUndefined({ ...input, createdAt: serverTimestamp() }),
  );
  return ref.id;
}

export async function updateCalendarEvent(
  id: string,
  patch: Partial<CalendarEventInput>,
): Promise<void> {
  await updateDoc(doc(db, COL, id), stripUndefined(patch));
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
