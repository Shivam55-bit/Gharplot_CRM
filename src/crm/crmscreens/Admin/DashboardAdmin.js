import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import * as crmDashboardApi from '../../services/crmDashboardApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const AdminDashboardScreen = ({ navigation, user }) => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalProperty: 0,
    boughtProperty: 0,
    residentialProperty: 0,
    commercialProperty: 0,
    rentProperty: 0,
    enquiries: {
      client: 0,
      manual: 0,
      total: 0,
    },
    leads: {
      hot: 0,
      warm: 0,
      cold: 0,
      total: 0,
    },
    properties: {
      sale: 0,
      rent: 0,
    },
    recentProperties: [],
    totalUsers: 0,
    activeEmployees: 0,
    pendingApprovals: 0,
  });
  
  const [refreshing, setRefreshing] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await crmDashboardApi.getCompleteDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all auth tokens
              await AsyncStorage.multiRemove([
                'crm_auth_token',
                'adminToken',
                'employee_auth_token',
                'authToken',
                'userProfile'
              ]);
              
              // Navigate to admin login
              navigation.reset({
                index: 0,
                routes: [{ name: 'AdminLogin' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout properly');
            }
          }
        }
      ]
    );
  };

  const statsCards = [
    { 
      title: "Total Properties", 
      value: dashboardData.totalProperty.toString(), 
      color: "#3b82f6", 
      chart: "line" 
    },
    { 
      title: "Residential", 
      value: dashboardData.residentialProperty.toString(), 
      color: "#8b5cf6", 
      chart: "pie" 
    },
    { 
      title: "Commercial", 
      value: dashboardData.commercialProperty.toString(), 
      color: "#f59e0b", 
      chart: "donut" 
    },
    { 
      title: "For Rent", 
      value: dashboardData.rentProperty.toString(), 
      color: "#ef4444", 
      chart: "bar" 
    },
  ];

  const renderCard = (item) => (
    <View style={[styles.card, { shadowColor: item.color }]} key={item.title}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={[styles.cardValue, { color: item.color }]}>{item.value}</Text>

      {/* Mini Charts */}
      <View style={styles.chartBox}>
        {item.chart === "line" && (
          <View style={[styles.line, { borderColor: item.color }]} />
        )}

        {item.chart === "pie" && (
          <View style={[styles.pie, { backgroundColor: item.color }]} />
        )}

        {item.chart === "donut" && (
          <View style={[styles.donutOuter, { borderColor: item.color }]}>
            <View style={styles.donutInner} />
          </View>
        )}

        {item.chart === "bar" && (
          <View style={styles.barContainer}>
            {[10, 18, 14, 22].map((h, i) => (
              <View
                key={i}
                style={[
                  styles.bar,
                  { backgroundColor: item.color, height: h },
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#3b82f6" />
        <LinearGradient
          colors={["#3b82f6", "#1e40af"]}
          style={styles.headerWrapper}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => setDrawerVisible(true)}>
              <Icon name="menu" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Icon name="log-out-outline" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3b82f6" />

      {/* HEADER */}
      <LinearGradient
        colors={["#3b82f6", "#1e40af"]}
        style={styles.headerWrapper}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setDrawerVisible(true)}>
            <Icon name="menu" size={26} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Admin Dashboard</Text>

          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Icon name="log-out-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerSubtitle}>Welcome back, {user?.name || 'Admin'}</Text>
      </LinearGradient>

      {/* BODY */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
      >
        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading dashboard data...</Text>
          </View>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>{statsCards.map(renderCard)}</View>

        {/* Enquiry Section */}
        <View style={styles.whiteCard}>
          <View style={styles.sectionHeader}>
            <Icon name="analytics" size={20} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Enquiry Overview</Text>
          </View>

          <View style={styles.enquiryRow}>
            <View style={styles.circleBox}>
              <Text style={styles.circleValue}>
                {dashboardData.enquiries.total}
              </Text>
              <Text style={styles.circleLabel}>Total</Text>
            </View>

            <View style={styles.enquiryList}>
              <View style={styles.enquiryItem}>
                <View style={[styles.dot, { backgroundColor: "#3b82f6" }]} />
                <Text style={styles.enquiryText}>Client</Text>
                <Text style={styles.enquiryValue}>{dashboardData.enquiries.client}</Text>
              </View>

              <View style={styles.enquiryItem}>
                <View style={[styles.dot, { backgroundColor: "#f59e0b" }]} />
                <Text style={styles.enquiryText}>Manual</Text>
                <Text style={styles.enquiryValue}>{dashboardData.enquiries.manual}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Property Overview Section */}
        <View style={styles.whiteCard}>
          <View style={styles.sectionHeader}>
            <Icon name="home" size={20} color="#28a745" />
            <Text style={styles.sectionTitle}>Property Overview</Text>
          </View>

          <View style={styles.enquiryRow}>
            <View style={styles.circleBox}>
              <Text style={styles.circleValue}>
                {(dashboardData.totalProperty + dashboardData.boughtProperty).toString()}
              </Text>
              <Text style={styles.circleLabel}>Total</Text>
            </View>

            <View style={styles.enquiryList}>
              <View style={styles.enquiryItem}>
                <View style={[styles.dot, { backgroundColor: "#3b82f6" }]} />
                <Text style={styles.enquiryText}>Available</Text>
                <Text style={styles.enquiryValue}>{dashboardData.totalProperty}</Text>
              </View>

              <TouchableOpacity 
                style={styles.enquiryItem}
                onPress={() => {
                  setDrawerVisible(false);
                  navigation.navigate('BoughtProperty');
                }}
              >
                <View style={[styles.dot, { backgroundColor: "#28a745" }]} />
                <Text style={styles.enquiryText}>Bought</Text>
                <Text style={styles.enquiryValue}>{dashboardData.boughtProperty}</Text>
                <Icon name="chevron-forward" size={16} color="#9ca3af" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Leads Section */}
        <Text style={styles.sectionTitleMain}>Lead Analytics</Text>

        <View style={styles.analyticsGrid}>
          {/* Hot Leads */}
          <TouchableOpacity style={[styles.blueCard, {backgroundColor: '#ef4444'}]} onPress={() => navigation.navigate('Operations', { screen: 'AllLeads' })}>
            <View style={styles.blueHeader}>
              <Icon name="flame" color="#fff" size={18} />
              <Text style={styles.blueTitle}>Hot Leads ({dashboardData.leads.hot})</Text>
            </View>

            <Text style={styles.blueMiniText}>
              {dashboardData.leads.hot > 0 ? `${dashboardData.leads.hot} active` : 'No hot leads'}
            </Text>
          </TouchableOpacity>

          {/* Warm Leads */}
          <TouchableOpacity style={[styles.blueCard, {backgroundColor: '#f59e0b'}]} onPress={() => navigation.navigate('Operations', { screen: 'AllLeads' })}>
            <View style={styles.blueHeader}>
              <Icon name="trending-up" color="#fff" size={18} />
              <Text style={styles.blueTitle}>Warm ({dashboardData.leads.warm})</Text>
            </View>

            <View style={styles.leadRow}>
              <Text style={styles.leadLabel}>Warm Leads</Text>
              <View style={[styles.leadBarFill, { width: dashboardData.leads.warm > 0 ? "60%" : "0%" }]} />
            </View>

            <Text style={styles.blueMiniText}>Active: {dashboardData.leads.warm}</Text>
          </TouchableOpacity>
        </View>

        {/* Management Section */}
        <View style={styles.whiteCard}>
          <View style={styles.sectionHeader}>
            <Icon name="people" size={20} color="#3b82f6" />
            <Text style={styles.sectionTitle}>User Management</Text>
          </View>

          <View style={styles.propRow}>
            <View style={styles.pieCircle} />
            <View>
              <Text style={styles.propText}>
                Total Users: {dashboardData.totalUsers}
              </Text>
              <Text style={styles.propText}>Active Employees: {dashboardData.activeEmployees}</Text>
              <Text style={styles.propText}>Pending Approvals: {dashboardData.pendingApprovals}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions
        <TouchableOpacity style={styles.followCard}>
          <View style={styles.blueHeader}>
            <Icon name="flash" color="#fff" size={18} />
            <Text style={styles.blueTitle}>Quick Actions</Text>
          </View>

          <TouchableOpacity 
            style={styles.followRow}
            onPress={() => {
              // Navigate to Properties tab and then to AddProperty screen
              navigation.navigate('Properties', { 
                screen: 'AddProperty' 
              });
            }}
          >
            <Text style={styles.followText}>Add Property</Text>
            <View style={styles.badgeBlue}>
              <Icon name="add" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.followRow}
            onPress={() => {
              // Navigate to Management tab
              navigation.navigate('Management', { 
                screen: 'UserManagement' 
              });
            }}
          >
            <Text style={styles.followText}>Manage Users</Text>
            <View style={styles.badgeYellow}>
              <Icon name="people" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.followRow}
            onPress={() => {
              // Navigate to Operations tab
              navigation.navigate('Operations', { 
                screen: 'ReportsComplaints' 
              });
            }}
          >
            <Text style={styles.followText}>View Reports</Text>
            <View style={styles.badgeRed}>
              <Icon name="analytics" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
        </TouchableOpacity> */}

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Admin Drawer Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={drawerVisible}
        onRequestClose={() => setDrawerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.drawerContainer}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerHeaderTitle}>Admin Menu</Text>
              <TouchableOpacity onPress={() => setDrawerVisible(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.drawerContent} showsVerticalScrollIndicator={false}>
              {/* MANAGEMENT Section */}
              <View style={styles.drawerSection}>
                <Text style={styles.sectionTitle}>MANAGEMENT</Text>
                
                <TouchableOpacity 
                  style={styles.drawerItem}
                  onPress={() => {
                    setDrawerVisible(false);
                    navigation.navigate('RoleManagement');
                  }}
                >
                  <Icon name="people-circle" size={20} color="#3b82f6" />
                  <Text style={styles.drawerItemText}>Role Management</Text>
                  <Icon name="chevron-forward" size={16} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.drawerItem}
                  onPress={() => {
                    setDrawerVisible(false);
                    navigation.navigate('BadAttendantAlerts');
                  }}
                >
                  <Icon name="warning" size={20} color="#ef4444" />
                  <Text style={styles.drawerItemText}>Bad Attendance Alerts</Text>
                  <Icon name="chevron-forward" size={16} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.drawerItem}
                  onPress={() => {
                    setDrawerVisible(false);
                    navigation.navigate('AdminRemindersControl');
                  }}
                >
                  <Icon name="notifications" size={20} color="#f59e0b" />
                  <Text style={styles.drawerItemText}>Admin Reminders Control</Text>
                  <Icon name="chevron-forward" size={16} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.drawerItem}
                  onPress={() => {
                    setDrawerVisible(false);
                    navigation.navigate('BoughtProperty');
                  }}
                >
                  <Icon name="home" size={20} color="#10b981" />
                  <Text style={styles.drawerItemText}>Bought Property</Text>
                  <Icon name="chevron-forward" size={16} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.drawerItem}
                  onPress={() => {
                    setDrawerVisible(false);
                    navigation.navigate('ServiceManagement');
                  }}
                >
                  <Icon name="construct" size={20} color="#8b5cf6" />
                  <Text style={styles.drawerItemText}>Service Management</Text>
                  <Icon name="chevron-forward" size={16} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.drawerItem}
                  onPress={() => {
                    setDrawerVisible(false);
                    navigation.navigate('Enquiries');
                  }}
                >
                  <Icon name="help-circle" size={20} color="#06b6d4" />
                  <Text style={styles.drawerItemText}>Enquiries</Text>
                  <Icon name="chevron-forward" size={16} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {/* USP MANAGEMENT Section */}
              <View style={styles.drawerSection}>
                <Text style={styles.sectionTitle}>USP MANAGEMENT</Text>
                
                <TouchableOpacity 
                  style={styles.drawerItem}
                  onPress={() => {
                    setDrawerVisible(false);
                    navigation.navigate('USPCategories');
                  }}
                >
                  <Icon name="list" size={20} color="#3b82f6" />
                  <Text style={styles.drawerItemText}>USP Categories</Text>
                  <Icon name="chevron-forward" size={16} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.drawerItem}
                  onPress={() => {
                    setDrawerVisible(false);
                    navigation.navigate('USPEmployees');
                  }}
                >
                  <Icon name="person" size={20} color="#3b82f6" />
                  <Text style={styles.drawerItemText}>USP Employees</Text>
                  <Icon name="chevron-forward" size={16} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {/* MY ASSIGNMENTS Section */}
              <View style={styles.drawerSection}>
                <Text style={styles.sectionTitle}>MY ASSIGNMENTS</Text>
                
                <TouchableOpacity 
                  style={styles.drawerItem}
                  onPress={() => {
                    setDrawerVisible(false);
                    navigation.navigate('MyReminders');
                  }}
                >
                  <Icon name="alarm" size={20} color="#f59e0b" />
                  <Text style={styles.drawerItemText}>My Reminders</Text>
                  <Icon name="chevron-forward" size={16} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.drawerItem}
                  onPress={() => {
                    setDrawerVisible(false);
                    navigation.navigate('FollowUps');
                  }}
                >
                  <Icon name="call" size={20} color="#10b981" />
                  <Text style={styles.drawerItemText}>Follow-ups</Text>
                  <Icon name="chevron-forward" size={16} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.drawerItem}
                  onPress={() => {
                    setDrawerVisible(false);
                    navigation.navigate('Alerts');
                  }}
                >
                  <Icon name="alert-circle" size={20} color="#ef4444" />
                  <Text style={styles.drawerItemText}>Alerts</Text>
                  <Icon name="chevron-forward" size={16} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
          
          <TouchableOpacity 
            style={styles.closeArea} 
            activeOpacity={1} 
            onPress={() => setDrawerVisible(false)}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f6ff" },

  /* Header */
  headerWrapper: {
    padding: 18,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  /* Stats Cards */
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 14,
    justifyContent: "space-between",
  },
  card: {
    width: width / 2.25,
    backgroundColor: "#fff",
    padding: 18,
    marginBottom: 14,
    borderRadius: 16,
    elevation: 4,
  },
  cardTitle: { fontSize: 13, color: "#6b7280", fontWeight: "600" },
  cardValue: {
    fontSize: 26,
    marginVertical: 8,
    fontWeight: "900",
  },
  chartBox: { height: 30 },

  /* Mini Chart Styles */
  line: {
    borderWidth: 2,
    width: "70%",
    borderRadius: 6,
  },
  pie: { width: 22, height: 22, borderRadius: 11 },
  donutOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  donutInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  barContainer: { flexDirection: "row", alignItems: "flex-end" },
  bar: { width: 4, borderRadius: 2, marginRight: 4 },

  /* White Cards */
  whiteCard: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 16,
    padding: 18,
    elevation: 4,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e3a8a",
    marginLeft: 8,
  },
  sectionTitleMain: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 18,
    marginLeft: 18,
    color: "#1e40af",
  },

  /* Enquiry */
  enquiryRow: { flexDirection: "row", marginTop: 16 },
  circleBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 8,
    borderColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
  },
  circleValue: { fontSize: 22, fontWeight: "700", color: "#1e293b" },
  circleLabel: { fontSize: 10, color: "#6b7280" },

  enquiryList: { flex: 1, marginLeft: 20 },
  enquiryItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  enquiryText: { flex: 1, fontSize: 14, color: "#1f2937" },
  enquiryValue: { fontSize: 16, fontWeight: "700" },

  /* Analytics */
  analyticsGrid: {
    flexDirection: "row",
    marginTop: 12,
    paddingHorizontal: 12,
  },
  blueCard: {
    flex: 1,
    backgroundColor: "#1e40af",
    padding: 16,
    borderRadius: 16,
    marginRight: 10,
    elevation: 4,
  },
  blueHeader: { flexDirection: "row", alignItems: "center" },
  blueTitle: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 8,
    fontSize: 14,
  },
  blueMiniText: { color: "#e0e7ff", marginTop: 10 },

  /* Leads */
  leadRow: { marginTop: 12 },
  leadLabel: { color: "#fff", marginBottom: 6 },
  leadBarFill: {
    height: 6,
    borderRadius: 4,
    backgroundColor: "#f59e0b",
  },

  /* Property Card */
  propRow: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  pieCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#10b981",
    marginRight: 20,
  },
  propText: { marginBottom: 6, fontSize: 14, color: "#1f2937" },

  /* Follow-up / Quick Actions */
  followCard: {
    backgroundColor: "#1e40af",
    margin: 12,
    padding: 18,
    borderRadius: 18,
    elevation: 5,
  },
  followRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  followText: { color: "#fff", fontSize: 14 },
  badgeRed: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeYellow: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeBlue: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: "#fff", fontWeight: "700" },

  /* Loading */
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontStyle: 'italic',
  },

  /* Drawer Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  drawerContainer: {
    width: width * 0.75,
    backgroundColor: '#ffffff',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  closeArea: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  drawerHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  drawerContent: {
    flex: 1,
    paddingHorizontal: 0,
  },
  drawerSection: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 10,
    paddingHorizontal: 20,
    letterSpacing: 0.5,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
  },
  drawerItemText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 15,
    flex: 1,
    fontWeight: '500',
  },
});

export default AdminDashboardScreen;