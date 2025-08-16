import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updateEmail as fbUpdateEmail,
  updatePassword as fbUpdatePassword,
  deleteUser as fbDeleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '../types';

class AuthService {
  constructor() {
    // Set up auth state listener only if auth is available
    if (auth && typeof onAuthStateChanged === 'function') {
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          // User is signed in, sync with Firestore
          await this.syncUserWithFirestore(firebaseUser);
        }
      });
    } else {
      console.warn('Firebase auth not properly initialized');
    }
  }

  // Convert Firebase user to our User type
  private async firebaseUserToUser(firebaseUser: FirebaseUser): Promise<User> {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    const userData = userDoc.data();

    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || userData?.displayName || '',
      photoURL: firebaseUser.photoURL || userData?.photoURL,
      bio: userData?.bio || '',
      role: (userData?.role as any) || 'user',
      banned: !!userData?.banned,
      stats: userData?.stats || {
        entries: 0,
        points: 0,
        followers: 0,
        following: 0,
        weeklyPoints: 0,
        monthlyPoints: 0,
      },
      createdAt: userData?.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };
  }

  // Sync Firebase user with Firestore user document
  private async syncUserWithFirestore(firebaseUser: FirebaseUser): Promise<void> {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    const baseUserData = {
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL,
      lastActive: serverTimestamp(),
      role: 'user',
      banned: false,
    };

    if (!userDoc.exists()) {
      // Create new user document
      await setDoc(userDocRef, {
        ...baseUserData,
        bio: '',
        stats: {
          entries: 0,
          points: 0,
          followers: 0,
          following: 0,
        },
        createdAt: serverTimestamp(),
      });
    } else {
      // Update existing user document
      await updateDoc(userDocRef, baseUserData);
    }
  }

  // Register with email and password
  async registerWithEmail(email: string, password: string, displayName: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update Firebase user profile
      await updateProfile(firebaseUser, { displayName });

      // Sync with Firestore
      await this.syncUserWithFirestore(firebaseUser);

      return await this.firebaseUserToUser(firebaseUser);
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  }

  // Login with email and password
  async loginWithEmail(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return await this.firebaseUserToUser(userCredential.user);
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  }

  // Login with Google
  async loginWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      const result = await signInWithPopup(auth, provider);
      return await this.firebaseUserToUser(result.user);
    } catch (error: any) {
      throw new Error(error.message || 'Google login failed');
    }
  }

  // Login with Facebook
  async loginWithFacebook(): Promise<User> {
    try {
      const provider = new FacebookAuthProvider();
      provider.addScope('email');

      const result = await signInWithPopup(auth, provider);
      return await this.firebaseUserToUser(result.user);
    } catch (error: any) {
      throw new Error(error.message || 'Facebook login failed');
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message || 'Logout failed');
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return null;

      return await this.firebaseUserToUser(firebaseUser);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!auth.currentUser;
  }

  // Get current user ID
  getCurrentUserId(): string | null {
    return auth.currentUser?.uid || null;
  }

  // Update user profile
  async updateUserProfile(updates: Partial<User>): Promise<User> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No authenticated user');

      // Update Firebase Auth profile if needed
      if (updates.displayName || updates.photoURL) {
        await updateProfile(currentUser, {
          displayName: updates.displayName || currentUser.displayName,
          photoURL: updates.photoURL || currentUser.photoURL,
        });
      }

      // Update Firestore document
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        ...updates,
        lastActive: serverTimestamp(),
      });

      return await this.firebaseUserToUser(currentUser);
    } catch (error: any) {
      throw new Error(error.message || 'Profile update failed');
    }
  }

  // Change email (requires recent authentication)
  async updateEmailAddress(newEmail: string, currentPassword: string): Promise<User> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) throw new Error('No authenticated user');

      // Reauthenticate with current email/password
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Update email in Firebase Auth
      await fbUpdateEmail(currentUser, newEmail);

      // Reflect change in Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, { email: newEmail, lastActive: serverTimestamp() });

      return await this.firebaseUserToUser(currentUser);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update email');
    }
  }

  // Change password (requires recent authentication)
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) throw new Error('No authenticated user');

      // Reauthenticate
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await fbUpdatePassword(currentUser, newPassword);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to change password');
    }
  }

  // Delete account (requires recent authentication)
  async deleteAccount(currentPassword: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) throw new Error('No authenticated user');

      // Reauthenticate before deletion
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Delete Firestore user doc
      const userDocRef = doc(db, 'users', currentUser.uid);
      try {
        await updateDoc(userDocRef, { deletedAt: serverTimestamp() });
      } catch (_) {
        // ignore if user doc doesn't exist or cannot be updated
      }

      // Delete auth user
      await fbDeleteUser(currentUser);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete account');
    }
  }

  // Set up auth state listener
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const user = await this.firebaseUserToUser(firebaseUser);
          callback(user);
        } else {
          callback(null);
        }
      } catch (error) {
        console.error('Auth state listener error:', error);
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();
