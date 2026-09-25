import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail as fbSendReset,
  updateProfile,
  updatePassword as fbUpdatePassword,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../config/firebase';

const googleProvider = new GoogleAuthProvider();

export const firebaseAuthService = {
  // Google Sign In via Firebase Auth
  async signInWithGoogle(): Promise<FirebaseUser> {
    const credential = await signInWithPopup(auth, googleProvider);
    return credential.user;
  },

  // Sign In with Email & Password
  async signIn(email: string, password: string): Promise<FirebaseUser> {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  },

  // Sign Up with Email & Password
  async signUp(fullName: string, email: string, password: string): Promise<FirebaseUser> {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (fullName && credential.user) {
      await updateProfile(credential.user, { displayName: fullName });
    }
    return credential.user;
  },

  // Sign Out
  async signOut(): Promise<void> {
    await fbSignOut(auth);
  },

  // Send Password Reset Email
  async sendPasswordReset(email: string): Promise<void> {
    await fbSendReset(auth, email);
  },

  // Update Password for currently logged-in user
  async updatePassword(newPassword: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No active Firebase user found.");
    }
    await fbUpdatePassword(currentUser, newPassword);
  }
};
