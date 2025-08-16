import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, TextInput } from 'react-native';
import { theme } from '../styles/theme';
import { adminService } from '../services/admin';

interface JSONImportModalProps {
  visible: boolean;
  onClose: () => void;
}

interface JsonData {
  titles: Array<{
    title: string;
    description?: string;
    category?: string;
    entries: Array<{
      content: string;
      type?: 'text' | 'image' | 'video';
    }>;
  }>;
}

// Helper function to create safe dates
const createSafeDate = (year: number, month: number, day: number, hour: number, minute: number): Date => {
  const date = new Date(year, month, day, hour, minute);
  return isNaN(date.getTime()) ? new Date(2025, 7, 1, 9, 0) : date;
};

export const JSONImportModal: React.FC<JSONImportModalProps> = ({ visible, onClose }) => {
  const [jsonText, setJsonText] = useState('');
  const [startDate, setStartDate] = useState<Date>(createSafeDate(2025, 7, 1, 9, 0)); // Aug 1, 2025, 9:00 AM
  const [endDate, setEndDate] = useState<Date>(createSafeDate(2025, 7, 31, 18, 0)); // Aug 31, 2025, 6:00 PM
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [isCreatingUsers, setIsCreatingUsers] = useState(false);
  const [importUsersCount, setImportUsersCount] = useState<number | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    articlesCount: number;
    entriesCount: number;
    dateRange: string;
    jsonData: JsonData;
    validStartDate: Date;
    validEndDate: Date;
  } | null>(null);

  React.useEffect(() => {
    if (visible) {
      checkImportUsers();
    }
  }, [visible]);

  if (!visible) return null;

  const checkImportUsers = async () => {
    try {
      const importUsers = await adminService.getImportUsers();
      setImportUsersCount(importUsers.length);
    } catch (error) {
      console.error('Failed to check import users:', error);
      setImportUsersCount(0);
    }
  };

  const createImportUsers = async () => {
    try {
      setIsCreatingUsers(true);
      setImportStatus('Creating import users...');
      
      const result = await adminService.createImportUsers();
      setImportUsersCount(result.created + result.existing);
      
      if (result.created > 0) {
        setImportStatus(`✅ Created ${result.created} new import users. Total: ${result.created + result.existing}/100`);
      } else {
        setImportStatus(`✅ All ${result.existing} import users already exist.`);
      }
    } catch (error: any) {
      setImportStatus(`❌ Failed to create import users: ${error.message}`);
    } finally {
      setIsCreatingUsers(false);
    }
  };

  const validateJson = (text: string): JsonData | null => {
    try {
      const parsed = JSON.parse(text);
      
      if (!parsed.titles || !Array.isArray(parsed.titles)) {
        throw new Error('JSON must contain a "titles" array');
      }

      for (const title of parsed.titles) {
        if (!title.title || typeof title.title !== 'string') {
          throw new Error('Each title must have a "title" string property');
        }
        if (!title.entries || !Array.isArray(title.entries)) {
          throw new Error('Each title must have an "entries" array');
        }
        for (const entry of title.entries) {
          if (!entry.content || typeof entry.content !== 'string') {
            throw new Error('Each entry must have a "content" string property');
          }
        }
      }

      return parsed as JsonData;
    } catch (error: any) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
  };

  const validateDates = (startDateTime: Date, endDateTime: Date): { startDate: Date; endDate: Date } => {
    // Check if dates are valid
    if (!startDateTime || isNaN(startDateTime.getTime())) {
      throw new Error('Invalid start date and time');
    }
    
    if (!endDateTime || isNaN(endDateTime.getTime())) {
      throw new Error('Invalid end date and time');
    }

    if (startDateTime >= endDateTime) {
      throw new Error('Start date and time must be before end date and time');
    }

    if (endDateTime > new Date()) {
      throw new Error('End date and time cannot be in the future');
    }

    return { startDate: startDateTime, endDate: endDateTime };
  };

  const formatDateTime = (date: Date): string => {
    if (!date || isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateTimeForInput = (date: Date): string => {
    if (!date || isNaN(date.getTime())) {
      // Return a default valid date if the date is invalid
      const defaultDate = new Date(2025, 7, 1, 9, 0);
      return defaultDate.toISOString().slice(0, 16);
    }
    return date.toISOString().slice(0, 16);
  };

  const handleImport = async () => {
    console.log('🎯 handleImport called');
    try {
      setImportStatus('');
      setIsImporting(true);
      console.log('🔧 State set - isImporting: true');

      // Validate inputs
      console.log('✅ Validating inputs...');
      if (!jsonText.trim()) {
        throw new Error('Please paste your JSON data');
      }
      console.log('✅ JSON text validated');

      // Check if import users exist
      console.log('👥 Checking import users count:', importUsersCount);
      if (!importUsersCount || importUsersCount === 0) {
        throw new Error('Please create import users first by clicking "Create Import Users"');
      }
      console.log('✅ Import users validated');

      // Validate JSON structure
      console.log('📝 Validating JSON structure...');
      const jsonData = validateJson(jsonText.trim());
      if (!jsonData) {
        throw new Error('Invalid JSON structure');
      }
      console.log('✅ JSON structure validated:', jsonData);
      
      // Validate dates
      console.log('📅 Validating date and time range...');
      const { startDate: validStartDate, endDate: validEndDate } = validateDates(startDate, endDate);
      console.log('✅ Date and time range validated:', { validStartDate, validEndDate });

      // Show confirmation dialog
      console.log('📊 Preparing confirmation dialog...');
      const totalEntries = jsonData.titles.reduce((sum, title) => sum + title.entries.length, 0);
      console.log('📊 Total entries calculated:', totalEntries);
      
      console.log('🔔 Setting up confirmation data...');
      const dateRangeText = `${formatDateTime(startDate)} to ${formatDateTime(endDate)}`;
      setConfirmationData({
        articlesCount: jsonData.titles.length,
        entriesCount: totalEntries,
        dateRange: dateRangeText,
        jsonData,
        validStartDate,
        validEndDate
      });
      setShowConfirmation(true);
      setIsImporting(false); // Reset importing state for confirmation

    } catch (error: any) {
      console.error('💥 Import error caught:', error);
      setImportStatus(`❌ Import failed: ${error.message}`);
    } finally {
      console.log('🏁 Import process finished, setting isImporting to false');
      setIsImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!confirmationData) return;
    
    try {
      console.log('✅ User confirmed import');
      setShowConfirmation(false);
      setIsImporting(true);
      
      // Perform import
      console.log('🚀 Starting import from frontend...');
      setImportStatus('🚀 Starting import process...');
      
      console.log('📡 Calling adminService.importJsonData...');
      const result = await adminService.importJsonData(
        confirmationData.jsonData, 
        confirmationData.validStartDate, 
        confirmationData.validEndDate
      );
      console.log('✅ Import completed from frontend:', result);
      
      setImportStatus(`✅ Import successful!\n📝 ${result.articlesCreated} articles created\n💬 ${result.entriesCreated} entries created`);
      
      // Clear form
      setJsonText('');
      setStartDate(createSafeDate(2025, 7, 1, 9, 0));
      setEndDate(createSafeDate(2025, 7, 31, 18, 0));
      setConfirmationData(null);
      
    } catch (error: any) {
      console.error('💥 Import error caught:', error);
      setImportStatus(`❌ Import failed: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancelImport = () => {
    console.log('❌ User cancelled import');
    setShowConfirmation(false);
    setConfirmationData(null);
    setIsImporting(false);
  };

  const handleClose = () => {
    setJsonText('');
    setStartDate(createSafeDate(2025, 7, 1, 9, 0));
    setEndDate(createSafeDate(2025, 7, 31, 18, 0));
    setImportStatus('');
    setIsImporting(false);
    setIsCreatingUsers(false);
    setImportUsersCount(null);
    setShowConfirmation(false);
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
    setConfirmationData(null);
    onClose();
  };

  const exampleJson = `{
  "titles": [
    {
      "title": "Technology Trends 2024",
      "description": "Discussion about emerging technologies",
      "category": "technology",
      "entries": [
        {
          "content": "AI is revolutionizing how we work and live.",
          "type": "text"
        },
        {
          "content": "Quantum computing might be the next big breakthrough.",
          "type": "text"
        }
      ]
    },
    {
      "title": "Climate Change Solutions",
      "category": "environment",
      "entries": [
        {
          "content": "Renewable energy adoption is accelerating globally."
        }
      ]
    }
  ]
}`;

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>Import JSON Data</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Import Users</Text>
          <Text style={styles.hint}>
            Import content will be assigned to dedicated fake users (not real users)
          </Text>
          
          <View style={styles.importUsersSection}>
            {importUsersCount !== null ? (
              <View style={styles.usersStatusRow}>
                <Text style={styles.usersStatusText}>
                  {importUsersCount === 0 
                    ? '⚠️ No import users found' 
                    : `✅ ${importUsersCount}/100 import users ready`
                  }
                </Text>
                {importUsersCount < 100 && (
                  <TouchableOpacity
                    style={[styles.createUsersButton, isCreatingUsers && styles.disabledButton]}
                    onPress={createImportUsers}
                    disabled={isCreatingUsers}
                  >
                    <Text style={styles.createUsersButtonText}>
                      {isCreatingUsers ? 'Creating...' : importUsersCount === 0 ? 'Create Import Users' : 'Complete Set'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <Text style={styles.usersStatusText}>Loading user status...</Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>Date & Time Range</Text>
          <Text style={styles.hint}>Content will be assigned random creation times within this period (down to the exact minute)</Text>
          
          <View style={styles.dateRow}>
            <View style={styles.dateInput}>
              <Text style={styles.label}>Start Date & Time</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.datePickerText}>
                  {formatDateTime(startDate)}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dateInput}>
              <Text style={styles.label}>End Date & Time</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.datePickerText}>
                  {formatDateTime(endDate)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionTitle}>JSON Data</Text>
          <Text style={styles.hint}>Paste your JSON data below (see example format)</Text>
          
          <TextInput
            style={styles.jsonInput}
            value={jsonText}
            onChangeText={setJsonText}
            placeholder="Paste your JSON data here..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.exampleSection}>
            <Text style={styles.sectionTitle}>Example JSON Format</Text>
            <View style={styles.exampleContainer}>
              <Text style={styles.exampleText}>{exampleJson}</Text>
            </View>
          </View>

          {importStatus ? (
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>{importStatus}</Text>
            </View>
          ) : null}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={isImporting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button, 
                styles.importButton, 
                (isImporting || !importUsersCount) && styles.disabledButton
              ]}
              onPress={() => {
                console.log('🔴 Import button clicked!');
                handleImport();
              }}
              disabled={isImporting || !importUsersCount}
            >
              <Text style={styles.importButtonText}>
                {isImporting ? 'Importing...' : 'Import Data'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Confirmation Modal */}
      {showConfirmation && confirmationData && (
        <View style={styles.confirmationOverlay}>
          <View style={styles.confirmationModal}>
            <Text style={styles.confirmationTitle}>Confirm Import</Text>
            <Text style={styles.confirmationText}>
              This will create:
            </Text>
            <Text style={styles.confirmationDetails}>
              • {confirmationData.articlesCount} articles
            </Text>
            <Text style={styles.confirmationDetails}>
              • {confirmationData.entriesCount} entries
            </Text>
            <Text style={styles.confirmationText}>
              Time period: {confirmationData.dateRange}
            </Text>
            <Text style={styles.confirmationText}>
              Proceed with import?
            </Text>
            
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancelImport}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.importButton]}
                onPress={handleConfirmImport}
              >
                <Text style={styles.importButtonText}>Import</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Start Date Picker Modal */}
      {showStartDatePicker && (
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerModal}>
            <Text style={styles.datePickerTitle}>Select Start Date & Time</Text>
            <input
              type="datetime-local"
              value={formatDateTimeForInput(startDate)}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                if (!isNaN(newDate.getTime())) {
                  setStartDate(newDate);
                }
              }}
              style={{
                padding: 12,
                borderRadius: 8,
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                fontSize: 16,
                width: '100%',
                marginBottom: 16
              }}
            />
            <View style={styles.datePickerButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowStartDatePicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.importButton]}
                onPress={() => setShowStartDatePicker(false)}
              >
                <Text style={styles.importButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* End Date Picker Modal */}
      {showEndDatePicker && (
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerModal}>
            <Text style={styles.datePickerTitle}>Select End Date & Time</Text>
            <input
              type="datetime-local"
              value={formatDateTimeForInput(endDate)}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                if (!isNaN(newDate.getTime())) {
                  setEndDate(newDate);
                }
              }}
              style={{
                padding: 12,
                borderRadius: 8,
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                fontSize: 16,
                width: '100%',
                marginBottom: 16
              }}
            />
            <View style={styles.datePickerButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowEndDatePicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.importButton]}
                onPress={() => setShowEndDatePicker(false)}
              >
                <Text style={styles.importButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 12,
    width: '90%',
    maxWidth: 600,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  hint: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    fontSize: 14,
  },
  jsonInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    fontSize: 14,
    minHeight: 120,
    fontFamily: 'monospace',
  },
  exampleSection: {
    marginTop: 20,
  },
  exampleContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  exampleText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: 'monospace',
  },
  statusContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
  },
  statusText: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
    paddingBottom: 8,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  importButton: {
    backgroundColor: theme.colors.primary,
  },
  importButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  importUsersSection: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  usersStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  usersStatusText: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  createUsersButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  createUsersButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  confirmationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  confirmationModal: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
  },
  confirmationText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmationDetails: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: theme.colors.background,
    minHeight: 44,
    justifyContent: 'center',
  },
  datePickerText: {
    color: theme.colors.text,
    fontSize: 14,
  },
  datePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3000,
  },
  datePickerModal: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
});
