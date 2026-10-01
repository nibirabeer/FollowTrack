import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { Snapshot } from '../types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function isFirebaseConfigured(): boolean {
  return !!firebaseConfig.apiKey && !!firebaseConfig.projectId;
}

export function initFirebase(): Firestore | null {
  if (!isFirebaseConfigured()) return null;
  if (!app) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
  return db;
}

export async function saveSnapshotToFirestore(snapshot: Snapshot): Promise<void> {
  const firestore = initFirebase();
  if (!firestore) return;
  const docRef = doc(collection(firestore, 'snapshots'), snapshot.id);
  await setDoc(docRef, snapshot);
}

export async function loadSnapshotsFromFirestore(): Promise<Snapshot[]> {
  const firestore = initFirebase();
  if (!firestore) return [];
  const querySnapshot = await getDocs(collection(firestore, 'snapshots'));
  const snapshots: Snapshot[] = [];
  querySnapshot.forEach((docSnap) => {
    snapshots.push(docSnap.data() as Snapshot);
  });
  return snapshots;
}

export async function deleteSnapshotFromFirestore(id: string): Promise<void> {
  const firestore = initFirebase();
  if (!firestore) return;
  await deleteDoc(doc(firestore, 'snapshots', id));
}

