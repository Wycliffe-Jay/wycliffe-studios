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
  deleteDoc,
  serverTimestamp,
  orderBy,
  query,
  type DocumentData,
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCztg9A-1e0obIBAQZvBJSLG1qLEAYivk',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'wycliffe-studios.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'wycliffe-studios',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'wycliffe-studios.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '126849363556',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:126849363556:web:52defe4302170af6bdf971',
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

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

export async function deleteCollectionItem(name: string, id: string) {
  await deleteDoc(doc(db, name, id));
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

export async function updateInquiryStatus(id: string, status: string) {
  await setDoc(doc(db, 'client_inquiries', id), { status }, { merge: true });
}

export function uploadImage(
  file: File,
  folder = 'site-images',
  onProgress?: (progress: number) => void,
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    return Promise.reject(new Error('Please select an image file.'));
  }
  if (file.size > 10 * 1024 * 1024) {
    return Promise.reject(new Error('Image must be 10 MB or smaller.'));
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const uniqueName = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '-' + safeName;
  const fileRef = storageRef(storage, folder + '/' + uniqueName);
  const task = uploadBytesResumable(fileRef, file, { contentType: file.type });

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      snapshot => {
        const progress = snapshot.totalBytes ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100 : 0;
        onProgress?.(Math.round(progress));
      },
      error => reject(error),
      async () => {
        try {
          resolve(await getDownloadURL(task.snapshot.ref));
        } catch (error) {
          reject(error);
        }
      },
    );
  });
}

export async function deleteUploadedImage(downloadUrl: string) {
  if (!downloadUrl.includes('firebasestorage.googleapis.com')) return;
  await deleteObject(storageRef(storage, downloadUrl));
}
