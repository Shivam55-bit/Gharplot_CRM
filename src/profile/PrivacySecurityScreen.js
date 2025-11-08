import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  twoFactor: 'privacy_two_factor',
  dataSharing: 'privacy_data_sharing',
};

const PrivacySecurityScreen = ({ navigation }) => {
  const [twoFA, setTwoFA] = useState(false);
  const [dataSharing, setDataSharing] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem(KEYS.twoFactor);
        const d = await AsyncStorage.getItem(KEYS.dataSharing);
        if (t !== null) setTwoFA(t === '1');
        if (d !== null) setDataSharing(d === '1');
      } catch (e) {}
    })();
  }, []);

  const persist = async (key, value) => {
    try { await AsyncStorage.setItem(key, value ? '1' : '0'); } catch (e) {}
  };

  const toggleTwoFA = (v) => { setTwoFA(v); persist(KEYS.twoFactor, v); };
  const toggleDataSharing = (v) => { setDataSharing(v); persist(KEYS.dataSharing, v); };

  const confirmDelete = () => {
    Alert.alert('Delete account', 'Deleting your account is permanent. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        // TODO: hook into backend delete endpoint
        Alert.alert('Deleted', 'Your account deletion request has been submitted.');
      } }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#FF7A00" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <View>
            <Text style={styles.title}>Two-Factor Authentication</Text>
            <Text style={styles.subtitle}>Add an extra layer of security to your account</Text>
          </View>
          <Switch value={twoFA} onValueChange={toggleTwoFA} thumbColor={twoFA ? '#FF7A00' : undefined} />
        </View>

        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('ChangePasswordScreen')}>
          <View>
            <Text style={styles.title}>Change Password</Text>
            <Text style={styles.subtitle}>Update your password regularly</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#6B7280" />
        </TouchableOpacity>

        <View style={styles.row}>
          <View>
            <Text style={styles.title}>Data Sharing</Text>
            <Text style={styles.subtitle}>Allow limited sharing of usage data (improves service)</Text>
          </View>
          <Switch value={dataSharing} onValueChange={toggleDataSharing} thumbColor={dataSharing ? '#FF7A00' : undefined} />
        </View>

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' }]} onPress={() => Alert.alert('Download data', 'A data export will be prepared and emailed to you.')}>
          <Text style={[styles.actionText, { color: '#111827' }]}>Download my data</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' }]} onPress={confirmDelete}>
          <Text style={[styles.actionText, { color: '#B91C1C' }]}>Delete my account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton: { marginRight: 10 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  content: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 12 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 12 },
  title: { fontSize: 15, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  actionButton: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  actionText: { fontWeight: '700' },
});

export default PrivacySecurityScreen;
