import { collection, doc, getDoc, getDocs, updateDoc, deleteDoc, query, where, serverTimestamp, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { User, Article, Entry } from '../types';

class AdminService {
  async getDashboardCounts(): Promise<{ totalArticles: number; totalEntries: number; totalUsers: number; totalReports: number; }>{
    const articles = await getDocs(collection(db, 'articles'));
    const entries = await getDocs(collection(db, 'entries'));
    const users = await getDocs(collection(db, 'users'));
    const reports = await getDocs(collection(db, 'reports'));
    return {
      totalArticles: articles.size,
      totalEntries: entries.size,
      totalUsers: users.size,
      totalReports: reports.size,
    };
  }

  async listPendingReports(): Promise<any[]> {
    const q = query(collection(db, 'reports'), where('status', '==', 'pending'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async resolveReport(reportId: string, action: 'delete_entry' | 'delete_article' | 'skip'): Promise<void> {
    const reportRef = doc(db, 'reports', reportId);
    const reportDoc = await getDoc(reportRef);
    if (!reportDoc.exists()) return;
    const report = reportDoc.data() as any;

    if (action === 'delete_entry' && report.entryId) {
      await deleteDoc(doc(db, 'entries', report.entryId));
    }
    if (action === 'delete_article' && report.articleId) {
      await this.deleteArticleAndEntries(report.articleId);
    }

    await updateDoc(reportRef, { status: 'resolved', resolvedAt: serverTimestamp() });
  }

  async banUserByUsername(username: string): Promise<boolean> {
    const q = query(collection(db, 'users'), where('displayName', '==', username));
    const snap = await getDocs(q);
    if (snap.empty) return false;
    await Promise.all(snap.docs.map(d => updateDoc(d.ref, { banned: true })));
    return true;
  }

  async unbanUserByUsername(username: string): Promise<boolean> {
    const q = query(collection(db, 'users'), where('displayName', '==', username));
    const snap = await getDocs(q);
    if (snap.empty) return false;
    await Promise.all(snap.docs.map(d => updateDoc(d.ref, { banned: false })));
    return true;
  }

  async resetWeeklyPoints(): Promise<void> {
    const usersSnap = await getDocs(collection(db, 'users'));
    await Promise.all(usersSnap.docs.map(d => updateDoc(d.ref, { 'stats.weeklyPoints': 0 })));
  }

  async resetMonthlyPoints(): Promise<void> {
    const usersSnap = await getDocs(collection(db, 'users'));
    await Promise.all(usersSnap.docs.map(d => updateDoc(d.ref, { 'stats.monthlyPoints': 0 })));
  }

  async getEntryById(entryId: string): Promise<any | null> {
    const ref = doc(db, 'entries', entryId);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  }

  async updateEntryContent(entryId: string, content: string): Promise<void> {
    const ref = doc(db, 'entries', entryId);
    await updateDoc(ref, { content, updatedAt: serverTimestamp() });
  }

  async getArticleById(articleId: string): Promise<any | null> {
    const ref = doc(db, 'articles', articleId);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  }

  async updateArticleTitle(articleId: string, newTitle: string): Promise<void> {
    const ref = doc(db, 'articles', articleId);
    await updateDoc(ref, { title: newTitle, slug: this.createSlug(newTitle), lastUpdated: serverTimestamp() });
  }

  async deleteArticleAndEntries(articleId: string): Promise<{ deletedEntries: number }> {
    // Delete all entries for this article, then the article itself
    const entriesQ = query(collection(db, 'entries'), where('articleId', '==', articleId));
    const entriesSnap = await getDocs(entriesQ);
    await Promise.all(entriesSnap.docs.map(d => deleteDoc(d.ref)));
    await deleteDoc(doc(db, 'articles', articleId));
    return { deletedEntries: entriesSnap.size };
  }

  async getAllUsers(): Promise<User[]> {
    const usersSnap = await getDocs(collection(db, 'users'));
    return usersSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        lastActive: data.lastActive?.toDate()?.toISOString() || new Date().toISOString(),
      } as User;
    });
  }

  async getImportUsers(): Promise<User[]> {
    try {
      console.log('🔍 Querying import users...');
      const q = query(collection(db, 'users'), where('role', '==', 'import_bot'));
      const usersSnap = await getDocs(q);
      console.log(`📊 Found ${usersSnap.docs.length} import users in database`);
      
      return usersSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          lastActive: data.lastActive?.toDate()?.toISOString() || new Date().toISOString(),
        } as User;
      });
    } catch (error: any) {
      console.error('❌ Error fetching import users:', error);
      throw new Error(`Failed to fetch import users: ${error.message}`);
    }
  }

  private generateFakeUserData(): Array<Omit<User, 'id'>> {
    // First 50 users - Real names with bios
    const predefinedNames = [
      'Lauren Thompson', 'Arjun Singh', 'Michelle Li', 'Tanvi Das', 'Haruki Nakamura',
      'Carlos Garcia', 'Neha Mehta', 'Brian Wilson', 'Ankit Patel', 'Emily Chen',
      'Lucia Lopez', 'Patrick O\'Connor', 'Imran Hussain', 'Alice Xu', 'Amir Khan',
      'Megan Scott', 'Vivian Wu', 'Aishwarya Iyer', 'Andrew Hughes', 'Raymond Zhou',
      'David Yang', 'Jessica Robinson', 'Priya Sharma', 'Kevin Lin', 'Sofia Rodriguez',
      'Hannah Lee', 'Vikram Varma', 'Sanjana Desai', 'Layla Haddad', 'Thomas Bennett',
      'Rohan Gupta', 'Farhan Choudhury', 'Sean Murphy', 'Minji Park', 'Thuy Nguyen',
      'Suman Bhattacharya', 'Eric Zhang', 'Diego Martinez', 'Angela Huang', 'Samina Ahmed',
      'Kiran Rao', 'Yuki Sato', 'Matthew Anderson', 'Lucia Lopez', 'Jason Wang',
      'Kavya Reddy', 'Daniel Johnson', 'Jaeho Kim', 'Olivia Clark', 'Alejandro Hernandez'
    ];

    // Next 50 users - Creative usernames without bios
    const creativeUsernames = [
      'CoffeeAndWiFi', 'TechNomad', 'PixelPenguin', 'LateNightTweets', 'BookishVibes',
      'SarcasmOverflow', 'UrbanFox', 'LostInTabs', 'DailyBanter', 'SkylineDreamer',
      'MemeLord2000', 'CodeAndChill', 'NotAnInfluencer', 'MidnightSnackClub', 'DramaFreeZone',
      'CloudWalker', 'GIFWizard', 'SleepyOtter', 'DigitalWanderer', 'InboxZeroHero',
      'TeaOverCoffee', 'RetroPixelKid', 'LaughTrackOnly', 'KeyboardWarrior', 'TweetingInPajamas',
      'LowBatteryMode', 'CtrlAltDefeat', 'TypoQueen', 'IceCreamPolitely', 'NomadicThoughts',
      'MoodRingEnergy', 'WiFiHermit', 'DeepFriedOpinions', 'BreadAndSarcasm', 'QuantumPotato',
      'EmojiEnthusiast', 'MondayBluesForever', 'OverthinkingExpert', 'SunsetsAndScripts', 'SassyAndClassy',
      'ThePunDepartment', 'CloudedCoffee', 'SleepIsOptional', 'TheLastTabOpen', 'PixelDaydreams',
      'PunsAndGiggles', 'SoftPretzelVibes', 'MildlyAmused', 'InboxPanic', 'BurritoLogic'
    ];

    const allUsers: Array<Omit<User, 'id'>> = [];

    // Create real name users (first 50)
    predefinedNames.forEach((fullName, index) => {
      const username = fullName.toLowerCase()
        .replace(/'/g, '') // Remove apostrophes
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/[^a-z0-9_]/g, ''); // Remove any other special characters
      
      allUsers.push({
        email: `${username}@importbot.local`,
        displayName: fullName,
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        bio: `Automated content contributor - ${fullName}`,
        role: 'import_bot' as 'user' | 'admin' | 'import_bot',
        banned: false,
        stats: {
          entries: 0,
          points: 0,
          followers: 0,
          following: 0,
          weeklyPoints: 0,
          monthlyPoints: 0,
        },
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      });
    });

    // Create creative username users (next 50)
    creativeUsernames.forEach((username, index) => {
      const emailUsername = username.toLowerCase();
      
      allUsers.push({
        email: `${emailUsername}@importbot.local`,
        displayName: username,
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${emailUsername}`,
        bio: '', // Empty bio as requested
        role: 'import_bot' as 'user' | 'admin' | 'import_bot',
        banned: false,
        stats: {
          entries: 0,
          points: 0,
          followers: 0,
          following: 0,
          weeklyPoints: 0,
          monthlyPoints: 0,
        },
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      });
    });

    return allUsers;
  }

  async createImportUsers(): Promise<{ created: number; existing: number }> {
    try {
      // Check if import users already exist
      const existingImportUsers = await this.getImportUsers();
      
      if (existingImportUsers.length >= 100) {
        return { created: 0, existing: existingImportUsers.length };
      }

      const fakeUsers = this.generateFakeUserData();
      const usersToCreate = fakeUsers.slice(existingImportUsers.length);
      
      // Create users in batches to avoid overwhelming Firestore
      const batchSize = 10;
      let created = 0;
      
      for (let i = 0; i < usersToCreate.length; i += batchSize) {
        const batch = usersToCreate.slice(i, i + batchSize);
        await Promise.all(
          batch.map(userData => 
            addDoc(collection(db, 'users'), {
              ...userData,
              createdAt: serverTimestamp(),
              lastActive: serverTimestamp(),
            })
          )
        );
        created += batch.length;
      }

      return { created, existing: existingImportUsers.length };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create import users');
    }
  }

  private getRandomTimestamp(startDate: Date, endDate: Date): Timestamp {
    const start = startDate.getTime();
    const end = endDate.getTime();
    const randomTime = start + Math.random() * (end - start);
    return Timestamp.fromDate(new Date(randomTime));
  }

  private getRandomUser(users: User[]): string {
    return users[Math.floor(Math.random() * users.length)].id;
  }

  private createSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async importJsonData(
    jsonData: { titles: Array<{ title: string; description?: string; category?: string; entries: Array<{ content: string; type?: 'text' | 'image' | 'video' }> }> },
    startDate: Date,
    endDate: Date
  ): Promise<{ articlesCreated: number; entriesCreated: number }> {
    try {
      console.log('🚀 Starting import process...');
      console.log('📊 Data to import:', { 
        titlesCount: jsonData.titles.length, 
        totalEntries: jsonData.titles.reduce((sum, title) => sum + title.entries.length, 0) 
      });

      // Use only import bot users, not real users
      console.log('👥 Fetching import users...');
      const importUsers = await this.getImportUsers();
      console.log(`✅ Found ${importUsers.length} import users`);
      
      if (importUsers.length === 0) {
        throw new Error('No import users found. Please create import users first.');
      }

      let articlesCreated = 0;
      let entriesCreated = 0;

      console.log('📝 Starting article creation...');
      for (let i = 0; i < jsonData.titles.length; i++) {
        const titleData = jsonData.titles[i];
        console.log(`📄 Creating article ${i + 1}/${jsonData.titles.length}: "${titleData.title}"`);
        
        try {
          // Create article with random timestamp and import user
          const randomUser = this.getRandomUser(importUsers);
          const randomTimestamp = this.getRandomTimestamp(startDate, endDate);
          
          const articleRef = await addDoc(collection(db, 'articles'), {
            title: titleData.title,
            description: titleData.description || '',
            category: titleData.category || 'general',
            createdBy: randomUser,
            slug: this.createSlug(titleData.title),
            stats: {
              entries: titleData.entries.length,
              likes: 0,
              views: 0,
            },
            createdAt: randomTimestamp,
            lastUpdated: randomTimestamp,
          });

          articlesCreated++;
          console.log(`✅ Article created with ID: ${articleRef.id}`);

          // Create entries for this article
          console.log(`💬 Creating ${titleData.entries.length} entries for this article...`);
          for (let j = 0; j < titleData.entries.length; j++) {
            const entryData = titleData.entries[j];
            console.log(`  📝 Creating entry ${j + 1}/${titleData.entries.length}`);
            
            try {
              const entryUser = this.getRandomUser(importUsers);
              const entryTimestamp = this.getRandomTimestamp(startDate, endDate);
              
              await addDoc(collection(db, 'entries'), {
                articleId: articleRef.id,
                userId: entryUser,
                content: entryData.content,
                type: entryData.type || 'text',
                stats: {
                  likes: 0,
                  dislikes: 0,
                  reports: 0,
                },
                interactions: {
                  likes: [],
                  dislikes: [],
                  reports: [],
                },
                createdAt: entryTimestamp,
                updatedAt: entryTimestamp,
              });

              entriesCreated++;
            } catch (entryError: any) {
              console.error(`❌ Failed to create entry ${j + 1}:`, entryError);
              throw new Error(`Failed to create entry ${j + 1} for article "${titleData.title}": ${entryError.message}`);
            }
          }
          console.log(`✅ All entries created for article "${titleData.title}"`);
          
        } catch (articleError: any) {
          console.error(`❌ Failed to create article "${titleData.title}":`, articleError);
          throw new Error(`Failed to create article "${titleData.title}": ${articleError.message}`);
        }
      }

      console.log('🎉 Import completed successfully!');
      console.log(`📊 Final stats: ${articlesCreated} articles, ${entriesCreated} entries created`);
      
      return { articlesCreated, entriesCreated };
    } catch (error: any) {
      console.error('💥 Import failed:', error);
      throw new Error(error.message || 'Failed to import JSON data');
    }
  }
}

export const adminService = new AdminService();


