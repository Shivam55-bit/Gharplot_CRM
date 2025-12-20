import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Badge, Alert } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import { getEndpoint, createAuthConfig } from '../../utils/authUtils';

// Custom CSS to ensure action buttons are always visible
const modalStyles = `
  .role-modal-content {
    position: relative !important;
  }
  .role-modal-content .modal-body {
    padding-bottom: 100px !important;
  }
  .modal-action-buttons {
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
  .modal-action-buttons button {
    font-size: 16px !important;
    font-weight: bold !important;
    padding: 12px 24px !important;
  }
  .modal.show .modal-dialog {
    margin-bottom: 100px !important;
  }
  
  /* Responsive Table Styles */
  .role-table-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    overflow-x: auto;
    max-width: 100%;
  }
  
  .role-table {
    margin: 0;
    font-size: 0.75rem;
    table-layout: fixed !important;
    width: 100%;
    border-collapse: separate !important;
    border-spacing: 0 !important;
  }
  
  .role-table th {
    padding: 8px 4px !important;
    font-weight: 600;
    color: #ffffff;
    background-color: #343a40;
    border: none;
    font-size: 0.7rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  
  .role-table td {
    padding: 8px 4px !important;
    border-bottom: 1px solid #dee2e6;
    vertical-align: middle;
    font-size: 0.75rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .role-table .sn-col { width: 8% !important; }
  .role-table .name-col { width: 20% !important; }
  .role-table .desc-col { width: 25% !important; }
  .role-table .perm-col { width: 12% !important; }
  .role-table .status-col { width: 12% !important; }
  .role-table .date-col { width: 12% !important; }
  .role-table .actions-col { width: 11% !important; }
  
  /* Force first column width */
  .role-table th:nth-child(1),
  .role-table td:nth-child(1) {
    width: 8% !important;
    text-align: center !important;
    padding: 6px 2px !important;
    font-size: 0.7rem !important;
  }
  
  /* Ensure table fits in container */
  .role-table-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    width: 100%;
    overflow: visible;
  }
  
  /* Better responsive handling */
  .desktop-table {
    width: 100%;
    overflow: visible;
  }
  
  .compact-badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 500;
    white-space: nowrap;
  }
  
  .action-btn {
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.75rem;
    margin: 0 2px;
  }
  
  /* Mobile Card Layout */
  @media (max-width: 768px) {
    .role-table-container {
      background: transparent;
      box-shadow: none;
    }
    
    .desktop-table {
      display: none;
    }
    
    .mobile-cards {
      display: block;
    }
    
    .role-card {
      background: white;
      border-radius: 12px;
      margin-bottom: 16px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border-left: 4px solid #007bff;
    }
    
    .role-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    
    .role-card-title {
      font-weight: 600;
      font-size: 1rem;
      color: #212529;
      margin: 0;
    }
    
    .role-card-actions {
      display: flex;
      gap: 8px;
    }
    
    .role-card-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .role-card-field {
      display: flex;
      flex-direction: column;
    }
    
    .role-card-label {
      font-size: 0.75rem;
      color: #6c757d;
      font-weight: 500;
      margin-bottom: 4px;
    }
    
    .role-card-value {
      font-size: 0.85rem;
      color: #212529;
    }
    
    .role-card-desc {
      grid-column: span 2;
    }
  }
  
  @media (min-width: 769px) {
    .mobile-cards {
      display: none !important;
    }
    
    .desktop-table {
      display: block !important;
    }
  }
  
  /* Compact responsive adjustments */
  @media (max-width: 1200px) {
    .role-table th,
    .role-table td {
      padding: 10px 6px !important;
      font-size: 0.8rem;
    }
  }
  
  @media (max-width: 992px) {
    .role-table th,
    .role-table td {
      padding: 8px 4px !important;
      font-size: 0.75rem;
    }
    
    .role-table .desc-col {
      max-width: 120px;
    }
  }
`;

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [availablePermissions, setAvailablePermissions] = useState({ modules: [], actions: [] });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch roles and available permissions
  useEffect(() => {
    fetchRoles();
    fetchAvailablePermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      const endpoint = getEndpoint('roles');
      const config = createAuthConfig();
      
      const response = await axios.get(endpoint, config);
      
      if (response.data.success) {
        setRoles(response.data.data);
      }
    } catch (error) {
      setError('Error fetching roles');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePermissions = async () => {
    try {
      // Permissions endpoint is available without auth, try admin endpoint first
      let response;
      try {
        response = await axios.get(`${API_BASE_URL}/admin/roles/permissions`);
      } catch (error) {
        // Fallback to employee endpoint
        response = await axios.get(`${API_BASE_URL}/api/roles/permissions`);
      }
      
      if (response.data.success) {
        setAvailablePermissions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const handleShowModal = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description || '',
        permissions: role.permissions || []
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: '',
        permissions: []
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: []
    });
    setError('');
    setSuccess('');
    setSubmitting(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionChange = (module, action, isChecked) => {
    setFormData(prev => {
      const permissions = [...prev.permissions];
      const moduleIndex = permissions.findIndex(p => p.module === module);

      if (moduleIndex >= 0) {
        if (isChecked) {
          // Add action if not exists
          if (!permissions[moduleIndex].actions.includes(action)) {
            permissions[moduleIndex].actions.push(action);
          }
        } else {
          // Remove action
          permissions[moduleIndex].actions = permissions[moduleIndex].actions.filter(a => a !== action);
          // Remove module if no actions left
          if (permissions[moduleIndex].actions.length === 0) {
            permissions.splice(moduleIndex, 1);
          }
        }
      } else if (isChecked) {
        // Add new module with action
        permissions.push({
          module,
          actions: [action]
        });
      }

      return {
        ...prev,
        permissions
      };
    });
  };

  const isPermissionChecked = (module, action) => {
    const permission = formData.permissions.find(p => p.module === module);
    return permission && permission.actions.includes(action);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    // Validate form data
    if (!formData.name.trim()) {
      setError('Role name is required');
      setSubmitting(false);
      return;
    }

    try {
      const url = editingRole 
        ? getEndpoint('roles', editingRole._id)
        : getEndpoint('roles');
      
      const method = editingRole ? 'put' : 'post';
      const config = createAuthConfig();

      console.log('Submitting role:', { url, method, formData }); // Debug log

      const response = await axios[method](url, formData, config);

      if (response.data.success) {
        setSuccess(editingRole ? 'Role updated successfully!' : 'Role created successfully!');
        fetchRoles();
        setTimeout(() => {
          handleCloseModal();
        }, 1500);
      } else {
        setError(response.data.message || 'Failed to save role');
      }
    } catch (error) {
      console.error('Role submission error:', error);
      setError(error.response?.data?.message || 'An error occurred while saving the role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (roleId) => {
    const roleToDelete = roles.find(r => r._id === roleId);
    const roleName = roleToDelete?.name || 'this role';
    
    const confirmMessage = `Are you sure you want to delete "${roleName}"?\n\nNote: You cannot delete a role if employees are still assigned to it.`;
    
    if (!window.confirm(confirmMessage)) return;

    try {
      const endpoint = getEndpoint('roles', roleId);
      const config = createAuthConfig();
      
      const response = await axios.delete(endpoint, config);

      if (response.data.success) {
        setSuccess('Role deleted successfully!');
        fetchRoles();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error deleting role';
      
      // Enhanced error message for role deletion constraint
      if (error.response?.status === 400 && errorMessage.includes('employee(s) are assigned')) {
        setError(`❌ Cannot delete "${roleName}": ${errorMessage}\n\n💡 Please reassign all employees from this role first, then try again.`);
      } else {
        setError(errorMessage);
      }
      
      setTimeout(() => setError(''), 5000); // Longer display for detailed message
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
      <Container fluid style={{ paddingTop: '80px', backgroundColor: '#f8f9fa', minHeight: '100vh', paddingLeft: '20px', paddingRight: '20px' }}>
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1" style={{ color: '#2c3e50', fontWeight: 'bold' }}>Role Management</h2>
            <p className="text-muted mb-0">Manage employee accounts and role assignments</p>
          </div>
          <Button
            variant="primary"
            onClick={() => handleShowModal()}
            style={{ 
              backgroundColor: '#3498db',
              borderColor: '#3498db',
              borderRadius: '8px',
              padding: '10px 20px',
              fontWeight: '600'
            }}
          >
            <FaPlus className="me-2" />
            ADD
          </Button>
        </div>

        {/* Success/Error Alerts */}
        {success && <Alert variant="success">{success}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}

        {/* Main Table */}
        <div style={{ width: '100%', overflowX: 'auto', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#343a40' }}>
                <th style={{ width: '60px', padding: '12px 8px', color: 'white', fontWeight: '600', fontSize: '0.8rem', textAlign: 'center', border: 'none' }}>
                  SN
                </th>
                <th style={{ width: '200px', padding: '12px 8px', color: 'white', fontWeight: '600', fontSize: '0.8rem', textAlign: 'left', border: 'none' }}>
                  Role Name
                </th>
                <th style={{ width: '250px', padding: '12px 8px', color: 'white', fontWeight: '600', fontSize: '0.8rem', textAlign: 'left', border: 'none' }}>
                  Description
                </th>
                <th style={{ width: '120px', padding: '12px 8px', color: 'white', fontWeight: '600', fontSize: '0.8rem', textAlign: 'center', border: 'none' }}>
                  Permissions
                </th>
                <th style={{ width: '100px', padding: '12px 8px', color: 'white', fontWeight: '600', fontSize: '0.8rem', textAlign: 'center', border: 'none' }}>
                  Status
                </th>
                <th style={{ width: '120px', padding: '12px 8px', color: 'white', fontWeight: '600', fontSize: '0.8rem', textAlign: 'center', border: 'none' }}>
                  Created
                </th>
                <th style={{ width: '120px', padding: '12px 8px', color: 'white', fontWeight: '600', fontSize: '0.8rem', textAlign: 'center', border: 'none' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role, index) => (
                <tr key={role._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px 8px', textAlign: 'center', color: '#6c757d', fontWeight: '500', fontSize: '0.85rem' }}>
                    {index + 1}
                  </td>
                  <td style={{ padding: '12px 8px', fontWeight: '600', color: '#212529', fontSize: '0.85rem' }}>
                    {role.name || 'N/A'}
                  </td>
                  <td style={{ padding: '12px 8px', color: '#6c757d', fontSize: '0.8rem' }}>
                    <div style={{ 
                      maxWidth: '220px', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap'
                    }}>
                      {role.description || 'No description'}
                    </div>
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <span style={{
                      backgroundColor: '#e8f5e8',
                      color: '#198754',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: '500'
                    }}>
                      {role.permissions?.length || 0} perms
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <span style={{
                      backgroundColor: role.isActive ? '#d1ecf1' : '#f8d7da',
                      color: role.isActive ? '#0c5460' : '#721c24',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: '500'
                    }}>
                      {role.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', color: '#6c757d', fontSize: '0.75rem' }}>
                    {new Date(role.createdAt).toLocaleDateString('en-GB', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: '2-digit'
                    })}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleShowModal(role)}
                        style={{ 
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          borderRadius: '6px'
                        }}
                      >
                        <FaEdit size={12} />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(role._id)}
                        style={{ 
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          borderRadius: '6px'
                        }}
                      >
                        <FaTrash size={12} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ 
                    padding: '40px 20px', 
                    textAlign: 'center', 
                    color: '#6c757d',
                    fontSize: '0.9rem'
                  }}>
                    No roles found. Create your first role!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      {/* Add/Edit Role Modal */}
      <Modal 
        show={showModal} 
        onHide={handleCloseModal} 
        size="lg"
        backdrop="static"
        keyboard={false}
        dialogClassName="modal-90w"
        style={{ 
          zIndex: 1055,
          display: showModal ? 'block' : 'none'
        }}
        contentClassName="role-modal-content"
      >
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingRole ? 'Edit Role' : 'Create New Role'}
            </Modal.Title>
          </Modal.Header>
          
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: '600', color: '#212529', fontSize: '0.9rem' }}>Role Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter role name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: '600', color: '#212529', fontSize: '0.9rem' }}>Description</Form.Label>
                  <Form.Control
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter role description"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: '600', color: '#212529', fontSize: '0.9rem' }}>Permissions</Form.Label>
              <Card>
                <Card.Body>
                  <Table responsive size="sm">
                    <thead>
                      <tr>
                        <th style={{ minWidth: '200px', fontWeight: '600', color: '#212529', padding: '12px' }}>Module</th>
                        {availablePermissions.actions.map(action => (
                          <th key={action.value} className="text-center" style={{ fontWeight: '600', color: '#212529', padding: '12px' }}>
                            {action.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {availablePermissions.modules.map(module => (
                        <tr key={module.value}>
                          <td style={{ padding: '12px' }}>
                            <strong style={{ color: '#212529', fontSize: '0.9rem' }}>{module.label}</strong>
                            <br />
                            <small className="text-muted">{module.description}</small>
                          </td>
                          {availablePermissions.actions.map(action => (
                            <td key={action.value} className="text-center">
                              <Form.Check
                                type="checkbox"
                                checked={isPermissionChecked(module.value, action.value)}
                                onChange={(e) => handlePermissionChange(
                                  module.value,
                                  action.value,
                                  e.target.checked
                                )}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Form.Group>
          </Modal.Body>
          
          {/* ACTION BUTTONS - ALWAYS VISIBLE */}
          <div 
            className="modal-action-buttons"
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
              disabled={submitting}
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
              disabled={!formData.name.trim() || submitting}
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
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {editingRole ? 'Updating Role...' : 'Creating Role...'}
                </>
              ) : (
                <>
                  {editingRole ? '✓ Update Role' : '✓ Create Role'}
                </>
              )}
            </Button>
          </div>
          
          <Modal.Footer style={{ display: 'none' }}></Modal.Footer>
        </Form>
      </Modal>
      </Container>
    </>
  );
};

export default RoleManagement;