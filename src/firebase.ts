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

const CLOUDINARY_CLOUD_NAME = 'sqzpc1s7';
const CLOUDINARY_UPLOAD_PRESET = 'wycliffe_portfolio';
const CLOUDINARY_UPLOAD_URL =
  'https://api.cloudinary.com/v1_1/' + CLOUDINARY_CLOUD_NAME + '/image/upload';

const ALLOWED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export function uploadImage(
  file: File,
  _folder = 'portfolio',
  onProgress?: (progress: number) => void,
): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return Promise.reject(new Error('Please select a PNG, JPG, JPEG, WEBP, or GIF image.'));
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return Promise.reject(new Error('Image must be 10 MB or smaller.'));
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('POST', CLOUDINARY_UPLOAD_URL);
    xhr.responseType = 'json';

    xhr.upload.addEventListener('progress', event => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      const response = xhr.response as { secure_url?: string; error?: { message?: string } } | null;

      if (xhr.status >= 200 && xhr.status < 300 && response?.secure_url) {
        onProgress?.(100);
        resolve(response.secure_url);
        return;
      }

      reject(new Error(response?.error?.message || 'Cloudinary image upload failed.'));
    });

    xhr.addEventListener('error', () => reject(new Error('Could not connect to Cloudinary.')));
    xhr.addEventListener('abort', () => reject(new Error('Image upload was cancelled.')));

    xhr.send(formData);
  });
}
