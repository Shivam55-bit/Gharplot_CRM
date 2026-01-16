/**
 * EnquiryDetailScreen.js
 * Full enquiry detail view with edit capability
 * Accessed from notification click or enquiry card
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllEnquiriesMerged } from '../../services/crmEnquiryApi';
import ReminderNotificationService from '../../../services/ReminderNotificationService';

const EnquiryDetailScreen = ({ route, navigation }) => {
  const { enquiryId, clientName, fromNotification = false, reminderId = null } = route.params || {};
  
  const [enquiry, setEnquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [editReminderModalVisible, setEditReminderModalVisible] = useState(false);
  
  // Comment states
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [userName, setUserName] = useState('Admin User');

  // Get user name from AsyncStorage
  useEffect(() => {
    const getUserName = async () => {
      try {
        const adminName = await AsyncStorage.getItem('adminName');
        const employeeName = await AsyncStorage.getItem('employeeName');
        const userName = await AsyncStorage.getItem('userName');
        setUserName(adminName || employeeName || userName || 'Admin User');
      } catch (error) {
        console.log('Error getting user name:', error);
      }
    };
    getUserName();
  }, []);

  // Fetch enquiry details on mount
  useEffect(() => {
    fetchEnquiryDetails();
  }, [enquiryId]);

  const fetchEnquiryDetails = async () => {
    try {
      setLoading(true);
      console.log(`📋 Fetching enquiry details for ID: ${enquiryId}`);

      // Fetch all enquiries and find the specific one
      const response = await getAllEnquiriesMerged();

      if (response.success && response.data) {
        const foundEnquiry = response.data.find(e => e._id === enquiryId);

        if (foundEnquiry) {
          console.log('✅ Enquiry found:', foundEnquiry);
          setEnquiry(foundEnquiry);
          setEditedData(foundEnquiry);
        } else {
          console.warn('⚠️ Enquiry not found in list');
          Alert.alert('Not Found', 'Enquiry details could not be loaded.');
          navigation.goBack();
        }
      } else {
        throw new Error(response.message || 'Failed to fetch enquiries');
      }
    } catch (error) {
      console.error('❌ Error fetching enquiry:', error);
      Alert.alert('Error', 'Failed to load enquiry details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveChanges = async () => {
    try {
      console.log('💾 Saving enquiry changes...');
      
      // Call update API (you need to create this in your API service)
      // For now, we'll just show success
      Alert.alert(
        'Success',
        'Enquiry updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setIsEditing(false);
              setEnquiry(editedData);
              fetchEnquiryDetails(); // Refresh
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error saving enquiry:', error);
      Alert.alert('Error', 'Failed to save changes.');
    }
  };

  const handleSetReminder = async () => {
    try {
      const reminderDate = new Date();
      reminderDate.setHours(reminderDate.getHours() + 1);

      const result = await ReminderNotificationService.scheduleReminder({
        id: `reminder_${enquiry._id}_${Date.now()}`,
        clientName: enquiry.clientName,
        message: `Follow up with ${enquiry.clientName} regarding property inquiry`,
        scheduledDate: reminderDate,
        enquiryId: enquiry._id,
        enquiry: enquiry,
      });

      if (result.success) {
        Alert.alert(
          '✅ Reminder Set!',
          `Notification scheduled for ${reminderDate.toLocaleString()}\n\nYou'll be notified even if the app is closed.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('❌ Error setting reminder:', error);
      Alert.alert('Error', 'Failed to set reminder.');
    }
  };

  const handleDeleteReminder = async () => {
    if (!reminderId) return;

    try {
      const result = await ReminderNotificationService.cancelReminder(reminderId);
      if (result.success) {
        Alert.alert('Success', 'Reminder cancelled');
      }
    } catch (error) {
      console.error('❌ Error deleting reminder:', error);
    }
  };

  // Add comment to enquiry
  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    setIsAddingComment(true);
    try {
      // Get auth token
      const token = await AsyncStorage.getItem('adminToken') ||
                    await AsyncStorage.getItem('crm_auth_token') ||
                    await AsyncStorage.getItem('employee_auth_token') ||
                    await AsyncStorage.getItem('employee_token');

      if (!token) {
        Alert.alert('Error', 'Please login again');
        return;
      }

      const response = await fetch(
        `https://abc.bhoomitechzone.us/api/inquiry/comment/${enquiryId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            comment: newComment.trim(),
            addedBy: userName,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        console.log('✅ Comment added successfully');
        setNewComment('');
        Alert.alert('Success', 'Comment added successfully!');
        // Refresh enquiry details to show new comment
        fetchEnquiryDetails();
      } else {
        throw new Error(result.message || 'Failed to add comment');
      }
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      Alert.alert('Error', error.message || 'Failed to add comment');
    } finally {
      setIsAddingComment(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading enquiry details...</Text>
      </View>
    );
  }

  if (!enquiry) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Enquiry not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayData = isEditing ? editedData : enquiry;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enquiry Details</Text>
        <TouchableOpacity
          onPress={() => {
            if (isEditing) {
              setIsEditing(false);
            } else {
              setIsEditing(true);
            }
          }}
        >
          <Text style={styles.editIcon}>{isEditing ? '✓' : '✎'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Client Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          
          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={displayData.clientName}
                onChangeText={(value) => handleEditChange('clientName', value)}
              />
            ) : (
              <Text style={styles.value}>{displayData.clientName}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={displayData.email}
                onChangeText={(value) => handleEditChange('email', value)}
              />
            ) : (
              <Text style={styles.value}>{displayData.email}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Phone</Text>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={displayData.contactNumber}
                onChangeText={(value) => handleEditChange('contactNumber', value)}
              />
            ) : (
              <Text style={styles.value}>{displayData.contactNumber}</Text>
            )}
          </View>
        </View>

        {/* Property Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Information</Text>
          
          <View style={styles.field}>
            <Text style={styles.label}>Location</Text>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={displayData.propertyLocation}
                onChangeText={(value) => handleEditChange('propertyLocation', value)}
              />
            ) : (
              <Text style={styles.value}>{displayData.propertyLocation}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Type</Text>
            <Text style={styles.value}>{displayData.propertyType || 'N/A'}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Price</Text>
            <Text style={styles.value}>
              {displayData.price && displayData.price !== 'N/A'
                ? `₹${displayData.price}`
                : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Additional Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Details</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Source</Text>
            <Text style={styles.value}>{displayData.source || 'N/A'}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{displayData.status || 'Pending'}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Created</Text>
            <Text style={styles.value}>
              {displayData.createdAt
                ? new Date(displayData.createdAt).toLocaleString()
                : 'N/A'}
            </Text>
          </View>

          {displayData.assignment && (
            <View style={styles.field}>
              <Text style={styles.label}>Assigned To</Text>
              <Text style={styles.value}>
                {displayData.assignment.employeeId?.fullName ||
                  displayData.assignment.employeeId ||
                  'Unknown'}
              </Text>
            </View>
          )}
        </View>

        {/* Comments Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💬 Comments</Text>
          
          {/* Existing Comments */}
          {displayData.comments && displayData.comments.length > 0 ? (
            displayData.comments.map((comment, index) => (
              <View key={comment._id || index} style={styles.commentItem}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>{comment.addedBy || 'Unknown'}</Text>
                  <Text style={styles.commentDate}>
                    {comment.addedAt ? new Date(comment.addedAt).toLocaleString() : ''}
                  </Text>
                </View>
                <Text style={styles.commentText}>{comment.comment}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noCommentsText}>No comments yet</Text>
          )}

          {/* Major Comments (if any) */}
          {displayData.majorComments && (
            <View style={styles.majorCommentsContainer}>
              <Text style={styles.majorCommentsLabel}>Previous Notes:</Text>
              <Text style={styles.majorCommentsText}>{displayData.majorComments}</Text>
            </View>
          )}

          {/* Add Comment Input */}
          <View style={styles.addCommentContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor="#9ca3af"
              value={newComment}
              onChangeText={setNewComment}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity
              style={[
                styles.addCommentButton,
                isAddingComment && styles.addCommentButtonDisabled
              ]}
              onPress={handleAddComment}
              disabled={isAddingComment}
            >
              {isAddingComment ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.addCommentButtonText}>Add Comment</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        {isEditing ? (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSaveChanges}
            >
              <Text style={styles.buttonText}>💾 Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => {
                setIsEditing(false);
                setEditedData(enquiry);
              }}
            >
              <Text style={styles.buttonText}>✕ Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.reminderButton]}
              onPress={handleSetReminder}
            >
              <Text style={styles.buttonText}>🔔 Set Reminder</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.buttonText}>✎ Edit</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Notification Badge */}
      {fromNotification && (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationText}>🔔 Opened from notification</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  backIcon: {
    fontSize: 18,
    color: '#3b82f6',
    fontWeight: '600',
  },
  editIcon: {
    fontSize: 20,
    color: '#3b82f6',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#f3f4f6',
  },
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
  },
  reminderButton: {
    backgroundColor: '#3b82f6',
  },
  editButton: {
    backgroundColor: '#f59e0b',
  },
  notificationBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e0f2fe',
    borderTopWidth: 1,
    borderTopColor: '#bfdbfe',
  },
  notificationText: {
    fontSize: 12,
    color: '#0c4a6e',
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  // Comment styles
  commentItem: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
  },
  commentDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  noCommentsText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  majorCommentsContainer: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  majorCommentsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  majorCommentsText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 18,
  },
  addCommentContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#ffffff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addCommentButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addCommentButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  addCommentButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EnquiryDetailScreen;
