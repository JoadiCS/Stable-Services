import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { ServiceRequest, ServiceRequestStatus } from '@/types/portal';

const COL = 'serviceRequests';

function fromSnap(id: string, data: Record<string, unknown>): ServiceRequest {
  const status = (data.status as ServiceRequestStatus | undefined) ?? 'new';
  return {
    requestId: id,
    ...(data as Omit<ServiceRequest, 'requestId' | 'status'>),
    status,
  };
}

export async function countServiceRequestsSince(date: Date): Promise<number> {
  try {
    const snap = await getDocs(
      query(
        collection(db, COL),
        where('createdAt', '>=', Timestamp.fromDate(date)),
      ),
    );
    return snap.size;
  } catch {
    return 0;
  }
}

export async function listServiceRequests(opts: { max?: number } = {}): Promise<ServiceRequest[]> {
  const max = opts.max ?? 100;
  try {
    const snap = await getDocs(
      query(collection(db, COL), orderBy('createdAt', 'desc'), limit(max)),
    );
    return snap.docs.map((d) => fromSnap(d.id, d.data() as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function updateServiceRequestStatus(
  requestId: string,
  status: ServiceRequestStatus,
): Promise<void> {
  await updateDoc(doc(db, COL, requestId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export const SERVICE_REQUEST_STATUSES: ServiceRequestStatus[] = [
  'new',
  'in_progress',
  'resolved',
  'closed',
];
