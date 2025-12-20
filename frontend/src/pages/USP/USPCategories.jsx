import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaUsers } from 'react-icons/fa';
import * as UspService from '../../services/UspService';

const USPCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await UspService.getAllCategories();
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError(error.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || ''
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: ''
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Category name is required');
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
      if (editingCategory) {
        await UspService.updateCategory(editingCategory._id, formData);
        setSuccess('Category updated successfully!');
      } else {
        await UspService.createCategory(formData);
        setSuccess('Category created successfully!');
      }
      
      fetchCategories();
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'An error occurred');
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      await UspService.deleteCategory(categoryId);
      setSuccess('Category deleted successfully!');
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Error deleting category');
      setTimeout(() => setError(''), 3000);
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
    <Container fluid style={{ paddingTop: '80px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1" style={{ color: '#2c3e50', fontWeight: 'bold' }}>USP Categories</h2>
          <p className="text-muted mb-0">Manage categories for organizing employees by expertise</p>
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
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(0,123,255,0.3)'
          }}
        >
          <FaPlus style={{ fontSize: '12px' }} />
          Add New Category
        </Button>
      </div>

      {/* Success/Error Alerts */}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Categories Grid */}
      <Row>
        {categories.map((category) => (
          <Col key={category._id} md={6} lg={4} className="mb-4">
            <Card className="h-100 shadow-sm" style={{ borderRadius: '12px', border: '1px solid #e0e0e0' }}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="flex-grow-1">
                    <h5 className="mb-2" style={{ color: '#2c3e50', fontWeight: '600' }}>
                      {category.name}
                    </h5>
                    <Badge 
                      bg={category.isActive ? 'success' : 'secondary'}
                      style={{ fontSize: '0.75rem' }}
                    >
                      {category.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleShowModal(category)}
                      style={{ borderRadius: '6px' }}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(category._id)}
                      style={{ borderRadius: '6px' }}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </div>
                
                <p className="text-muted mb-3" style={{ fontSize: '0.9rem', minHeight: '48px' }}>
                  {category.description || 'No description provided'}
                </p>
                
                <div className="d-flex justify-content-between align-items-center pt-3" style={{ borderTop: '1px solid #e0e0e0' }}>
                  <div className="d-flex align-items-center gap-2">
                    <FaUsers style={{ color: '#007bff' }} />
                    <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                      {category.employeeCount || 0} Employees
                    </span>
                  </div>
                  <small className="text-muted">
                    {new Date(category.createdAt).toLocaleDateString('en-GB')}
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}

        {categories.length === 0 && (
          <Col xs={12}>
            <Card className="text-center p-5" style={{ borderRadius: '12px' }}>
              <Card.Body>
                <FaUsers size={48} className="text-muted mb-3" />
                <h4 className="text-muted mb-2">No Categories Found</h4>
                <p className="text-muted mb-3">Create your first USP category to get started</p>
                <Button
                  variant="primary"
                  onClick={() => handleShowModal()}
                >
                  <FaPlus className="me-2" />
                  Create Category
                </Button>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      {/* Add/Edit Category Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCategory ? 'Edit Category' : 'Create New Category'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Form.Group className="mb-3">
              <Form.Label>Category Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g., Real Estate Experts"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of this category"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default USPCategories;
