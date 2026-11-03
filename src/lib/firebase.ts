import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  signInAnonymously,
  User 
} from 'firebase/auth';
import { 
  initializeFirestore,
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc
} from 'firebase/firestore';
import type { SavedSession, ClinicalCase, ReflectiveJournalEntry } from '../types';

// Read config from injected file
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use custom firestore database ID and force long polling to avoid 10s backend unreachable timeout in sandboxed/proxy iframe environments
const firestoreSettings = {
  experimentalForceLongPolling: true,
};

export const db = firebaseConfigJson.firestoreDatabaseId 
  ? initializeFirestore(app, firestoreSettings, firebaseConfigJson.firestoreDatabaseId)
  : initializeFirestore(app, firestoreSettings);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function loginAsGuest(): Promise<User> {
  const result = await signInAnonymously(auth);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  await fbSignOut(auth);
}

// Session Persistence
export async function saveSessionToFirestore(session: SavedSession): Promise<void> {
  // Always update local storage first for resilience
  try {
    const key = `psychosim_sessions_${session.userId}`;
    const existing: SavedSession[] = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = [session, ...existing.filter(s => s.id !== session.id)];
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (localErr) {
    console.warn('Local session caching failed:', localErr);
  }

  // If authenticated user with valid ID, persist to Firestore
  if (session.userId && session.userId !== 'guest' && auth.currentUser) {
    const path = `users/${session.userId}/sessions/${session.id}`;
    try {
      const userDocRef = doc(db, 'users', session.userId, 'sessions', session.id);
      await setDoc(userDocRef, session, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

export async function getUserSessionsFromFirestore(userId: string): Promise<SavedSession[]> {
  const localKey = `psychosim_sessions_${userId}`;
  const getLocal = (): SavedSession[] => {
    try {
      const local = localStorage.getItem(localKey);
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  };

  // If guest or not signed in, return local immediately
  if (!userId || userId === 'guest' || !auth.currentUser) {
    return getLocal();
  }

  const path = `users/${userId}/sessions`;
  try {
    const colRef = collection(db, 'users', userId, 'sessions');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const results: SavedSession[] = [];
    snap.forEach((docSnap) => {
      results.push(docSnap.data() as SavedSession);
    });
    if (results.length > 0) {
      try {
        localStorage.setItem(localKey, JSON.stringify(results));
      } catch {}
      return results;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }

  return getLocal();
}

// Custom Case Persistence
export async function saveCustomCaseToFirestore(userId: string, clinicalCase: ClinicalCase): Promise<void> {
  try {
    const key = `psychosim_cases_${userId}`;
    const existing: ClinicalCase[] = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = [clinicalCase, ...existing.filter(c => c.id !== clinicalCase.id)];
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (localErr) {
    console.warn('Local case caching failed:', localErr);
  }

  if (userId && userId !== 'guest' && auth.currentUser) {
    const path = `users/${userId}/cases/${clinicalCase.id}`;
    try {
      const caseRef = doc(db, 'users', userId, 'cases', clinicalCase.id);
      await setDoc(caseRef, clinicalCase, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

export async function getUserCustomCases(userId: string): Promise<ClinicalCase[]> {
  const localKey = `psychosim_cases_${userId}`;
  const getLocal = (): ClinicalCase[] => {
    try {
      const local = localStorage.getItem(localKey);
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  };

  if (!userId || userId === 'guest' || !auth.currentUser) {
    return getLocal();
  }

  const path = `users/${userId}/cases`;
  try {
    const colRef = collection(db, 'users', userId, 'cases');
    const snap = await getDocs(colRef);
    const results: ClinicalCase[] = [];
    snap.forEach(docSnap => results.push(docSnap.data() as ClinicalCase));
    if (results.length > 0) {
      try {
        localStorage.setItem(localKey, JSON.stringify(results));
      } catch {}
      return results;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }

  return getLocal();
}

// Reflective Journal Persistence
export async function saveJournalEntryToFirestore(entry: ReflectiveJournalEntry): Promise<void> {
  // Always keep localStorage updated for instant access and guest support
  try {
    const key = `psychosim_journals_${entry.userId}`;
    const existing: ReflectiveJournalEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
    const index = existing.findIndex(j => j.id === entry.id);
    let updated: ReflectiveJournalEntry[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = entry;
    } else {
      updated = [entry, ...existing];
    }
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.warn('Local storage journal save error:', e);
  }

  if (entry.userId && entry.userId !== 'guest' && auth.currentUser) {
    const path = `users/${entry.userId}/journals/${entry.id}`;
    try {
      const journalRef = doc(db, 'users', entry.userId, 'journals', entry.id);
      await setDoc(journalRef, entry, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

export async function getUserJournalEntriesFromFirestore(userId: string): Promise<ReflectiveJournalEntry[]> {
  const localKey = `psychosim_journals_${userId}`;
  const getLocal = (): ReflectiveJournalEntry[] => {
    try {
      const local = localStorage.getItem(localKey);
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  };

  if (!userId || userId === 'guest' || !auth.currentUser) {
    return getLocal();
  }

  const path = `users/${userId}/journals`;
  try {
    const colRef = collection(db, 'users', userId, 'journals');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const results: ReflectiveJournalEntry[] = [];
    snap.forEach(docSnap => results.push(docSnap.data() as ReflectiveJournalEntry));
    if (results.length > 0) {
      try {
        localStorage.setItem(localKey, JSON.stringify(results));
      } catch {}
      return results;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }

  return getLocal();
}

export async function deleteJournalEntryFromFirestore(userId: string, entryId: string): Promise<void> {
  try {
    const key = `psychosim_journals_${userId}`;
    const existing: ReflectiveJournalEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = existing.filter(j => j.id !== entryId);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.warn('Local storage journal delete error:', e);
  }

  if (userId && userId !== 'guest' && auth.currentUser) {
    const path = `users/${userId}/journals/${entryId}`;
    try {
      const journalRef = doc(db, 'users', userId, 'journals', entryId);
      await deleteDoc(journalRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
}


