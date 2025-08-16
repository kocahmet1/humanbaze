# AI Content Generation Demo

This document provides examples of how to use the automated AI content generation system.

## Quick Start

### 1. Set up Environment Variables

Create a `.env` file in your `humanbaze-web` directory:

```bash
# Required: Get this from Google AI Studio
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Customize behavior
REACT_APP_AI_CONTENT_ENABLED=true
REACT_APP_AI_CONTENT_INTERVAL_HOURS=8
REACT_APP_AI_CONTENT_MAX_RUNS_PER_DAY=3
```

### 2. Install Dependencies

```bash
cd humanbaze-web
npm install
```

### 3. Manual Content Generation

Run a one-time content generation:

```bash
npm run ai-content:manual
```

This will:
- Initialize the AI bot user
- Fetch trending AI topics from Gemini API
- Create 3-5 articles with entries
- Display detailed results

### 4. Start Automated Scheduling

Start the automated scheduler:

```bash
npm run ai-content:schedule
```

This will:
- Start the scheduler to run every 8 hours
- Respect quiet hours (1 AM - 6 AM)
- Generate content automatically
- Keep running until you stop it

### 5. Check Status

Check the current system status:

```bash
npm run ai-content:status
```

Shows:
- Bot user information
- Scheduler status and next run time
- Last generation results
- Configuration settings

## Admin Interface Usage

### 1. Access Admin Panel

1. Sign in as an admin user
2. Navigate to the admin screen
3. Find the "AI Content Generation" section
4. Click "Open AI Manager"

### 2. AI Content Manager Features

- **Bot User Status**: See if the bot user is initialized
- **Manual Generation**: Trigger content generation immediately
- **Scheduler Control**: Start/stop automated scheduling
- **Results Monitoring**: View last run results and errors
- **Configuration Display**: See current settings

## Programmatic Usage

### Basic Content Generation

```typescript
import { aiContentGenerator, botService } from './src/services';

// Initialize system
await botService.initializeBotUser();

// Configure generation
aiContentGenerator.updateConfig({
  maxArticlesPerRun: 3,
  maxEntriesPerArticle: 2,
  enabled: true
});

// Generate content
const result = await aiContentGenerator.generateAndPublishContent();
console.log(`Created ${result.articlesCreated} articles`);
```

### Scheduler Management

```typescript
import { contentScheduler } from './src/services';

// Configure scheduler
contentScheduler.updateConfig({
  enabled: true,
  intervalHours: 12,
  maxRunsPerDay: 2,
  runOnWeekends: false,
  quietHours: { start: 1, end: 6 }
});

// Start automatic scheduling
contentScheduler.startScheduler();

// Check status
const status = contentScheduler.getStatus();
console.log('Next run:', status.nextRunTime);

// Manually trigger
const result = await contentScheduler.triggerManualRun();
```

### Custom Topic Generation

```typescript
import { geminiService } from './src/services';

// Generate content for specific topics
const content = await geminiService.generateTrendingAIContent();

// Generate additional entries for a topic
const additionalEntries = await geminiService.generateAdditionalEntries(
  content.topics[0],
  ['existing entry content']
);
```

## Example Generated Content

### Sample Topics Generated

1. **"OpenAI Announces GPT-5 Development Progress"**
   - Category: models
   - 3-4 paragraph detailed discussion
   - Follow-up entries with different perspectives

2. **"EU AI Act Implementation Begins"**
   - Category: regulation
   - Analysis of regulatory impact
   - Community discussion entries

3. **"Google's Gemini Ultra Shows Impressive Reasoning"**
   - Category: models
   - Technical comparison content
   - Industry implications discussion

### Content Structure

**Article Creation:**
- Engaging, discussion-worthy titles
- Brief descriptions for previews
- Appropriate category mapping
- Created by AI bot user

**Entry Generation:**
- Main content: 3-4 informative paragraphs
- Additional entries: Different perspectives
- Community-friendly discussion format
- Suitable for social media engagement

## Monitoring and Maintenance

### Log Monitoring

Check console logs for:
- Generation success/failure messages
- API rate limiting warnings
- Scheduler status updates
- Error details for troubleshooting

### Error Handling

The system includes robust error handling:
- Falls back to predefined topics if Gemini API fails
- Continues if individual article creation fails
- Logs all errors for debugging
- Prevents rate limiting with delays

### Performance Monitoring

Monitor these metrics:
- Articles created per day
- Entry generation success rate
- API response times
- Scheduler reliability

## Troubleshooting

### Common Issues

1. **"Gemini API key not configured"**
   - Check your `.env` file
   - Verify `REACT_APP_GEMINI_API_KEY` is set
   - Restart the application

2. **"Bot user not initialized"**
   - Run manual generation first
   - Check Firebase permissions
   - Verify authentication settings

3. **"Content generation failed"**
   - Check internet connection
   - Verify Gemini API quotas
   - Review Firebase security rules

4. **Scheduler not running**
   - Check environment variables
   - Verify scheduler configuration
   - Ensure browser/system stays active

### Debug Commands

```bash
# Check configuration
npm run ai-content:status

# Test manual generation
npm run ai-content:manual

# View detailed logs
npm run ai-content:schedule # Watch console output
```

### API Limits

**Gemini API:**
- Free tier: 60 requests per minute
- Rate limiting handled automatically
- Fallback content available

**Firebase:**
- Read/write operations counted
- Monitor usage in console
- Optimize delays if needed

## Production Considerations

### Security

- Keep API keys secure and private
- Use environment variables, not hardcoded keys
- Monitor bot user activity
- Review generated content periodically

### Scaling

- Adjust generation frequency based on user activity
- Monitor Firebase costs and quotas
- Consider API upgrade for higher volume
- Implement content moderation if needed

### Content Quality

- Review generated topics periodically
- Adjust prompts for better content
- Monitor user engagement with AI content
- Implement feedback mechanisms

## Advanced Configuration

### Custom Prompts

Modify the Gemini service to use custom prompts:

```typescript
// In geminiService.generateTrendingAIContent()
const customPrompt = `
Focus on: ${specificTopics.join(', ')}
Generate content suitable for: ${targetAudience}
Tone: ${contentTone}
...
`;
```

### Category Mapping

Customize category mapping in aiContentGenerator:

```typescript
private mapCategoryToSystem(aiCategory: string): string {
  const categoryMap = {
    'models': 'ai-models',
    'research': 'ai-research',
    // Add your custom mappings
  };
  return categoryMap[aiCategory] || 'general';
}
```

### Scheduling Patterns

Create complex scheduling patterns:

```typescript
// Weekend-only generation
contentScheduler.updateConfig({
  enabled: true,
  intervalHours: 24,
  runOnWeekends: true,
  // Run only on weekends by checking day in shouldRunNow()
});

// Peak hours generation
contentScheduler.updateConfig({
  enabled: true,
  intervalHours: 4,
  quietHours: { start: 23, end: 7 }, // Only run 7 AM - 11 PM
});
```

This comprehensive system provides automated, high-quality AI content generation for your Humanbaze platform, keeping your community engaged with the latest AI developments!
