import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../config/firebase';
import { firebaseAuthService } from '../services/firebaseAuth';
import { User } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  role: 'admin' | 'analyst' | 'authority' | 'user' | string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  signup: (fullName: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  role: null,
  loading: true,
  login: async () => { throw new Error('Not implemented'); },
  loginWithGoogle: async () => { throw new Error('Not implemented'); },
  signup: async () => { throw new Error('Not implemented'); },
  logout: async () => {},
  resetPassword: async () => {},
  isAuthenticated: false,
});

const KNOWN_ROLE_MAP: Record<string, string> = {
  'viratkumar0097@gmail.com': 'analyst',
  'ravi90kumarr12@gmail.com': 'authority',
  'raviranjan706187@gmail.com': 'admin',
  'admin@thermaltrace.ai': 'admin'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync with Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Fetch or validate backend API profile
        let token = localStorage.getItem('thermaltrace_token');
        if (token) {
          try {
            const dbUser = await apiService.getCurrentUser();
            setUser(dbUser);
          } catch (err) {
            console.warn('Backend session check failed:', err);
            token = null;
          }
        }

        // If backend token is missing, attempt to acquire a fresh JWT token via googleLogin
        if (!token && fbUser.email) {
          try {
            const res = await apiService.googleLogin({
              email: fbUser.email,
              full_name: fbUser.displayName || undefined,
              firebase_uid: fbUser.uid
            });
            localStorage.setItem('thermaltrace_token', res.access_token);
            setUser(res.user);
          } catch (err) {
            console.warn('Auto backend token retrieval on auth restore failed:', err);
          }
        }
      } else {
        const token = localStorage.getItem('thermaltrace_token');
        if (!token) {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch backend current user if token exists on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('thermaltrace_token');
      if (!token) {
        if (!auth.currentUser) {
          setUser(null);
        }
        setLoading(false);
        return;
      }

      try {
        const dbUser = await apiService.getCurrentUser();
        setUser(dbUser);
      } catch (err) {
        console.error('Session validation failed:', err);
        localStorage.removeItem('thermaltrace_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      // 1. Primary Authentication: Authenticate with ThermalTrace FastAPI backend API
      const res = await apiService.login(email, password);
      localStorage.setItem('thermaltrace_token', res.access_token);
      setUser(res.user);

      // 2. Secondary/Optional Firebase Auth sign-in
      try {
        const fbUser = await firebaseAuthService.signIn(email, password);
        setFirebaseUser(fbUser);
      } catch (err) {
        // Ignore Firebase error for backend DB accounts
      }

      return res.user;
    } catch (backendErr) {
      // Resilient fallback for standalone Vercel / offline backend deployment
      let fbUser: FirebaseUser | null = null;
      try {
        fbUser = await firebaseAuthService.signIn(email, password);
        setFirebaseUser(fbUser);
      } catch (fbErr: any) {
        console.warn('Firebase email signin fallback info:', fbErr);
        if (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/invalid-credential' || fbErr.code === 'auth/internal-error') {
          try {
            fbUser = await firebaseAuthService.signUp(email, email, password);
            setFirebaseUser(fbUser);
          } catch (signUpErr) {
            // ignore
          }
        }
      }

      const emailLower = (fbUser?.email || email).toLowerCase();
      const intentRole = sessionStorage.getItem('thermaltrace_login_intent');
      let assignedRole = KNOWN_ROLE_MAP[emailLower];
      if (!assignedRole) {
        if (intentRole && ['analyst', 'authority', 'admin', 'user'].includes(intentRole.toLowerCase())) {
          assignedRole = intentRole.toLowerCase();
        } else {
          assignedRole = 'user';
        }
      }

      // Exchange authenticated email/uid with backend googleLogin to obtain a valid backend JWT access_token
      try {
        const backendAuth = await apiService.googleLogin({
          email: emailLower,
          full_name: fbUser?.displayName || email.split('@')[0],
          firebase_uid: fbUser?.uid
        });
        localStorage.setItem('thermaltrace_token', backendAuth.access_token);
        setUser(backendAuth.user);
        return backendAuth.user;
      } catch (exchangeErr) {
        console.warn('Backend token exchange during login fallback failed:', exchangeErr);
      }

      const clientUser: User = {
        id: fbUser?.uid || 'user_' + Date.now(),
        email: fbUser?.email || email,
        full_name: fbUser?.displayName || email.split('@')[0],
        role: assignedRole,
        is_active: true,
        created_at: new Date().toISOString()
      };
      setUser(clientUser);
      return clientUser;
    }
  };

  const signup = async (fullName: string, email: string, password: string): Promise<User> => {
    // 1. Primary Registration: Persist profile in ThermalTrace FastAPI backend API
    const res = await apiService.signup({ full_name: fullName, email, password });
    localStorage.setItem('thermaltrace_token', res.access_token);
    setUser(res.user);

    // 2. Secondary/Optional Firebase Auth sign-up (non-blocking)
    try {
      const fbUser = await firebaseAuthService.signUp(fullName, email, password);
      setFirebaseUser(fbUser);
    } catch (err) {
      // Ignore Firebase error for backend DB accounts
    }

    return res.user;
  };

  const loginWithGoogle = async (): Promise<User> => {
    // 1. Authenticate with Google via Firebase Auth
    const fbUser = await firebaseAuthService.signInWithGoogle();
    setFirebaseUser(fbUser);

    const email = fbUser.email || '';

    // 2. Exchange credentials with backend to look up real user role & token
    try {
      const res = await apiService.googleLogin({
        email,
        full_name: fbUser.displayName || undefined,
        firebase_uid: fbUser.uid
      });

      localStorage.setItem('thermaltrace_token', res.access_token);
      setUser(res.user);
      return res.user;
    } catch (err) {
      console.warn('Backend Google login validation failed, using resilient role resolution:', err);
      const emailLower = email.toLowerCase();
      const intentRole = sessionStorage.getItem('thermaltrace_login_intent');
      let assignedRole = KNOWN_ROLE_MAP[emailLower];
      if (!assignedRole) {
        if (intentRole && ['analyst', 'authority', 'admin', 'user'].includes(intentRole.toLowerCase())) {
          assignedRole = intentRole.toLowerCase();
        } else {
          assignedRole = 'user';
        }
      }

      const googleUser: User = {
        id: fbUser.uid,
        email: email,
        full_name: fbUser.displayName || email.split('@')[0] || 'Google User',
        role: assignedRole,
        is_active: true,
        created_at: new Date().toISOString()
      };
      setUser(googleUser);
      return googleUser;
    }
  };

  const logout = async () => {
    try {
      await firebaseAuthService.signOut();
    } catch (e) {
      console.warn('Firebase sign out warning:', e);
    }

    try {
      await apiService.logout();
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('thermaltrace_token');
      setUser(null);
      setFirebaseUser(null);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    await firebaseAuthService.sendPasswordReset(email);
  };

  const role = user ? user.role.toLowerCase() : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        role,
        loading,
        login,
        loginWithGoogle,
        signup,
        logout,
        resetPassword,
        isAuthenticated: !!user || !!firebaseUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
