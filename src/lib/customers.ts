import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
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

export interface ListCustomersOpts {
  status?: CustomerStatus;
  serviceType?: ServiceType;
}

export async function listCustomers(opts: ListCustomersOpts = {}): Promise<Customer[]> {
  const constraints: QueryConstraint[] = [];
  if (opts.status) constraints.push(where('status', '==', opts.status));
  if (opts.serviceType) constraints.push(where('serviceType', '==', opts.serviceType));
  constraints.push(orderBy('lastName'));
  const snap = await getDocs(query(collection(db, COL), ...constraints));
  return snap.docs.map((d) => fromSnap(d.id, d.data() as Record<string, unknown>));
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
  await setDoc(doc(db, COL, id), { ...input, createdAt: serverTimestamp() });
  return id;
}

export async function updateCustomer(
  customerId: string,
  patch: Partial<CustomerInput>,
): Promise<void> {
  await updateDoc(doc(db, COL, customerId), patch);
}
