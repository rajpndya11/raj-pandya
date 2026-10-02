import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { safeStorage } from './storageService';

const AUTH_KEY = 'rp_admin_auth';
const PASSCODE_KEY = 'rp_admin_passcode';
const DEFAULT_PASSCODE = 'raj1131';

// Primary authorized bootstrap admin emails
export const BOOTSTRAP_ADMIN_EMAILS = [
  'rajpandya1131@gmail.com',
  'gpl.raj@firsteconomy.com'
];
export const BOOTSTRAP_ADMIN_EMAIL = 'Rajpandya1131@gmail.com';

// In-memory authentication state
let inMemoryAuth = false;
let currentAuthUser: User | null = null;

export interface AuthState {
  user: User | null;
  isAuthorized: boolean;
  loading: boolean;
  error?: string | null;
}

export const authService = {
  getPasscode(): string {
    return safeStorage.getItem(PASSCODE_KEY) || DEFAULT_PASSCODE;
  },

  setPasscode(newPasscode: string): boolean {
    if (!newPasscode || newPasscode.trim().length < 4) {
      return false;
    }
    safeStorage.setItem(PASSCODE_KEY, newPasscode.trim());
    return true;
  },

  getCurrentUser(): User | null {
    return currentAuthUser || auth.currentUser;
  },

  async isEmailAuthorized(user: User): Promise<boolean> {
    if (!user || !user.email) return false;
    const email = user.email.toLowerCase();

    // 1. Direct match with authorized bootstrap admins
    if (BOOTSTRAP_ADMIN_EMAILS.includes(email)) {
      // Auto-bootstrap their admin record in Firestore
      try {
        if (db) {
          const adminRef = doc(db, 'admins', user.uid);
          await setDoc(adminRef, {
            email: user.email,
            role: 'owner_admin',
            lastLogin: new Date().toISOString()
          }, { merge: true });
        }
      } catch (err) {
        console.warn('Admin record sync notice:', err);
      }
      return true;
    }

    // 2. Check Firestore /admins/{uid} registry
    try {
      if (db) {
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (adminDoc.exists()) {
          return true;
        }
      }
    } catch (err) {
      console.warn('Error verifying admin authorization:', err);
    }

    return false;
  },

  async loginWithGoogle(): Promise<{ user: User; authorized: boolean }> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const authorized = await this.isEmailAuthorized(user);

      if (!authorized) {
        await signOut(auth);
        inMemoryAuth = false;
        throw new Error(
          `Access Denied: "${user.email}" is not on the authorized administrators list. Only authorized owners (${BOOTSTRAP_ADMIN_EMAIL}) are permitted.`
        );
      }

      inMemoryAuth = true;
      currentAuthUser = user;
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.setItem(AUTH_KEY, 'true');
        }
      } catch {
        // Ignore
      }

      return { user, authorized: true };
    } catch (error: any) {
      inMemoryAuth = false;
      throw error;
    }
  },

  loginWithPasscode(passcode: string): boolean {
    const currentPasscode = this.getPasscode();
    if (passcode.trim() === currentPasscode) {
      inMemoryAuth = true;
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.setItem(AUTH_KEY, 'true');
        }
      } catch {
        // Ignore
      }
      return true;
    }
    return false;
  },

  async logout(): Promise<void> {
    inMemoryAuth = false;
    currentAuthUser = null;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(AUTH_KEY);
      }
    } catch {
      // Ignore
    }
    try {
      await signOut(auth);
    } catch {
      // Ignore
    }
  },

  isAuthenticated(): boolean {
    if (inMemoryAuth) return true;
    if (auth.currentUser && auth.currentUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
      return true;
    }
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage.getItem(AUTH_KEY) === 'true';
      }
    } catch {
      // Ignore
    }
    return false;
  },

  onAuthStateSubscription(callback: (state: AuthState) => void): () => void {
    return onAuthStateChanged(auth, async (user) => {
      currentAuthUser = user;
      if (user) {
        const authorized = await this.isEmailAuthorized(user);
        if (authorized) {
          inMemoryAuth = true;
          try {
            if (typeof window !== 'undefined' && window.sessionStorage) {
              window.sessionStorage.setItem(AUTH_KEY, 'true');
            }
          } catch {
            // Ignore
          }
          callback({ user, isAuthorized: true, loading: false });
        } else {
          inMemoryAuth = false;
          callback({ 
            user, 
            isAuthorized: false, 
            loading: false, 
            error: `Account ${user.email} is not authorized for CMS admin access.` 
          });
        }
      } else {
        const hasSession = this.isAuthenticated();
        callback({ user: null, isAuthorized: hasSession, loading: false });
      }
    });
  }
};
