#!/usr/bin/env node

/**
 * Automated AI Content Generation Script
 * 
 * This script can be run manually or scheduled to generate AI content automatically.
 * It uses the Gemini API to fetch trending AI topics and creates articles/entries.
 * 
 * Usage:
 *   npm run generate-ai-content
 *   node src/scripts/generateAIContent.js
 * 
 * Options:
 *   --manual     Run once manually (default)
 *   --schedule   Start the scheduler
 *   --stop       Stop the scheduler
 *   --status     Show current status
 *   --config     Show current configuration
 */

import { aiContentGenerator } from '../services/aiContentGenerator';
import { contentScheduler } from '../services/contentScheduler';
import { botService } from '../services/bot';

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || '--manual';

async function main() {
  console.log('🤖 AI Content Generation System');
  console.log('=================================');

  try {
    switch (command) {
      case '--manual':
        await runManualGeneration();
        break;
      case '--schedule':
        await startScheduler();
        break;
      case '--stop':
        await stopScheduler();
        break;
      case '--status':
        await showStatus();
        break;
      case '--config':
        await showConfig();
        break;
      case '--help':
        showHelp();
        break;
      default:
        console.log(`Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

/**
 * Run manual content generation
 */
async function runManualGeneration() {
  console.log('🔄 Starting manual content generation...');
  
  try {
    // Initialize bot user
    console.log('👤 Initializing bot user...');
    const botUser = await botService.initializeBotUser();
    console.log(`✅ Bot user ready: ${botUser.displayName} (${botUser.id})`);

    // Check if generation is already in progress
    if (aiContentGenerator.isGenerationInProgress()) {
      console.log('⚠️  Content generation already in progress');
      return;
    }

    // Configure for manual run
    aiContentGenerator.updateConfig({
      maxArticlesPerRun: 5,
      maxEntriesPerArticle: 3,
      delayBetweenOperations: 2000,
      enabled: true
    });

    // Generate content
    console.log('🎯 Generating AI content...');
    const result = await aiContentGenerator.generateAndPublishContent();

    // Display results
    console.log('\n📊 Generation Results:');
    console.log(`   Articles Created: ${result.articlesCreated}`);
    console.log(`   Entries Created: ${result.entriesCreated}`);
    console.log(`   Topics Processed: ${result.topics.length}`);
    console.log(`   Success: ${result.success ? '✅' : '❌'}`);
    console.log(`   Timestamp: ${result.timestamp}`);

    if (result.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      result.errors.forEach(error => console.log(`   - ${error}`));
    }

    if (result.topics.length > 0) {
      console.log('\n📰 Topics Generated:');
      result.topics.forEach((topic, index) => {
        console.log(`   ${index + 1}. ${topic.title} (${topic.category})`);
      });
    }

    console.log('\n✅ Manual generation completed!');

  } catch (error: any) {
    console.error('❌ Manual generation failed:', error.message);
    throw error;
  }
}

/**
 * Start the scheduler
 */
async function startScheduler() {
  console.log('⏰ Starting content scheduler...');

  try {
    // Initialize bot user first
    await botService.initializeBotUser();

    // Configure scheduler
    const config = {
      enabled: true,
      intervalHours: parseInt(process.env.REACT_APP_AI_CONTENT_INTERVAL_HOURS || '8'),
      maxRunsPerDay: parseInt(process.env.REACT_APP_AI_CONTENT_MAX_RUNS_PER_DAY || '3'),
      runOnWeekends: process.env.REACT_APP_AI_CONTENT_RUN_ON_WEEKENDS !== 'false',
      quietHours: {
        start: parseInt(process.env.REACT_APP_AI_CONTENT_QUIET_HOURS_START || '1'),
        end: parseInt(process.env.REACT_APP_AI_CONTENT_QUIET_HOURS_END || '6')
      },
      timezone: 'UTC'
    };

    contentScheduler.updateConfig(config);
    contentScheduler.startScheduler();

    const status = contentScheduler.getStatus();
    console.log('✅ Scheduler started successfully!');
    console.log(`   Next run: ${status.nextRunTime}`);
    console.log(`   Runs today: ${status.runsToday}/${config.maxRunsPerDay}`);
    console.log(`   Interval: Every ${config.intervalHours} hours`);
    console.log(`   Quiet hours: ${config.quietHours.start}:00 - ${config.quietHours.end}:00`);

    // Keep the process running for Node.js environments
    if (typeof window === 'undefined') {
      console.log('\n🔄 Scheduler is running... Press Ctrl+C to stop');
      
      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n🛑 Stopping scheduler...');
        contentScheduler.stopScheduler();
        console.log('✅ Scheduler stopped');
        process.exit(0);
      });

      // Keep process alive
      setInterval(() => {
        const currentStatus = contentScheduler.getStatus();
        if (currentStatus.lastRunTime) {
          const lastRun = new Date(currentStatus.lastRunTime);
          console.log(`⏰ Last run: ${lastRun.toLocaleString()}, Next: ${currentStatus.nextRunTime ? new Date(currentStatus.nextRunTime).toLocaleString() : 'Calculating...'}`);
        }
      }, 60000); // Log status every minute
    }

  } catch (error: any) {
    console.error('❌ Failed to start scheduler:', error.message);
    throw error;
  }
}

/**
 * Stop the scheduler
 */
async function stopScheduler() {
  console.log('🛑 Stopping content scheduler...');
  
  contentScheduler.stopScheduler();
  
  const status = contentScheduler.getStatus();
  console.log(`✅ Scheduler stopped. Total runs: ${status.totalRuns}`);
}

/**
 * Show current status
 */
async function showStatus() {
  console.log('📊 Current Status:');

  try {
    // Bot status
    const botUser = botService.getBotUser();
    if (botUser) {
      console.log(`\n👤 Bot User: ${botUser.displayName}`);
      console.log(`   ID: ${botUser.id}`);
      console.log(`   Email: ${botUser.email}`);
      console.log(`   Stats: ${botUser.stats.entries} entries, ${botUser.stats.points} points`);
    } else {
      console.log('\n👤 Bot User: Not initialized');
    }

    // Generation status
    const isGenerating = aiContentGenerator.isGenerationInProgress();
    console.log(`\n🎯 Content Generation: ${isGenerating ? 'In Progress' : 'Idle'}`);

    // Scheduler status
    const schedulerStatus = contentScheduler.getStatus();
    console.log(`\n⏰ Scheduler Status:`);
    console.log(`   Active: ${schedulerStatus.isActive ? '✅' : '❌'}`);
    console.log(`   Next Run: ${schedulerStatus.nextRunTime || 'Not scheduled'}`);
    console.log(`   Last Run: ${schedulerStatus.lastRunTime || 'Never'}`);
    console.log(`   Runs Today: ${schedulerStatus.runsToday}`);
    console.log(`   Total Runs: ${schedulerStatus.totalRuns}`);

    // Last run result
    if (schedulerStatus.lastRunResult) {
      const result = schedulerStatus.lastRunResult;
      console.log(`\n📈 Last Run Result:`);
      console.log(`   Success: ${result.success ? '✅' : '❌'}`);
      console.log(`   Articles: ${result.articlesCreated}`);
      console.log(`   Entries: ${result.entriesCreated}`);
      console.log(`   Errors: ${result.errors.length}`);
      console.log(`   Time: ${new Date(result.timestamp).toLocaleString()}`);
    }

    // Configuration
    const genConfig = aiContentGenerator.getConfig();
    const scheduleConfig = contentScheduler.getConfig();
    console.log(`\n⚙️  Configuration:`);
    console.log(`   Generation Enabled: ${genConfig.enabled}`);
    console.log(`   Max Articles/Run: ${genConfig.maxArticlesPerRun}`);
    console.log(`   Max Entries/Article: ${genConfig.maxEntriesPerArticle}`);
    console.log(`   Scheduler Enabled: ${scheduleConfig.enabled}`);
    console.log(`   Interval: ${scheduleConfig.intervalHours} hours`);
    console.log(`   Max Runs/Day: ${scheduleConfig.maxRunsPerDay}`);

  } catch (error: any) {
    console.error('❌ Failed to get status:', error.message);
  }
}

/**
 * Show current configuration
 */
async function showConfig() {
  console.log('⚙️  Configuration:');

  const genConfig = aiContentGenerator.getConfig();
  const scheduleConfig = contentScheduler.getConfig();

  console.log('\n🎯 Content Generation:');
  Object.entries(genConfig).forEach(([key, value]) => {
    console.log(`   ${key}: ${JSON.stringify(value)}`);
  });

  console.log('\n⏰ Scheduler:');
  Object.entries(scheduleConfig).forEach(([key, value]) => {
    console.log(`   ${key}: ${JSON.stringify(value)}`);
  });

  console.log('\n🌍 Environment Variables:');
  const envVars = [
    'REACT_APP_GEMINI_API_KEY',
    'REACT_APP_AI_CONTENT_ENABLED',
    'REACT_APP_AI_CONTENT_INTERVAL_HOURS',
    'REACT_APP_AI_CONTENT_MAX_RUNS_PER_DAY',
    'REACT_APP_AI_CONTENT_RUN_ON_WEEKENDS',
    'REACT_APP_AI_CONTENT_QUIET_HOURS_START',
    'REACT_APP_AI_CONTENT_QUIET_HOURS_END'
  ];

  envVars.forEach(envVar => {
    const value = process.env[envVar];
    const display = envVar.includes('API_KEY') && value ? '***HIDDEN***' : (value || 'Not set');
    console.log(`   ${envVar}: ${display}`);
  });
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
Usage: npm run generate-ai-content [command]

Commands:
  --manual     Run content generation once (default)
  --schedule   Start the automated scheduler
  --stop       Stop the scheduler
  --status     Show current system status
  --config     Show current configuration
  --help       Show this help message

Examples:
  npm run generate-ai-content
  npm run generate-ai-content -- --schedule
  npm run generate-ai-content -- --status

Environment Variables:
  REACT_APP_GEMINI_API_KEY              Gemini API key (required)
  REACT_APP_AI_CONTENT_ENABLED          Enable/disable generation (default: true)
  REACT_APP_AI_CONTENT_INTERVAL_HOURS   Hours between runs (default: 8)
  REACT_APP_AI_CONTENT_MAX_RUNS_PER_DAY Max runs per day (default: 3)
  REACT_APP_AI_CONTENT_RUN_ON_WEEKENDS  Run on weekends (default: true)
  REACT_APP_AI_CONTENT_QUIET_HOURS_*    Quiet hours start/end (default: 1-6)
`);
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

export { main as generateAIContent };
