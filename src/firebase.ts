import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  query,
  type DocumentData,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCztg9aG-1e0obIBAQZvBJSLG1qLEAYivk',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'wycliffe-studios.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'wycliffe-studios',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'wycliffe-studios.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '126849363556',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:126849363556:web:52defe4302170af6bdf971',
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
export const db = getFirestore(app);

export const ADMIN_UID = 'vNJmOaLhwsgw95QrHtP0hqoFuqm1';

export async function signInAdmin(email: string, password: string) {
  const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
  if (result.user.uid !== ADMIN_UID) {
    await signOut(firebaseAuth);
    throw new Error('This account is not authorized to manage Wycliffe Studios.');
  }
  return result.user;
}

export const signOutAdmin = () => signOut(firebaseAuth);

export function watchAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(firebaseAuth, callback);
}

export async function readSection(id: string): Promise<DocumentData | null> {
  const snap = await getDoc(doc(db, 'site_content', id));
  return snap.exists() ? snap.data() : null;
}

export async function saveSection(id: string, data: DocumentData) {
  await setDoc(doc(db, 'site_content', id), data, { merge: true });
}

export async function readCollection(name: string): Promise<DocumentData[]> {
  const ref = collection(db, name);
  try {
    const snap = await getDocs(query(ref, orderBy('order', 'asc')));
    return snap.docs.map(item => ({ id: item.id, ...item.data() }));
  } catch {
    const snap = await getDocs(ref);
    return snap.docs.map(item => ({ id: item.id, ...item.data() }));
  }
}

export async function saveCollectionItem(name: string, id: string | undefined, data: DocumentData) {
  if (id) {
    await setDoc(doc(db, name, id), data, { merge: true });
    return id;
  }
  const result = await addDoc(collection(db, name), data);
  return result.id;
}

export async function createClientInquiry(data: {
  name: string;
  business: string;
  email: string;
  phone: string;
  service: string;
  budget: string;
  projectDetails: string;
}) {
  await addDoc(collection(db, 'client_inquiries'), {
    ...data,
    status: 'New',
    createdAt: serverTimestamp(),
  });
}
