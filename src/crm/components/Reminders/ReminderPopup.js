/**
 * Reminder Popup Component
 * Shows reminder popup at scheduled time (like website)
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ReminderPopup = ({ visible, onClose, reminder }) => {
  const [response, setResponse] = useState('');

  if (!reminder) return null;

  const handleCall = () => {
    if (reminder.phone || reminder.contactNumber) {
      const phone = reminder.phone || reminder.contactNumber;
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Error', 'Phone number not available');
    }
  };

  const handleDismiss = () => {
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
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.callButton} onPress={handleCall}>
              <Icon name="phone" size={20} color="#ffffff" />
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.dismissButton, !response.trim() && styles.buttonDisabled]} 
              onPress={handleDismiss}
              disabled={!response.trim()}
            >
              <Text style={styles.dismissButtonText}>Dismiss</Text>
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
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ec4899',
    paddingVertical: 14,
    borderRadius: 8,
  },
  dismissButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default ReminderPopup;
