import type { FirebaseError } from 'firebase/app';
import {
  GoogleAuthProvider,
  User,
  linkWithPopup,
  signInWithCredential,
  signInWithPopup,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  limit,
  orderBy,
} from 'firebase/firestore';
import { auth, db, firebaseReady } from './client';
import { LanguageCode, LocationCoordinate } from '@/types/models';

export async function signInWithGoogle(): Promise<User> {
  if (!auth || !firebaseReady) throw new Error('Firebase is not configured.');

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const currentUser = auth.currentUser;
  let user: User;
  if (currentUser?.isAnonymous) {
    try {
      user = (await linkWithPopup(currentUser, provider)).user;
    } catch (error) {
      const credential = GoogleAuthProvider.credentialFromError(error as FirebaseError);
      if ((error as { code?: string })?.code !== 'auth/credential-already-in-use' || !credential) {
        throw error;
      }
      user = (await signInWithCredential(auth, credential)).user;
    }
  } else if (currentUser) {
    user = currentUser;
  } else {
    user = (await signInWithPopup(auth, provider)).user;
  }

  const idToken = await user.getIdToken();
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ idToken }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || 'Unable to establish a secure session.');
  }

  return user;
}

export async function signOutCurrentUser(): Promise<void> {
  if (!auth) throw new Error('Firebase is not configured.');
  const response = await fetch('/api/auth/session', {
    method: 'DELETE',
    credentials: 'same-origin',
  });
  if (!response.ok) throw new Error('Unable to clear the secure session.');
  const { signOut } = await import('firebase/auth');
  await signOut(auth);
}

export async function ensureFarmerProfile(
  user: User,
  defaultFarmLocation?: LocationCoordinate
): Promise<any> {
  const response = await fetch('/api/farmer/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ defaultFarmLocation }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw Object.assign(new Error(result.error || 'Farmer profile sync failed.'), {
      code: result.code || `http-${response.status}`,
      operation: 'profile',
    });
  }
  return result.profile;
}

export async function saveFarmerLocation(
  user: User,
  farmLocation: LocationCoordinate
): Promise<void> {
  void user;
  const response = await fetch('/api/farmer/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ farmLocation }),
  });
  if (!response.ok) throw new Error('Farm location save failed.');
}

export async function loadFarmerProfile(uid?: string): Promise<any | null> {
  if (!db || !uid) return null;
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    throw createProfileSyncError(error, 'read');
  }
}

function createProfileSyncError(error: unknown, operation: 'read' | 'write') {
  const firebaseCode =
    typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : 'unknown';
  const syncError = new Error(`Firestore profile ${operation} failed.`);
  Object.assign(syncError, { code: firebaseCode, operation });
  return syncError;
}

export async function loadFarmerContext(uid?: string) {
  if (!db || !uid) {
    return { profile: null, farms: [], cycles: [], healthRecords: [], diagnoses: [] };
  }

  try {
    const [farmSnapshot, cycleSnapshot, healthSnapshot, diagnosisSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'farms'), where('userId', '==', uid), limit(10))),
      getDocs(query(collection(db, 'cropCycles'), where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(10))),
      getDocs(query(collection(db, 'cropHealthRecords'), where('userId', '==', uid), orderBy('recordedAt', 'desc'), limit(10))),
      getDocs(query(collection(db, 'diagnoses'), where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(10))),
    ]);

    return {
      profile: await loadFarmerProfile(uid),
      farms: farmSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })),
      cycles: cycleSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })),
      healthRecords: healthSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })),
      diagnoses: diagnosisSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })),
    };
  } catch (error) {
    console.warn('Failed to load Firebase farmer context:', error);
    return { profile: await loadFarmerProfile(uid), farms: [], cycles: [], healthRecords: [], diagnoses: [] };
  }
}

export async function saveObservation(record: Record<string, any>) {
  if (!db || !record?.userId) return false;

  try {
    const recordId = record.recordId || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await setDoc(doc(db, 'cropHealthRecords', recordId), {
      ...record,
      recordId,
      recordedAt: record.recordedAt || new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.warn('Failed to save crop observation to Firestore:', error);
    return false;
  }
}

export function toFarmLocation(profile: any): LocationCoordinate | undefined {
  if (!profile?.farmLocation) return undefined;
  return {
    ...profile.farmLocation,
    displayNameEn: profile.farmLocation.displayNameEn || 'Guntur, Andhra Pradesh',
    displayNameTe: profile.farmLocation.displayNameTe || 'గుంటూరు, ఆంధ్రప్రదేశ్',
  };
}

export function getPreferredLanguage(profile: any): LanguageCode {
  if (profile?.preferredLanguage === 'en' || profile?.preferredLanguage === 'te') {
    return profile.preferredLanguage;
  }
  return 'te';
}
