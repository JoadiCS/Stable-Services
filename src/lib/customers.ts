import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Customer, CustomerStatus, ServiceType } from '@/types/portal';

const COL = 'customers';

function fromSnap(id: string, data: Record<string, unknown>): Customer {
  return { customerId: id, ...(data as Omit<Customer, 'customerId'>) };
}

/**
 * Firestore rejects `undefined` field values with
 * "Unsupported field value: undefined". Strip them before writing so
 * partially-filled forms (e.g. no tech assigned yet) don't blow up.
 * Empty strings are kept — they're legal Firestore values.
 */
function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

export interface ListCustomersOpts {
  status?: CustomerStatus;
  serviceType?: ServiceType;
}

export async function listCustomers(opts: ListCustomersOpts = {}): Promise<Customer[]> {
  const constraints: QueryConstraint[] = [];
  if (opts.status) constraints.push(where('status', '==', opts.status));
  if (opts.serviceType) constraints.push(where('serviceType', '==', opts.serviceType));
  // NOTE: we intentionally sort client-side rather than via orderBy('lastName').
  // Firestore's orderBy silently EXCLUDES docs missing the order-by field, which
  // caused the visit generator to find 0 customers when records lacked lastName.
  // Sorting client-side also dodges the composite index requirement that pairs
  // with the status filter.
  const snap = await getDocs(query(collection(db, COL), ...constraints));
  const rows = snap.docs.map((d) => fromSnap(d.id, d.data() as Record<string, unknown>));
  rows.sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));
  return rows;
}

export async function getCustomer(customerId: string): Promise<Customer | null> {
  const snap = await getDoc(doc(db, COL, customerId));
  if (!snap.exists()) return null;
  return fromSnap(snap.id, snap.data() as Record<string, unknown>);
}

export type CustomerInput = Omit<Customer, 'customerId' | 'createdAt'>;

/**
 * Creates a customer. If you pass `customerId`, the doc is created with that ID
 * (use the auth UID when linking a customer to their login). Otherwise a random
 * ID is assigned.
 */
export async function createCustomer(
  input: CustomerInput,
  customerId?: string,
): Promise<string> {
  const id = customerId ?? doc(collection(db, COL)).id;
  const payload = stripUndefined({ ...input, createdAt: serverTimestamp() });
  await setDoc(doc(db, COL, id), payload);
  return id;
}

/**
 * Pass `clearFields: ['monthlyRate']` to explicitly remove a field from
 * the Firestore doc (uses deleteField sentinel). Useful when the admin
 * blanks out an optional override field that previously held a value —
 * undefined alone would be stripped by stripUndefined and the old value
 * would persist on the doc.
 */
export async function updateCustomer(
  customerId: string,
  patch: Partial<CustomerInput>,
  clearFields: ReadonlyArray<keyof CustomerInput> = [],
): Promise<void> {
  const cleaned: Record<string, unknown> = stripUndefined(patch);
  for (const f of clearFields) {
    cleaned[f as string] = deleteField();
  }
  await updateDoc(doc(db, COL, customerId), cleaned);
}
