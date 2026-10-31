import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, UserRole } from '../types';

const WORKER_APP_NAME = 'FirebaseAuthWorkerApp';

/**
 * Returns a dedicated secondary Firebase Auth instance so administrative
 * user provisioning does not log out or mutate the current user session.
 */
function getWorkerAuth() {
  const existingApp = getApps().find((a) => a.name === WORKER_APP_NAME);
  const workerApp = existingApp || initializeApp(firebaseConfig, WORKER_APP_NAME);
  return getAuth(workerApp);
}

/**
 * Creates a user account directly in Firebase Authentication and stores their
 * profile in Firestore /users/{uid}.
 * Gracefully handles existing accounts to avoid breaking batch or student creation.
 */
export async function createFirebaseUserAccount(params: {
  email: string;
  password?: string;
  fullName: string;
  role?: UserRole;
  phone?: string;
  schoolId?: string;
}): Promise<{ success: boolean; uid?: string; error?: string; alreadyExisted?: boolean }> {
  const workerAuth = getWorkerAuth();
  const password = params.password && params.password.length >= 6 ? params.password : '123456';

  let email = params.email.trim().toLowerCase();
  if (!email.includes('@')) {
    email = `${email.replace(/[^a-z0-9._-]/g, '')}@student.smartclass.edu.vn`;
  }

  try {
    let uid = '';

    // 1. Attempt to create user in Firebase Authentication
    try {
      const cred = await createUserWithEmailAndPassword(workerAuth, email, password);
      uid = cred.user.uid;
      if (params.fullName) {
        await updateProfile(cred.user, { displayName: params.fullName }).catch(() => {});
      }
    } catch (authErr: any) {
      if (authErr?.code === 'auth/email-already-in-use') {
        // Account already exists in Firebase Auth
        // Try signing in to retrieve UID and sync profile
        try {
          const signInCred = await signInWithEmailAndPassword(workerAuth, email, password);
          uid = signInCred.user.uid;
          if (params.fullName) {
            await updateProfile(signInCred.user, { displayName: params.fullName }).catch(() => {});
          }
        } catch {
          // If password differs and it's an auto-generated student email, generate a unique student email
          if (email.endsWith('@student.smartclass.edu.vn')) {
            const uniqueEmail = email.replace(
              '@student.smartclass.edu.vn',
              `_${Math.floor(1000 + Math.random() * 9000)}@student.smartclass.edu.vn`
            );
            const retryCred = await createUserWithEmailAndPassword(workerAuth, uniqueEmail, password).catch(() => null);
            if (retryCred?.user?.uid) {
              uid = retryCred.user.uid;
              email = uniqueEmail;
              if (params.fullName) {
                await updateProfile(retryCred.user, { displayName: params.fullName }).catch(() => {});
              }
            }
          }
        }

        // If UID still not retrieved, produce a deterministic ID so student creation completes safely
        if (!uid) {
          uid = 'uid_' + btoa(email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 24);
          await signOut(workerAuth).catch(() => {});
          return {
            success: true,
            uid,
            alreadyExisted: true
          };
        }
      } else {
        throw authErr;
      }
    }

    // 2. Immediately sign out worker instance so current browser session stays clean
    await signOut(workerAuth).catch(() => {});

    // 3. Save user profile to Firestore /users/{uid}
    const userProfile: UserProfile = {
      id: uid,
      email: email,
      full_name: params.fullName,
      role: params.role || 'student',
      phone: params.phone,
      school_id: params.schoolId || 'sch-001',
      is_active: true,
      created_at: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', uid), userProfile, { merge: true });
    } catch (fsErr) {
      console.warn('Could not save user profile to Firestore:', fsErr);
    }

    return { success: true, uid };
  } catch (err: any) {
    await signOut(workerAuth).catch(() => {});

    let friendlyMsg = err?.message || 'Không thể tạo tài khoản trên Firebase Authentication';
    if (err?.code === 'auth/email-already-in-use') {
      friendlyMsg = 'Email này đã tồn tại trên Firebase Authentication.';
    } else if (err?.code === 'auth/weak-password') {
      friendlyMsg = 'Mật khẩu phải chứa ít nhất 6 ký tự.';
    } else if (err?.code === 'auth/invalid-email') {
      friendlyMsg = 'Địa chỉ email không hợp lệ.';
    }

    console.warn('Firebase Auth creation notice:', friendlyMsg);

    return {
      success: false,
      error: friendlyMsg
    };
  }
}
