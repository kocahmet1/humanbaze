import { aiContentGenerator, ContentGenerationResult } from './aiContentGenerator';

export interface ScheduleConfig {
  enabled: boolean;
  intervalHours: number;
  maxRunsPerDay: number;
  runOnWeekends: boolean;
  quietHours: {
    start: number; // 0-23 hour
    end: number;   // 0-23 hour
  };
  timezone: string;
}

export interface ScheduleStatus {
  isActive: boolean;
  nextRunTime: string | null;
  lastRunTime: string | null;
  lastRunResult: ContentGenerationResult | null;
  runsToday: number;
  totalRuns: number;
}

/**
 * Service for scheduling automated content generation
 */
class ContentSchedulerService {
  private config: ScheduleConfig = {
    enabled: false,
    intervalHours: 8, // Run every 8 hours
    maxRunsPerDay: 3,
    runOnWeekends: true,
    quietHours: {
      start: 1,  // 1 AM
      end: 6     // 6 AM
    },
    timezone: 'UTC'
  };

  private status: ScheduleStatus = {
    isActive: false,
    nextRunTime: null,
    lastRunTime: null,
    lastRunResult: null,
    runsToday: 0,
    totalRuns: 0
  };

  private intervalId: NodeJS.Timeout | null = null;
  private readonly STORAGE_KEY = 'ai_content_scheduler_status';

  constructor() {
    this.loadStatusFromStorage();
    this.resetDailyCounterIfNeeded();
  }

  /**
   * Start the automated content generation scheduler
   */
  startScheduler(): void {
    if (this.intervalId) {
      console.log('Scheduler is already running');
      return;
    }

    if (!this.config.enabled) {
      console.log('Scheduler is disabled in config');
      return;
    }

    console.log('Starting content scheduler...');
    this.status.isActive = true;
    
    // Run immediately if it's been a while since last run
    this.checkAndRun();
    
    // Set up interval (check every 30 minutes)
    this.intervalId = setInterval(() => {
      this.checkAndRun();
    }, 30 * 60 * 1000); // 30 minutes

    this.calculateNextRunTime();
    this.saveStatusToStorage();
    console.log('Content scheduler started');
  }

  /**
   * Stop the automated content generation scheduler
   */
  stopScheduler(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.status.isActive = false;
    this.status.nextRunTime = null;
    this.saveStatusToStorage();
    console.log('Content scheduler stopped');
  }

  /**
   * Update scheduler configuration
   */
  updateConfig(newConfig: Partial<ScheduleConfig>): void {
    const wasEnabled = this.config.enabled;
    this.config = { ...this.config, ...newConfig };
    
    console.log('Scheduler config updated:', this.config);

    // Restart scheduler if it was running and still enabled
    if (wasEnabled && this.config.enabled && this.intervalId) {
      this.stopScheduler();
      this.startScheduler();
    } else if (!this.config.enabled && this.intervalId) {
      this.stopScheduler();
    } else if (this.config.enabled && !this.intervalId) {
      this.startScheduler();
    }

    this.calculateNextRunTime();
  }

  /**
   * Get current scheduler configuration
   */
  getConfig(): ScheduleConfig {
    return { ...this.config };
  }

  /**
   * Get current scheduler status
   */
  getStatus(): ScheduleStatus {
    return { ...this.status };
  }

  /**
   * Manually trigger content generation (bypasses schedule)
   */
  async triggerManualRun(): Promise<ContentGenerationResult> {
    console.log('Triggering manual content generation...');
    
    try {
      const result = await aiContentGenerator.generateAndPublishContent();
      
      this.status.lastRunTime = new Date().toISOString();
      this.status.lastRunResult = result;
      this.status.totalRuns++;
      
      if (this.isToday(this.status.lastRunTime)) {
        this.status.runsToday++;
      }
      
      this.calculateNextRunTime();
      this.saveStatusToStorage();
      
      return result;
    } catch (error: any) {
      console.error('Manual content generation failed:', error);
      throw error;
    }
  }

  /**
   * Check if it's time to run and execute if conditions are met
   */
  private async checkAndRun(): Promise<void> {
    if (!this.config.enabled || !this.shouldRunNow()) {
      return;
    }

    try {
      console.log('Automated content generation triggered by scheduler');
      const result = await aiContentGenerator.generateAndPublishContent();
      
      this.status.lastRunTime = new Date().toISOString();
      this.status.lastRunResult = result;
      this.status.totalRuns++;
      this.status.runsToday++;
      
      this.calculateNextRunTime();
      this.saveStatusToStorage();
      
      console.log('Scheduled content generation completed successfully');
    } catch (error: any) {
      console.error('Scheduled content generation failed:', error);
      
      // Still update the status to prevent immediate retry
      this.status.lastRunTime = new Date().toISOString();
      this.status.lastRunResult = {
        success: false,
        articlesCreated: 0,
        entriesCreated: 0,
        errors: [`Scheduler error: ${error.message}`],
        topics: [],
        timestamp: new Date().toISOString()
      };
      
      this.calculateNextRunTime();
      this.saveStatusToStorage();
    }
  }

  /**
   * Determine if content generation should run now
   */
  private shouldRunNow(): boolean {
    const now = new Date();
    
    // Check if we've exceeded daily runs
    if (this.status.runsToday >= this.config.maxRunsPerDay) {
      return false;
    }

    // Check weekend setting
    if (!this.config.runOnWeekends && (now.getDay() === 0 || now.getDay() === 6)) {
      return false;
    }

    // Check quiet hours
    const currentHour = now.getHours();
    if (this.isInQuietHours(currentHour)) {
      return false;
    }

    // Check if enough time has passed since last run
    if (this.status.lastRunTime) {
      const lastRun = new Date(this.status.lastRunTime);
      const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastRun < this.config.intervalHours) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if current hour is in quiet hours
   */
  private isInQuietHours(hour: number): boolean {
    const { start, end } = this.config.quietHours;
    
    if (start <= end) {
      return hour >= start && hour < end;
    } else {
      // Quiet hours span midnight (e.g., 23:00 to 6:00)
      return hour >= start || hour < end;
    }
  }

  /**
   * Calculate when the next run should occur
   */
  private calculateNextRunTime(): void {
    if (!this.config.enabled) {
      this.status.nextRunTime = null;
      return;
    }

    const now = new Date();
    let nextRun = new Date(now);

    if (this.status.lastRunTime) {
      nextRun = new Date(this.status.lastRunTime);
      nextRun.setHours(nextRun.getHours() + this.config.intervalHours);
    } else {
      nextRun.setHours(nextRun.getHours() + 1); // Run in 1 hour if never run
    }

    // Skip quiet hours
    while (this.isInQuietHours(nextRun.getHours())) {
      nextRun.setHours(nextRun.getHours() + 1);
    }

    // Skip weekends if configured
    if (!this.config.runOnWeekends) {
      while (nextRun.getDay() === 0 || nextRun.getDay() === 6) {
        nextRun.setDate(nextRun.getDate() + 1);
        nextRun.setHours(9); // Start at 9 AM on weekdays
      }
    }

    this.status.nextRunTime = nextRun.toISOString();
  }

  /**
   * Check if date is today
   */
  private isToday(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  /**
   * Reset daily counter if it's a new day
   */
  private resetDailyCounterIfNeeded(): void {
    if (!this.status.lastRunTime || !this.isToday(this.status.lastRunTime)) {
      this.status.runsToday = 0;
    }
  }

  /**
   * Save status to localStorage
   */
  private saveStatusToStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
          lastRunTime: this.status.lastRunTime,
          runsToday: this.status.runsToday,
          totalRuns: this.status.totalRuns,
          lastRunResult: this.status.lastRunResult
        }));
      }
    } catch (error) {
      console.warn('Failed to save scheduler status to storage:', error);
    }
  }

  /**
   * Load status from localStorage
   */
  private loadStatusFromStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          this.status.lastRunTime = data.lastRunTime || null;
          this.status.runsToday = data.runsToday || 0;
          this.status.totalRuns = data.totalRuns || 0;
          this.status.lastRunResult = data.lastRunResult || null;
        }
      }
    } catch (error) {
      console.warn('Failed to load scheduler status from storage:', error);
    }
  }
}

export const contentScheduler = new ContentSchedulerService();
