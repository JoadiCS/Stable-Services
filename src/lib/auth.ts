import { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export type StaffRole = 'owner' | 'ops' | 'tech';

export interface AuthUserState {
  user: User | null;
  loading: boolean;
}

export function useAuthUser(): AuthUserState {
  const [state, setState] = useState<AuthUserState>({ user: null, loading: true });

  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      (user) => setState({ user, loading: false }),
      () => setState({ user: null, loading: false }),
    );
    return unsub;
  }, []);

  return state;
}

export interface StaffRoleState {
  role: StaffRole | null;
  loading: boolean;
}

export function useStaffRole(uid: string | null | undefined): StaffRoleState {
  const [state, setState] = useState<StaffRoleState>({ role: null, loading: !!uid });

  useEffect(() => {
    if (!uid) {
      setState({ role: null, loading: false });
      return;
    }
    let cancelled = false;
    setState({ role: null, loading: true });
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'staff', uid));
        if (cancelled) return;
        if (snap.exists()) {
          const data = snap.data() as { role?: StaffRole };
          setState({ role: data.role ?? null, loading: false });
        } else {
          setState({ role: null, loading: false });
        }
      } catch {
        if (!cancelled) setState({ role: null, loading: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  return state;
}

export function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function signUpWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function sendPasswordReset(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export function signOut() {
  return fbSignOut(auth);
}
