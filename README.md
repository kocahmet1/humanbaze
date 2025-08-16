# Humanbaze Web - Social Wikipedia

A React Native Web application built with TypeScript, Firebase, and Redux Toolkit. Humanbaze is a social platform where users can create articles on topics of interest and share their knowledge, opinions, and insights through text, images, and videos.

## Features

### Phase 1 (Current)
- React Native Web setup with TypeScript
- Firebase authentication (Email, Google, Facebook)
- Redux Toolkit state management
- Responsive three-column layout
- Basic navigation and routing
- User registration and login screens

### Phase 2 (Next)
- Article creation and management
- Text entries with rich content
- Home feed with recent entries
- Search functionality
- User profiles

### Phase 3 (Future)
- Image upload and display
- Video embedding (YouTube)
- Like/dislike system
- Entry sharing and reporting

### Phase 4 (Future)
- Follow/unfollow users
- Real-time updates
- Push notifications
- Advanced search and filters

## Tech Stack

- **Frontend**: React Native Web, TypeScript
- **Backend**: Firebase (Firestore, Auth, Storage, Functions)
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation v6
- **Styling**: React Native StyleSheet (theme-based)
- **Build Tool**: Webpack

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd humanbaze-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   - Create a new Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password, Google, Facebook)
   - Create a Firestore database
   - Enable Storage
   - Copy your Firebase config

4. **Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   REACT_APP_FIREBASE_API_KEY=your-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
   REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdefghijk
   REACT_APP_FIREBASE_MEASUREMENT_ID=G-ABCDEFGHIJ
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

   The app will open at http://localhost:3000

### Firebase Security Rules

Add these Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read all user profiles, but only edit their own
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Anyone can read articles, authenticated users can create
    match /articles/{articleId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.createdBy;
    }
    
    // Entries follow same pattern as articles
    match /entries/{entryId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Follows are managed by authenticated users
    match /follows/{followId} {
      allow read: if true;
      allow create, delete: if request.auth != null && 
        request.auth.uid == resource.data.followerId;
    }
  }
}
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── icons/          # Icon components
│   └── ...
├── navigation/         # Navigation setup
│   ├── AppNavigator.tsx
│   ├── AuthNavigator.tsx
│   ├── MainNavigator.tsx
│   └── MainTabNavigator.tsx
├── screens/           # Screen components
│   ├── auth/         # Authentication screens
│   └── ...
├── services/         # Firebase and API services
│   ├── firebase.ts
│   ├── auth.ts
│   ├── articles.ts
│   ├── entries.ts
│   └── users.ts
├── store/           # Redux store and slices
│   ├── slices/
│   └── index.ts
├── styles/         # Theme and styling
│   └── theme.ts
├── types/          # TypeScript type definitions
│   └── index.ts
├── utils/          # Utility functions
├── App.tsx         # Main app component
└── index.tsx       # Entry point
```

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## Development

### Adding New Features

1. **Create types** in `src/types/index.ts`
2. **Add service methods** in appropriate service files
3. **Create Redux slices** for state management
4. **Build UI components** with proper styling
5. **Add navigation** if needed
6. **Write tests** for new functionality

### Styling Guidelines

- Use the theme system defined in `src/styles/theme.ts`
- Follow responsive design patterns
- Maintain consistency with the original Humanbaze design
- Use semantic color names and spacing values

### State Management

- Use Redux Toolkit for global state
- Create async thunks for API calls
- Keep UI state separate from business logic
- Use selectors for computed state

## Deployment

### Web Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to your hosting provider**
   - Firebase Hosting
   - Vercel
   - Netlify
   - AWS S3 + CloudFront

### Firebase Functions (Future)

For server-side logic, we'll add Firebase Cloud Functions:
- User statistics aggregation
- Content moderation
- Email notifications
- Search indexing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Roadmap

- [ ] Complete Phase 1 (Authentication & Basic UI)
- [ ] Phase 2: Content Management
- [ ] Phase 3: Media & Engagement
- [ ] Phase 4: Social Features
- [ ] Performance optimizations
- [ ] Mobile app versions (iOS/Android)
- [ ] Advanced search with Algolia
- [ ] Real-time notifications
- [ ] Moderation tools
- [ ] Analytics dashboard
