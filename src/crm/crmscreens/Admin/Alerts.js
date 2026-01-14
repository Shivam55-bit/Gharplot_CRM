import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as crmAlertApi from '../../services/crmAlertApi';
import AlertNotificationService from '../../../services/AlertNotificationService';

const AlertsScreen = ({ navigation }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async (params = {}) => {
    try {
      setLoading(true);
      const response = await crmAlertApi.getSystemAlerts(params);
      const data = response?.alerts || response?.data || [];
      setAlerts(Array.isArray(data) ? data : []);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toISOString().split('T')[0];
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toTimeString().slice(0, 5);
  };

  const handleFilter = () => {
    const params = {};
    if (startDate) params.startDate = formatDate(startDate);
    if (endDate) params.endDate = formatDate(endDate);
    fetchAlerts(params);
  };

  const clearFilter = () => {
    setStartDate(null);
    setEndDate(null);
    fetchAlerts();
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Alert', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            // Delete from backend
            await crmAlertApi.deleteSystemAlert(id);
            
            // Cancel scheduled notification
            await AlertNotificationService.cancelAlert(id);
            console.log('✅ Alert and notification deleted:', id);
            
            // Refresh list
            fetchAlerts();
          } catch (error) {
            console.error('Error deleting alert:', error);
            Alert.alert('Error', 'Failed to delete alert');
          }
        },
      },
    ]);
  };

  const handleEdit = (alert) => {
    console.log('📝 Editing alert:', alert._id);
    navigation.navigate('EditAlert', {
      alertId: alert._id,
      originalTitle: alert.title,
      originalReason: alert.reason,
      originalDate: alert.date,
      originalTime: alert.time,
      repeatDaily: alert.repeatDaily
    });
  };

  /* ================= MOBILE CARD ================= */
  const renderRow = ({ item }) => {
    const created = item.createdAt || item.date;

    return (
      <View style={styles.alertCard}>
        <Text style={styles.cardDate}>
          {formatDate(created)} • {formatTime(created)}
        </Text>

        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title || item.reason}
        </Text>
        
        {item.title && (
          <Text style={styles.cardReason} numberOfLines={2}>
            {item.reason}
          </Text>
        )}

        <View style={styles.badgeRow}>
          <View
            style={[
              styles.badge,
              item.repeatDaily ? styles.badgeYes : styles.badgeNo,
            ]}
          >
            <Text style={styles.badgeText}>
              {item.repeatDaily ? 'REPEAT: YES' : 'REPEAT: NO'}
            </Text>
          </View>

          <View
            style={[
              styles.badge,
              item.isActive ? styles.badgeActive : styles.badgeInactive,
            ]}
          >
            <Text style={styles.badgeText}>
              {item.isActive ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => handleEdit(item)}
          >
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item._id || item.id)}
          >
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.topRow}>
        <Text style={styles.title}>Alert Management</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateAlert')}
        >
          <Text style={styles.createBtnText}>+ Create Alert</Text>
        </TouchableOpacity>
      </View>

      {/* Filter */}
      <View style={styles.filterCard}>
        <View style={styles.inputRow}>
          <View style={styles.inputCol}>
            <Text style={styles.label}>Start Date</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowStartPicker(true)}
            >
              <Text>
                {startDate ? formatDate(startDate) : 'dd-mm-yyyy'}
              </Text>
              <Icon name="calendar-outline" size={18} />
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={startDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(e, d) => {
                  setShowStartPicker(false);
                  if (d) setStartDate(d);
                }}
              />
            )}
          </View>

          <View style={styles.inputCol}>
            <Text style={styles.label}>End Date</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowEndPicker(true)}
            >
              <Text>{endDate ? formatDate(endDate) : 'dd-mm-yyyy'}</Text>
              <Icon name="calendar-outline" size={18} />
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={endDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(e, d) => {
                  setShowEndPicker(false);
                  if (d) setEndDate(d);
                }}
              />
            )}
          </View>
        </View>

        <View style={styles.filterActions}>
          <TouchableOpacity style={styles.filterBtn} onPress={handleFilter}>
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearBtn} onPress={clearFilter}>
            <Text style={styles.filterText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={alerts}
          renderItem={renderRow}
          keyExtractor={(i) => i._id || i.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 40 }}>
              No alerts found
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default AlertsScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    alignItems: 'center',
  },

  title: { fontSize: 18, fontWeight: '700' },

  createBtn: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },

  createBtnText: { color: '#fff', fontWeight: '700' },

  filterCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    elevation: 2,
  },

  inputRow: { flexDirection: 'row' },

  inputCol: { flex: 1, marginRight: 8 },

  label: { fontSize: 12, color: '#6b7280', marginBottom: 6 },

  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
  },

  filterActions: {
    flexDirection: 'row',
    marginTop: 12,
  },

  filterBtn: {
    backgroundColor: '#0ea5e9',
    padding: 10,
    borderRadius: 6,
    marginRight: 8,
  },

  clearBtn: {
    backgroundColor: '#ef4444',
    padding: 10,
    borderRadius: 6,
  },

  filterText: { color: '#fff', fontWeight: '700' },

  /* CARD */
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
  },

  cardDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 6,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    color: '#111827',
  },

  cardReason: {
    fontSize: 14,
    marginBottom: 10,
    color: '#6b7280',
    fontStyle: 'italic',
  },

  badgeRow: { flexDirection: 'row', marginBottom: 12 },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },

  badgeYes: { backgroundColor: '#dcfce7' },
  badgeNo: { backgroundColor: '#fee2e2' },
  badgeActive: { backgroundColor: '#bbf7d0' },
  badgeInactive: { backgroundColor: '#e5e7eb' },

  badgeText: { fontSize: 12, fontWeight: '700' },

  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  editBtn: {
    backgroundColor: '#2563eb',
    padding: 10,
    borderRadius: 6,
    marginRight: 10,
  },

  deleteBtn: {
    backgroundColor: '#ef4444',
    padding: 10,
    borderRadius: 6,
  },

  actionText: { color: '#fff', fontWeight: '700' },
});
