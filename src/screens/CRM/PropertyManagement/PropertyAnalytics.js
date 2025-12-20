import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getPropertyAnalytics, getAllProperties } from '../../../services/propertyService';

const { width } = Dimensions.get('window');

const PropertyAnalytics = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    total: 0,
    residential: 0,
    commercial: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    rent: 0,
    bought: 0,
    priceRanges: {
      low: 0,
      medium: 0,
      high: 0
    }
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setError(null);
      const analyticsData = await getPropertyAnalytics();
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError(error.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (value, total) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const AnalyticsCard = ({ title, children }) => (
    <View style={styles.analyticsCard}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );

  const StatBar = ({ label, value, total, color, icon }) => {
    const percentage = calculatePercentage(value, total);
    const barWidth = total > 0 ? (value / total) * 100 : 0;
    
    return (
      <View style={styles.statBar}>
        <View style={styles.statBarHeader}>
          <View style={styles.statBarLabel}>
            <MaterialIcons name={icon} size={16} color={color} />
            <Text style={styles.statBarText}>{label}</Text>
          </View>
          <View style={styles.statBarValue}>
            <Text style={styles.statBarNumber}>{value}</Text>
            <Text style={styles.statBarPercentage}>({percentage}%)</Text>
          </View>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${barWidth}%`,
                backgroundColor: color,
              }
            ]}
          />
        </View>
      </View>
    );
  };

  const MetricCard = ({ title, value, subtitle, icon, color }) => (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: color }]}>
        <MaterialIcons name={icon} size={24} color="#FFFFFF" />
      </View>
      <View style={styles.metricContent}>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricTitle}>{title}</Text>
        {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <MaterialIcons name="error-outline" size={64} color="#EF4444" />
      <Text style={styles.errorTitle}>Failed to Load Analytics</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadAnalytics}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.loadingText}>Loading analytics...</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Property Analytics</Text>
          <View style={styles.placeholder} />
        </View>
        {renderLoading()}
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Property Analytics</Text>
          <View style={styles.placeholder} />
        </View>
        {renderError()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Property Analytics</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadAnalytics}
        >
          <MaterialIcons name="refresh" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overview Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Total Properties"
              value={analytics.total}
              icon="home"
              color="#3B82F6"
            />
            <MetricCard
              title="Active Listings"
              value={analytics.approved}
              subtitle={`${calculatePercentage(analytics.approved, analytics.total)}% approved`}
              icon="check-circle"
              color="#10B981"
            />
          </View>
        </View>

        {/* Property Type Breakdown */}
        <AnalyticsCard title="Property Types">
          <StatBar
            label="Residential"
            value={analytics.residential}
            total={analytics.total}
            color="#10B981"
            icon="apartment"
          />
          <StatBar
            label="Commercial"
            value={analytics.commercial}
            total={analytics.total}
            color="#F59E0B"
            icon="business"
          />
          <StatBar
            label="Other Types"
            value={analytics.total - analytics.residential - analytics.commercial}
            total={analytics.total}
            color="#6B7280"
            icon="home"
          />
        </AnalyticsCard>

        {/* Status Breakdown */}
        <AnalyticsCard title="Approval Status">
          <StatBar
            label="Approved"
            value={analytics.approved}
            total={analytics.total}
            color="#10B981"
            icon="check-circle"
          />
          <StatBar
            label="Pending"
            value={analytics.pending}
            total={analytics.total}
            color="#F59E0B"
            icon="schedule"
          />
          <StatBar
            label="Rejected"
            value={analytics.rejected}
            total={analytics.total}
            color="#EF4444"
            icon="cancel"
          />
        </AnalyticsCard>

        {/* Purpose Distribution */}
        <AnalyticsCard title="Property Purpose">
          <StatBar
            label="For Rent"
            value={analytics.rent}
            total={analytics.total}
            color="#8B5CF6"
            icon="key"
          />
          <StatBar
            label="For Sale"
            value={analytics.bought}
            total={analytics.total}
            color="#3B82F6"
            icon="monetization-on"
          />
          <StatBar
            label="Other Purpose"
            value={analytics.total - analytics.rent - analytics.bought}
            total={analytics.total}
            color="#6B7280"
            icon="more-horiz"
          />
        </AnalyticsCard>

        {/* Price Range Distribution */}
        <AnalyticsCard title="Price Range Distribution">
          <StatBar
            label="Budget (< ₹10L)"
            value={analytics.priceRanges.low}
            total={analytics.total}
            color="#22C55E"
            icon="trending-down"
          />
          <StatBar
            label="Mid-range (₹10L - ₹50L)"
            value={analytics.priceRanges.medium}
            total={analytics.total}
            color="#F59E0B"
            icon="trending-flat"
          />
          <StatBar
            label="Premium (> ₹50L)"
            value={analytics.priceRanges.high}
            total={analytics.total}
            color="#EF4444"
            icon="trending-up"
          />
        </AnalyticsCard>

        {/* Summary Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Insights</Text>
          <View style={styles.insightsList}>
            <View style={styles.insightItem}>
              <MaterialIcons name="insights" size={20} color="#3B82F6" />
              <Text style={styles.insightText}>
                <Text style={styles.insightHighlight}>
                  {calculatePercentage(analytics.residential, analytics.total)}%
                </Text>
                {' '}of properties are residential
              </Text>
            </View>
            
            <View style={styles.insightItem}>
              <MaterialIcons name="approval" size={20} color="#10B981" />
              <Text style={styles.insightText}>
                <Text style={styles.insightHighlight}>
                  {calculatePercentage(analytics.approved, analytics.total)}%
                </Text>
                {' '}approval rate
              </Text>
            </View>
            
            <View style={styles.insightItem}>
              <MaterialIcons name="home-work" size={20} color="#F59E0B" />
              <Text style={styles.insightText}>
                <Text style={styles.insightHighlight}>
                  {calculatePercentage(analytics.rent, analytics.total)}%
                </Text>
                {' '}are rental properties
              </Text>
            </View>
            
            <View style={styles.insightItem}>
              <MaterialIcons name="trending-up" size={20} color="#8B5CF6" />
              <Text style={styles.insightText}>
                <Text style={styles.insightHighlight}>
                  {calculatePercentage(analytics.priceRanges.high, analytics.total)}%
                </Text>
                {' '}are premium properties
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  analyticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  statBar: {
    marginBottom: 16,
  },
  statBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statBarLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statBarText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  statBarValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBarNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 4,
  },
  statBarPercentage: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  insightsList: {
    gap: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  insightText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  insightHighlight: {
    fontWeight: '700',
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default PropertyAnalytics;