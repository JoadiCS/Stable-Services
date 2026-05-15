import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from './firebase';
import { createStaffMember, type StaffInput } from './staff';
import type { StaffRole } from '@/types/portal';

const COL = 'staffPending';

export interface StaffPending {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: StaffRole;
  active: boolean;
  createdAt?: Timestamp;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Admin creates a pending staff record before the tech has signed up.
 * Doc id is the email itself so the Firestore rules can locate the
 * record using `request.auth.token.email` when the tech later signs in.
 */
export async function createPendingStaff(input: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: StaffRole;
}): Promise<void> {
  const email = normalizeEmail(input.email);
  if (!email) throw new Error('Email is required.');
  await setDoc(doc(db, COL, email), {
    email,
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone ?? '',
    role: input.role,
    active: true,
    createdAt: serverTimestamp(),
  });
}

export async function listPendingStaff(): Promise<StaffPending[]> {
  try {
    const snap = await getDocs(collection(db, COL));
    return snap.docs.map((d) => d.data() as StaffPending);
  } catch {
    return [];
  }
}

export async function deletePendingStaff(email: string): Promise<void> {
  await deleteDoc(doc(db, COL, normalizeEmail(email)));
}

/**
 * Called automatically on every sign-in. If there's a pending staff
 * record matching the user's email AND no linked /staff/{uid} doc yet,
 * promote the pending record to /staff/{uid} and delete the pending row.
 * Failures are intentionally swallowed — a non-staff customer signing in
 * will hit this code path too and we don't want to surface noise.
 */
export async function claimPendingStaffForUser(user: User): Promise<void> {
  if (!user.email) return;
  const email = normalizeEmail(user.email);
  try {
    // Don't overwrite an existing linked record.
    const linked = await getDoc(doc(db, 'staff', user.uid));
    if (linked.exists()) return;

    const pending = await getDoc(doc(db, COL, email));
    if (!pending.exists()) return;

    const data = pending.data() as StaffPending;
    const staffInput: StaffInput = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: data.role,
      active: data.active ?? true,
    };
    await createStaffMember(user.uid, staffInput);
    await deleteDoc(doc(db, COL, email));
  } catch {
    // Swallow — most users won't have a pending record (customers don't
    // hit this collection at all). Rule denials are expected.
  }
}
