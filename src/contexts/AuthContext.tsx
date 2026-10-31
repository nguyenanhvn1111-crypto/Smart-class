import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  updateProfile as updateFirebaseProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile, UserRole } from '../types';
import { DEMO_USERS } from '../services/seedData';
import { store } from '../services/dataService';
import { auth, signInWithGoogle, logOutFirebase, db, handleFirestoreError, OperationType } from '../services/firebase';

export interface RegisterParams {
  email: string;
  password?: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  school_id?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  register: (params: RegisterParams) => Promise<{ success: boolean; error?: string }>;
  switchRole: (role: UserRole) => void;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  firebaseUser: FirebaseUser | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'smartclass_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default to Teacher for rich interactive testing
    return DEMO_USERS[1]; // Cô Trần Thị Mai (Teacher)
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          // Verify if token can be refreshed without token-service API error
          try {
            await fbUser.getIdToken(false);
          } catch (tokenErr: any) {
            if (
              tokenErr?.message?.includes('token-service-api') ||
              tokenErr?.code?.includes('token-service-api') ||
              tokenErr?.message?.includes('securetoken.googleapis.com')
            ) {
              console.warn('Firebase token service is unavailable for current project. Session cleared.');
              await logOutFirebase().catch(() => {});
              return;
            }
          }

          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setUser(data);
          } else {
            // Determine role: nguyenanh.vn1111@gmail.com defaults to admin, otherwise teacher
            const userRole: UserRole = fbUser.email === 'nguyenanh.vn1111@gmail.com' ? 'admin' : 'teacher';
            const newProfile: UserProfile = {
              id: fbUser.uid,
              email: fbUser.email || '',
              full_name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Giáo viên',
              role: userRole,
              avatar_url: fbUser.photoURL || undefined,
              school_id: 'sch-001',
              is_active: true,
              created_at: new Date().toISOString()
            };
            await setDoc(userDocRef, newProfile);
            setUser(newProfile);
          }
        } catch (err) {
          console.warn('Could not sync user profile with Firestore, using fallback state:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const loginWithGoogle = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const fbUser = await signInWithGoogle();
      if (fbUser) {
        store.logAudit(
          'FIREBASE_LOGIN',
          'auth',
          fbUser.uid,
          `Đăng nhập Google Firebase thành công (${fbUser.email})`,
          fbUser.displayName || fbUser.email || '',
          'teacher'
        );
        setIsLoading(false);
        return true;
      }
      setIsLoading(false);
      return false;
    } catch (err) {
      console.error('Login with Google error:', err);
      setIsLoading(false);
      return false;
    }
  };

  const login = async (email: string, requestedRole?: UserRole): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Find matching demo user or role
      let matched = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!matched && requestedRole) {
        matched = DEMO_USERS.find((u) => u.role === requestedRole);
      }
      if (!matched) {
        // Fallback default
        matched = {
          id: 'usr-' + Date.now(),
          email,
          full_name: email.split('@')[0],
          role: requestedRole || 'teacher',
          school_id: 'sch-001',
          is_active: true,
          created_at: new Date().toISOString()
        };
      }
      setUser(matched);
      store.logAudit('USER_LOGIN', 'auth', matched.id, `Đăng nhập thành công với vai trò ${matched.role}`, matched.full_name, matched.role);
      setIsLoading(false);
      return true;
    } catch (err) {
      setIsLoading(false);
      return false;
    }
  };

  const switchRole = (newRole: UserRole) => {
    const targetUser = DEMO_USERS.find((u) => u.role === newRole) || {
      ...DEMO_USERS[0],
      role: newRole,
      full_name: `Tài khoản ${newRole.toUpperCase()}`
    };
    setUser(targetUser);
    store.logAudit('SWITCH_ROLE', 'auth', targetUser.id, `Chuyển quyền sang vai trò ${newRole}`, targetUser.full_name, newRole);
  };

  const logout = async () => {
    if (user) {
      store.logAudit('USER_LOGOUT', 'auth', user.id, `Đăng xuất khỏi hệ thống`, user.full_name, user.role);
    }
    try {
      await logOutFirebase();
    } catch {}
    setUser(null);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    store.logAudit('UPDATE_PROFILE', 'profiles', user.id, `Cập nhật thông tin tài khoản`, user.full_name, user.role);

    // Sync to Firestore if user has a valid ID and logged in
    if (firebaseUser && firebaseUser.uid === user.id) {
      try {
        const userDocRef = doc(db, 'users', user.id);
        await setDoc(userDocRef, { ...updated, updated_at: new Date().toISOString() }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.id}`);
      }
    }
  };

  const register = async (params: RegisterParams): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const cleanEmail = params.email.trim().toLowerCase();
      const password = params.password && params.password.length >= 6 ? params.password : '123456';

      let uid = '';
      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        uid = cred.user.uid;
        if (params.full_name) {
          await updateFirebaseProfile(cred.user, { displayName: params.full_name }).catch(() => {});
        }
      } catch (fbErr: any) {
        console.error('Firebase createUser error:', fbErr);
        let friendly = fbErr?.message || 'Không thể tạo tài khoản trên Firebase Authentication';
        if (fbErr?.code === 'auth/email-already-in-use') {
          friendly = 'Địa chỉ email này đã được sử dụng trên Firebase Authentication.';
        } else if (fbErr?.code === 'auth/invalid-email') {
          friendly = 'Địa chỉ email không đúng định dạng.';
        } else if (fbErr?.code === 'auth/weak-password') {
          friendly = 'Mật khẩu phải có độ dài từ 6 ký tự trở lên.';
        }
        setIsLoading(false);
        return { success: false, error: friendly };
      }

      const newProfile: UserProfile = {
        id: uid,
        email: cleanEmail,
        full_name: params.full_name,
        role: params.role || 'teacher',
        phone: params.phone,
        school_id: params.school_id || 'sch-001',
        is_active: true,
        created_at: new Date().toISOString()
      };

      // Save user to Firestore users collection
      try {
        const userDocRef = doc(db, 'users', uid);
        await setDoc(userDocRef, newProfile);
      } catch (err) {
        console.warn('Could not write user to Firestore:', err);
      }

      setUser(newProfile);
      store.logAudit(
        'USER_REGISTER',
        'auth',
        newProfile.id,
        `Đăng ký tài khoản mới thành công trên Firebase Auth (${newProfile.email} - vai trò: ${newProfile.role})`,
        newProfile.full_name,
        newProfile.role
      );
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err?.message || 'Đăng ký thất bại, vui lòng thử lại.' };
    }
  };

  const role: UserRole = user?.role || 'teacher';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        register,
        switchRole,
        logout,
        updateProfile,
        firebaseUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

