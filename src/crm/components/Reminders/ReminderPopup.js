/**
 * Reminder Popup Component
 * Shows reminder popup at scheduled time (like website)
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Vibration,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Sound from 'react-native-sound';

const ReminderPopup = ({ visible, onClose, reminder, navigation }) => {
  const [response, setResponse] = useState('');
  const [reminderSound, setReminderSound] = useState(null);
  const [selectedRepeat, setSelectedRepeat] = useState(null);
  const [showRepeatOptions, setShowRepeatOptions] = useState(false);

  // ✅ ENHANCED: Setup sound notification
  useEffect(() => {
    // Enable playback in silence mode
    Sound.setCategory('Playback');

    // Try multiple sound sources for reliability
    let sound = null;
    
    // Try bundled sound first
    sound = new Sound('notification.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Bundled sound failed, trying system alert', error);
        // Fallback to system alert sound
        sound = new Sound('alert.wav', Sound.SYSTEM, (sysError) => {
          if (sysError) {
            console.log('System alert failed, trying default', sysError);
            // Final fallback to default system sound
            sound = new Sound('default', Sound.SYSTEM, (defError) => {
              if (!defError) {
                console.log('✅ Default system sound loaded');
                setReminderSound(sound);
              } else {
                console.log('❌ All sound loading failed', defError);
              }
            });
          } else {
            console.log('✅ System alert sound loaded');
            setReminderSound(sound);
          }
        });
      } else {
        console.log('✅ Bundled notification sound loaded');
        setReminderSound(sound);
      }
    });

    return () => {
      if (reminderSound) {
        reminderSound.release();
      }
    };
  }, []);

  // ✅ ENHANCED: Play sound and vibrate when modal opens
  useEffect(() => {
    if (visible && reminder) {
      console.log('🔔 Reminder popup opened - playing sound and vibration');
      
      // ✅ DEBUG: Add debugging commands for repeat/snooze testing
      if (__DEV__) {
        global.debugReminderPopup = {
          // Test repeat functionality
          testRepeat: (type) => {
            handleRepeat(type || 'daily');
            return `Testing ${type || 'daily'} repeat`;
          },
          
          // Test snooze functionality  
          testSnooze: (minutes) => {
            handleSnooze(minutes || 5);
            return `Testing ${minutes || 5} minute snooze`;
          },
          
          // Check current reminder data
          checkReminder: () => {
            console.log('📋 Current reminder data:', reminder);
            return reminder;
          },
          
          // Force close popup
          forceClose: () => {
            onClose('debug_closed');
            return 'Popup force closed';
          }
        };
        
        console.log('🛠️ Debug commands available:');
        console.log('  • global.debugReminderPopup.testRepeat("daily")');
        console.log('  • global.debugReminderPopup.testSnooze(5)');
        console.log('  • global.debugReminderPopup.checkReminder()');
        console.log('  • global.debugReminderPopup.forceClose()');
      }
      
      // Play sound
      if (reminderSound) {
        reminderSound.setVolume(1.0);
        reminderSound.play((success) => {
          if (success) {
            console.log('✅ Reminder sound played successfully');
          } else {
            console.log('❌ Reminder sound failed to play');
          }
        });
      }

      // Vibration pattern: [wait, vibrate, wait, vibrate, ...]
      const vibrationPattern = [0, 1000, 500, 1000, 500, 1000]; // 3 long vibrations
      Vibration.vibrate(vibrationPattern);
      
      console.log('📳 Reminder vibration triggered');
    }
  }, [visible, reminder, reminderSound]);

  if (!reminder) return null;

  const handleCall = () => {
    if (reminder.phone || reminder.contactNumber) {
      const phone = reminder.phone || reminder.contactNumber;
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Error', 'Phone number not available');
    }
  };

  const handleRepeat = async (repeatType) => {
    try {
      console.log('🔄 TESTING: Setting up repeat reminder:', repeatType);
      setSelectedRepeat(repeatType);
      
      // Calculate next reminder time based on repeat type
      const currentTime = new Date(reminder.reminderDateTime || reminder.reminderTime);
      let nextTime = new Date(currentTime);
      
      console.log('📅 Current reminder time:', currentTime.toLocaleString());
      
      switch (repeatType) {
        case 'none':
          Alert.alert(
            'No Repeat',
            'This reminder will not repeat. It will only trigger once.',
            [{ text: 'OK' }]
          );
          return;
        case 'hourly':
          nextTime.setHours(nextTime.getHours() + 1);
          console.log('📅 Next hourly reminder:', nextTime.toLocaleString());
          break;
        case 'daily':
          nextTime.setDate(nextTime.getDate() + 1);
          console.log('📅 Next daily reminder:', nextTime.toLocaleString());
          break;
        case 'weekly':
          nextTime.setDate(nextTime.getDate() + 7);
          console.log('📅 Next weekly reminder:', nextTime.toLocaleString());
          break;
        case 'monthly':
          nextTime.setMonth(nextTime.getMonth() + 1);
          console.log('📅 Next monthly reminder:', nextTime.toLocaleString());
          break;
        case 'yearly':
          nextTime.setFullYear(nextTime.getFullYear() + 1);
          console.log('📅 Next yearly reminder:', nextTime.toLocaleString());
          break;
        case 'custom':
          Alert.alert(
            'Custom Repeat',
            'Custom repeat interval coming soon! For now, please use predefined options.',
            [{ text: 'OK' }]
          );
          return;
        default:
          console.warn('⚠️ Unknown repeat type:', repeatType);
          return;
      }

      // ✅ FIXED: Correct import path and better error handling
      console.log('📤 Importing reminder manager...');
      
      // Try different import approaches for reliability
      let reminderManager;
      try {
        reminderManager = (await import('../../services/reminderManager')).default;
      } catch (importError) {
        console.log('⚠️ First import failed, trying alternate path...');
        reminderManager = (await import('../../../crm/services/reminderManager')).default;
      }
      
      if (!reminderManager) {
        throw new Error('Reminder manager not available');
      }

      const newReminder = {
        ...reminder,
        id: `repeat-${repeatType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        reminderDateTime: nextTime.toISOString(),
        reminderTime: nextTime.toISOString(),
        note: `${reminder.note || 'Repeat reminder'} (${repeatType} repeat)`,
        title: `🔄 ${reminder.title || 'Reminder'} (${repeatType.charAt(0).toUpperCase() + repeatType.slice(1)})`,
        repeatType: repeatType,
        originalId: reminder.id,
        status: 'pending',
        triggered: false,
        createdAt: new Date().toISOString()
      };

      console.log('📋 Creating repeat reminder:', newReminder);
      
      const addedReminder = await reminderManager.addReminder(newReminder);
      console.log('✅ Repeat reminder added:', addedReminder.id);
      
      // Force check after 2 seconds
      setTimeout(() => {
        reminderManager.forceCheck();
        console.log('🔄 Forced check for new repeat reminder');
      }, 2000);
      
      Alert.alert(
        '✅ Repeat Reminder Set!',
        `Next ${repeatType} reminder set for:\n📅 ${nextTime.toLocaleString()}\n\n🔔 You will get popup at this time!`,
        [
          { 
            text: 'Perfect!', 
            onPress: () => {
              console.log('✅ Repeat reminder dialog closed');
              onClose(`repeat_${repeatType}`);
            }
          }
        ]
      );
      
      console.log(`🎉 ${repeatType} repeat reminder created successfully!`);
    } catch (error) {
      console.error('❌ COMPLETE Error setting repeat reminder:', error);
      console.error('❌ Error stack:', error.stack);
      Alert.alert(
        'Error', 
        `Failed to set repeat reminder: ${error.message}. Please try again.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleDismiss = () => {
    onClose('');
  };

  const handleViewProfile = () => {
    // Navigate to enquiry detail screen
    if (reminder && navigation) {
      console.log('📋 ===== VIEW PROFILE CLICKED =====');
      console.log('📋 Full reminder data:', JSON.stringify(reminder, null, 2));
      
      // Close the popup first
      onClose('');
      
      // Try to find enquiry ID from reminder data (multiple fallbacks)
      const enquiryId = reminder.enquiryId || reminder._id || reminder.id;
      
      console.log('🔍 Extracted enquiry ID:', enquiryId);
      console.log('🔍 From reminder.enquiryId:', reminder.enquiryId);
      console.log('🔍 From reminder._id:', reminder._id);
      console.log('🔍 From reminder.id:', reminder.id);
      
      if (enquiryId) {
        // Navigate to Enquiry Detail Screen
        console.log('🧭 Navigating to EnquiryDetailScreen with params:', {
          enquiryId: enquiryId,
          clientName: reminder.name || reminder.clientName,
          fromNotification: true
        });
        
        navigation.navigate('EnquiryDetailScreen', { 
          enquiryId: enquiryId,
          clientName: reminder.name || reminder.clientName,
          fromNotification: true
        });
        console.log('✅ Navigation command sent to EnquiryDetailScreen');
      } else {
        console.warn('⚠️ No enquiry ID found in reminder');
        console.warn('⚠️ Reminder keys:', Object.keys(reminder));
        Alert.alert('Error', 'Cannot open profile. Enquiry ID not found in reminder data.');
      }
    } else {
      console.warn('⚠️ Navigation not available or reminder missing');
      console.warn('⚠️ Navigation:', navigation ? 'Available' : 'NOT Available');
      console.warn('⚠️ Reminder:', reminder ? 'Available' : 'NOT Available');
      Alert.alert('Error', 'Cannot navigate to profile at this time.');
    }
  };

  const handleSnooze = async (minutes) => {
    try {
      console.log(`⏰ TESTING: Snoozing reminder for ${minutes} minutes`);
      
      // Calculate snooze time
      const snoozeTime = new Date(Date.now() + minutes * 60000);
      console.log('⏰ Current time:', new Date().toLocaleString());
      console.log('⏰ Snooze time will be:', snoozeTime.toLocaleString());
      
      // ✅ FIXED: Better import and error handling
      console.log('📤 Importing reminder manager for snooze...');
      
      // Try different import approaches for reliability
      let reminderManager;
      try {
        reminderManager = (await import('../../services/reminderManager')).default;
      } catch (importError) {
        console.log('⚠️ First import failed, trying alternate path...');
        reminderManager = (await import('../../../crm/services/reminderManager')).default;
      }
      
      if (!reminderManager) {
        throw new Error('Reminder manager not available');
      }

      const snoozedReminder = {
        ...reminder,
        id: `snooze-${minutes}min-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        reminderDateTime: snoozeTime.toISOString(),
        reminderTime: snoozeTime.toISOString(),
        note: `${reminder.note || 'Snoozed reminder'} (snoozed ${minutes} min)`,
        title: `⏰ ${reminder.title || 'Reminder'} (Snoozed ${minutes}min)`,
        snoozeMinutes: minutes,
        snoozeOriginalId: reminder.id,
        status: 'pending',
        triggered: false,
        createdAt: new Date().toISOString()
      };

      console.log('📋 Creating snoozed reminder:', snoozedReminder);
      
      const addedReminder = await reminderManager.addReminder(snoozedReminder);
      console.log('✅ Snoozed reminder added:', addedReminder.id);

      // Force check after 3 seconds (to ensure it's registered)
      setTimeout(() => {
        reminderManager.forceCheck();
        console.log('🔄 Forced check for new snoozed reminder');
      }, 3000);
      
      Alert.alert(
        '⏰ Reminder Snoozed!',
        `Reminder will popup again in ${minutes} minutes:\n📅 At ${snoozeTime.toLocaleTimeString()}\n\n🔔 You will get popup with sound + vibration!`,
        [
          { 
            text: 'Perfect!', 
            onPress: () => {
              console.log(`✅ ${minutes}min snooze dialog closed`);
              onClose(`snoozed_${minutes}min`);
            }
          }
        ]
      );
      
      console.log(`🎉 Reminder snoozed for ${minutes} minutes successfully!`);
    } catch (error) {
      console.error('❌ COMPLETE Error snoozing reminder:', error);
      console.error('❌ Error stack:', error.stack);
      Alert.alert(
        'Error', 
        `Failed to snooze reminder: ${error.message}. Please try again.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleComplete = () => {
    if (response.trim().length < 10) {
      Alert.alert('Validation', 'Please enter at least 10 words in your response');
      return;
    }
    onClose(response);
  };

  const formatDateTime = (dateTime) => {
    try {
      const date = new Date(dateTime);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return dateTime;
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Icon name="notifications-active" size={28} color="#ffffff" />
            <Text style={styles.headerTitle}>Enquiry Reminder</Text>
            {/* ✅ ENHANCED: Sound indicator */}
            <View style={styles.soundIndicator}>
              <Icon name="volume-up" size={20} color="#ffffff" />
            </View>
            <TouchableOpacity onPress={() => onClose('')} style={styles.closeButton}>
              <Icon name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Date Time Badge */}
          <View style={styles.dateTimeBadge}>
            <Icon name="access-time" size={16} color="#10b981" />
            <Text style={styles.dateTimeText}>
              {formatDateTime(reminder.reminderDateTime || reminder.reminderTime)}
            </Text>
            <View style={styles.leadBadge}>
              <Text style={styles.leadBadgeText}>Lead</Text>
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.reminderTitle}>
              {reminder.title || `Enquiry Reminder: ${reminder.name}`}
            </Text>
          </View>

          {/* Note */}
          {reminder.note && (
            <View style={styles.noteSection}>
              <Text style={styles.noteText}>{reminder.note}</Text>
            </View>
          )}

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Details Cards */}
            <View style={styles.cardsContainer}>
              {/* Reminder Details */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Icon name="bookmark" size={18} color="#6366f1" />
                  <Text style={styles.cardTitle}>Reminder Details</Text>
                </View>
                <View style={styles.cardContent}>
                  <DetailRow label="Type:" value="Client Lead" />
                  <DetailRow label="Status:" value={reminder.status || 'Pending'} />
                  <DetailRow label="Created:" value={formatDateTime(reminder.createdAt || new Date())} />
                </View>
              </View>

              {/* Client Information */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Icon name="person" size={18} color="#ec4899" />
                  <Text style={styles.cardTitle}>Client Information</Text>
                </View>
                <View style={styles.cardContent}>
                  <DetailRow label="Name:" value={reminder.name} />
                  <DetailRow label="Phone:" value={reminder.phone || reminder.contactNumber} />
                  <DetailRow label="Location:" value={reminder.location} />
                </View>
              </View>

              {/* Enquiry Details */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Icon name="info" size={18} color="#3b82f6" />
                  <Text style={styles.cardTitle}>Enquiry Details</Text>
                </View>
                <View style={styles.cardContent}>
                  <DetailRow label="S.No:" value={reminder.serialNumber} />
                  <DetailRow label="Product Type:" value={reminder.productType} />
                  <DetailRow label="Case Status:" value={reminder.caseStatus} />
                  <DetailRow label="Source:" value={reminder.source} />
                </View>
              </View>

              {/* Additional Info */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Icon name="article" size={18} color="#f59e0b" />
                  <Text style={styles.cardTitle}>Additional Info</Text>
                </View>
                <View style={styles.cardContent}>
                  <DetailRow label="Client Code:" value={reminder.clientCode} />
                  <DetailRow label="Project Code:" value={reminder.projectCode} />
                  <DetailRow label="Action Plan:" value={reminder.actionPlan || 'Week/Action reminder'} />
                </View>
              </View>
            </View>

            {/* Response Section */}
            <View style={styles.responseSection}>
              <Text style={styles.responseLabel}>
                Complete with Response: <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.responseInput}
                placeholder="Enter your response (minimum 10 words recommended)..."
                multiline
                numberOfLines={4}
                value={response}
                onChangeText={setResponse}
                textAlignVertical="top"
              />
              <Text style={styles.wordCount}>
                Words: {response.trim().split(/\s+/).filter(w => w).length} (Min: 10 words)
              </Text>
            </View>

            {/* ✅ ENHANCED: Repeat Options Section */}
            <View style={styles.repeatSection}>
              <Text style={styles.sectionTitle}>🔄 Repeat Options</Text>
              <View style={styles.repeatOptions}>
                <TouchableOpacity
                  style={[styles.repeatButton, selectedRepeat === 'none' && styles.repeatButtonSelected]}
                  onPress={() => handleRepeat('none')}
                >
                  <Icon name="block" size={18} color={selectedRepeat === 'none' ? '#ffffff' : '#6b7280'} />
                  <Text style={[styles.repeatButtonText, selectedRepeat === 'none' && styles.repeatButtonTextSelected]}>
                    Does not repeat
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.repeatButton, selectedRepeat === 'hourly' && styles.repeatButtonSelected]}
                  onPress={() => handleRepeat('hourly')}
                >
                  <Icon name="access-time" size={18} color={selectedRepeat === 'hourly' ? '#ffffff' : '#ec4899'} />
                  <Text style={[styles.repeatButtonText, selectedRepeat === 'hourly' && styles.repeatButtonTextSelected]}>
                    Hourly
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.repeatButton, selectedRepeat === 'daily' && styles.repeatButtonSelected]}
                  onPress={() => handleRepeat('daily')}
                >
                  <Icon name="today" size={18} color={selectedRepeat === 'daily' ? '#ffffff' : '#10b981'} />
                  <Text style={[styles.repeatButtonText, selectedRepeat === 'daily' && styles.repeatButtonTextSelected]}>
                    Daily
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.repeatButton, selectedRepeat === 'weekly' && styles.repeatButtonSelected]}
                  onPress={() => handleRepeat('weekly')}
                >
                  <Icon name="date-range" size={18} color={selectedRepeat === 'weekly' ? '#ffffff' : '#3b82f6'} />
                  <Text style={[styles.repeatButtonText, selectedRepeat === 'weekly' && styles.repeatButtonTextSelected]}>
                    Weekly
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.repeatButton, selectedRepeat === 'monthly' && styles.repeatButtonSelected]}
                  onPress={() => handleRepeat('monthly')}
                >
                  <Icon name="event" size={18} color={selectedRepeat === 'monthly' ? '#ffffff' : '#8b5cf6'} />
                  <Text style={[styles.repeatButtonText, selectedRepeat === 'monthly' && styles.repeatButtonTextSelected]}>
                    Monthly
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.repeatButton, selectedRepeat === 'yearly' && styles.repeatButtonSelected]}
                  onPress={() => handleRepeat('yearly')}
                >
                  <Icon name="cake" size={18} color={selectedRepeat === 'yearly' ? '#ffffff' : '#f97316'} />
                  <Text style={[styles.repeatButtonText, selectedRepeat === 'yearly' && styles.repeatButtonTextSelected]}>
                    Yearly
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.repeatButton, selectedRepeat === 'custom' && styles.repeatButtonSelected]}
                  onPress={() => handleRepeat('custom')}
                >
                  <Icon name="tune" size={18} color={selectedRepeat === 'custom' ? '#ffffff' : '#6366f1'} />
                  <Text style={[styles.repeatButtonText, selectedRepeat === 'custom' && styles.repeatButtonTextSelected]}>
                    Custom...
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ✅ NEW: Snooze Options Section */}
            <View style={styles.snoozeSection}>
              <Text style={styles.sectionTitle}>⏰ Snooze Options</Text>
              <View style={styles.snoozeOptions}>
                <TouchableOpacity
                  style={styles.snoozeButton}
                  onPress={() => handleSnooze(5)}
                >
                  <Icon name="snooze" size={16} color="#f59e0b" />
                  <Text style={styles.snoozeButtonText}>5 min</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.snoozeButton}
                  onPress={() => handleSnooze(15)}
                >
                  <Icon name="snooze" size={16} color="#f59e0b" />
                  <Text style={styles.snoozeButtonText}>15 min</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.snoozeButton}
                  onPress={() => handleSnooze(30)}
                >
                  <Icon name="snooze" size={16} color="#f59e0b" />
                  <Text style={styles.snoozeButtonText}>30 min</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.snoozeButton}
                  onPress={() => handleSnooze(60)}
                >
                  <Icon name="snooze" size={16} color="#f59e0b" />
                  <Text style={styles.snoozeButtonText}>1 hour</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* ✅ ENHANCED: Footer Actions with View Profile, Repeat and Dismiss */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
              <Icon name="close" size={20} color="#ffffff" />
              <Text style={styles.dismissButtonText}>Dismiss</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.viewProfileButton} onPress={handleViewProfile}>
              <Icon name="person" size={20} color="#ffffff" />
              <Text style={styles.viewProfileButtonText}>View Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.callButton} onPress={handleCall}>
              <Icon name="phone" size={20} color="#ffffff" />
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.completeButton, !response.trim() && styles.buttonDisabled]} 
              onPress={handleComplete}
              disabled={!response.trim()}
            >
              <Icon name="check-circle" size={20} color="#ffffff" />
              <Text style={styles.completeButtonText}>Complete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value || 'N/A'}</Text>
  </View>
);

const { TextInput } = require('react-native');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    padding: 16,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  soundIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 6,
    marginLeft: 8,
  },
  dateTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dateTimeText: {
    flex: 1,
    fontSize: 14,
    color: '#166534',
    fontWeight: '500',
  },
  leadBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  leadBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  titleSection: {
    backgroundColor: '#dbeafe',
    padding: 16,
    alignItems: 'center',
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    textAlign: 'center',
  },
  noteSection: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  noteText: {
    fontSize: 14,
    color: '#92400e',
    fontStyle: 'italic',
  },
  scrollContent: {
    maxHeight: 400,
  },
  cardsContainer: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  cardContent: {
    padding: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    minWidth: 120,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '400',
  },
  responseSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  responseInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    minHeight: 100,
    backgroundColor: '#ffffff',
  },
  wordCount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  repeatSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  repeatOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  repeatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    gap: 6,
    minWidth: '30%',
  },
  repeatButtonSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  repeatButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  repeatButtonTextSelected: {
    color: '#ffffff',
  },
  snoozeSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fef3c7',
  },
  snoozeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 6,
  },
  snoozeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f59e0b',
    gap: 4,
  },
  snoozeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  callButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6b7280',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  dismissButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  viewProfileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  viewProfileButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ec4899',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default ReminderPopup;
