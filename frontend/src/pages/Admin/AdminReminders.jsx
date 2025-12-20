import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Eye,
  Settings
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import { toast } from 'react-toastify';
import './AdminReminders.css';

const AdminReminders = () => {
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [dueReminders, setDueReminders] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeReminders, setEmployeeReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, employees, due-reminders
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Fetch admin statistics
  const fetchStats = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/admin/reminders/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('📊 Stats API Response:', response.data);
      
      if (response.data.success) {
        setStats(response.data.data);
        console.log('✅ Stats loaded:', response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to fetch statistics');
    }
  };

  // Fetch employees with reminder status
  const fetchEmployees = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem('adminToken');
      
      console.log('📋 Fetching employees with reminder status...');
      
      let employeeData = [];
      
      // Try dedicated endpoint first
      try {
        const response = await axios.get(`${API_BASE_URL}/admin/reminders/employees-status`, {
          headers: { Authorization: `Bearer ${adminToken}` },
          params: { page, limit: 20, search }
        });
        
        console.log('✅ employees-status Response:', response.data);
        
        if (response.data.success && response.data.data && response.data.data.length > 0) {
          employeeData = response.data.data;
          console.log('👥 Loaded from reminder endpoint:', employeeData.length);
          
          setEmployees(employeeData);
          setPagination(response.data.pagination || {
            currentPage: page,
            totalPages: 1,
            totalItems: employeeData.length,
            itemsPerPage: 20
          });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.log('⚠️ Reminder endpoint failed, using fallback:', err.message);
      }
      
      // Fallback: Regular employee endpoint
      console.log('🔄 Trying regular employee endpoint...');
      const response = await axios.get(`${API_BASE_URL}/admin/employees`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { page, limit: 100, search }
      });
      
      console.log('✅ Regular employees Response:', response.data);
      
      if (response.data.success) {
        employeeData = Array.isArray(response.data.data) 
          ? response.data.data 
          : (response.data.employees || []);
        
        console.log('👥 Loaded from employee endpoint:', employeeData.length);
        
        // Manually set adminReminderPopupEnabled to false if not present
        employeeData = employeeData.map(emp => ({
          ...emp,
          adminReminderPopupEnabled: emp.adminReminderPopupEnabled || false,
          reminderStats: {
            totalPending: 0,
            currentlyDue: 0
          }
        }));
        
        setEmployees(employeeData);
        setPagination({
          currentPage: page,
          totalPages: Math.ceil(employeeData.length / 20),
          totalItems: employeeData.length,
          itemsPerPage: 20
        });
      }
    } catch (error) {
      console.error('❌ Error fetching employees:', error);
      console.error('📛 Error details:', error.response?.data);
      toast.error('Failed to fetch employees: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Fetch all due reminders for admin
  const fetchDueReminders = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      
      console.log('⏰ Fetching all due reminders...');
      
      const response = await axios.get(`${API_BASE_URL}/admin/reminders/due-all`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ Due reminders response:', response.data);
      console.log('📊 Total due:', response.data.count, 'for', response.data.totalEmployees, 'employees');
      
      if (response.data.success) {
        const remindersData = Array.isArray(response.data.data) ? response.data.data : [];
        console.log('🔔 Due reminders loaded:', remindersData.length);
        setDueReminders(remindersData);
      }
    } catch (error) {
      console.error('❌ Error fetching due reminders:', error);
      console.error('📛 Error details:', error.response?.data);
    }
  };

  // Fetch specific employee's reminders
  const fetchEmployeeReminders = async (employeeId, status = '') => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/admin/reminders/employee/${employeeId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { status, page: 1, limit: 50 }
      });
      
      if (response.data.success) {
        setEmployeeReminders(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching employee reminders:', error);
      toast.error('Failed to fetch reminders');
    } finally {
      setLoading(false);
    }
  };

  // Toggle employee popup
  const toggleEmployeePopup = async (employeeId, currentStatus) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const newStatus = !currentStatus;
      
      console.log('🔄 Toggling popup for employee:', employeeId);
      console.log('📤 Setting adminReminderPopupEnabled:', newStatus);
      
      // First get current employee data
      const getRes = await axios.get(
        `${API_BASE_URL}/admin/employees/${employeeId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      if (!getRes.data.success) {
        throw new Error('Failed to fetch employee');
      }
      
      const employeeData = getRes.data.data || getRes.data.employee;
      console.log('📋 Current employee:', employeeData);
      
      // Update employee with new popup status
      const response = await axios.put(
        `${API_BASE_URL}/admin/employees/${employeeId}`,
        {
          name: employeeData.name,
          email: employeeData.email,
          phone: employeeData.phone,
          department: employeeData.department,
          role: employeeData.role?._id || employeeData.role,
          adminReminderPopupEnabled: newStatus
        },
        { 
          headers: { 
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      console.log('✅ Update response:', response.data);
      
      if (response.data.success) {
        // Update UI
        setEmployees(prev => prev.map(emp => 
          emp._id === employeeId 
            ? { ...emp, adminReminderPopupEnabled: newStatus }
            : emp
        ));
        
        toast.success(`Admin popup ${newStatus ? 'enabled' : 'disabled'}!`, {
          position: "top-right",
          autoClose: 2000
        });
        
        // Verify after 1 second
        setTimeout(async () => {
          const verifyRes = await axios.get(
            `${API_BASE_URL}/admin/employees/${employeeId}`,
            { headers: { Authorization: `Bearer ${adminToken}` } }
          );
          const verified = verifyRes.data.data?.adminReminderPopupEnabled || verifyRes.data.employee?.adminReminderPopupEnabled;
          console.log('🔍 Verified after save:', verified);
          
          if (verified !== newStatus) {
            console.warn('⚠️ Value not persisted! Expected:', newStatus, 'Got:', verified);
            toast.warning('Setting may not have saved. Contact backend developer.', {
              position: "top-right",
              autoClose: 4000
            });
          }
        }, 1000);
      } else {
        throw new Error(response.data.message || 'Failed to update');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      console.error('📛 Details:', error.response?.data);
      
      toast.error('Failed: ' + (error.response?.data?.message || error.message), {
        position: "top-right",
        autoClose: 3000
      });
      
      // Refresh to show actual state
      fetchEmployees(currentPage, searchTerm);
    }
  };

  // Initial load
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    
    console.log('🔑 Admin Token:', adminToken ? 'Found ✅' : 'Missing ❌');
    if (adminToken) {
      console.log('🔑 Token preview:', adminToken.substring(0, 30) + '...');
    } else {
      console.error('❌ No admin token! Please login first.');
      toast.error('Please login as admin first!', {
        position: "top-right",
        autoClose: 3000
      });
      return;
    }
    
    fetchStats();
    fetchEmployees();
    fetchDueReminders();
    
    // Poll for due reminders every 1 minute
    const interval = setInterval(fetchDueReminders, 60000);
    return () => clearInterval(interval);
  }, []);

  // Search handler
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'employees') {
        fetchEmployees(1, searchTerm);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Format date/time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const dateObj = new Date(year, month, day);
    return {
      date: dateObj.toLocaleDateString(),
      time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    };
  };

  // Calculate total due reminders count
  const totalDueCount = dueReminders.reduce((acc, item) => acc + item.reminders.length, 0);

  return (
    <div className="admin-reminders-page">
      <div className="page-header">
        <div className="header-title">
          <Bell size={28} className="header-icon" />
          <h1>Admin Reminder Management</h1>
        </div>
        <div className="header-stats-mini">
          <div className="stat-badge stat-badge-warning">
            <AlertTriangle size={16} />
            <span>{totalDueCount} Due Now</span>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('checkedReminders');
              toast.success('✅ Reminder cache cleared! Refresh page to see popups again.');
              console.log('🗑️ Cleared checkedReminders from localStorage');
            }}
            style={{
              marginLeft: '10px',
              padding: '8px 16px',
              background: '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
            title="Clear dismissed reminders cache"
          >
            🗑️ Clear Cache
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={18} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          <Users size={18} />
          Employees ({employees.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'due-reminders' ? 'active' : ''}`}
          onClick={() => setActiveTab('due-reminders')}
        >
          <Clock size={18} />
          Due Reminders ({totalDueCount})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="overview-section">
          <div className="stats-grid">
            <div className="stat-card stat-card-primary">
              <div className="stat-icon">
                <Users size={32} />
              </div>
              <div className="stat-content">
                <h3>{stats.employees?.total || 0}</h3>
                <p>Total Employees</p>
                <small>{stats.employees?.withPopupEnabled || 0} with popup enabled</small>
              </div>
            </div>

            <div className="stat-card stat-card-info">
              <div className="stat-icon">
                <Bell size={32} />
              </div>
              <div className="stat-content">
                <h3>{stats.reminders?.total || 0}</h3>
                <p>Total Reminders</p>
                <small>{stats.reminders?.pending || 0} pending</small>
              </div>
            </div>

            <div className="stat-card stat-card-warning">
              <div className="stat-icon">
                <Clock size={32} />
              </div>
              <div className="stat-content">
                <h3>{stats.reminders?.currentlyDue || 0}</h3>
                <p>Currently Due</p>
                <small>Requires attention</small>
              </div>
            </div>

            <div className="stat-card stat-card-success">
              <div className="stat-icon">
                <CheckCircle size={32} />
              </div>
              <div className="stat-content">
                <h3>{stats.reminders?.completed || 0}</h3>
                <p>Completed</p>
                <small>All time</small>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="status-breakdown-card">
            <h3>Reminders by Status</h3>
            <div className="status-breakdown">
              {stats.reminders?.byStatus?.map(status => (
                <div key={status._id} className="status-item">
                  <div className={`status-badge status-${status._id}`}>
                    {status._id}
                  </div>
                  <div className="status-count">{status.count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Employees */}
          <div className="top-employees-card">
            <h3>
              <TrendingUp size={20} />
              Top Employees by Reminders
            </h3>
            <div className="top-employees-list">
              {stats.topEmployees?.map((emp, index) => (
                <div key={emp.employeeId} className="top-employee-item">
                  <div className="rank">#{index + 1}</div>
                  <div className="employee-info">
                    <strong>{emp.name}</strong>
                    <small>{emp.email}</small>
                  </div>
                  <div className="reminder-count">
                    <Bell size={16} />
                    {emp.reminderCount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div className="employees-section">
          <div className="section-controls">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="employees-table-container">
            <table className="employees-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Reminders</th>
                  <th>Admin Popup</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center">Loading...</td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center">No employees found</td>
                  </tr>
                ) : (
                  employees.map(emp => (
                    <tr key={emp._id}>
                      <td>Let me search for where the reminder-content div closes in the original working version. The issue is likely missing closing tags. Let me rebuild the employee section properly:
                        <div className="employee-cell">
                          <strong>{emp.name}</strong>
                          <small>{emp.email}</small>
                          <small>{emp.phone}</small>
                        </div>
                      </td>
                      <td>{emp.department || 'N/A'}</td>
                      <td>{emp.role?.name || 'N/A'}</td>
                      <td>
                        <div className="reminder-stats-cell">
                          <span className="badge badge-warning">
                            {emp.reminderStats?.totalPending || 0} Pending
                          </span>
                          {emp.reminderStats?.currentlyDue > 0 && (
                            <span className="badge badge-danger">
                              {emp.reminderStats.currentlyDue} Due
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={emp.adminReminderPopupEnabled || false}
                            onChange={() => toggleEmployeePopup(emp._id, emp.adminReminderPopupEnabled)}
                            disabled={loading}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <small style={{display: 'block', marginTop: '4px', fontSize: '11px', color: '#6b7280'}}>
                          {emp.adminReminderPopupEnabled ? 'Enabled' : 'Disabled'}
                        </small>
                      </td>
                      <td>
                        <button
                          className="btn-icon"
                          onClick={() => {
                            setSelectedEmployee(emp);
                            fetchEmployeeReminders(emp._id);
                          }}
                          title="View reminders"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage(currentPage - 1);
                  fetchEmployees(currentPage - 1, searchTerm);
                }}
              >
                <ChevronLeft size={18} />
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <button
                className="pagination-btn"
                disabled={currentPage === pagination.totalPages}
                onClick={() => {
                  setCurrentPage(currentPage + 1);
                  fetchEmployees(currentPage + 1, searchTerm);
                }}
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Due Reminders Tab */}
      {activeTab === 'due-reminders' && (
        <div className="due-reminders-section">
          {dueReminders.length === 0 ? (
            <div className="empty-state">
              <CheckCircle size={64} />
              <h3>No Due Reminders</h3>
              <p>All reminders are up to date!</p>
            </div>
          ) : (
            dueReminders.map(item => (
              <div key={item.employee._id} className="employee-reminders-group">
                <div className="employee-header">
                  <div className="employee-info">
                    <h3>{item.employee.name}</h3>
                    <p>{item.employee.email} • {item.employee.department}</p>
                  </div>
                  <div className="reminder-count-badge">
                    {item.reminders.length} Due
                  </div>
                </div>
                <div className="reminders-list">
                  {item.reminders.map(reminder => {
                    const { date, time } = formatDateTime(reminder.reminderDateTime);
                    return (
                      <div key={reminder._id} className="reminder-card">
                        <div className="reminder-header">
                          <h4>{reminder.title}</h4>
                          <div className="reminder-time">
                            <Clock size={14} />
                            {date} at {time}
                          </div>
                        </div>
                        <p className="reminder-comment">{reminder.comment}</p>
                        {reminder.clientName && (
                          <div className="client-info">
                            <strong>Client:</strong> {reminder.clientName}
                            {reminder.phone && <span> • {reminder.phone}</span>}
                            {reminder.location && <span> • {reminder.location}</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Employee Reminders Modal */}
      {selectedEmployee && (
        <div className="modal-overlay" onClick={() => setSelectedEmployee(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedEmployee.name}'s Reminders</h3>
              <button className="close-btn" onClick={() => setSelectedEmployee(null)}>
                <XCircle size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="filter-buttons">
                <button 
                  className={`filter-btn ${filterStatus === '' ? 'active' : ''}`}
                  onClick={() => {
                    setFilterStatus('');
                    fetchEmployeeReminders(selectedEmployee._id, '');
                  }}
                >
                  All
                </button>
                <button 
                  className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
                  onClick={() => {
                    setFilterStatus('pending');
                    fetchEmployeeReminders(selectedEmployee._id, 'pending');
                  }}
                >
                  Pending
                </button>
                <button 
                  className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
                  onClick={() => {
                    setFilterStatus('completed');
                    fetchEmployeeReminders(selectedEmployee._id, 'completed');
                  }}
                >
                  Completed
                </button>
              </div>
              
              <div className="reminders-list">
                {employeeReminders.length === 0 ? (
                  <p className="text-center">No reminders found</p>
                ) : (
                  employeeReminders.map(reminder => {
                    const { date, time } = formatDateTime(reminder.reminderDateTime);
                    return (
                      <div key={reminder._id} className="reminder-card">
                        <div className="reminder-header">
                          <h4>{reminder.title}</h4>
                          <span className={`status-badge status-${reminder.status}`}>
                            {reminder.status}
                          </span>
                        </div>
                        <p>{reminder.comment}</p>
                        <div className="reminder-meta">
                          <span>{date} at {time}</span>
                          {reminder.clientName && <span> • {reminder.clientName}</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReminders;
