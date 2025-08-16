import { auth, db } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { User } from '../types';

/**
 * Service for managing the AI bot user that will create automated content
 */
class BotService {
  private botUser: User | null = null;
  private readonly BOT_EMAIL = 'aibot@humanbaze.com';
  private readonly BOT_PASSWORD = 'AI_BOT_SECURE_PASSWORD_2024!';
  private readonly BOT_DISPLAY_NAME = 'AI Content Bot';

  /**
   * Initialize or get the bot user
   */
  async initializeBotUser(): Promise<User> {
    console.log('🤖 Starting bot user initialization...');
    
    if (!auth || !db) {
      console.error('❌ Firebase services not available:', { auth: !!auth, db: !!db });
      throw new Error('Firebase services not properly initialized');
    }
    
    console.log('✅ Firebase services available:', { auth: !!auth, db: !!db });
    
    // If bot user is already cached, return it
    if (this.botUser) {
      console.log('✅ Bot user already cached:', this.botUser.id);
      return this.botUser;
    }
    
    try {
      console.log('🔍 Checking if bot user exists in database...');
      
      // Check if we have stored the bot user ID in localStorage (browser only)
      let botUserId: string | null = null;
      try {
        if (typeof localStorage !== 'undefined') {
          botUserId = localStorage.getItem('ai_bot_user_id');
        }
      } catch {}
      
      if (botUserId) {
        console.log('💾 Found cached bot user ID:', botUserId);
        
        // Try to get bot user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', botUserId));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          this.botUser = {
            id: botUserId,
            email: userData.email || this.BOT_EMAIL,
            displayName: userData.displayName || this.BOT_DISPLAY_NAME,
            bio: userData.bio || 'AI-powered content creator focused on the latest AI developments',
            photoURL: userData.photoURL || '',
            role: userData.role || 'bot',
            banned: false,
            stats: userData.stats || {
              entries: 0,
              points: 0,
              followers: 0,
              following: 0,
              weeklyPoints: 0,
              monthlyPoints: 0,
            },
            createdAt: userData.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
            lastActive: new Date().toISOString(),
          };
          
          console.log('✅ Bot user data loaded from cache:', this.botUser.id);
          return this.botUser;
        } else {
          console.log('⚠️ Cached bot user not found in Firestore, clearing cache');
          try { if (typeof localStorage !== 'undefined') { localStorage.removeItem('ai_bot_user_id'); } } catch {}
        }
      }
      
      // Bot user doesn't exist, create it
      // Try to sign in with known bot credentials in case the Auth user exists already
      try {
        console.log('🔑 Attempting to sign in existing bot user...');
        const cred = await signInWithEmailAndPassword(auth, this.BOT_EMAIL, this.BOT_PASSWORD);
        const firebaseUser = cred.user;
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (!userDoc.exists()) {
          console.log('🧾 Bot user Firestore doc missing, creating...');
          const botUserData = {
            email: this.BOT_EMAIL,
            displayName: this.BOT_DISPLAY_NAME,
            bio: 'AI-powered content creator focused on the latest AI developments and technology trends',
            photoURL: '',
            role: 'bot',
            banned: false,
            stats: {
              entries: 0,
              points: 0,
              followers: 0,
              following: 0,
              weeklyPoints: 0,
              monthlyPoints: 0,
            },
            createdAt: serverTimestamp(),
            lastActive: serverTimestamp(),
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), botUserData);
        }
        const fresh = await getDoc(doc(db, 'users', firebaseUser.uid));
        const data: any = fresh.data();
        this.botUser = {
          id: firebaseUser.uid,
          email: data?.email || this.BOT_EMAIL,
          displayName: data?.displayName || this.BOT_DISPLAY_NAME,
          bio: data?.bio || 'AI-powered content creator focused on the latest AI developments',
          photoURL: data?.photoURL || '',
          role: data?.role || 'bot',
          banned: false,
          stats: data?.stats || {
            entries: 0,
            points: 0,
            followers: 0,
            following: 0,
            weeklyPoints: 0,
            monthlyPoints: 0,
          },
          createdAt: data?.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          lastActive: new Date().toISOString(),
        };
        try { if (typeof localStorage !== 'undefined') localStorage.setItem('ai_bot_user_id', this.botUser.id); } catch {}
        console.log('✅ Bot user signed in and ready:', this.botUser.id);
        return this.botUser;
      } catch (signInErr) {
        console.log('👤 Bot user not found, creating new bot user...');
        return await this.createBotUserWithoutSignIn();
      }
      
    } catch (error: any) {
      console.error('❌ Unexpected error during bot initialization:', error);
      throw new Error(`Bot initialization failed: ${error.message}`);
    }
  }

  /**
   * Create a new bot user without signing in (preserves current session)
   */
  private async createBotUserWithoutSignIn(): Promise<User> {
    // Store current user to restore later
    const currentUser = auth.currentUser;
    console.log('💾 Storing current user for restoration:', currentUser?.uid);
    
    try {
      console.log('🏗️ Creating new bot user...');
      
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        this.BOT_EMAIL, 
        this.BOT_PASSWORD
      );
      const firebaseUser = userCredential.user;
      console.log('✅ Firebase Auth user created:', firebaseUser.uid);

      // Create Firestore user document
      const botUserData = {
        email: this.BOT_EMAIL,
        displayName: this.BOT_DISPLAY_NAME,
        bio: 'AI-powered content creator focused on the latest AI developments and technology trends',
        photoURL: '',
        role: 'bot',
        banned: false,
        stats: {
          entries: 0,
          points: 0,
          followers: 0,
          following: 0,
          weeklyPoints: 0,
          monthlyPoints: 0,
        },
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), botUserData);
      console.log('✅ Firestore user document created');

      this.botUser = {
        id: firebaseUser.uid,
        email: this.BOT_EMAIL,
        displayName: this.BOT_DISPLAY_NAME,
        bio: botUserData.bio,
        photoURL: '',
        role: 'bot',
        banned: false,
        stats: botUserData.stats,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };

      console.log('Bot user created successfully:', this.botUser.id);
      
      // Store bot user ID in localStorage for future use (browser only)
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('ai_bot_user_id', this.botUser.id);
          console.log('💾 Cached bot user ID for future use');
        }
      } catch {}
      
      // Sign out of bot user
      await signOut(auth);
      console.log('🔄 Signed out of bot user');
      
      // Restore original user session if there was one
      if (currentUser) {
        console.log('🔄 Note: Original user session should be restored automatically');
        // Firebase should automatically restore the previous session
      }
      
      return this.botUser;
    } catch (error: any) {
      console.error('Failed to create bot user:', error);
      if (error?.code === 'auth/email-already-in-use') {
        // Sign in and proceed (user exists in Auth)
        const cred = await signInWithEmailAndPassword(auth, this.BOT_EMAIL, this.BOT_PASSWORD);
        const firebaseUser = cred.user;
        let fresh = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (!fresh.exists()) {
          const botUserData = {
            email: this.BOT_EMAIL,
            displayName: this.BOT_DISPLAY_NAME,
            bio: 'AI-powered content creator focused on the latest AI developments and technology trends',
            photoURL: '',
            role: 'bot',
            banned: false,
            stats: {
              entries: 0,
              points: 0,
              followers: 0,
              following: 0,
              weeklyPoints: 0,
              monthlyPoints: 0,
            },
            createdAt: serverTimestamp(),
            lastActive: serverTimestamp(),
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), botUserData);
          fresh = await getDoc(doc(db, 'users', firebaseUser.uid));
        }
        const data: any = fresh.data();
        this.botUser = {
          id: firebaseUser.uid,
          email: data?.email || this.BOT_EMAIL,
          displayName: data?.displayName || this.BOT_DISPLAY_NAME,
          bio: data?.bio || 'AI-powered content creator focused on the latest AI developments',
          photoURL: data?.photoURL || '',
          role: data?.role || 'bot',
          banned: false,
          stats: data?.stats || {
            entries: 0,
            points: 0,
            followers: 0,
            following: 0,
            weeklyPoints: 0,
            monthlyPoints: 0,
          },
          createdAt: data?.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          lastActive: new Date().toISOString(),
        };
        try { if (typeof localStorage !== 'undefined') localStorage.setItem('ai_bot_user_id', this.botUser.id); } catch {}
        return this.botUser;
      }
      throw new Error(`Failed to create bot user: ${error.message}`);
    }
  }

  /**
   * Create a new bot user (legacy method - signs in as bot)
   */
  private async createBotUser(): Promise<User> {
    try {
      console.log('🏗️ Creating new bot user...');
      
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        this.BOT_EMAIL, 
        this.BOT_PASSWORD
      );
      const firebaseUser = userCredential.user;
      console.log('✅ Firebase Auth user created:', firebaseUser.uid);

      // Create Firestore user document
      const botUserData = {
        email: this.BOT_EMAIL,
        displayName: this.BOT_DISPLAY_NAME,
        bio: 'AI-powered content creator focused on the latest AI developments and technology trends',
        photoURL: '',
        role: 'bot',
        banned: false,
        stats: {
          entries: 0,
          points: 0,
          followers: 0,
          following: 0,
          weeklyPoints: 0,
          monthlyPoints: 0,
        },
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), botUserData);
      console.log('✅ Firestore user document created');

      this.botUser = {
        id: firebaseUser.uid,
        email: this.BOT_EMAIL,
        displayName: this.BOT_DISPLAY_NAME,
        bio: botUserData.bio,
        photoURL: '',
        role: 'bot',
        banned: false,
        stats: botUserData.stats,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };

      console.log('Bot user created successfully:', this.botUser.id);
      return this.botUser;
    } catch (error: any) {
      console.error('Failed to create bot user:', error);
      throw new Error(`Failed to create bot user: ${error.message}`);
    }
  }

  /**
   * Get the current bot user (must call initializeBotUser first)
   */
  getBotUser(): User | null {
    return this.botUser;
  }

  /**
   * Sign in as bot user for automated operations
   */
  async signInAsBot(): Promise<void> {
    try {
      await signInWithEmailAndPassword(auth, this.BOT_EMAIL, this.BOT_PASSWORD);
      console.log('Signed in as bot user for automated operations');
    } catch (error: any) {
      console.error('Failed to sign in as bot:', error);
      throw new Error(`Failed to sign in as bot: ${error.message}`);
    }
  }

  /**
   * Check if current user is the bot
   */
  isCurrentUserBot(): boolean {
    return this.botUser !== null && auth.currentUser?.uid === this.botUser.id;
  }
}

export const botService = new BotService();
