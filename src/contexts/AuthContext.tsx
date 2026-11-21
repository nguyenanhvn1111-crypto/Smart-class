import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  updateProfile as updateFirebaseProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile, UserRole } from '../types';
import { DEMO_USERS } from '../services/seedData';
import { store } from '../services/dataService';
import { auth, signInWithGoogle, logOutFirebase, db } from '../services/firebase';

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
  changeAccountRole: (role: UserRole) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  firebaseUser: FirebaseUser | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'smartclass_auth_user';
const PASSWORD_HASH_STORAGE_KEY = 'smartclass_account_pwd_hashes';

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

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
        let resolvedRole: UserRole = fbUser.email === 'nguyenanh.vn1111@gmail.com' ? 'admin' : 'teacher';
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            resolvedRole = data.role || resolvedRole;
            setUser(data);
          } else {
            const newProfile: UserProfile = {
              id: fbUser.uid,
              email: fbUser.email || '',
              full_name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Giáo viên',
              role: resolvedRole,
              avatar_url: fbUser.photoURL || undefined,
              school_id: 'sch-001',
              is_active: true,
              created_at: new Date().toISOString()
            };
            await setDoc(userDocRef, newProfile).catch(() => {});
            setUser(newProfile);
          }
        } catch {
          // Fallback if Firestore read fails offline
        }

        store.logAudit(
          'FIREBASE_LOGIN',
          'auth',
          fbUser.uid,
          `Đăng nhập Google Firebase thành công (${fbUser.email})`,
          fbUser.displayName || fbUser.email || '',
          resolvedRole
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
    const updated: UserProfile = { ...user, ...data };
    setUser(updated);
    store.logAudit('UPDATE_PROFILE', 'profiles', user.id, `Cập nhật thông tin tài khoản`, updated.full_name, updated.role);

    if (firebaseUser && firebaseUser.uid === user.id) {
      if (data.full_name) {
        await updateFirebaseProfile(firebaseUser, { displayName: data.full_name }).catch(() => {});
      }
      try {
        const userDocRef = doc(db, 'users', user.id);
        await setDoc(userDocRef, { ...updated, updated_at: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.warn('Could not sync profile update to Firestore:', err);
      }
    }
  };

  const changeAccountRole = async (newRole: UserRole) => {
    if (!user) return;
    const prevRole = user.role;
    const updated: UserProfile = { ...user, role: newRole };
    setUser(updated);
    store.logAudit(
      'CHANGE_ACCOUNT_ROLE',
      'auth',
      user.id,
      `Thay đổi vai trò tài khoản từ ${prevRole} sang ${newRole}`,
      updated.full_name,
      newRole
    );

    if (firebaseUser && firebaseUser.uid === user.id) {
      try {
        const userDocRef = doc(db, 'users', user.id);
        await setDoc(userDocRef, { role: newRole, updated_at: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.warn('Could not sync role change to Firestore:', err);
      }
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    if (!user) {
      return { success: false, error: 'Chưa có tài khoản đăng nhập.' };
    }
    if (!currentPassword.trim()) {
      return { success: false, error: 'Vui lòng nhập mật khẩu hiện tại.' };
    }
    if (newPassword.length < 6) {
      return { success: false, error: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' };
    }
    if (newPassword === currentPassword) {
      return { success: false, error: 'Mật khẩu mới phải khác mật khẩu hiện tại.' };
    }

    const hasEmailPasswordProvider =
      firebaseUser &&
      firebaseUser.email &&
      firebaseUser.providerData?.some((p) => p.providerId === 'password');

    if (hasEmailPasswordProvider && firebaseUser?.email) {
      try {
        const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
        await reauthenticateWithCredential(firebaseUser, credential);
        await updatePassword(firebaseUser, newPassword);
        store.logAudit('CHANGE_PASSWORD', 'auth', user.id, 'Đổi mật khẩu tài khoản Firebase thành công', user.full_name, user.role);
        return { success: true, message: 'Đã cập nhật mật khẩu tài khoản thành công!' };
      } catch (err: any) {
        if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
          return { success: false, error: 'Mật khẩu hiện tại không chính xác.' };
        }
        if (err?.code === 'auth/requires-recent-login') {
          return { success: false, error: 'Phiên đăng nhập đã cũ. Vui lòng đăng xuất và đăng nhập lại trước khi đổi mật khẩu.' };
        }
        if (err?.code === 'auth/weak-password') {
          return { success: false, error: 'Mật khẩu mới quá yếu. Vui lòng chọn mật khẩu mạnh hơn.' };
        }
        return { success: false, error: err?.message || 'Không thể đổi mật khẩu lúc này.' };
      }
    }

    // Local / Demo or Google-linked account app PIN/password verification using SHA-256 digest
    try {
      const accountKey = user.email.toLowerCase();
      const rawMap = localStorage.getItem(PASSWORD_HASH_STORAGE_KEY);
      const hashMap: Record<string, string> = rawMap ? JSON.parse(rawMap) : {};
      const expectedHash = hashMap[accountKey] || (await sha256Hex(`${accountKey}:password123`));
      const providedCurrentHash = await sha256Hex(`${accountKey}:${currentPassword}`);

      if (providedCurrentHash !== expectedHash) {
        return {
          success: false,
          error: 'Mật khẩu hiện tại không đúng (mặc định tài khoản mẫu là password123).'
        };
      }

      hashMap[accountKey] = await sha256Hex(`${accountKey}:${newPassword}`);
      localStorage.setItem(PASSWORD_HASH_STORAGE_KEY, JSON.stringify(hashMap));
      store.logAudit('CHANGE_PASSWORD', 'auth', user.id, 'Đổi mật khẩu tài khoản thành công', user.full_name, user.role);
      return { success: true, message: 'Đã cập nhật mật khẩu mới thành công!' };
    } catch {
      return { success: false, error: 'Không thể cập nhật mật khẩu vào lúc này.' };
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
        changeAccountRole,
        changePassword,
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

