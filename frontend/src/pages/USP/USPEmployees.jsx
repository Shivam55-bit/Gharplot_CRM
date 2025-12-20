import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Badge, Tabs, Tab } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaUser, FaBuilding, FaBriefcase, FaFilter } from 'react-icons/fa';
import * as UspService from '../../services/UspService';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import { TokenManager } from '../../utils/tokenManager';

const USPEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [systemEmployees, setSystemEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('system'); // 'system' or 'manual'
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const [formData, setFormData] = useState({
    employeeId: '',
    categoryId: '',
    name: '',
    phone: '',
    expertise: '',
    experienceYears: '',
    description: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchEmployees();
    fetchSystemEmployees();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await UspService.getAllCategories();
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await UspService.getAllUspEmployees();
      if (response.success) {
        setEmployees(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching USP employees:', error);
      setError(error.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemEmployees = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const employeeToken = localStorage.getItem('employeeToken');
      const token = adminToken || employeeToken;
      const endpoint = adminToken ? `${API_BASE_URL}/admin/employees` : `${API_BASE_URL}/api/employees`;
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSystemEmployees(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching system employees:', error);
    }
  };

  const handleShowModal = (type = 'system', employee = null) => {
    setModalType(type);
    
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        employeeId: employee.employee?._id || '',
        categoryId: employee.category?._id || '',
        name: employee.manualName || '',
        phone: employee.manualPhone || '',
        expertise: employee.expertise || '',
        experienceYears: employee.experienceYears || '',
        description: employee.description || ''
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        employeeId: '',
        categoryId: '',
        name: '',
        phone: '',
        expertise: '',
        experienceYears: '',
        description: ''
      });
    }
    
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
    setModalType('system');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.categoryId) {
      setError('Please select a category');
      return false;
    }

    if (modalType === 'system') {
      if (!formData.employeeId) {
        setError('Please select an employee');
        return false;
      }
    } else {
      if (!formData.name.trim()) {
        setError('Employee name is required');
        return false;
      }
      if (!formData.phone.trim()) {
        setError('Phone number is required');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    try {
      if (editingEmployee) {
        // Update existing employee
        const updateData = {
          categoryId: formData.categoryId,
          expertise: formData.expertise,
          experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : undefined,
          description: formData.description
        };

        if (editingEmployee.employeeType === 'manual') {
          updateData.manualName = formData.name;
          updateData.manualPhone = formData.phone;
        }

        await UspService.updateUspEmployee(editingEmployee._id, updateData);
        setSuccess('Employee updated successfully!');
      } else {
        // Add new employee
        if (modalType === 'system') {
          const data = {
            employeeId: formData.employeeId,
            categoryId: formData.categoryId,
            expertise: formData.expertise,
            experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : undefined,
            description: formData.description
          };
          await UspService.addEmployeeById(data);
        } else {
          const data = {
            categoryId: formData.categoryId,
            name: formData.name,
            phone: formData.phone,
            expertise: formData.expertise,
            experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : undefined,
            description: formData.description
          };
          await UspService.addEmployeeManually(data);
        }
        setSuccess('Employee added to USP successfully!');
      }
      
      fetchEmployees();
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'An error occurred');
    }
  };

  const handleDelete = async (employeeId) => {
    if (!window.confirm('Are you sure you want to remove this employee from USP?')) {
      return;
    }

    try {
      await UspService.deleteUspEmployee(employeeId);
      setSuccess('Employee removed from USP successfully!');
      fetchEmployees();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Error removing employee');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Filter employees by category
  const filteredEmployees = selectedCategory === 'all' 
    ? employees 
    : employees.filter(emp => emp.category?._id === selectedCategory);

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
    <Container fluid style={{ paddingTop: '80px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1" style={{ color: '#2c3e50', fontWeight: 'bold' }}>USP Employees</h2>
          <p className="text-muted mb-0">Manage employees featured in USP categories</p>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="success"
            onClick={() => handleShowModal('system')}
            style={{ 
              borderRadius: '8px',
              padding: '12px 24px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FaPlus style={{ fontSize: '12px' }} />
            Add from System
          </Button>
          <Button
            variant="primary"
            onClick={() => handleShowModal('manual')}
            style={{ 
              borderRadius: '8px',
              padding: '12px 24px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FaPlus style={{ fontSize: '12px' }} />
            Add Manually
          </Button>
        </div>
      </div>

      {/* Success/Error Alerts */}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Filter Section */}
      <Card className="mb-4 shadow-sm" style={{ borderRadius: '12px' }}>
        <Card.Body>
          <div className="d-flex align-items-center gap-3">
            <FaFilter className="text-muted" />
            <Form.Select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ maxWidth: '300px' }}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </Form.Select>
            <Badge bg="secondary" style={{ fontSize: '0.9rem' }}>
              {filteredEmployees.length} Employees
            </Badge>
          </div>
        </Card.Body>
      </Card>

      {/* Employees Table */}
      <div className="bg-white rounded shadow-sm">
        <Table hover responsive className="mb-0">
          <thead style={{ backgroundColor: '#343a40' }}>
            <tr>
              <th style={{ padding: '12px', color: '#ffffff', fontWeight: '600' }}>SN</th>
              <th style={{ padding: '12px', color: '#ffffff', fontWeight: '600' }}>Name</th>
              <th style={{ padding: '12px', color: '#ffffff', fontWeight: '600' }}>Contact</th>
              <th style={{ padding: '12px', color: '#ffffff', fontWeight: '600' }}>Category</th>
              <th style={{ padding: '12px', color: '#ffffff', fontWeight: '600' }}>Expertise</th>
              <th style={{ padding: '12px', color: '#ffffff', fontWeight: '600' }}>Experience</th>
              <th style={{ padding: '12px', color: '#ffffff', fontWeight: '600' }}>Type</th>
              <th style={{ padding: '12px', color: '#ffffff', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '12px', color: '#ffffff', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((employee, index) => (
              <tr key={employee._id}>
                <td style={{ padding: '12px' }}>{index + 1}</td>
                <td style={{ padding: '12px', fontWeight: '600' }}>
                  {employee.employeeType === 'system' 
                    ? employee.employee?.name 
                    : employee.manualName}
                </td>
                <td style={{ padding: '12px', fontSize: '0.85rem' }}>
                  {employee.employeeType === 'system' 
                    ? employee.employee?.phone 
                    : employee.manualPhone}
                </td>
                <td style={{ padding: '12px' }}>
                  <Badge bg="info" style={{ fontSize: '0.8rem' }}>
                    {employee.category?.name}
                  </Badge>
                </td>
                <td style={{ padding: '12px', fontSize: '0.85rem' }}>
                  {employee.expertise || '-'}
                </td>
                <td style={{ padding: '12px' }}>
                  {employee.experienceYears ? `${employee.experienceYears} years` : '-'}
                </td>
                <td style={{ padding: '12px' }}>
                  <Badge bg={employee.employeeType === 'system' ? 'primary' : 'warning'}>
                    {employee.employeeType}
                  </Badge>
                </td>
                <td style={{ padding: '12px' }}>
                  <Badge bg={employee.isActive ? 'success' : 'secondary'}>
                    {employee.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td style={{ padding: '12px' }}>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleShowModal(employee.employeeType, employee)}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(employee._id)}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredEmployees.length === 0 && (
              <tr>
                <td colSpan="9" className="text-center" style={{ padding: '40px' }}>
                  <FaUser size={48} className="text-muted mb-3" />
                  <p className="text-muted">No employees found. Add employees to get started.</p>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Add/Edit Employee Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingEmployee 
              ? 'Edit USP Employee' 
              : `Add Employee ${modalType === 'system' ? 'from System' : 'Manually'}`
            }
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {!editingEmployee && modalType === 'system' && (
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Select Employee *</Form.Label>
                    <Form.Select
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select an employee</option>
                      {systemEmployees.map(emp => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name} - {emp.email}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            )}

            {(modalType === 'manual' || (editingEmployee && editingEmployee.employeeType === 'manual')) && (
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name *</Form.Label>
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
                    <Form.Label>Phone *</Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter phone number"
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Expertise</Form.Label>
                  <Form.Control
                    type="text"
                    name="expertise"
                    value={formData.expertise}
                    onChange={handleInputChange}
                    placeholder="e.g., Commercial Real Estate"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Years of Experience</Form.Label>
                  <Form.Control
                    type="number"
                    name="experienceYears"
                    value={formData.experienceYears}
                    onChange={handleInputChange}
                    min="0"
                    max="50"
                    placeholder="e.g., 5"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of expertise and achievements"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingEmployee ? 'Update Employee' : 'Add to USP'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default USPEmployees;
