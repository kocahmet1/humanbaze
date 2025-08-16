// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  role?: 'user' | 'admin' | 'import_bot' | 'bot';
  banned?: boolean;
  stats: {
    entries: number;
    points: number;
    followers: number;
    following: number;
    weeklyPoints?: number;
    monthlyPoints?: number;
  };
  createdAt: string; // ISO string
  lastActive: string; // ISO string
}

// Article types
export interface Article {
  id: string;
  title: string;
  description?: string;
  category: string;
  createdBy: string;
  slug: string;
  stats: {
    entries: number;
    likes: number;
    views: number;
    reports?: number;
  };
  createdAt: string; // ISO string
  lastUpdated: string; // ISO string
}

// Entry types
export type EntryType = 'text' | 'image' | 'video';

export interface EntryMedia {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

export interface Entry {
  id: string;
  articleId: string;
  userId: string;
  content: string;
  type: EntryType;
  media?: EntryMedia;
  stats: {
    likes: number;
    dislikes: number;
    reports: number;
  };
  interactions: {
    likes: string[]; // user IDs
    dislikes: string[]; // user IDs
    reports: string[]; // user IDs
  };
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
}

// Leaderboard types
export interface LeaderboardItem {
  user: User;
  value: number; // meaning depends on leaderboard mode
  valueLabel: 'likes' | 'created';
}

// Interaction types
export type InteractionType = 'like' | 'dislike' | 'report' | 'follow' | 'unfollow';

export interface Interaction {
  id: string;
  userId: string;
  targetId: string;
  targetType: 'entry' | 'article' | 'user';
  type: InteractionType;
  createdAt: Date;
}

// Follow types
export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'follow' | 'comment' | 'mention';
  message: string;
  read: boolean;
  metadata: {
    triggeredBy: string;
    articleId?: string;
    entryId?: string;
  };
  createdAt: Date;
}

// Category types
export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  articleCount: number;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Discover: undefined;
  Create: undefined;
  Profile: undefined;
};

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Feed types
export interface FeedItem {
  id: string;
  type: 'entry' | 'article';
  data: Entry | Article;
  user: User;
  createdAt: Date;
}

// Search types
export interface SearchFilters {
  category?: string;
  dateRange?: 'today' | 'week' | 'month' | 'all';
  sortBy?: 'recent' | 'popular' | 'controversial';
  type?: 'articles' | 'entries' | 'users';
}

export interface SearchResult {
  articles: Article[];
  entries: Entry[];
  users: User[];
  total: number;
}

// AI news ingestion types
export type SignalSource = 'arxiv' | 'hn' | 'github' | 'huggingface' | 'yt' | 'blog' | 'pwc' | string;

export interface RawSignal {
  id: string; // stable hash of source+url+title
  source: SignalSource;
  title: string;
  url: string;
  author?: string;
  summary?: string;
  tags: string[];
  publishedAt: string; // ISO
  metadata?: Record<string, any>;
}

export interface ScoredSignal extends RawSignal {
  score: number;
}
