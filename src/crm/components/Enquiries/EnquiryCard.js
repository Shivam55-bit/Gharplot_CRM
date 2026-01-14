/**
 * Enquiry Card Component
 * Displays individual enquiry with all details and actions
 * Updated with ReminderNotificationService for background notifications
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
import SourceBadge from './SourceBadge';
import AssignmentBadge from './AssignmentBadge';
import PriorityBadge from './PriorityBadge';
import ReminderNotificationService from '../../../services/ReminderNotificationService';

const EnquiryCard = ({ 
  enquiry, 
  isSelected, 
  onSelect, 
  onPress, 
  onSetReminder, 
  onFollowUp, 
  onUnassign,
  canSelect = true,
  showCheckbox = false,
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
    });
  };

  const formatPrice = (price) => {
    if (!price || price === 'N/A' || typeof price === 'object') return 'N/A';
    if (typeof price === 'number') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price);
    }
    return String(price);
  };

  // 🔔 QUICK REMINDER: Set reminder for 1 hour from now using ReminderNotificationService
  const handleQuickReminder = async () => {
    try {
      // Set reminder for 1 hour from now
      const reminderDate = new Date();
      reminderDate.setHours(reminderDate.getHours() + 1);

      const reminderData = {
        id: `reminder_${enquiry._id}_${Date.now()}`,
        clientName: enquiry.clientName,
        message: `Follow up with ${enquiry.clientName} regarding property inquiry`,
        scheduledDate: reminderDate,
        enquiryId: enquiry._id,
        enquiry: enquiry,
        // Enhanced navigation configuration for notification click
        targetScreen: 'EnquiryDetails',
        navigationType: 'nested',
        navigationData: {
          enquiryId: enquiry._id,
          clientName: enquiry.clientName,
          reminderType: 'quick_follow_up',
          enquiry: enquiry,
          showDetails: true,
          scrollToEnquiry: true,
        },
      };

      const result = await ReminderNotificationService.scheduleReminder(reminderData);
      
      if (result.success) {
        Alert.alert(
          'Reminder Set!',
          `🔔 Reminder scheduled for ${reminderDate.toLocaleString()}\n\nYou will receive a notification even if the app is closed.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to set reminder');
      }
    } catch (error) {
      console.error('❌ Failed to set quick reminder:', error);
      Alert.alert('Error', 'Failed to set reminder. Please try again.');
    }
  };

  // Safe value extraction to prevent object rendering
  const safePropertyId = typeof enquiry.propertyId === 'object' 
    ? enquiry.propertyId?._id || 'N/A' 
    : enquiry.propertyId || 'N/A';
    
  const safeAreaDetails = typeof enquiry.areaDetails === 'object' 
    ? 'N/A' 
    : enquiry.areaDetails;

  const isAssigned = !!enquiry.assignment;
  const canSelectItem = canSelect && !isAssigned;

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header with badges and selection */}
      <View style={styles.header}>
        <View style={styles.badgesContainer}>
          <SourceBadge source={enquiry.source} enquiryType={enquiry.enquiryType} />
          {enquiry.assignment?.priority && (
            <PriorityBadge priority={enquiry.assignment.priority} />
          )}
        </View>
        
        <View style={styles.rightHeader}>
          {isAssigned && <AssignmentBadge assignment={enquiry.assignment} />}
          {showCheckbox && (
            <TouchableOpacity
              style={[
                styles.checkbox,
                isSelected && styles.checkboxSelected,
                !canSelectItem && styles.checkboxDisabled,
              ]}
              onPress={() => canSelectItem && onSelect()}
              disabled={!canSelectItem}
            >
              {isSelected && <Text style={{ fontSize: 16, color: '#ffffff' }}>✓</Text>}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Client Information */}
      <View style={styles.clientSection}>
        <Text style={styles.clientName}>{enquiry.clientName}</Text>
        <Text style={styles.propertyId}>ID: {safePropertyId}</Text>
      </View>

      {/* Contact Details */}
      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Text style={{ fontSize: 16, color: '#6b7280' }}>📞</Text>
          <Text style={styles.detailText}>{enquiry.contactNumber}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={{ fontSize: 16, color: '#6b7280' }}>📧</Text>
          <Text style={styles.detailText}>{enquiry.email}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={{ fontSize: 16, color: '#6b7280' }}>📍</Text>
          <Text style={styles.detailText}>{enquiry.propertyLocation}</Text>
        </View>
      </View>

      {/* Property Information */}
      {enquiry.propertyType !== 'N/A' && (
        <View style={styles.propertySection}>
          <View style={styles.detailRow}>
            <Text style={{ fontSize: 16, color: '#6b7280' }}>🏠</Text>
            <Text style={styles.detailText}>{enquiry.propertyType}</Text>
          </View>
          {enquiry.price !== 'N/A' && (
            <View style={styles.detailRow}>
              <Text style={{ fontSize: 16, color: '#6b7280' }}>₹</Text>
              <Text style={styles.detailText}>{formatPrice(enquiry.price)}</Text>
            </View>
          )}
          {safeAreaDetails !== 'N/A' && (
            <View style={styles.detailRow}>
              <Text style={{ fontSize: 16, color: '#6b7280' }}>□</Text>
              <Text style={styles.detailText}>{safeAreaDetails}</Text>
            </View>
          )}
        </View>
      )}

      {/* Date and Status */}
      <View style={styles.metaSection}>
        <Text style={styles.dateText}>📅 {formatDate(enquiry.createdAt)}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(enquiry.status) }
        ]}>
          <Text style={styles.statusText}>{enquiry.status || 'pending'}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        {/* Custom Reminder Button */}
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            styles.reminderButton,
            { backgroundColor: enquiry.source === 'client' ? '#e0f2fe' : '#f0f9ff' }
          ]} 
          onPress={() => onSetReminder(enquiry)}
        >
          <Text style={{ fontSize: 18, color: '#3b82f6' }}>🔔</Text>
          <Text style={styles.actionText}>
            {enquiry.source === 'client' ? 'Set Reminder' : 'Reminder'}
          </Text>
        </TouchableOpacity>
        
        {isAssigned && (
          <TouchableOpacity style={[styles.actionButton, styles.unassignButton]} onPress={() => onUnassign(enquiry)}>
            <Text style={{ fontSize: 18, color: '#ef4444' }}>🚫</Text>
            <Text style={styles.actionText}>Unassign</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending': return '#f59e0b';
    case 'resolved': return '#10b981';
    case 'closed': return '#6b7280';
    case 'in progress': return '#3b82f6';
    default: return '#6b7280';
  }
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#f0f9ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkboxDisabled: {
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  clientSection: {
    marginBottom: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  propertyId: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailsSection: {
    gap: 8,
    marginBottom: 12,
  },
  propertySection: {
    gap: 6,
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
  dateText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reminderButton: {
    borderColor: '#bfdbfe',
  },
  followUpButton: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  unassignButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  quickReminderButton: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
  },
});

export default EnquiryCard;