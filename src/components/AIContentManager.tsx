import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { theme } from '../styles/theme';
import { aiContentGenerator, ContentGenerationResult } from '../services/aiContentGenerator';
import { contentScheduler, ScheduleStatus } from '../services/contentScheduler';
import { botService } from '../services/bot';
import { User } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const AIContentManager: React.FC<Props> = ({ visible, onClose }) => {
  const [botUser, setBotUser] = useState<User | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [schedulerStatus, setSchedulerStatus] = useState<ScheduleStatus | null>(null);
  const [lastResult, setLastResult] = useState<ContentGenerationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadData();
      const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [visible]);

  const loadData = async () => {
    try {
      // Get bot user status
      const bot = botService.getBotUser();
      setBotUser(bot);

      // Get generation status
      setIsGenerating(aiContentGenerator.isGenerationInProgress());

      // Get scheduler status
      const status = contentScheduler.getStatus();
      setSchedulerStatus(status);
      setLastResult(status.lastRunResult);

      setIsLoading(false);
    } catch (error: any) {
      console.error('Failed to load AI content manager data:', error);
      setIsLoading(false);
    }
  };

  const handleInitializeBot = async () => {
    try {
      setIsLoading(true);
      console.log('Starting bot initialization...');
      
      const bot = await botService.initializeBotUser();
      console.log('Bot initialization successful:', bot);
      
      setBotUser(bot);
      Alert.alert('Success', 'Bot user initialized successfully');
    } catch (error: any) {
      console.error('Bot initialization failed:', error);
      Alert.alert('Error', `Failed to initialize bot: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualGeneration = async () => {
    try {
      setIsGenerating(true);
      const result = await aiContentGenerator.generateAndPublishContent();
      setLastResult(result);
      
      if (result.success) {
        Alert.alert(
          'Success', 
          `Generated ${result.articlesCreated} articles and ${result.entriesCreated} entries`
        );
      } else {
        Alert.alert('Partial Success', `Some errors occurred: ${result.errors.join(', ')}`);
      }
    } catch (error: any) {
      Alert.alert('Error', `Generation failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
      loadData();
    }
  };

  const handleToggleScheduler = async () => {
    try {
      if (schedulerStatus?.isActive) {
        contentScheduler.stopScheduler();
        Alert.alert('Success', 'Scheduler stopped');
      } else {
        contentScheduler.updateConfig({
          enabled: true,
          intervalHours: 8,
          maxRunsPerDay: 3,
          runOnWeekends: true,
          quietHours: { start: 1, end: 6 },
          timezone: 'UTC'
        });
        contentScheduler.startScheduler();
        Alert.alert('Success', 'Scheduler started');
      }
      loadData();
    } catch (error: any) {
      Alert.alert('Error', `Failed to toggle scheduler: ${error.message}`);
    }
  };

  const handleTriggerScheduled = async () => {
    try {
      setIsLoading(true);
      const result = await contentScheduler.triggerManualRun();
      setLastResult(result);
      
      if (result.success) {
        Alert.alert(
          'Success', 
          `Scheduled generation completed: ${result.articlesCreated} articles, ${result.entriesCreated} entries`
        );
      } else {
        Alert.alert('Partial Success', `Some errors occurred: ${result.errors.join(', ')}`);
      }
    } catch (error: any) {
      Alert.alert('Error', `Scheduled generation failed: ${error.message}`);
    } finally {
      setIsLoading(false);
      loadData();
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <ScrollView style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>AI Content Manager</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Bot User Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🤖 Bot User</Text>
            {botUser ? (
              <View style={styles.statusCard}>
                <Text style={styles.statusText}>✅ {botUser.displayName}</Text>
                <Text style={styles.subText}>ID: {botUser.id}</Text>
                <Text style={styles.subText}>Email: {botUser.email}</Text>
                <Text style={styles.subText}>
                  Stats: {botUser.stats.entries} entries, {botUser.stats.points} points
                </Text>
              </View>
            ) : (
              <View style={styles.statusCard}>
                <Text style={styles.errorText}>❌ Bot user not initialized</Text>
                <TouchableOpacity 
                  style={styles.button} 
                  onPress={handleInitializeBot}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>Initialize Bot User</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Content Generation */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Content Generation</Text>
            <View style={styles.statusCard}>
              <Text style={styles.statusText}>
                Status: {isGenerating ? '🔄 Generating...' : '⏸️ Idle'}
              </Text>
              <TouchableOpacity 
                style={[styles.button, isGenerating && styles.buttonDisabled]} 
                onPress={handleManualGeneration}
                disabled={isGenerating || !botUser}
              >
                <Text style={styles.buttonText}>Generate Content Now</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Scheduler Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏰ Scheduler</Text>
            {schedulerStatus && (
              <View style={styles.statusCard}>
                <Text style={styles.statusText}>
                  Status: {schedulerStatus.isActive ? '✅ Active' : '❌ Inactive'}
                </Text>
                <Text style={styles.subText}>
                  Next Run: {schedulerStatus.nextRunTime 
                    ? new Date(schedulerStatus.nextRunTime).toLocaleString() 
                    : 'Not scheduled'}
                </Text>
                <Text style={styles.subText}>
                  Runs Today: {schedulerStatus.runsToday}
                </Text>
                <Text style={styles.subText}>
                  Total Runs: {schedulerStatus.totalRuns}
                </Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={[styles.button, styles.buttonSmall]} 
                    onPress={handleToggleScheduler}
                  >
                    <Text style={styles.buttonText}>
                      {schedulerStatus.isActive ? 'Stop' : 'Start'} Scheduler
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.button, styles.buttonSmall, styles.buttonSecondary]} 
                    onPress={handleTriggerScheduled}
                    disabled={!botUser}
                  >
                    <Text style={styles.buttonTextSecondary}>Trigger Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Last Run Result */}
          {lastResult && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Last Run Result</Text>
              <View style={styles.statusCard}>
                <Text style={[
                  styles.statusText, 
                  lastResult.success ? styles.successText : styles.errorText
                ]}>
                  {lastResult.success ? '✅ Success' : '❌ Failed'}
                </Text>
                <Text style={styles.subText}>
                  Time: {new Date(lastResult.timestamp).toLocaleString()}
                </Text>
                <Text style={styles.subText}>
                  Articles: {lastResult.articlesCreated}
                </Text>
                <Text style={styles.subText}>
                  Entries: {lastResult.entriesCreated}
                </Text>
                <Text style={styles.subText}>
                  Topics: {lastResult.topics.length}
                </Text>
                
                {lastResult.errors.length > 0 && (
                  <View style={styles.errorSection}>
                    <Text style={styles.errorTitle}>Errors:</Text>
                    {lastResult.errors.map((error, index) => (
                      <Text key={index} style={styles.errorText}>• {error}</Text>
                    ))}
                  </View>
                )}

                {lastResult.topics.length > 0 && (
                  <View style={styles.topicsSection}>
                    <Text style={styles.topicsTitle}>Generated Topics:</Text>
                    {lastResult.topics.map((topic, index) => (
                      <Text key={index} style={styles.topicText}>
                        {index + 1}. {topic.title} ({topic.category})
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Configuration Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Configuration</Text>
            <View style={styles.statusCard}>
              <Text style={styles.subText}>
                Max Articles/Run: {aiContentGenerator.getConfig().maxArticlesPerRun}
              </Text>
              <Text style={styles.subText}>
                Max Entries/Article: {aiContentGenerator.getConfig().maxEntriesPerArticle}
              </Text>
              <Text style={styles.subText}>
                Delay Between Operations: {aiContentGenerator.getConfig().delayBetweenOperations}ms
              </Text>
              <Text style={styles.subText}>
                Generation Enabled: {aiContentGenerator.getConfig().enabled ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    width: '90%',
    maxWidth: 600,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    color: theme.colors.text,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 10,
  },
  statusCard: {
    backgroundColor: theme.colors.surface,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 5,
  },
  successText: {
    color: theme.colors.success,
  },
  errorText: {
    color: theme.colors.error,
  },
  subText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 3,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonSmall: {
    flex: 1,
    marginHorizontal: 5,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.border,
  },
  buttonText: {
    color: theme.colors.surface,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  errorSection: {
    marginTop: 10,
    padding: 10,
    backgroundColor: theme.colors.errorBackground || '#ffebee',
    borderRadius: 5,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.error,
    marginBottom: 5,
  },
  topicsSection: {
    marginTop: 10,
    padding: 10,
    backgroundColor: theme.colors.successBackground || '#e8f5e8',
    borderRadius: 5,
  },
  topicsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.success,
    marginBottom: 5,
  },
  topicText: {
    fontSize: 12,
    color: theme.colors.text,
    marginBottom: 2,
  },
});
