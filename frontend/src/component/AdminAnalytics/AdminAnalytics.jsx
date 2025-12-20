import React, { useState, useEffect } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import axios from "axios";
import { API_BASE_URL } from "../../config/apiConfig";
import "./AdminAnalytics.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    reminders: { total: 0, pending: 0, completed: 0, overdue: 0 },
    leads: { total: 0, hot: 0, warm: 0, cold: 0 },
    followUps: { total: 0, today: 0, thisWeek: 0, thisMonth: 0 },
    properties: { total: 0, rent: 0, sale: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get auth token
      const token = localStorage.getItem('adminToken') || localStorage.getItem('employeeToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch data for admin analytics
      const [remindersRes, propertiesRes, inquiriesRes] = await Promise.all([
        // Fetch reminder statistics
        axios.get(`${API_BASE_URL}/api/reminder/stats`, { headers }).catch(err => {
          console.log("Reminder stats API failed:", err.response?.status);
          return { data: { data: { total: 0, pending: 0, completed: 0, due: 0 } } };
        }),
        
        // Fetch properties
        axios.get(`${API_BASE_URL}/api/properties/all`, { headers }).catch(err => {
          console.log("Properties API failed:", err.response?.status);
          return { data: { data: [] } };
        }),
        
        // Fetch inquiries for leads
        axios.get(`${API_BASE_URL}/api/inquiry/get-enquiries`, { headers }).catch(err => {
          console.log("Inquiries API failed:", err.response?.status);
          return { data: { data: [] } };
        })
      ]);

      // Process reminders data
      const reminderStats = remindersRes.data?.data || {
        total: 0,
        pending: 0,
        completed: 0,
        due: 0
      };
      
      // Calculate overdue from due count
      const processedReminderStats = {
        total: reminderStats.total,
        pending: reminderStats.pending,
        completed: reminderStats.completed,
        overdue: reminderStats.due || 0
      };

      // Process properties data
      const properties = propertiesRes.data?.data || [];
      const propertyStats = processPropertiesData(properties);

      // Process leads data (from inquiries)
      const inquiries = inquiriesRes.data?.data || [];
      const leadsStats = processLeadsData(inquiries);

      // Process follow-ups (calculated from reminder stats)
      const followUpsStats = {
        total: processedReminderStats.total,
        today: processedReminderStats.overdue,
        thisWeek: Math.ceil(processedReminderStats.pending / 2),
        thisMonth: processedReminderStats.pending
      };

      setAnalyticsData({
        reminders: processedReminderStats,
        leads: leadsStats,
        followUps: followUpsStats,
        properties: propertyStats
      });

    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };



  const processPropertiesData = (properties) => {
    let rent = 0, sale = 0;
    
    properties.forEach(property => {
      if (property.purpose === 'Rent/Lease') {
        rent++;
      } else if (property.purpose === 'Sell') {
        sale++;
      }
    });

    return {
      total: properties.length,
      rent,
      sale
    };
  };

  const processLeadsData = (inquiries) => {
    // Categorize leads based on inquiry date (recent = hot, medium = warm, old = cold)
    const now = new Date();
    let hot = 0, warm = 0, cold = 0;

    inquiries.forEach(inquiry => {
      const inquiryDate = new Date(inquiry.createdAt || inquiry.date);
      const daysDiff = Math.floor((now - inquiryDate) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 3) {
        hot++;
      } else if (daysDiff <= 14) {
        warm++;
      } else {
        cold++;
      }
    });

    return {
      total: inquiries.length,
      hot,
      warm,
      cold
    };
  };



  if (loading) {
    return (
      <div className="admin-analytics-loading">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-analytics-error">
        <div className="alert alert-danger">
          <h5>Analytics Error</h5>
          <p>{error}</p>
          <button className="btn btn-outline-danger" onClick={fetchAnalyticsData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Chart configurations
  const remindersChartData = {
    labels: ['Pending', 'Completed', 'Overdue'],
    datasets: [{
      label: 'Reminders',
      data: [analyticsData.reminders.pending, analyticsData.reminders.completed, analyticsData.reminders.overdue],
      backgroundColor: ['#ffc107', '#28a745', '#dc3545'],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  const leadsChartData = {
    labels: ['Hot Leads', 'Warm Leads', 'Cold Leads'],
    datasets: [{
      label: 'Leads Distribution',
      data: [analyticsData.leads.hot, analyticsData.leads.warm, analyticsData.leads.cold],
      backgroundColor: ['#dc3545', '#fd7e14', '#6c757d'],
      borderRadius: 6,
      barThickness: 40
    }]
  };

  const propertiesChartData = {
    labels: ['For Sale', 'For Rent'],
    datasets: [{
      label: 'Properties',
      data: [analyticsData.properties.sale, analyticsData.properties.rent],
      backgroundColor: ['#0ea5e9', '#22c55e'],
      borderWidth: 1,
      borderColor: '#fff'
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#000',
        bodyColor: '#000',
        borderColor: '#ccc',
        borderWidth: 1
      }
    }
  };

  const propertiesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 10,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#000',
        bodyColor: '#000',
        borderColor: '#ccc',
        borderWidth: 1
      }
    }
  };

  return (
    <div className="admin-analytics-container">
      <div className="row g-4">
        {/* Reminders Overview */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 rounded-3 h-100">
            <div className="card-header bg-warning text-white">
              <h6 className="mb-0 fw-bold" style={{ color: '#fff' }}>
                📅 Your Reminders ({analyticsData.reminders.total})
              </h6>
            </div>
            <div className="card-body">
              <div style={{ height: '250px' }}>
                <Doughnut data={remindersChartData} options={chartOptions} />
              </div>
              <div className="mt-3">
                <div className="d-flex justify-content-between">
                  <small>Pending: <strong>{analyticsData.reminders.pending}</strong></small>
                  <small>Completed: <strong>{analyticsData.reminders.completed}</strong></small>
                  <small>Overdue: <strong>{analyticsData.reminders.overdue}</strong></small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leads Analysis */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 rounded-3 h-100">
            <div className="card-header bg-primary text-white">
              <h6 className="mb-0 fw-bold" style={{ color: '#fff' }}>
                🎯 Your Leads ({analyticsData.leads.total})
              </h6>
            </div>
            <div className="card-body">
              <div style={{ height: '250px' }}>
                <Bar data={leadsChartData} options={chartOptions} />
              </div>
              <div className="mt-3">
                <div className="d-flex justify-content-between">
                  <small>Hot: <strong>{analyticsData.leads.hot}</strong></small>
                  <small>Warm: <strong>{analyticsData.leads.warm}</strong></small>
                  <small>Cold: <strong>{analyticsData.leads.cold}</strong></small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Overview */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 rounded-3 h-100">
            <div className="card-header bg-success text-white">
              <h6 className="mb-0 fw-bold" style={{ color: '#fff', fontSize: '1rem' }}>
                🏠 Your Properties ({analyticsData.properties.total})
              </h6>
            </div>
            <div className="card-body">
              <div style={{ height: '200px' }}>
                <Doughnut data={propertiesChartData} options={propertiesChartOptions} />
              </div>
              <div className="mt-3 text-center">
                <div className="row">
                  <div className="col-6">
                    <div className="border rounded p-1">
                      <div className="fw-bold text-primary">{analyticsData.properties.sale}</div>
                      <small>For Sale</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="border rounded p-2">
                      <div className="fw-bold text-success">{analyticsData.properties.rent}</div>
                      <small>For Rent</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Follow-ups Timeline */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 rounded-3 h-100">
            <div className="card-header bg-info text-white">
              <h6 className="mb-0 fw-bold" style={{ color: '#fff', fontSize: '1rem' }}>
                📋 Follow-ups Schedule
              </h6>
            </div>
            <div className="card-body" style={{ overflowX: 'hidden', padding: '1rem' }}>
              <div className="timeline-stats" style={{ maxWidth: '100%' }}>
                <div className="stat-item mb-3 p-3 bg-light rounded" style={{ maxWidth: '100%' }}>
                  <div className="d-flex justify-content-between align-items-center" style={{ flexWrap: 'nowrap' }}>
                    <span className="fw-medium" style={{ fontSize: '1rem', flex: '1', minWidth: '0', whiteSpace: 'nowrap' }}>Today</span>
                    <span className="badge bg-danger ms-2" style={{ fontSize: '1rem' }}>{analyticsData.followUps.today}</span>
                  </div>
                </div>
                <div className="stat-item mb-3 p-3 bg-light rounded" style={{ maxWidth: '100%' }}>
                  <div className="d-flex justify-content-between align-items-center" style={{ flexWrap: 'nowrap' }}>
                    <span className="fw-medium" style={{ fontSize: '1rem', flex: '1', minWidth: '0', whiteSpace: 'nowrap' }}>This Week</span>
                    <span className="badge bg-warning ms-2" style={{ fontSize: '1rem' }}>{analyticsData.followUps.thisWeek}</span>
                  </div>
                </div>
                <div className="stat-item mb-3 p-3 bg-light rounded" style={{ maxWidth: '100%' }}>
                  <div className="d-flex justify-content-between align-items-center" style={{ flexWrap: 'nowrap' }}>
                    <span className="fw-medium" style={{ fontSize: '1rem', flex: '1', minWidth: '0', whiteSpace: 'nowrap' }}>This Month</span>
                    <span className="badge bg-info ms-2" style={{ fontSize: '1rem' }}>{analyticsData.followUps.thisMonth}</span>
                  </div>
                </div>
                <div className="stat-item p-4 bg-primary text-white rounded" style={{ maxWidth: '100%' }}>
                  <div className="d-flex justify-content-between align-items-center" style={{ flexWrap: 'nowrap' }}>
                    <span className="fw-bold" style={{ fontSize: '1.12rem', flex: '1', minWidth: '0', whiteSpace: 'nowrap' }}>Total Reminders</span>
                    <span className="fs-6 fw-bold ms-3">{analyticsData.followUps.total}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;