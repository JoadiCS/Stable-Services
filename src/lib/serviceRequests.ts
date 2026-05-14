import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

export async function countServiceRequestsSince(date: Date): Promise<number> {
  try {
    const snap = await getDocs(
      query(
        collection(db, 'serviceRequests'),
        where('createdAt', '>=', Timestamp.fromDate(date)),
      ),
    );
    return snap.size;
  } catch {
    return 0;
  }
}
