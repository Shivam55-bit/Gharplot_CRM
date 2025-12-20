import React, { useState, useEffect } from 'react';
import apiClient from '../utils/axiosConfig';
import './EmployeeReports.css';
import { 
  FaUsers, 
  FaTasks, 
  FaPhoneAlt, 
  FaUserTie, 
  FaUser,
  FaChartLine, 
  FaDownload,
  FaCalendarAlt,
  FaEye,
  FaFilter,
  FaSearch
} from 'react-icons/fa';

const EmployeeReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [totals, setTotals] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');

  useEffect(() => {
    fetchEmployeeReports();
  }, [dateRange]);

  const fetchEmployeeReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Determine if user is admin or employee with permission
      const adminToken = localStorage.getItem('adminToken');
      const employeeToken = localStorage.getItem('employeeToken');
      
      // Check if we have any token
      if (!adminToken && !employeeToken) {
        throw new Error('No authentication token found. Please login again.');
      }
      
      const isAdmin = !!adminToken;
      const baseUrl = isAdmin ? '/admin/employee-reports' : '/api/employee-reports/manager';
      
      const params = {};
      if (dateRange.startDate && dateRange.endDate) {
        params.startDate = dateRange.startDate;
        params.endDate = dateRange.endDate;
      }

      const response = await apiClient.get(`${baseUrl}/all`, { 
        params
      });
      
      if (response.data.success) {
        setReports(response.data.data.employees || []);
        setTotals(response.data.data.totals || {});
      }
    } catch (err) {
      console.error('Error fetching employee reports:', err);
      setError(err.response?.data?.message || 'Failed to fetch employee reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeDetail = async (employeeId) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const employeeToken = localStorage.getItem('employeeToken');
      
      // Check if we have any token
      if (!adminToken && !employeeToken) {
        throw new Error('No authentication token found. Please login again.');
      }
      
      const baseUrl = adminToken ? '/admin/employee-reports' : '/api/employee-reports/manager';
      
      const params = { employeeId };
      if (dateRange.startDate && dateRange.endDate) {
        params.startDate = dateRange.startDate;
        params.endDate = dateRange.endDate;
      }

      const response = await apiClient.get(`${baseUrl}/all`, { 
        params
      });
      
      if (response.data.success) {
        setSelectedEmployee(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching employee detail:', err);
      setError('Failed to fetch employee details');
    }
  };

  const exportReport = async (employeeId = null, format = 'json') => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const employeeToken = localStorage.getItem('employeeToken');
      
      // Check if we have any token
      if (!adminToken && !employeeToken) {
        throw new Error('No authentication token found. Please login again.');
      }
      
      const baseUrl = adminToken ? '/admin/employee-reports' : '/api/employee-reports/manager';
      
      const params = { format };
      if (employeeId) params.employeeId = employeeId;

      const response = await apiClient.get(`${baseUrl}/export`, { 
        params
      });
      
      if (format === 'csv') {
        // Handle CSV download
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `employee-report-${employeeId || 'all'}.csv`;
        link.click();
      } else {
        // Handle JSON download
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `employee-report-${employeeId || 'all'}.json`;
        link.click();
      }
    } catch (err) {
      console.error('Error exporting report:', err);
      setError('Failed to export report');
    }
  };

  const filteredReports = reports
    .filter(report => {
      if (searchTerm) {
        return report.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               report.employee.email.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return true;
    })
    .filter(report => {
      if (filterBy === 'all') return true;
      if (filterBy === 'high-performers') {
        return parseFloat(report.performance.completionRate) >= 80;
      }
      if (filterBy === 'needs-attention') {
        return parseFloat(report.performance.completionRate) < 60;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.employee.name.localeCompare(b.employee.name);
      }
      if (sortBy === 'completion-rate') {
        return parseFloat(b.performance.completionRate) - parseFloat(a.performance.completionRate);
      }
      if (sortBy === 'total-tasks') {
        return (b.reminders.total + b.followUps.total) - (a.reminders.total + a.followUps.total);
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="employee-reports-loading">
        <div className="loading-spinner"></div>
        <p>Loading employee reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="employee-reports-error">
        <p>Error: {error}</p>
        <button onClick={fetchEmployeeReports}>Retry</button>
      </div>
    );
  }

  return (
    <div className="employee-reports" style={{ paddingTop: '80px' }}>
      <div className="reports-header">
        <div className="header-left">
          <h1><FaChartLine /> Employee Reports</h1>
          <p>Comprehensive performance and activity reports for all employees</p>
        </div>
        <div className="header-actions">
          <button 
            className="export-btn"
            onClick={() => exportReport(null, 'json')}
          >
            <FaDownload /> Export All (JSON)
          </button>
          <button 
            className="export-btn csv"
            onClick={() => exportReport(null, 'csv')}
          >
            <FaDownload /> Export All (CSV)
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="reports-controls">
        <div className="date-filters">
          <label>
            <FaCalendarAlt /> From:
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </label>
          <label>
            To:
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </label>
        </div>

        <div className="search-filter">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
          >
            <option value="all">All Employees</option>
            <option value="high-performers">High Performers (80%+)</option>
            <option value="needs-attention">Needs Attention (&lt;60%)</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Sort by Name</option>
            <option value="completion-rate">Sort by Completion Rate</option>
            <option value="total-tasks">Sort by Total Tasks</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {totals && Object.keys(totals).length > 0 && (
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-icon reminders">
              <FaTasks />
            </div>
            <div className="card-content">
              <h3>{totals.totalReminders || 0}</h3>
              <p>Total Reminders</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon followups">
              <FaPhoneAlt />
            </div>
            <div className="card-content">
              <h3>{totals.totalFollowUps || 0}</h3>
              <p>Total Follow-ups</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon leads">
              <FaUsers />
            </div>
            <div className="card-content">
              <h3>{totals.totalLeads || 0}</h3>
              <p>Total Leads</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon inquiries">
              <FaUserTie />
            </div>
            <div className="card-content">
              <h3>{totals.totalInquiries || 0}</h3>
              <p>Total Inquiries</p>
            </div>
          </div>
        </div>
      )}

      {/* Employee Reports Table */}
      <div className="reports-table">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Role</th>
              <th>Reminders</th>
              <th>Follow-ups</th>
              <th>Leads</th>
              <th>Inquiries</th>
              <th>Completion Rate</th>
              <th>Conversion Rate</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((report) => (
              <tr key={report.employee.id}>
                <td>
                  <div className="employee-info">
                    <div className="employee-name">{report.employee.name}</div>
                    <div className="employee-email">{report.employee.email}</div>
                  </div>
                </td>
                <td>
                  <span className="role-badge">{report.employee.role}</span>
                </td>
                <td>
                  <div className="metric-cell">
                    <span className="metric-value">{report.reminders.total}</span>
                    <span className="metric-breakdown">
                      {report.reminders.completed}✓ {report.reminders.pending}⏳
                    </span>
                  </div>
                </td>
                <td>
                  <div className="metric-cell">
                    <span className="metric-value">{report.followUps.total}</span>
                    <span className="metric-breakdown">
                      {report.followUps.completed}✓ {report.followUps.pending}⏳
                    </span>
                  </div>
                </td>
                <td>
                  <div className="metric-cell">
                    <span className="metric-value">{report.leads.total}</span>
                    <span className="metric-breakdown">
                      {report.leads.converted}📈 {report.leads.active}👥
                    </span>
                  </div>
                </td>
                <td>
                  <div className="metric-cell">
                    <span className="metric-value">{report.inquiries.total}</span>
                    <span className="metric-breakdown">
                      {report.inquiries.closed}✓ {report.inquiries.open}📨
                    </span>
                  </div>
                </td>
                <td>
                  <div className={`completion-rate ${getPerformanceClass(report.performance.completionRate)}`}>
                    {report.performance.completionRate}%
                  </div>
                </td>
                <td>
                  <div className="conversion-rate">
                    {report.performance.leadConversionRate}%
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="view-btn"
                      onClick={() => fetchEmployeeDetail(report.employee.id)}
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    <button
                      className="export-btn"
                      onClick={() => exportReport(report.employee.id, 'json')}
                      title="Export Report"
                    >
                      <FaDownload />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Enhanced Employee Detail Modal */}
      {selectedEmployee && (
        <div className="modal-overlay" onClick={() => setSelectedEmployee(null)}>
          <div className="employee-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-section">
                <h2><FaUserTie /> {selectedEmployee.employee.name}</h2>
                <p className="modal-subtitle">Comprehensive Performance Report</p>
              </div>
              <button 
                className="close-btn"
                onClick={() => setSelectedEmployee(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              {/* Quick Stats Banner */}
              <div className="quick-stats-banner">
                <div className="quick-stat">
                  <div className="stat-number">{selectedEmployee.reminders.total + selectedEmployee.followUps.total}</div>
                  <div className="stat-label">Total Tasks</div>
                </div>
                <div className="quick-stat">
                  <div className="stat-number">{selectedEmployee.performance.completionRate}%</div>
                  <div className="stat-label">Completion Rate</div>
                </div>
                <div className="quick-stat">
                  <div className="stat-number">{selectedEmployee.leads.converted}</div>
                  <div className="stat-label">Conversions</div>
                </div>
                <div className="quick-stat">
                  <div className="stat-number">{selectedEmployee.performance.responseTime}h</div>
                  <div className="stat-label">Avg Response</div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="modal-main-grid">
                {/* Left Column */}
                <div className="modal-left-column">
                  {/* Employee Information */}
                  <div className="info-card">
                    <div className="info-card-header">
                      <FaUser className="header-icon" />
                      <h3>Employee Information</h3>
                    </div>
                    <div className="info-card-content">
                      <div className="info-item">
                        <span className="info-label">📧 Email:</span>
                        <span className="info-value">{selectedEmployee.employee.email}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">📱 Phone:</span>
                        <span className="info-value">{selectedEmployee.employee.phone}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">👤 Role:</span>
                        <span className="info-value role-badge">{selectedEmployee.employee.role}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">🏢 Department:</span>
                        <span className="info-value">{selectedEmployee.employee.department}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">📅 Join Date:</span>
                        <span className="info-value">{new Date(selectedEmployee.employee.joinDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="info-card performance-card">
                    <div className="info-card-header">
                      <FaChartLine className="header-icon" />
                      <h3>Performance Metrics</h3>
                    </div>
                    <div className="performance-grid">
                      <div className="performance-metric">
                        <div className="metric-circle excellent">
                          <span className="metric-percentage">{selectedEmployee.performance.completionRate}%</span>
                        </div>
                        <span className="metric-name">Task Completion</span>
                      </div>
                      <div className="performance-metric">
                        <div className="metric-circle good">
                          <span className="metric-percentage">{selectedEmployee.performance.leadConversionRate}%</span>
                        </div>
                        <span className="metric-name">Lead Conversion</span>
                      </div>
                      <div className="performance-metric">
                        <div className="metric-circle average">
                          <span className="metric-percentage">{selectedEmployee.performance.inquiryCloseRate}%</span>
                        </div>
                        <span className="metric-name">Inquiry Resolution</span>
                      </div>
                      <div className="performance-metric">
                        <div className="metric-circle response-time">
                          <span className="metric-hours">{selectedEmployee.performance.responseTime}h</span>
                        </div>
                        <span className="metric-name">Avg Response Time</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="modal-right-column">
                  {/* Activity Statistics */}
                  <div className="activity-stats-grid">
                    {/* Reminders Section */}
                    <div className="stat-card reminders-card">
                      <div className="stat-card-header">
                        <FaTasks className="stat-icon" />
                        <h4>Reminders ({selectedEmployee.reminders.total})</h4>
                      </div>
                      <div className="stat-grid">
                        <div className="stat-item completed">
                          <span className="stat-number">{selectedEmployee.reminders.completed}</span>
                          <span className="stat-text">Completed</span>
                        </div>
                        <div className="stat-item pending">
                          <span className="stat-number">{selectedEmployee.reminders.pending}</span>
                          <span className="stat-text">Pending</span>
                        </div>
                        <div className="stat-item overdue">
                          <span className="stat-number">{selectedEmployee.reminders.overdue}</span>
                          <span className="stat-text">Overdue</span>
                        </div>
                      </div>
                      <div className="priority-section">
                        <span className="priority-label">Priority:</span>
                        <div className="priority-tags">
                          <span className="priority-tag high">High: {selectedEmployee.reminders.byPriority.high}</span>
                          <span className="priority-tag medium">Medium: {selectedEmployee.reminders.byPriority.medium}</span>
                          <span className="priority-tag low">Low: {selectedEmployee.reminders.byPriority.low}</span>
                        </div>
                      </div>
                    </div>

                    {/* Leads Section */}
                    <div className="stat-card leads-card">
                      <div className="stat-card-header">
                        <FaUsers className="stat-icon" />
                        <h4>Leads ({selectedEmployee.leads.total})</h4>
                      </div>
                      <div className="stat-grid">
                        <div className="stat-item active">
                          <span className="stat-number">{selectedEmployee.leads.active}</span>
                          <span className="stat-text">Active</span>
                        </div>
                        <div className="stat-item converted">
                          <span className="stat-number">{selectedEmployee.leads.converted}</span>
                          <span className="stat-text">Converted</span>
                        </div>
                        <div className="stat-item inactive">
                          <span className="stat-number">{selectedEmployee.leads.inactive}</span>
                          <span className="stat-text">Inactive</span>
                        </div>
                        <div className="stat-item new">
                          <span className="stat-number">{selectedEmployee.leads.newThisMonth}</span>
                          <span className="stat-text">New This Month</span>
                        </div>
                      </div>
                    </div>

                    {/* Inquiries Section */}
                    <div className="stat-card inquiries-card">
                      <div className="stat-card-header">
                        <FaPhoneAlt className="stat-icon" />
                        <h4>Inquiries ({selectedEmployee.inquiries.total})</h4>
                      </div>
                      <div className="stat-grid">
                        <div className="stat-item open">
                          <span className="stat-number">{selectedEmployee.inquiries.open}</span>
                          <span className="stat-text">Open</span>
                        </div>
                        <div className="stat-item in-progress">
                          <span className="stat-number">{selectedEmployee.inquiries.inProgress}</span>
                          <span className="stat-text">In Progress</span>
                        </div>
                        <div className="stat-item closed">
                          <span className="stat-number">{selectedEmployee.inquiries.closed}</span>
                          <span className="stat-text">Closed</span>
                        </div>
                        <div className="stat-item converted">
                          <span className="stat-number">{selectedEmployee.inquiries.converted}</span>
                          <span className="stat-text">Converted</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activities */}
                  <div className="info-card activities-card">
                    <div className="info-card-header">
                      <FaCalendarAlt className="header-icon" />
                      <h3>Recent Activities</h3>
                    </div>
                    <div className="activities-timeline">
                      {selectedEmployee.recentActivities.map((activity, index) => (
                        <div key={index} className="timeline-item">
                          <div className={`timeline-marker ${activity.type}`}></div>
                          <div className="timeline-content">
                            <div className="timeline-title">{activity.title}</div>
                            <div className="timeline-meta">
                              <span className={`status-badge ${activity.status}`}>{activity.status}</span>
                              <span className="timeline-date">
                                {new Date(activity.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer">
                <button 
                  className="export-btn modal-export-btn"
                  onClick={() => exportReport(selectedEmployee.employee.id, 'json')}
                >
                  <FaDownload /> Export Report (JSON)
                </button>
                <button 
                  className="export-btn csv modal-export-btn"
                  onClick={() => exportReport(selectedEmployee.employee.id, 'csv')}
                >
                  <FaDownload /> Export Report (CSV)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get performance class
const getPerformanceClass = (rate) => {
  const numRate = parseFloat(rate);
  if (numRate >= 80) return 'excellent';
  if (numRate >= 60) return 'good';
  if (numRate >= 40) return 'average';
  return 'poor';
};

export default EmployeeReports;