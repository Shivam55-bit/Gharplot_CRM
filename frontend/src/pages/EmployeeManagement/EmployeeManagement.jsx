import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Badge, Alert } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaEye, FaKey, FaStar } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import { TokenManager } from '../../utils/tokenManager';
import * as UspService from '../../services/UspService';

// Custom CSS to ensure action buttons are always visible
const modalStyles = `
  .employee-modal-content {
    position: relative !important;
  }
  .employee-modal-content .modal-body {
    padding-bottom: 100px !important;
  }
  .employee-modal-action-buttons {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    background-color: #ffffff !important;
    border-top: 2px solid #007bff !important;
    padding: 20px !important;
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    z-index: 99999 !important;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.15) !important;
    margin: 0 !important;
    width: 100% !important;
  }
  .employee-modal-action-buttons button {
    font-size: 16px !important;
    font-weight: bold !important;
    padding: 12px 24px !important;
  }
  .modal.show .modal-dialog {
    margin-bottom: 100px !important;
  }
  
  /* Ensure table action buttons are visible */
  .table {
    table-layout: fixed !important;
    width: 100% !important;
  }
  
  .table td {
    vertical-align: middle !important;
    word-wrap: break-word !important;
  }
  
  .table .btn {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    opacity: 1 !important;
    visibility: visible !important;
    position: relative !important;
    z-index: 1 !important;
    flex-shrink: 0 !important;
  }
  
  .table .btn:hover {
    transform: scale(1.05) !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
    transition: all 0.2s ease !important;
  }
  
  .table td .d-flex {
    align-items: center !important;
    justify-content: flex-start !important;
    gap: 4px !important;
    flex-wrap: nowrap !important;
  }
  
  /* Responsive table container */
  .table-container {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
  }
  
  /* Column widths for better layout */
  .table th:nth-child(1) { width: 8%; }   /* SN */
  .table th:nth-child(2) { width: 15%; }  /* Name */
  .table th:nth-child(3) { width: 20%; }  /* Email */
  .table th:nth-child(4) { width: 12%; }  /* Phone */
  .table th:nth-child(5) { width: 12%; }  /* Role */
  .table th:nth-child(6) { width: 10%; }  /* Dept */
  .table th:nth-child(7) { width: 10%; }  /* Status */
  .table th:nth-child(8) { width: 10%; }  /* Date */
  .table th:nth-child(9) { width: 13%; }  /* Actions */
`;

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showUspModal, setShowUspModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [passwordEmployee, setPasswordEmployee] = useState(null);
  const [uspEmployee, setUspEmployee] = useState(null);
  const [uspCategories, setUspCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    password: '',
    department: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [uspData, setUspData] = useState({
    categoryId: '',
    expertise: '',
    experienceYears: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch employees and roles
  useEffect(() => {
    // Immediate token validation
    const adminToken = localStorage.getItem('adminToken');
    const employeeToken = localStorage.getItem('employeeToken');
    
    if (!adminToken && !employeeToken) {
      setError('No authentication token found. Redirecting to login...');
      setTimeout(() => {
        TokenManager.redirectToLogin();
      }, 1500);
      return;
    }
    
    // Check if tokens are expired
    if ((adminToken && TokenManager.isTokenExpired(adminToken)) || 
        (employeeToken && TokenManager.isTokenExpired(employeeToken))) {
      setError('Session expired. Redirecting to login...');
      setTimeout(() => {
        TokenManager.redirectToLogin();
      }, 1500);
      return;
    }
    
    fetchEmployees();
    fetchRoles();
  }, []);

  const fetchEmployees = async () => {
    try {
      // Check and clear expired tokens first
      TokenManager.clearExpiredTokens();
      
      const employeeToken = localStorage.getItem('employeeToken');
      const adminToken = localStorage.getItem('adminToken');
      
      // Prioritize admin token if available, then employee token
      const token = adminToken || employeeToken;
      
      // Use admin endpoint if admin token, employee endpoint if employee token
      const endpoint = adminToken ? `${API_BASE_URL}/admin/employees` : `${API_BASE_URL}/api/employees`;
      
      console.log('🔑 Token Debug:', {
        hasAdminToken: !!adminToken,
        hasEmployeeToken: !!employeeToken,
        usingToken: token ? token.substring(0, 20) + '...' : 'None',
        endpoint: endpoint
      });
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error('Error:', error);
      
      // Use TokenManager to handle invalid/expired tokens
      if (TokenManager.handleInvalidToken(error)) {
        setError('Session expired. Redirecting to login...');
        return; // TokenManager handles the redirect
      } else {
        setError('Error fetching employees. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const employeeToken = localStorage.getItem('employeeToken');
      const adminToken = localStorage.getItem('adminToken');
      
      // Prioritize admin token if available, then employee token
      const token = adminToken || employeeToken;
      
      // Use admin endpoint if admin token, employee endpoint if employee token  
      const endpoint = adminToken ? `${API_BASE_URL}/admin/roles` : `${API_BASE_URL}/api/roles`;
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setRoles(response.data.data.filter(role => role.isActive));
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleShowModal = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role._id,
        password: '',
        department: employee.department || '',
        giveAdminAccess: employee.giveAdminAccess || false,
        address: {
          street: employee.address?.street || '',
          city: employee.address?.city || '',
          state: employee.address?.state || '',
          zipCode: employee.address?.zipCode || '',
          country: employee.address?.country || ''
        }
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        password: '',
        department: '',
        giveAdminAccess: false,
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        }
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
  };

  const handleShowPasswordModal = (employee) => {
    setPasswordEmployee(employee);
    setPasswordData({
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordModal(true);
    setError('');
    setSuccess('');
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordEmployee(null);
    setPasswordData({
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleShowUspModal = async (employee) => {
    setUspEmployee(employee);
    setUspData({
      categoryId: '',
      expertise: '',
      experienceYears: '',
      description: ''
    });
    setShowUspModal(true);
    setError('');
    setSuccess('');
    
    // Fetch USP categories
    try {
      const response = await UspService.getAllCategories();
      if (response.success) {
        setUspCategories(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching USP categories:', error);
    }
  };

  const handleCloseUspModal = () => {
    setShowUspModal(false);
    setUspEmployee(null);
    setUspData({
      categoryId: '',
      expertise: '',
      experienceYears: '',
      description: ''
    });
  };

  const handleUspInputChange = (e) => {
    const { name, value } = e.target;
    setUspData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone is required');
      return false;
    }
    if (!formData.role) {
      setError('Role is required');
      return false;
    }
    if (!editingEmployee && !formData.password) {
      setError('Password is required for new employees');
      return false;
    }
    return true;
  };

  const validatePasswordForm = () => {
    if (!passwordData.newPassword) {
      setError('New password is required');
      return false;
    }
    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const validateUspForm = () => {
    if (!uspData.categoryId) {
      setError('Please select a USP category');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    try {
      const employeeToken = localStorage.getItem('employeeToken');
      const adminToken = localStorage.getItem('adminToken');
      const token = employeeToken || adminToken;
      
      // Use admin endpoint if admin token, employee endpoint if employee token
      const baseEndpoint = adminToken ? `${API_BASE_URL}/admin/employees` : `${API_BASE_URL}/api/employees`;
      const url = editingEmployee 
        ? `${baseEndpoint}/${editingEmployee._id}`
        : baseEndpoint;
      
      const method = editingEmployee ? 'put' : 'post';

      // Don't send password if editing and password is empty
      const submitData = { ...formData };
      if (editingEmployee && !submitData.password) {
        delete submitData.password;
      }

      const response = await axios[method](url, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess(editingEmployee ? 'Employee updated successfully!' : 'Employee created successfully!');
        fetchEmployees();
        setTimeout(() => {
          handleCloseModal();
        }, 1500);
      }
    } catch (error) {
      // Use TokenManager to handle invalid/expired tokens
      if (TokenManager.handleInvalidToken(error)) {
        setError('Session expired. Redirecting to login...');
        return; // TokenManager handles the redirect
      } else {
        setError(error.response?.data?.message || 'An error occurred');
      }
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validatePasswordForm()) return;

    try {
      const employeeToken = localStorage.getItem('employeeToken');
      const adminToken = localStorage.getItem('adminToken');
      const token = employeeToken || adminToken;
      
      // Use admin endpoint if admin token, employee endpoint if employee token
      const endpoint = adminToken ? 
        `${API_BASE_URL}/admin/employees/${passwordEmployee._id}/password` : 
        `${API_BASE_URL}/api/employees/${passwordEmployee._id}/password`;
      
      const response = await axios.put(
        endpoint,
        { newPassword: passwordData.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccess('Password updated successfully!');
        setTimeout(() => {
          handleClosePasswordModal();
        }, 1500);
      }
    } catch (error) {
      // Use TokenManager to handle invalid/expired tokens
      if (TokenManager.handleInvalidToken(error)) {
        setError('Session expired. Redirecting to login...');
        return; // TokenManager handles the redirect
      } else {
        setError(error.response?.data?.message || 'Error updating password');
      }
    }
  };

  const handleUspSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateUspForm()) return;

    try {
      const data = {
        employeeId: uspEmployee._id,
        categoryId: uspData.categoryId,
        expertise: uspData.expertise,
        experienceYears: uspData.experienceYears ? parseInt(uspData.experienceYears) : undefined,
        description: uspData.description
      };

      await UspService.addEmployeeById(data);
      setSuccess('Employee added to USP successfully!');
      
      setTimeout(() => {
        handleCloseUspModal();
      }, 1500);
    } catch (error) {
      if (TokenManager.handleInvalidToken(error)) {
        setError('Session expired. Redirecting to login...');
        return;
      } else {
        setError(error.response?.data?.message || 'Error adding employee to USP');
      }
    }
  };

  const handleDelete = async (employeeId) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;

    try {
      const employeeToken = localStorage.getItem('employeeToken');
      const adminToken = localStorage.getItem('adminToken');
      const token = employeeToken || adminToken;
      
      // Use admin endpoint if admin token, employee endpoint if employee token
      const endpoint = adminToken ? 
        `${API_BASE_URL}/admin/employees/${employeeId}` : 
        `${API_BASE_URL}/api/employees/${employeeId}`;
      
      const response = await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess('Employee deleted successfully!');
        fetchEmployees();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      // Use TokenManager to handle invalid/expired tokens
      if (TokenManager.handleInvalidToken(error)) {
        setError('Session expired. Redirecting to login...');
        return; // TokenManager handles the redirect
      } else {
        setError(error.response?.data?.message || 'Error deleting employee');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <>
      <style>{modalStyles}</style>
      <Container fluid style={{ paddingTop: '80px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1" style={{ color: '#2c3e50', fontWeight: 'bold' }}>Employee Management</h2>
            <p className="text-muted mb-0">Manage employee accounts and role assignments</p>
          </div>
          <Button
            variant="primary"
            onClick={() => handleShowModal()}
            style={{ 
              backgroundColor: '#007bff',
              borderColor: '#007bff',
              borderRadius: '8px',
              padding: '12px 24px',
              fontWeight: '600',
              color: '#ffffff',
              border: '2px solid #007bff',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 4px rgba(0,123,255,0.3)',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            <FaPlus style={{ fontSize: '12px' }} />
            Add New Employee
          </Button>
        </div>

        {/* Success/Error Alerts */}
        {success && <Alert variant="success">{success}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}

        {/* Main Table */}
        <div className="bg-white rounded shadow-sm" style={{ overflow: 'auto', maxWidth: '100%' }}>
          <Table hover className="mb-0" style={{ fontSize: '0.85rem', tableLayout: 'fixed', width: '100%', minWidth: '900px' }}>
            <thead style={{ backgroundColor: '#343a40' }}>
              <tr>
                <th style={{ padding: '12px 8px', fontWeight: '600', color: '#ffffff', borderBottom: '2px solid #dee2e6', fontSize: '0.8rem' }}>SN</th>
                <th style={{ padding: '12px 10px', fontWeight: '600', color: '#ffffff', borderBottom: '2px solid #dee2e6', fontSize: '0.8rem' }}>Name</th>
                <th style={{ padding: '12px 10px', fontWeight: '600', color: '#ffffff', borderBottom: '2px solid #dee2e6', fontSize: '0.8rem' }}>Email</th>
                <th style={{ padding: '12px 8px', fontWeight: '600', color: '#ffffff', borderBottom: '2px solid #dee2e6', fontSize: '0.8rem' }}>Phone</th>
                <th style={{ padding: '12px 8px', fontWeight: '600', color: '#ffffff', borderBottom: '2px solid #dee2e6', fontSize: '0.8rem' }}>Role</th>
                <th style={{ padding: '12px 8px', fontWeight: '600', color: '#ffffff', borderBottom: '2px solid #dee2e6', fontSize: '0.8rem' }}>Dept</th>
                <th style={{ padding: '12px 8px', fontWeight: '600', color: '#ffffff', borderBottom: '2px solid #dee2e6', fontSize: '0.8rem' }}>Status</th>
                <th style={{ padding: '12px 8px', fontWeight: '600', color: '#ffffff', borderBottom: '2px solid #dee2e6', fontSize: '0.8rem' }}>Join Date</th>
                <th style={{ padding: '12px 10px', fontWeight: '600', color: '#ffffff', borderBottom: '2px solid #dee2e6', fontSize: '0.8rem', minWidth: '160px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee, index) => (
                <tr key={employee._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '10px 8px', fontWeight: '500', color: '#6c757d', fontSize: '0.8rem' }}>
                    {index + 1}
                  </td>
                  <td style={{ padding: '10px 10px', fontWeight: '600', color: '#212529', fontSize: '0.8rem' }}>
                    <div style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {employee.name}
                    </div>
                  </td>
                  <td style={{ padding: '10px 10px', color: '#6c757d', fontSize: '0.75rem' }}>
                    <div style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {employee.email}
                    </div>
                  </td>
                  <td style={{ padding: '10px 8px', color: '#6c757d', fontSize: '0.75rem' }}>
                    {employee.phone}
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <span 
                      className="badge" 
                      style={{
                        backgroundColor: '#e8f4fd',
                        color: '#0d6efd',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: '500'
                      }}
                    >
                      {employee.role?.name?.substring(0, 8) || 'No Role'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', color: '#6c757d', fontSize: '0.75rem' }}>
                    <div style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {employee.department || 'N/A'}
                    </div>
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <span 
                      className="badge" 
                      style={{
                        backgroundColor: employee.isActive ? '#d1ecf1' : '#f8d7da',
                        color: employee.isActive ? '#0c5460' : '#721c24',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: '500'
                      }}
                    >
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', color: '#6c757d', fontSize: '0.75rem' }}>
                    {new Date(employee.joinDate).toLocaleDateString('en-GB', { 
                      day: '2-digit', month: '2-digit' 
                    })}
                  </td>
                  <td style={{ padding: '10px 10px' }}>
                    <div className="d-flex gap-1" style={{ minWidth: '150px', flexWrap: 'wrap' }}>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleShowModal(employee)}
                        style={{ 
                          borderRadius: '4px',
                          padding: '6px 8px',
                          border: '1px solid #007bff',
                          color: '#007bff',
                          backgroundColor: '#ffffff',
                          fontSize: '11px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '28px',
                          height: '28px'
                        }}
                        title="Edit"
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        variant="outline-warning"
                        size="sm"
                        onClick={() => handleShowPasswordModal(employee)}
                        style={{ 
                          borderRadius: '4px',
                          padding: '6px 8px',
                          border: '1px solid #ffc107',
                          color: '#ffc107',
                          backgroundColor: '#ffffff',
                          fontSize: '11px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '28px',
                          height: '28px'
                        }}
                        title="Password"
                      >
                        <FaKey />
                      </Button>
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => handleShowUspModal(employee)}
                        style={{ 
                          borderRadius: '4px',
                          padding: '6px 8px',
                          border: '1px solid #28a745',
                          color: '#28a745',
                          backgroundColor: '#ffffff',
                          fontSize: '11px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '28px',
                          height: '28px'
                        }}
                        title="Set on USP"
                      >
                        <FaStar />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(employee._id)}
                        style={{ 
                          borderRadius: '4px',
                          padding: '6px 8px',
                          border: '1px solid #dc3545',
                          color: '#dc3545',
                          backgroundColor: '#ffffff',
                          fontSize: '11px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '28px',
                          height: '28px'
                        }}
                        title="Delete"
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan="9" className="text-center" style={{ padding: '30px 20px', color: '#6c757d' }}>
                    <div>
                      <p className="mb-0">No employees found. Create your first employee!</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

      {/* Add/Edit Employee Modal */}
      <Modal 
        show={showModal} 
        onHide={handleCloseModal} 
        size="lg"
        backdrop="static"
        keyboard={false}
        contentClassName="employee-modal-content"
        style={{ zIndex: 1055 }}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editingEmployee ? 'Edit Employee' : 'Create New Employee'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter full name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter email address"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone *</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter 10-11 digit phone number"
                    pattern="\d{10,11}"
                    title="Please enter a valid 10-11 digit phone number"
                    maxLength={11}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role *</Form.Label>
                  <Form.Select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a role</option>
                    {roles.map(role => (
                      <option key={role._id} value={role._id}>
                        {role.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Admin Access Checkbox */}
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="giveAdminAccess"
                    name="giveAdminAccess"
                    checked={formData.giveAdminAccess}
                    onChange={handleInputChange}
                    label={
                      <span>
                        <strong>🔓 Give Admin Access</strong>
                        <small className="text-muted d-block">
                          When checked, this employee will have full admin-level access to all features and data
                        </small>
                      </span>
                    }
                    className="admin-access-checkbox"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Password {!editingEmployee && '*'}
                    {editingEmployee && <small className="text-muted">(Leave blank to keep current)</small>}
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingEmployee}
                    placeholder="Enter password"
                    minLength={6}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Department</Form.Label>
                  <Form.Control
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="Enter department"
                  />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="mt-3 mb-2">Address Information</h6>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Street</Form.Label>
                  <Form.Control
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleInputChange}
                    placeholder="Enter street address"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleInputChange}
                    placeholder="Enter state"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Zip Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleInputChange}
                    placeholder="Enter zip code"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Country</Form.Label>
                  <Form.Control
                    type="text"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleInputChange}
                    placeholder="Enter country"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          
          {/* ACTION BUTTONS - ALWAYS VISIBLE */}
          <div 
            className="employee-modal-action-buttons"
            style={{
              position: 'sticky',
              bottom: '0',
              backgroundColor: '#ffffff',
              borderTop: '2px solid #007bff',
              padding: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: '9999',
              boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
              margin: '0',
              width: '100%'
            }}
          >
            <Button 
              variant="secondary" 
              type="button"
              onClick={handleCloseModal}
              size="lg"
              style={{ 
                minWidth: '120px',
                fontWeight: 'bold'
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              size="lg"
              style={{ 
                minWidth: '150px',
                backgroundColor: '#007bff',
                borderColor: '#007bff',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '16px',
                boxShadow: '0 2px 8px rgba(0,123,255,0.3)'
              }}
            >
              {editingEmployee ? '✓ Update Employee' : '✓ Create Employee'}
            </Button>
          </div>
          
          <Modal.Footer style={{ display: 'none' }}></Modal.Footer>
        </Form>
      </Modal>

      {/* Change Password Modal */}
      <Modal 
        show={showPasswordModal} 
        onHide={handleClosePasswordModal}
        backdrop="static"
        keyboard={false}
        contentClassName="employee-modal-content"
        style={{ zIndex: 1055 }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Change Password - {passwordEmployee?.name}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handlePasswordSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Form.Group className="mb-3">
              <Form.Label>New Password *</Form.Label>
              <Form.Control
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                placeholder="Enter new password"
                minLength={6}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password *</Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                placeholder="Confirm new password"
                minLength={6}
              />
            </Form.Group>
          </Modal.Body>
          
          {/* PASSWORD MODAL ACTION BUTTONS - ALWAYS VISIBLE */}
          <div 
            className="employee-modal-action-buttons"
            style={{
              position: 'sticky',
              bottom: '0',
              backgroundColor: '#ffffff',
              borderTop: '2px solid #007bff',
              padding: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: '9999',
              boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
              margin: '0',
              width: '100%'
            }}
          >
            <Button 
              variant="secondary" 
              type="button"
              onClick={handleClosePasswordModal}
              size="lg"
              style={{ 
                minWidth: '120px',
                fontWeight: 'bold'
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              size="lg"
              style={{ 
                minWidth: '150px',
                backgroundColor: '#007bff',
                borderColor: '#007bff',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '16px',
                boxShadow: '0 2px 8px rgba(0,123,255,0.3)'
              }}
            >
              ✓ Update Password
            </Button>
          </div>
          
          <Modal.Footer style={{ display: 'none' }}></Modal.Footer>
        </Form>
      </Modal>

      {/* Add to USP Modal */}
      <Modal 
        show={showUspModal} 
        onHide={handleCloseUspModal}
        backdrop="static"
        keyboard={false}
        contentClassName="employee-modal-content"
        style={{ zIndex: 1055 }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Add to USP - {uspEmployee?.name}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUspSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Alert variant="info">
              <strong>ℹ️ What is USP?</strong>
              <p className="mb-0 mt-2" style={{ fontSize: '0.9rem' }}>
                USP (Unique Selling Proposition) highlights your best employees by category. 
                This helps showcase their expertise to clients and stakeholders.
              </p>
            </Alert>

            <Form.Group className="mb-3">
              <Form.Label>USP Category *</Form.Label>
              <Form.Select
                name="categoryId"
                value={uspData.categoryId}
                onChange={handleUspInputChange}
                required
              >
                <option value="">Select a category</option>
                {uspCategories.map(cat => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Choose the expertise category for this employee
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Expertise</Form.Label>
              <Form.Control
                type="text"
                name="expertise"
                value={uspData.expertise}
                onChange={handleUspInputChange}
                placeholder="e.g., Commercial Real Estate Specialist"
              />
              <Form.Text className="text-muted">
                Specific area of expertise within the category
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Years of Experience</Form.Label>
              <Form.Control
                type="number"
                name="experienceYears"
                value={uspData.experienceYears}
                onChange={handleUspInputChange}
                min="0"
                max="50"
                placeholder="e.g., 5"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={uspData.description}
                onChange={handleUspInputChange}
                placeholder="Brief description highlighting achievements and expertise"
              />
            </Form.Group>
          </Modal.Body>
          
          {/* USP MODAL ACTION BUTTONS */}
          <div 
            className="employee-modal-action-buttons"
            style={{
              position: 'sticky',
              bottom: '0',
              backgroundColor: '#ffffff',
              borderTop: '2px solid #28a745',
              padding: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: '9999',
              boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
              margin: '0',
              width: '100%'
            }}
          >
            <Button 
              variant="secondary" 
              type="button"
              onClick={handleCloseUspModal}
              size="lg"
              style={{ 
                minWidth: '120px',
                fontWeight: 'bold'
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="success" 
              type="submit"
              size="lg"
              style={{ 
                minWidth: '150px',
                backgroundColor: '#28a745',
                borderColor: '#28a745',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '16px',
                boxShadow: '0 2px 8px rgba(40,167,69,0.3)'
              }}
            >
              ⭐ Add to USP
            </Button>
          </div>
          
          <Modal.Footer style={{ display: 'none' }}></Modal.Footer>
        </Form>
      </Modal>
      </Container>
      
      <style jsx>{`
        .admin-access-checkbox .form-check-input {
          transform: scale(1.2);
          margin-right: 0.75rem;
        }
        
        .admin-access-checkbox .form-check-label {
          cursor: pointer;
        }
        
        .admin-access-checkbox .form-check-label strong {
          color: #dc3545;
          font-size: 1.1rem;
        }
        
        .admin-access-checkbox .form-check-input:checked {
          background-color: #dc3545;
          border-color: #dc3545;
        }
        
        .admin-access-checkbox .form-check-input:focus {
          box-shadow: 0 0 0 0.25rem rgba(220, 53, 69, 0.25);
        }
        
        .admin-access-checkbox:hover {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 0.5rem;
          margin: -0.5rem;
          transition: all 0.2s ease;
        }
      `}</style>
    </>
  );
};

export default EmployeeManagement;