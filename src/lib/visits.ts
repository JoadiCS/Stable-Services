import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  ChecklistItem,
  ChemicalAddition,
  ChemicalReadings,
  Visit,
  VisitPhoto,
} from '@/types/portal';

const COL = 'visits';

function fromSnap(id: string, data: Record<string, unknown>): Visit {
  return { visitId: id, ...(data as Omit<Visit, 'visitId'>) };
}

async function runQuery(...constraints: QueryConstraint[]): Promise<Visit[]> {
  const q = query(collection(db, COL), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromSnap(d.id, d.data() as Record<string, unknown>));
}

export async function listVisitsForTechToday(techId: string, todayISO: string): Promise<Visit[]> {
  return runQuery(
    where('techId', '==', techId),
    where('scheduledDate', '==', todayISO),
    orderBy('scheduledWindow'),
    orderBy('customerName'),
  );
}

export async function listVisitsForTechDate(techId: string, dateISO: string): Promise<Visit[]> {
  return runQuery(
    where('techId', '==', techId),
    where('scheduledDate', '==', dateISO),
    orderBy('scheduledWindow'),
    orderBy('customerName'),
  );
}

export async function listVisitsForTechWeek(
  techId: string,
  weekStartISO: string,
  weekEndISO: string,
): Promise<Visit[]> {
  return runQuery(
    where('techId', '==', techId),
    where('scheduledDate', '>=', weekStartISO),
    where('scheduledDate', '<=', weekEndISO),
    orderBy('scheduledDate'),
    orderBy('scheduledWindow'),
  );
}

export async function listVisitsForCustomer(customerId: string): Promise<Visit[]> {
  return runQuery(
    where('customerId', '==', customerId),
    orderBy('scheduledDate', 'desc'),
    limit(50),
  );
}

export async function listVisitsForWeek(
  weekStartISO: string,
  weekEndISO: string,
): Promise<Visit[]> {
  return runQuery(
    where('scheduledDate', '>=', weekStartISO),
    where('scheduledDate', '<=', weekEndISO),
    orderBy('scheduledDate'),
    orderBy('scheduledWindow'),
  );
}

export async function listVisitsByStatusInRange(
  status: Visit['status'],
  startISO: string,
  endISO: string,
): Promise<Visit[]> {
  return runQuery(
    where('status', '==', status),
    where('scheduledDate', '>=', startISO),
    where('scheduledDate', '<=', endISO),
  );
}

export async function getVisit(visitId: string): Promise<Visit | null> {
  const snap = await getDoc(doc(db, COL, visitId));
  if (!snap.exists()) return null;
  return fromSnap(snap.id, snap.data() as Record<string, unknown>);
}

export async function startVisit(visitId: string): Promise<void> {
  await updateDoc(doc(db, COL, visitId), {
    status: 'in_progress',
    startedAt: serverTimestamp(),
  });
}

export async function completeVisit(visitId: string): Promise<void> {
  await updateDoc(doc(db, COL, visitId), {
    status: 'completed',
    completedAt: serverTimestamp(),
    reportGenerated: true,
  });
}

export async function updateVisitChecklist(
  visitId: string,
  checklist: ChecklistItem[],
): Promise<void> {
  await updateDoc(doc(db, COL, visitId), { checklist });
}

export async function updateVisitChemicals(
  visitId: string,
  readings: ChemicalReadings,
  additions: ChemicalAddition[],
): Promise<void> {
  await updateDoc(doc(db, COL, visitId), {
    chemicalReadings: readings,
    chemicalsAdded: additions,
  });
}

export async function updateVisitNotes(
  visitId: string,
  customerNotes: string,
  techNotes: string,
): Promise<void> {
  await updateDoc(doc(db, COL, visitId), { customerNotes, techNotes });
}

export async function addVisitPhoto(visitId: string, photo: VisitPhoto): Promise<void> {
  await updateDoc(doc(db, COL, visitId), { photos: arrayUnion(photo) });
}

export type VisitInput = Omit<Visit, 'visitId'>;

export async function createVisit(input: VisitInput): Promise<string> {
  const ref = await addDoc(collection(db, COL), input);
  return ref.id;
}
