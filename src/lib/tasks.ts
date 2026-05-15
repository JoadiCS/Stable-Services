import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Task, TaskPriority, TaskStatus } from '@/types/portal';

const COL = 'tasks';

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

function fromSnap(id: string, data: Record<string, unknown>): Task {
  const status = (data.status as TaskStatus) ?? 'open';
  const priority = (data.priority as TaskPriority) ?? 'normal';
  return {
    id,
    ...(data as Omit<Task, 'id' | 'status' | 'priority'>),
    status,
    priority,
  };
}

/**
 * Real-time stream of every task. Returns the unsubscribe function. Order
 * is by createdAt desc so newly-added tasks appear at the top of any raw
 * iteration; consumers can re-sort by dueDate/priority client-side.
 */
export function listenTasks(cb: (tasks: Task[]) => void): () => void {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      cb(snap.docs.map((d) => fromSnap(d.id, d.data() as Record<string, unknown>)));
    },
    () => {
      cb([]);
    },
  );
}

export type TaskInput = Omit<Task, 'id' | 'createdAt' | 'completedAt' | 'status'> & {
  status?: TaskStatus;
};

export async function createTask(input: TaskInput): Promise<string> {
  const ref = await addDoc(
    collection(db, COL),
    stripUndefined({
      ...input,
      status: input.status ?? 'open',
      createdAt: serverTimestamp(),
    }),
  );
  return ref.id;
}

export async function updateTask(
  id: string,
  patch: Partial<TaskInput>,
  clearFields: ReadonlyArray<keyof TaskInput> = [],
): Promise<void> {
  const cleaned: Record<string, unknown> = stripUndefined(patch);
  for (const f of clearFields) {
    cleaned[f as string] = deleteField();
  }
  await updateDoc(doc(db, COL, id), cleaned);
}

export async function toggleTaskDone(id: string, currentStatus: TaskStatus): Promise<void> {
  if (currentStatus === 'done') {
    await updateDoc(doc(db, COL, id), {
      status: 'open',
      completedAt: deleteField(),
    });
  } else {
    await updateDoc(doc(db, COL, id), {
      status: 'done',
      completedAt: serverTimestamp(),
    });
  }
}

export async function deleteTask(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
