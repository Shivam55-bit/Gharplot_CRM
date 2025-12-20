import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig.jsx";
import "./UserPage.css";
import UserChart from "../component/UserChart/UserChart.jsx";

function UserPage() {
  const limit = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // Assignment related states
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [assignmentData, setAssignmentData] = useState({
    employeeId: '',
    priority: 'medium',
    notes: ''
  });

  // Auto-assignment states
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false);
  const [roles, setRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState(new Set());
  const [autoAssignPriority, setAutoAssignPriority] = useState('medium');
  const [autoAssignNotes, setAutoAssignNotes] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  // Helper function to construct image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    let cleanPath = imagePath;
    if (cleanPath.startsWith("/")) {
      cleanPath = cleanPath.substring(1);
    }

    return `${API_BASE_URL}/${cleanPath}`;
  };

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/users`);
      console.log("Users API response:", response.data);
      console.log(
        "First user with photo:",
        response.data.users?.find((u) => u.photosAndVideo)
      );
      console.log("Users with assignments:", response.data.users?.filter(u => u.assignment));

      if (response.data.success) {
        setUsers(response.data.users);
        setTotalUsers(response.data.totalUsers);
        setError(null);
      } else {
        setError("Failed to fetch users");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.message);
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchEmployees();
    fetchRoles();
  }, []);

  // Fetch employees for assignment dropdown
  const fetchEmployees = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) return;

      const response = await axios.get(`${API_BASE_URL}/admin/user-leads/available-employees`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.data.success) {
        setEmployees(response.data.data);
        console.log('Employees loaded:', response.data.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Fetch roles for auto-assignment
  const fetchRoles = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) return;

      const response = await axios.get(`${API_BASE_URL}/admin/roles/`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.data.success) {
        setRoles(response.data.data);
        console.log('Roles loaded:', response.data.data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  // Handle role selection for auto-assignment
  const handleRoleSelection = (roleId) => {
    setSelectedRoles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roleId)) {
        newSet.delete(roleId);
      } else {
        newSet.add(roleId);
      }
      return newSet;
    });
  };

  // Filter employees when roles are selected
  useEffect(() => {
    if (selectedRoles.size > 0) {
      const filtered = employees.filter(emp => 
        selectedRoles.has(emp.role?._id)
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees([]);
    }
  }, [selectedRoles, employees]);

  // Handle auto-assignment
  const handleAutoAssignment = async () => {
    if (selectedUsers.size === 0) {
      alert('Please select users to assign');
      return;
    }

    if (filteredEmployees.length === 0) {
      alert('No employees available for selected roles');
      return;
    }

    try {
      const adminToken = localStorage.getItem('adminToken');
      const userIds = Array.from(selectedUsers);
      
      // Distribute users equally among employees
      const usersPerEmployee = Math.floor(userIds.length / filteredEmployees.length);
      const remainder = userIds.length % filteredEmployees.length;
      
      let userIndex = 0;
      const employeeAssignments = [];

      filteredEmployees.forEach((employee, index) => {
        const count = usersPerEmployee + (index < remainder ? 1 : 0);
        const assignedUsers = userIds.slice(userIndex, userIndex + count);
        
        if (assignedUsers.length > 0) {
          employeeAssignments.push({
            employeeId: employee._id,
            employeeName: employee.name,
            userIds: assignedUsers,
            count: assignedUsers.length
          });
        }
        
        userIndex += count;
      });

      console.log('Employee assignments:', employeeAssignments);

      // Make API calls for each employee assignment
      let successCount = 0;
      let failCount = 0;

      for (const assignment of employeeAssignments) {
        try {
          const response = await axios.post(
            `${API_BASE_URL}/admin/user-leads/assign`,
            {
              userIds: assignment.userIds,
              employeeId: assignment.employeeId,
              priority: autoAssignPriority,
              notes: autoAssignNotes || `Auto-assigned ${assignment.count} users`
            },
            {
              headers: { Authorization: `Bearer ${adminToken}` }
            }
          );

          if (response.data.success) {
            successCount += assignment.count;
            console.log(`✓ Assigned ${assignment.count} users to ${assignment.employeeName}`);
          } else {
            failCount += assignment.count;
            console.error(`✗ Failed to assign to ${assignment.employeeName}:`, response.data.message);
          }
        } catch (error) {
          failCount += assignment.count;
          console.error(`✗ Error assigning to ${assignment.employeeName}:`, error);
        }
      }

      // Show results
      if (successCount > 0) {
        setModalMessage(
          `Successfully assigned ${successCount} user(s) to ${employeeAssignments.length} employee(s).${
            failCount > 0 ? ` Failed to assign ${failCount} user(s).` : ''
          }`
        );
        setShowSuccessModal(true);
        setSelectedUsers(new Set());
        setShowAutoAssignModal(false);
        setSelectedRoles(new Set());
        setAutoAssignNotes('');
        // Refresh the users list to show updated assignments after a small delay
        setTimeout(() => {
          fetchUsers();
        }, 500);
      } else {
        setModalMessage(`Failed to assign ${failCount} user(s). Please try again.`);
        setShowErrorModal(true);
      }

    } catch (error) {
      console.error('Error in auto-assignment:', error);
      setModalMessage('Failed to auto-assign users. Please try again.');
      setShowErrorModal(true);
    }
  };

  // Handle user selection
  const handleUserSelection = (userId) => {
    console.log('handleUserSelection called with userId:', userId);
    const user = users.find(u => u._id === userId);
    console.log('Found user:', user);
    console.log('User assignment:', user?.assignment);
    
    // Prevent selection if user is already assigned
    if (user?.assignment) {
      console.log('User already assigned, preventing selection');
      return;
    }
    
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        console.log('Removing user from selection');
        newSet.delete(userId);
      } else {
        console.log('Adding user to selection');
        newSet.add(userId);
      }
      console.log('New selected users:', newSet);
      return newSet;
    });
  };

  // Handle select all users
  const handleSelectAll = () => {
    // Only select unassigned users
    const unassignedUsers = users.filter(user => !user.assignment);
    
    if (selectedUsers.size === unassignedUsers.length && selectedUsers.size > 0) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(unassignedUsers.map(user => user._id)));
    }
  };

  // Handle assignment modal
  const handleAssignUsers = () => {
    if (selectedUsers.size === 0) {
      alert('Please select at least one user to assign');
      return;
    }
    setShowAssignmentModal(true);
  };

  // Handle assignment submission
  const handleAssignmentSubmit = async () => {
    if (!assignmentData.employeeId) {
      alert('Please select an employee');
      return;
    }

    try {
      const adminToken = localStorage.getItem('adminToken');
      const userIds = Array.from(selectedUsers);

      console.log('🚀 Starting user assignment...');
      console.log('Selected user IDs:', userIds);
      console.log('Employee ID:', assignmentData.employeeId);
      console.log('Priority:', assignmentData.priority);
      console.log('Notes:', assignmentData.notes);

      const response = await axios.post(
        `${API_BASE_URL}/admin/user-leads/assign`,
        {
          userIds,
          employeeId: assignmentData.employeeId,
          priority: assignmentData.priority,
          notes: assignmentData.notes
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );

      console.log('✅ Assignment response:', response.data);

      if (response.data.success) {
        setModalMessage(`Successfully assigned ${response.data.data.assignments.length} users to employee`);
        setShowSuccessModal(true);
        setSelectedUsers(new Set());
        setShowAssignmentModal(false);
        setAssignmentData({
          employeeId: '',
          priority: 'medium',
          notes: ''
        });
        // Refresh the users list to show updated assignments after a small delay
        console.log('🔄 Refreshing user list in 500ms...');
        setTimeout(() => {
          console.log('🔄 Calling fetchUsers...');
          fetchUsers();
        }, 500);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('❌ Error assigning users:', error);
      console.error('Error response:', error.response?.data);
      setModalMessage('Failed to assign users. Please try again.');
      setShowErrorModal(true);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    const userId = userToDelete._id;
    setShowDeleteModal(false);

    try {
      setDeletingUserId(userId);
      const response = await axios.delete(`${API_BASE_URL}/api/users/${userId}`);
      console.log("Delete API response:", response.data);

      if (response.status === 200 || response.data.success) {
        setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId));
        setTotalUsers((prev) => prev - 1);

        const filteredUsersAfterDelete = users.filter(
          (user) =>
            user._id !== userId &&
            (user.fullName || "Unknown User")
              .toLowerCase()
              .includes(searchQuery.trim().toLowerCase())
        );
        const newTotalPages = Math.max(
          1,
          Math.ceil(filteredUsersAfterDelete.length / limit)
        );
        if (currentPage > newTotalPages) {
          setCurrentPage(1);
        }

        setModalMessage(
          `User "${userToDelete.fullName || "Unknown User"}" has been deleted successfully!`
        );
        setShowSuccessModal(true);
      } else {
        throw new Error("Failed to delete user");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      setModalMessage(
        `Failed to delete user: ${err.response?.data?.message || err.message}`
      );
      setShowErrorModal(true);
    } finally {
      setDeletingUserId(null);
      setUserToDelete(null);
    }
  };

  // ✅ FIX: handle users with null name or email safely
  const filteredUsers = users.filter((user) => {
    const name = user.fullName || "Unknown User";
    return name.toLowerCase().includes(searchQuery.trim().toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / limit));

  const currentPageUsers = filteredUsers.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

  const calculateUserActivity = () => {
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    let activeCount = 0;
    let inactiveCount = 0;

    users.forEach((user) => {
      let lastLoginDate = null;

      if (user.lastLogin) {
        if (typeof user.lastLogin === "string") {
          lastLoginDate = new Date(user.lastLogin);
        } else if (user.lastLogin.$date) {
          lastLoginDate = new Date(user.lastLogin.$date);
        } else if (user.lastLogin instanceof Date) {
          lastLoginDate = user.lastLogin;
        }
      }

      if (!lastLoginDate && user.createdAt) {
        if (typeof user.createdAt === "string") {
          lastLoginDate = new Date(user.createdAt);
        } else if (user.createdAt.$date) {
          lastLoginDate = new Date(user.createdAt.$date);
        } else if (user.createdAt instanceof Date) {
          lastLoginDate = user.createdAt;
        }
      }

      if (lastLoginDate && lastLoginDate >= fiveDaysAgo) {
        activeCount++;
      } else {
        inactiveCount++;
      }
    });

    return { activeCount, inactiveCount };
  };

  const { activeCount, inactiveCount } = calculateUserActivity();

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <>
      <div className="userpage-container mt-5">
        <div className="header-section mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="title">👥 User Management ({totalUsers} Users)</h2>
            </div>
            <button 
              className="btn btn-outline-light btn-sm" 
              onClick={() => {
                fetchUsers();
                console.log('Manual refresh triggered');
              }}
            >
              🔄 Refresh
            </button>
          </div>
          <input
            type="text"
            className="search-input"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        <div className="mb-3">
          {!loading && (
            <UserChart
              activeCount={activeCount}
              inactiveCount={inactiveCount}
              totalUsers={totalUsers}
            />
          )}
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="spinner-border text-light" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-light">Loading users...</p>
          </div>
        )}

        {error && !loading && (
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">Error Loading Users</h4>
            <p>Unable to fetch user data: {error}</p>
            <button className="btn btn-outline-danger" onClick={fetchUsers}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Assignment Controls */}
            <div className="assignment-controls mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <div className="selection-info">
                  <span className="badge bg-primary me-2" style={{fontSize: '0.75rem', padding: '4px 8px'}}>
                    {selectedUsers.size} selected
                  </span>
                  <button 
                    className="btn btn-sm btn-outline-secondary me-2" 
                    onClick={handleSelectAll}
                    style={{fontSize: '0.75rem', padding: '4px 8px'}}
                  >
                    {selectedUsers.size === users.filter(u => !u.assignment).length && selectedUsers.size > 0 ? 'Deselect All' : 'Select All Unassigned'}
                  </button>
                  <span className="text-muted small" style={{fontSize: '0.7rem'}}>
                    ({users.filter(u => u.assignment).length} already assigned)
                  </span>
                </div>
                {selectedUsers.size > 0 && (
                  <div className="d-flex gap-1">
                    <button 
                      className="btn btn-success btn-sm" 
                      onClick={() => setShowAutoAssignModal(true)}
                      style={{fontSize: '0.75rem', padding: '4px 8px'}}
                    >
                      🤖 Auto Assign ({selectedUsers.size})
                    </button>
                    <button 
                      className="btn btn-primary btn-sm" 
                      onClick={handleAssignUsers}
                      style={{fontSize: '0.75rem', padding: '4px 8px'}}
                    >
                      Assign to Employee ({selectedUsers.size})
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="table-main-container">
              <div className="table-responsive-user" style={{ overflowX: 'auto', maxWidth: '100%' }}>
                <table className="table table-hover user-table" style={{ minWidth: '100%', tableLayout: 'fixed', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{lineHeight: '1.2'}}>
                      <th style={{ width: "2%", padding: '4px 2px', fontSize: '0.8rem', textAlign: 'center' }}>
                        <div style={{minWidth: '18px', minHeight: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          <input
                            type="checkbox"
                            checked={selectedUsers.size === users.filter(u => !u.assignment).length && users.filter(u => !u.assignment).length > 0 && selectedUsers.size > 0}
                            onChange={(e) => {
                              e.stopPropagation();
                              console.log('Header checkbox clicked');
                              handleSelectAll();
                            }}
                            style={{
                              width: '14px',
                              height: '14px',
                              cursor: 'pointer',
                              margin: 0
                            }}
                            title="Select/Deselect all unassigned users"
                          />
                        </div>
                      </th>
                      <th style={{ width: "3%", padding: '6px 4px', fontSize: '0.8rem' }}>No.</th>
                      <th style={{ width: "20%", padding: '6px 4px', fontSize: '0.8rem' }}>User Details</th>
                      <th style={{ width: "12%", padding: '6px 4px', fontSize: '0.8rem' }}>Contact & Location</th>
                      <th style={{ width: "18%", padding: '6px 4px', fontSize: '0.8rem' }}>Assigned Employee</th>
                      <th style={{ width: "10%", padding: '6px 4px', fontSize: '0.8rem' }}>Signup Date</th>
                      <th style={{ width: "8%", padding: '6px 4px', fontSize: '0.8rem' }}>Status</th>
                      <th style={{ width: "7%", padding: '6px 4px', fontSize: '0.8rem' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPageUsers.length > 0 ? (
                      currentPageUsers.map((user, idx) => {
                        const isAssigned = !!user.assignment;
                        if (idx === 0) {
                          console.log('First user:', user);
                          console.log('First user assignment:', user.assignment);
                          console.log('Is assigned:', isAssigned);
                        }
                        return (
                        <tr key={user._id} className="fade-in" style={{lineHeight: '1.1'}}>
                          <td style={{padding: '4px 2px', verticalAlign: 'middle', textAlign: 'center'}}>
                            <div style={{minWidth: '18px', minHeight: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                              <input
                                type="checkbox"
                                checked={selectedUsers.has(user._id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  console.log('Checkbox clicked for user:', user._id);
                                  handleUserSelection(user._id);
                                }}
                                disabled={isAssigned}
                                style={{
                                  width: '14px',
                                  height: '14px',
                                  cursor: isAssigned ? 'not-allowed' : 'pointer',
                                  opacity: isAssigned ? 0.5 : 1,
                                  margin: 0
                                }}
                                title={isAssigned ? 'User already assigned' : `Select ${user.fullName || 'user'}`}
                              />
                            </div>
                          </td>
                          <td style={{padding: '6px 4px', verticalAlign: 'middle'}}><strong style={{fontSize: '0.85rem'}}>{(currentPage - 1) * limit + idx + 1}</strong></td>
                          <td data-label="User Details" style={{padding: '6px 4px', verticalAlign: 'middle'}}>
                            <div className="d-flex align-items-start gap-1">
                              {(() => {
                                const hasPhoto =
                                  user.photosAndVideo &&
                                  Array.isArray(user.photosAndVideo) &&
                                  user.photosAndVideo.length > 0;

                                const imageUrl = hasPhoto
                                  ? getImageUrl(user.photosAndVideo[0])
                                  : user.avatar ||
                                    "https://abc.ridealmobility.com/uploads/default-avatar.jpg";

                                return (
                                  <img
                                    src={imageUrl}
                                    alt={user.fullName || "User"}
                                    className="user-photo"
                                    style={{width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0}}
                                    onError={(e) => {
                                      e.target.src =
                                        "https://abc.ridealmobility.com/uploads/default-avatar.jpg";
                                    }}
                                  />
                                );
                              })()}
                              <div className="flex-grow-1 overflow-hidden">
                                <div className="fw-bold text-white mb-1 text-truncate" style={{fontSize: '0.8rem', lineHeight: '1.1'}}>{user.fullName || "Unknown User"}</div>
                                <div className="small">
                                  <div className="text-muted text-truncate" style={{fontSize: '0.7rem', lineHeight: '1.1'}}>📧 {user.email || "N/A"}</div>
                                  {(user.isEmailVerified || user.isPhoneVerified) && (
                                    <div className="d-flex gap-1 mt-1">
                                      {user.isEmailVerified && <span className="badge bg-success" style={{fontSize: '7px', padding: '1px 3px'}}>✓ Email</span>}
                                      {user.isPhoneVerified && <span className="badge bg-success" style={{fontSize: '7px', padding: '1px 3px'}}>✓ Phone</span>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td data-label="Contact & Location" style={{padding: '6px 4px', verticalAlign: 'middle'}}>
                            <div className="small">
                              <div className="text-white mb-1 text-truncate" style={{fontSize: '0.7rem', lineHeight: '1.1'}}>📞 {user.phone || "N/A"}</div>
                              <div className="text-muted text-truncate" style={{fontSize: '0.65rem', lineHeight: '1.1'}}>
                                📍 {user.city || "N/A"}, {user.state || "N/A"}
                              </div>
                              {user.pinCode && <div className="text-muted text-truncate" style={{fontSize: '0.65rem', lineHeight: '1.1'}}>PIN: {user.pinCode}</div>}
                            </div>
                          </td>
                          <td data-label="Assigned Employee" style={{padding: '6px 4px', verticalAlign: 'middle'}}>
                            {user.assignment ? (
                              <div className="assignment-card p-1" style={{
                                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                                borderRadius: '6px',
                                border: '1px solid rgba(40, 167, 69, 0.3)',
                                fontSize: '0.7rem'
                              }}>
                                <div className="fw-bold text-success mb-1" style={{fontSize: '0.7rem', lineHeight: '1.1'}}>
                                  ✓ ASSIGNED TO: {user.assignment.employeeId?.name || 'Unknown'}
                                </div>
                                <div className="small">
                                  <div className="text-muted" style={{fontSize: '0.65rem', lineHeight: '1.1'}}>EMAIL: {user.assignment.employeeId?.email || 'N/A'}</div>
                                  <div className="text-warning mt-1" style={{fontSize: '0.65rem', lineHeight: '1.1'}}>STATUS: {user.assignment.status?.toUpperCase() || 'ACTIVE'}</div>
                                  <div className="text-muted" style={{fontSize: '0.65rem', lineHeight: '1.1'}}>ASSIGNED: {new Date(user.assignment.assignedDate).toLocaleDateString()}</div>
                                  <div>
                                    <span className={`badge mt-1 ${
                                      user.assignment.priority === 'urgent' ? 'bg-danger' :
                                      user.assignment.priority === 'high' ? 'bg-warning text-dark' :
                                      user.assignment.priority === 'medium' ? 'bg-info' :
                                      'bg-secondary'
                                    }`} style={{fontSize: '0.6rem', padding: '1px 3px'}}>
                                      PRIORITY: {user.assignment.priority?.toUpperCase()}
                                    </span>
                                  </div>
                                  {user.assignment.notes && (
                                    <div className="text-muted fst-italic mt-1" style={{fontSize: '0.6rem', lineHeight: '1.1'}}>
                                      📝 {user.assignment.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted" style={{fontSize: '0.75rem'}}>Not assigned</span>
                            )}
                          </td>
                          <td data-label="Signup Date" style={{padding: '6px 4px', verticalAlign: 'middle'}}>
                            <div className="small">
                              <div className="text-white" style={{fontSize: '0.7rem', lineHeight: '1.1'}}>{new Date(user.createdAt).toLocaleDateString()}</div>
                              <div className="text-muted" style={{fontSize: '0.65rem', lineHeight: '1.1'}}>{new Date(user.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
                              {user.lastLogin && (
                                <div className="text-muted mt-1" style={{fontSize: '0.65rem', lineHeight: '1.1'}}>
                                  Last: {new Date(user.lastLogin).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td data-label="Status" style={{padding: '6px 4px', verticalAlign: 'middle'}}>
                            <div className="d-flex flex-column gap-1">
                              {user.isNewUser ? (
                                <span className="badge bg-success" style={{fontSize: '0.6rem', padding: '2px 4px'}}>NEW USER</span>
                              ) : (
                                <span className="badge bg-primary" style={{fontSize: '0.6rem', padding: '2px 4px'}}>EXISTING USER</span>
                              )}
                              {user.lastLogin && 
                               new Date(user.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? (
                                <span className="badge bg-success" style={{fontSize: '0.6rem', padding: '2px 4px'}}>ACTIVE</span>
                              ) : (
                                <span className="badge bg-warning" style={{fontSize: '0.6rem', padding: '2px 4px'}}>INACTIVE</span>
                              )}
                            </div>
                          </td>
                          <td
                            data-label="Action"
                            style={{ padding: '6px 4px', verticalAlign: 'middle' }}
                          >
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteClick(user)}
                              disabled={deletingUserId === user._id}
                              title="Delete User"
                              style={{fontSize: '0.7rem', padding: '3px 6px'}}
                            >
                              {deletingUserId === user._id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </td>
                        </tr>
                      )})
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center no-data">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-4 pagination-wrapper">
              <button
                className="btn btn-primary btn-paginate"
                onClick={handlePrev}
                disabled={currentPage === 1}
              >
                ⬅ Previous
              </button>
              <span className="page-info">
                Page <strong>{currentPage}</strong> of{" "}
                <strong>{totalPages}</strong>
              </span>
              <button
                className="btn btn-primary btn-paginate"
                onClick={handleNext}
                disabled={currentPage === totalPages}
              >
                Next ➡
              </button>
            </div>
          </>
        )}

        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Confirm Delete</h3>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to delete{" "}
                  <strong>{userToDelete?.fullName || "Unknown User"}</strong>?
                </p>
                <p className="text-warning">This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={handleCancelDelete}>
                  Cancel
                </button>
                <button
                  className="btn-confirm-delete"
                  onClick={handleConfirmDelete}
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        )}

        {showSuccessModal && (
          <div className="modal-overlay">
            <div className="modal-content success-modal">
              <div className="modal-header">
                <h3>Success</h3>
              </div>
              <div className="modal-body">
                <p>{modalMessage}</p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn-ok"
                  onClick={() => setShowSuccessModal(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {showErrorModal && (
          <div className="modal-overlay">
            <div className="modal-content error-modal">
              <div className="modal-header">
                <h3>Error</h3>
              </div>
              <div className="modal-body">
                <p>{modalMessage}</p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn-ok"
                  onClick={() => setShowErrorModal(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assignment Modal */}
        {showAssignmentModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Assign Users to Employee</h3>
              </div>
              <div className="modal-body">
                <p>Assigning {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} to employee:</p>
                
                {/* Show selected users details */}
                <div className="mb-3">
                  <label className="form-label">Selected Users:</label>
                  <div className="selected-users-preview" style={{maxHeight: '150px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '5px', padding: '10px'}}>
                    {Array.from(selectedUsers).map(userId => {
                      const user = users.find(u => u._id === userId);
                      if (!user) return null;
                      return (
                        <div key={userId} className="d-flex align-items-center mb-2 p-2" style={{backgroundColor: '#f8f9fa', borderRadius: '5px'}}>
                          <img
                            src={user.avatar || "https://abc.ridealmobility.com/uploads/default-avatar.jpg"}
                            alt={user.fullName || "User"}
                            style={{width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', marginRight: '10px'}}
                            onError={(e) => {
                              e.target.src = "https://abc.ridealmobility.com/uploads/default-avatar.jpg";
                            }}
                          />
                          <div className="flex-grow-1">
                            <div className="fw-bold">{user.fullName || 'Unknown User'}</div>
                            <div className="small text-muted">
                              {user.email} | {user.phone || 'No phone'}
                            </div>
                            {(user.city || user.state) && (
                              <div className="small text-muted">
                                📍 {[user.city, user.state].filter(Boolean).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Select Employee:</label>
                  <select 
                    className="form-select"
                    value={assignmentData.employeeId}
                    onChange={(e) => setAssignmentData({...assignmentData, employeeId: e.target.value})}
                  >
                    <option value="">Choose an employee...</option>
                    {employees.map(employee => (
                      <option key={employee._id} value={employee._id}>
                        {employee.name} ({employee.email})
                      </option>
                    ))}
                  </select>
                  {employees.length === 0 && (
                    <small className="text-muted">No employees available</small>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Priority:</label>
                  <select 
                    className="form-select"
                    value={assignmentData.priority}
                    onChange={(e) => setAssignmentData({...assignmentData, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Notes (Optional):</label>
                  <textarea 
                    className="form-control notes-textarea-ltr"
                    rows="3"
                    placeholder="Add any notes about this assignment..."
                    value={assignmentData.notes}
                    onChange={(e) => setAssignmentData({...assignmentData, notes: e.target.value})}
                    dir="ltr"
                    lang="en"
                    style={{ 
                      direction: 'ltr', 
                      textAlign: 'left',
                      unicodeBidi: 'normal'
                    }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn-cancel" 
                  onClick={() => setShowAssignmentModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-confirm-delete" 
                  onClick={handleAssignmentSubmit}
                  disabled={!assignmentData.employeeId}
                >
                  Assign Users
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auto-Assignment Modal */}
        {showAutoAssignModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{maxWidth: '700px'}}>
              <div className="modal-header">
                <h3>🤖 Auto Assign Users</h3>
              </div>
              <div className="modal-body">
                <p className="mb-3">
                  Select roles to distribute {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} equally among employees
                </p>

                {/* Role Selection */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Select Roles:</label>
                  <div className="roles-selection-container" style={{
                    maxHeight: '200px', 
                    overflowY: 'auto', 
                    border: '1px solid #ddd', 
                    borderRadius: '8px', 
                    padding: '15px',
                    backgroundColor: '#f8f9fa'
                  }}>
                    {roles.map(role => (
                      <div key={role._id} className="form-check mb-2 p-2" style={{
                        backgroundColor: selectedRoles.has(role._id) ? '#e7f3ff' : '#fff',
                        borderRadius: '5px',
                        border: selectedRoles.has(role._id) ? '2px solid #0d6efd' : '1px solid #dee2e6',
                        transition: 'all 0.2s'
                      }}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`role-${role._id}`}
                          checked={selectedRoles.has(role._id)}
                          onChange={() => handleRoleSelection(role._id)}
                        />
                        <label className="form-check-label fw-bold" htmlFor={`role-${role._id}`} style={{cursor: 'pointer'}}>
                          {role.name}
                          <span className="badge bg-secondary ms-2" style={{fontSize: '11px'}}>
                            {employees.filter(emp => emp.role?._id === role._id).length} employees
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                  {roles.length === 0 && (
                    <p className="text-muted mt-2">No roles available</p>
                  )}
                </div>

                {/* Assignment Preview */}
                {filteredEmployees.length > 0 && (
                  <div className="mb-3 p-3" style={{
                    backgroundColor: '#e7f3ff', 
                    borderRadius: '8px',
                    border: '1px solid #0d6efd'
                  }}>
                    <h6 className="fw-bold mb-2">📊 Assignment Preview:</h6>
                    <div className="row">
                      <div className="col-6">
                        <small className="text-muted">Total Users:</small>
                        <div className="fw-bold">{selectedUsers.size}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Available Employees:</small>
                        <div className="fw-bold">{filteredEmployees.length}</div>
                      </div>
                      <div className="col-12 mt-2">
                        <small className="text-muted">Users per Employee:</small>
                        <div className="fw-bold">
                          ~{Math.floor(selectedUsers.size / filteredEmployees.length)} - {Math.ceil(selectedUsers.size / filteredEmployees.length)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Employee list */}
                    <div className="mt-3">
                      <small className="text-muted fw-bold">Employees in selected roles:</small>
                      <div style={{maxHeight: '150px', overflowY: 'auto'}} className="mt-2">
                        {filteredEmployees.map((emp, index) => {
                          const usersPerEmployee = Math.floor(selectedUsers.size / filteredEmployees.length);
                          const remainder = selectedUsers.size % filteredEmployees.length;
                          const assignedCount = usersPerEmployee + (index < remainder ? 1 : 0);
                          
                          return (
                            <div key={emp._id} className="d-flex justify-content-between align-items-center p-2 mb-1" style={{
                              backgroundColor: '#fff',
                              borderRadius: '5px',
                              fontSize: '13px'
                            }}>
                              <span>
                                <strong>{emp.name}</strong>
                                <span className="text-muted ms-2">({emp.role?.name})</span>
                              </span>
                              <span className="badge bg-primary">{assignedCount} users</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Priority Selection */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Priority:</label>
                  <select 
                    className="form-select"
                    value={autoAssignPriority}
                    onChange={(e) => setAutoAssignPriority(e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Notes (Optional):</label>
                  <textarea 
                    className="form-control"
                    rows="2"
                    placeholder="Add any notes about this auto-assignment..."
                    value={autoAssignNotes}
                    onChange={(e) => setAutoAssignNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn-cancel" 
                  onClick={() => {
                    setShowAutoAssignModal(false);
                    setSelectedRoles(new Set());
                    setAutoAssignNotes('');
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn-confirm-delete" 
                  onClick={handleAutoAssignment}
                  disabled={filteredEmployees.length === 0}
                  style={{
                    backgroundColor: filteredEmployees.length === 0 ? '#6c757d' : '#198754',
                    borderColor: filteredEmployees.length === 0 ? '#6c757d' : '#198754'
                  }}
                >
                  {filteredEmployees.length === 0 
                    ? 'Select Roles First' 
                    : `Auto Assign to ${filteredEmployees.length} Employee${filteredEmployees.length > 1 ? 's' : ''}`
                  }
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default UserPage;
