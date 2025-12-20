import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  StatusBar,
  RefreshControl,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import * as crmEmployeeDashboardApi from '../../services/crmEmployeeDashboardApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get("window");

const DashboardEmployee = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalProperty: 0,
    boughtProperty: 0,
    residentialProperty: 0,
    commercialProperty: 0,
    rentProperty: 0,
    reminders: 0,
    leads: 0,
  });

  // Fetch dashboard data
  const fetchDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      console.log('🔄 Fetching employee dashboard data...');
      const data = await crmEmployeeDashboardApi.getCompleteDashboardData();
      console.log('✅ Employee dashboard data received:', JSON.stringify(data, null, 2));
      console.log('📊 Leads value:', data.leads, 'Reminders value:', data.reminders);
      setDashboardData(data);
    } catch (error) {
      console.error('❌ Error fetching employee dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData(false);
    setRefreshing(false);
  };

  // Load data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

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
              
              // Navigate to employee login
              navigation.reset({
                index: 0,
                routes: [{ name: 'EmployeeLogin' }],
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
      title: "Total Property", 
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
      title: "Rent Property", 
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3b82f6" />

      {/* HEADER */}
      <LinearGradient
        colors={["#3b82f6", "#1e40af"]}
        style={styles.headerWrapper}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Dashboard</Text>

          <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
            <TouchableOpacity onPress={() => navigation.navigate('EmployeeProfile')}>
              <Icon name="person-circle-outline" color="#fff" size={30} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Icon name="log-out-outline" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
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
                  Alert.alert(
                    'Bought Properties',
                    `Total Bought Properties: ${dashboardData.boughtProperty}`,
                    [
                      { text: 'OK', style: 'default' }
                    ]
                  );
                }}
              >
                <View style={[styles.dot, { backgroundColor: "#f59e0b" }]} />
                <Text style={styles.enquiryText}>Bought</Text>
                <Text style={styles.enquiryValue}>{dashboardData.boughtProperty}</Text>
                <Icon name="chevron-forward" size={16} color="#9ca3af" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Analytics Section */}
        <Text style={styles.sectionTitleMain}>Your Personal Analytics</Text>

        <View style={styles.analyticsGrid}>
          {/* Reminders */}
          <TouchableOpacity style={styles.blueCard} onPress={() => navigation.navigate('MyReminders')}>
            <View style={styles.blueHeader}>
              <Icon name="notifications" color="#fff" size={18} />
              <Text style={styles.blueTitle}>Reminders ({dashboardData.reminders})</Text>
            </View>

            <Text style={styles.blueMiniText}>
              {dashboardData.reminders > 0 ? `${dashboardData.reminders} pending` : 'No reminders available'}
            </Text>
          </TouchableOpacity>

          {/* Leads */}
          <TouchableOpacity style={styles.blueCard} onPress={() => navigation.navigate('MyLeads')}>
            <View style={styles.blueHeader}>
              <Icon name="people" color="#fff" size={18} />
              <Text style={styles.blueTitle}>Leads ({dashboardData.leads})</Text>
            </View>

            <View style={styles.leadRow}>
              <Text style={styles.leadLabel}>Active Leads</Text>
              <View style={[styles.leadBarFill, { width: dashboardData.leads > 0 ? "60%" : "0%" }]} />
            </View>

            <Text style={styles.blueMiniText}>Active: {dashboardData.leads}</Text>
          </TouchableOpacity>
        </View>

        {/* Properties */}
        <View style={styles.whiteCard}>
          <View style={styles.sectionHeader}>
            <Icon name="home" size={20} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Your Properties ({dashboardData.totalProperty})</Text>
          </View>

          <View style={styles.propRow}>
            <View style={styles.pieCircle} />
            <View>
              <Text style={styles.propText}>
                For Sale: {dashboardData.totalProperty - dashboardData.rentProperty}
              </Text>
              <Text style={styles.propText}>For Rent: {dashboardData.rentProperty}</Text>
            </View>
          </View>
        </View>

        {/* Follow-up Section */}
        <TouchableOpacity style={styles.followCard} onPress={() => navigation.navigate('FollowUps')}>
          <View style={styles.blueHeader}>
            <Icon name="calendar" color="#fff" size={18} />
            <Text style={styles.blueTitle}>Follow-Ups</Text>
          </View>

          <View style={styles.followRow}>
            <Text style={styles.followText}>Today</Text>
            <View style={styles.badgeRed}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </View>

          <View style={styles.followRow}>
            <Text style={styles.followText}>This Week</Text>
            <View style={styles.badgeYellow}>
              <Text style={styles.badgeText}>4</Text>
            </View>
          </View>

          <View style={styles.followRow}>
            <Text style={styles.followText}>This Month</Text>
            <View style={styles.badgeBlue}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardEmployee;

/* --------------------------------------------------------- */
/* ----------------------- STYLES -------------------------- */
/* --------------------------------------------------------- */
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
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  alertBtn: { marginTop: 18 },
  alertGradient: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 22,
    alignSelf: "flex-start",
  },
  alertText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
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

  /* Follow-up */
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
});
