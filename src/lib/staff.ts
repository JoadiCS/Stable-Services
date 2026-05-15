import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { StaffMember, StaffRole } from '@/types/portal';

const COL = 'staff';

function fromSnap(id: string, data: Record<string, unknown>): StaffMember {
  return { uid: id, ...(data as Omit<StaffMember, 'uid'>) };
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

/**
 * Returns all techs eligible for assignment. Excludes staff explicitly
 * marked active: false. Staff records without an `active` field are
 * treated as active (legacy docs created before the field existed).
 *
 * Sorting is done client-side because Firestore's orderBy silently drops
 * docs missing the order-by field — we don't want a staff doc without a
 * lastName to vanish from the roster.
 */
export async function listTechs(): Promise<StaffMember[]> {
  const snap = await getDocs(
    query(
      collection(db, COL),
      where('role', 'in', ['tech', 'lead_tech', 'owner']),
    ),
  );
  return snap.docs
    .map((d) => fromSnap(d.id, d.data() as Record<string, unknown>))
    .filter((s) => s.active !== false)
    .sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));
}

export async function listAllStaff(): Promise<StaffMember[]> {
  const snap = await getDocs(query(collection(db, COL)));
  return snap.docs
    .map((d) => fromSnap(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));
}

export async function getStaffMember(uid: string): Promise<StaffMember | null> {
  const snap = await getDoc(doc(db, COL, uid));
  if (!snap.exists()) return null;
  return fromSnap(snap.id, snap.data() as Record<string, unknown>);
}

export type StaffInput = Omit<StaffMember, 'uid' | 'createdAt' | 'active'> & {
  active?: boolean;
};

/**
 * Creates a staff record at /staff/{uid}. The uid here matches the Firebase
 * Auth UID that will be assigned to the staff member after they sign up.
 * Admins typically create the staff doc first, then ask the new tech to
 * register using "Forgot password" with their email.
 *
 * `active` defaults to `true` when omitted.
 */
export async function createStaffMember(uid: string, input: StaffInput): Promise<void> {
  const payload = stripUndefined({
    ...input,
    active: input.active ?? true,
    createdAt: serverTimestamp(),
  });
  await setDoc(doc(db, COL, uid), payload);
}

export async function updateStaffMember(
  uid: string,
  patch: Partial<StaffInput>,
): Promise<void> {
  await updateDoc(doc(db, COL, uid), stripUndefined(patch));
}

export const STAFF_ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: 'tech', label: 'Tech' },
  { value: 'lead_tech', label: 'Lead Tech' },
  { value: 'admin', label: 'Admin' },
  { value: 'owner', label: 'Owner' },
];
