# AI Content Generation Setup Guide

This guide explains how to set up the automated AI content generation system for your Humanbaze application.

## Overview

The AI content generation system automatically creates articles and entries about trending AI topics using Google's Gemini API. It includes:

- **Bot User Management**: Creates and manages a dedicated AI bot user
- **Gemini API Integration**: Fetches trending AI topics and generates content
- **Content Automation**: Creates articles and entries automatically
- **Scheduling System**: Runs content generation on a schedule
- **Configuration Management**: Fully configurable behavior

## Required Environment Variables

Add these to your `.env` file:

```bash
# Gemini AI API Configuration
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here

# AI Content Generation Settings (Optional - defaults provided)
REACT_APP_AI_CONTENT_ENABLED=true
REACT_APP_AI_CONTENT_INTERVAL_HOURS=8
REACT_APP_AI_CONTENT_MAX_RUNS_PER_DAY=3
REACT_APP_AI_CONTENT_RUN_ON_WEEKENDS=true
REACT_APP_AI_CONTENT_QUIET_HOURS_START=1
REACT_APP_AI_CONTENT_QUIET_HOURS_END=6

# Bot User Configuration (Optional - will use defaults)
REACT_APP_BOT_EMAIL=aibot@yourdomain.com
REACT_APP_BOT_PASSWORD=your_secure_bot_password
REACT_APP_BOT_DISPLAY_NAME=AI Content Bot
```

## Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key and add it to your `.env` file

## Setup Steps

### 1. Install Dependencies

The system uses existing dependencies, no additional packages needed.

### 2. Configure Environment Variables

Create a `.env` file in your `humanbaze-web` directory with the required variables above.

### 3. Initialize the System

The system will automatically create a bot user on first run. You can also manually initialize it:

```typescript
import { botService } from './src/services/bot';
import { aiContentGenerator } from './src/services/aiContentGenerator';
import { contentScheduler } from './src/services/contentScheduler';

// Initialize bot user
await botService.initializeBotUser();

// Configure content generation
aiContentGenerator.updateConfig({
  maxArticlesPerRun: 5,
  maxEntriesPerArticle: 3,
  delayBetweenOperations: 2000,
  enabled: true
});

// Start scheduler
contentScheduler.updateConfig({
  enabled: true,
  intervalHours: 8,
  maxRunsPerDay: 3
});
contentScheduler.startScheduler();
```

## Usage

### Manual Content Generation

```typescript
import { aiContentGenerator } from './src/services/aiContentGenerator';

// Generate content manually
const result = await aiContentGenerator.generateAndPublishContent();
console.log(`Created ${result.articlesCreated} articles and ${result.entriesCreated} entries`);
```

### Scheduled Content Generation

```typescript
import { contentScheduler } from './src/services/contentScheduler';

// Start automatic scheduling
contentScheduler.startScheduler();

// Check status
const status = contentScheduler.getStatus();
console.log('Next run:', status.nextRunTime);
console.log('Runs today:', status.runsToday);

// Trigger manual run
const result = await contentScheduler.triggerManualRun();
```

### Configuration Options

#### Content Generation Config

```typescript
interface ContentGenerationConfig {
  maxArticlesPerRun: number;      // Max articles per generation run (default: 5)
  maxEntriesPerArticle: number;   // Max entries per article (default: 3)
  delayBetweenOperations: number; // Delay between API calls in ms (default: 2000)
  categories: string[];           // Allowed categories
  enabled: boolean;               // Enable/disable generation
}
```

#### Scheduler Config

```typescript
interface ScheduleConfig {
  enabled: boolean;        // Enable/disable scheduler
  intervalHours: number;   // Hours between runs (default: 8)
  maxRunsPerDay: number;  // Max runs per day (default: 3)
  runOnWeekends: boolean; // Run on weekends (default: true)
  quietHours: {
    start: number;        // Quiet hours start (0-23, default: 1)
    end: number;          // Quiet hours end (0-23, default: 6)
  };
  timezone: string;       // Timezone (default: 'UTC')
}
```

## API Endpoints

### Admin Interface

Add these to your admin panel:

```typescript
// Get bot status
const botUser = botService.getBotUser();

// Get generation status
const generationStatus = aiContentGenerator.isGenerationInProgress();

// Get scheduler status
const schedulerStatus = contentScheduler.getStatus();

// Manual trigger
const result = await contentScheduler.triggerManualRun();
```

## Content Topics

The system focuses on AI-related topics:

- **AI Models**: GPT-5, Claude, Gemini updates, new model releases
- **Research**: Breakthrough papers, new techniques, academic developments
- **Industry**: Company announcements, acquisitions, product launches
- **Regulation**: AI laws, policy changes, governance updates
- **Ethics**: AI safety, bias, responsible AI developments
- **Applications**: Real-world AI implementations, industry use cases

## Generated Content Structure

### Articles
- **Title**: Engaging, discussion-worthy titles
- **Description**: Brief 2-3 sentence summaries
- **Category**: Mapped to your system categories
- **Creator**: AI bot user

### Entries
- **Main Entry**: Detailed content from Gemini API (3-4 paragraphs)
- **Additional Entries**: Follow-up discussions and insights
- **Format**: Text-based, suitable for social discussion

## Monitoring and Logs

The system provides comprehensive logging:

```typescript
// Check recent activity
const activity = await aiContentGenerator.getBotActivity();

// View last run results
const status = contentScheduler.getStatus();
const lastResult = status.lastRunResult;

// Monitor errors
if (lastResult && !lastResult.success) {
  console.log('Errors:', lastResult.errors);
}
```

## Troubleshooting

### Common Issues

1. **Gemini API Errors**
   - Check API key validity
   - Verify API quotas and limits
   - System falls back to predefined topics

2. **Firebase Permission Errors**
   - Ensure bot user has proper permissions
   - Check Firestore security rules

3. **Scheduling Issues**
   - Verify environment variables
   - Check quiet hours configuration
   - Monitor browser/system time

### Error Handling

The system includes comprehensive error handling:
- Falls back to predefined topics if Gemini API fails
- Continues operation if individual article creation fails
- Logs all errors for debugging
- Prevents infinite loops and rate limiting

## Security Considerations

- Bot user credentials are managed securely
- API keys should be kept private
- Consider rate limiting for production use
- Monitor generated content for quality

## Performance

- Includes delays between operations to respect API limits
- Batches operations efficiently
- Uses fallback content when APIs are unavailable
- Minimal impact on main application performance
