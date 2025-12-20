import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { API_BASE_URL } from '../../config/apiConfig.jsx';
import apiClient from '../../utils/axiosConfig';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
  FaHome, 
  FaSearch,
  FaFilter,
  FaCheck,
  FaTimes,
  FaEye,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
  FaCheckCircle
} from 'react-icons/fa';
import './RecentPage.css';
import PropertyCard from '../Properties/PropertyCard';
import { useAdmin } from '../../context/AdminContext';

const RecentPage = () => {
  const { recentProperties: contextRecentProperties, markRecentPropertiesAsSeen, deleteProperty, loading, error, refreshAllData } = useAdmin();
  const [recentProperties, setRecentProperties] = useState(contextRecentProperties || []);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [soldProperties, setSoldProperties] = useState(new Set());
  const itemsPerPage = 10;

  // Sync contextRecentProperties with local recentProperties state
  useEffect(() => {
    if (contextRecentProperties) {
      setRecentProperties(contextRecentProperties);
    }
  }, [contextRecentProperties]);

  // Handle action functions
  const handleApprove = async (propertyId) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('employeeToken') || localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (response.ok) {
        // Update only the specific property in the local state instead of refreshing all data
        // This is much faster and smoother than a full refresh
        setRecentProperties(prevProperties => 
          prevProperties.map(property => 
            property._id === propertyId 
              ? { ...property, status: 'approved' } 
              : property
          )
        );
        
        // Show success toast notification
        toast.success("Property approved successfully!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } else {
        toast.error("Failed to approve property", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    } catch (error) {
      console.error('Error approving property:', error);
      toast.error("Error approving property: " + (error.message || "Unknown error"), {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const handleReject = async (propertyId) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('employeeToken') || localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (response.ok) {
        // Update only the specific property in the local state instead of refreshing all data
        // This is much faster and smoother than a full refresh
        setRecentProperties(prevProperties => 
          prevProperties.map(property => 
            property._id === propertyId 
              ? { ...property, status: 'rejected' } 
              : property
          )
        );
        
        // Show success toast notification
        toast.success("Property rejected successfully!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } else {
        toast.error("Failed to reject property", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    } catch (error) {
      console.error('Error rejecting property:', error);
      toast.error("Error rejecting property: " + (error.message || "Unknown error"), {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const handleViewDetails = (property) => {
    setSelectedProperty(property);
    setShowModal(true);
  };

  const handleDelete = async (propertyId, propertyName) => {
    setPropertyToDelete({ id: propertyId, name: propertyName });
    setShowDeleteConfirm(true);
  };

  // Handle mark as sold/unsold toggle
  const handleMarkSold = async (propertyId) => {
    try {
      console.log('Attempting to toggle property sold status with ID:', propertyId);
      
      // Use PATCH method as specified with apiClient (which includes auth headers automatically)
      const response = await apiClient.patch(`/property/${propertyId}/mark-sold`);
      
      console.log('Mark sold response:', response);
      
      if (response.data && response.data.success) {
        // Update the local state to reflect the sold status
        const newSoldProperties = new Set(soldProperties);
        if (newSoldProperties.has(propertyId)) {
          newSoldProperties.delete(propertyId);
        } else {
          newSoldProperties.add(propertyId);
        }
        setSoldProperties(newSoldProperties);
        
        // Update only the specific property in the local state instead of refreshing all data
        // This is much faster and smoother than a full refresh
        setRecentProperties(prevProperties => 
          prevProperties.map(property => 
            property._id === propertyId 
              ? { ...property, isSold: !property.isSold } 
              : property
          )
        );
        
        // Also update the context data to ensure consistency across the app
        await refreshAllData();
        
        // Show success toast notification
        toast.success("Property sold status updated successfully!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } else {
        toast.error("Failed to update property sold status: " + (response.data?.message || "Unknown error"), {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    } catch (error) {
      console.error('Error updating property sold status:', error);
      console.error('Error response:', error.response);
      
      if (error.response) {
        // Server responded with error status
        toast.error(`Error updating property sold status: ${error.response.status} - ${error.response.statusText}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } else if (error.request) {
        // Request was made but no response received
        toast.error("Error updating property sold status: No response from server", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } else {
        // Something else happened
        toast.error("Error updating property sold status: " + (error.message || "Unknown error"), {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    }
  };

  const confirmDelete = async () => {
    if (!propertyToDelete) return;

    setShowDeleteConfirm(false);
    
    try {
      const result = await deleteProperty(propertyToDelete.id);
      
      if (result.success) {
        // Update only the specific property in the local state instead of refreshing all data
        // This is much faster and smoother than a full refresh
        setRecentProperties(prevProperties => 
          prevProperties.filter(property => property._id !== propertyToDelete.id)
        );
        
        // Show success toast notification
        toast.success(`Property "${propertyToDelete.name}" has been deleted successfully!`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } else {
        // Show error toast notification
        toast.error(`Failed to delete property: ${result.message}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      
      // Show error toast notification
      toast.error(`Error deleting property: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setPropertyToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setPropertyToDelete(null);
  };

  // Helper function to construct image URL
  const getImageUrl = (imagePath) => {
    console.log('Processing image path:', imagePath);
    
    if (!imagePath) {
      return 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
    }
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Clean the image path - handle both formats from your API
    let cleanPath = imagePath;
    
    // Remove any leading slashes
    if (cleanPath.startsWith('/') || cleanPath.startsWith('\\')) {
      cleanPath = cleanPath.substring(1);
    }
    
    // Handle Windows-style paths with backslashes (uploads\\filename)
    if (cleanPath.includes('uploads\\')) {
      // Extract just the filename from "uploads\\filename"
      cleanPath = cleanPath.split('uploads\\')[1];
    }
    // Handle Unix-style paths with forward slashes (uploads/filename)  
    else if (cleanPath.includes('uploads/')) {
      // Extract just the filename from "uploads/filename"
      cleanPath = cleanPath.split('uploads/')[1];
    }
    // If it starts with "uploads" without slash, remove it
    else if (cleanPath.startsWith('uploads')) {
      cleanPath = cleanPath.substring(7);
      if (cleanPath.startsWith('/') || cleanPath.startsWith('\\')) {
        cleanPath = cleanPath.substring(1);
      }
    }
    
    // Construct the final URL using your API's base URL (port 4000)
    const fullUrl = `${API_BASE_URL}/uploads/${cleanPath}`;
    console.log('Constructed image URL:', fullUrl);
    
    return fullUrl;
  };

  // Debug logging
  console.log("RecentPage - loading:", loading);
  console.log("RecentPage - error:", error);
  console.log("RecentPage - recentProperties:", recentProperties);
  console.log("RecentPage - recentProperties length:", recentProperties?.length);
  
  // Log property images for debugging
  if (recentProperties && recentProperties.length > 0) {
    console.log("First property images:", recentProperties[0]?.images);
    console.log("First property image path example:", recentProperties[0]?.images?.[0]);
  }

  // Test API endpoint directly
  const testAPI = async () => {
    try {
      console.log("Testing API endpoint directly...");
      const token = localStorage.getItem('adminToken') || localStorage.getItem('employeeToken') || localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/properties/recent/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      console.log("Direct API test result:", data);
    } catch (error) {
      console.error("Direct API test failed:", error);
    }
  };

  // Run test on component mount
  useEffect(() => {
    testAPI();
  }, []);

  // Filter properties based on search and status
  const filteredProjects = (recentProperties || []).filter((property) => {
    const matchesSearch = !searchTerm || 
      property.propertyLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.propertyType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.residentialType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.commercialType?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' || property.availability === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProperties = filteredProjects.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  // Mark properties as seen when user visits the page  
  useEffect(() => {

  }, [markRecentPropertiesAsSeen]);

  return (
    <div className="recentpage-container" style={{ padding: '1rem', marginTop: '80px', backgroundColor: '#f8f9fa', minHeight: '100vh', maxWidth: '100vw', overflowX: 'hidden' }}>
      <ToastContainer />
      {/* Header Section */}
      <div className="row g-0 mx-0">
        <div className="col-12">
          <div className="card border-2 p-4 shadow-lg" style={{ background: 'linear-gradient(135deg, #11305dff, #2d5a87)' }}>
            <div className="card-body text-light p-4">
              <div className="row g-3 align-items-center mx-0">
                <div className="col-md-8">
                  <h2 className="display-6 fw-bold mb-2 d-flex align-items-center">
                    <FaHome className="me-3 text-light" />
                    Property Listings
                  </h2>
                  <p className="lead mb-0 opacity-75">Recently added property listings</p>
                </div>
                <div className="col-md-4 text-md-end">
                  <div className="d-flex flex-column align-items-md-end">
                    <span className="badge bg-light text-dark px-3 py-2 fs-6 rounded-pill">
                      {filteredProjects.length} Properties
                    </span>
                    {/* {totalPages > 1 && (
                      <small className="text-light-50 mt-1">
                        Showing {startIndex + 1}-{Math.min(endIndex, filteredProjects.length)} of {filteredProjects.length}
                      </small>
                    )} */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="row g-0 mx-0">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="row g-3 align-items-center justify-content-between mx-0">
                <div className="col-md-5 col-lg-4">
                  <div className="search-wrapper">
                    <FaSearch className="search-icon" />
                    <input
                      type="text"
                      className="search-input form-control"
                      placeholder="Search by location or type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-4 col-lg-3">
                  <div className="filter-dropdown-wrapper">
                    <FaFilter className="filter-dropdown-icon" />
                    <select
                      className="filter-dropdown form-select"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="All">All Categories</option>
                      <option value="Ready to Move">Ready to Move</option>
                      <option value="Under Construction">Under Construction</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div className="text-center mt-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading recent properties...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Properties Grid */}
      {!loading && !error && (
        <>
          {filteredProjects.length === 0 ? (
            <div className="text-center mt-5">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-5">
                  <FaHome className="display-1 text-muted mb-3" />
                  <h4 className="text-muted">No recent properties found</h4>
                  <p className="text-muted">No recent properties match your current filters.</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="table-main-container" style={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div className="table-responsive" style={{ overflowX: 'auto', maxWidth: '100%' }}>
                  <table className="table table-hover user-table" style={{ tableLayout: 'fixed', width: '100%', minWidth: '800px' }}>
                    <thead style={{ backgroundColor: '#343a40' }}>
                      <tr>
                        <th style={{ width: "14%", padding: '12px 8px', fontWeight: '700', color: '#ffffff', borderBottom: '2px solid #dee2e6', fontSize: '0.9rem' }}>Image</th>
                        <th style={{ width: "14%", padding: '12px 8px', fontWeight: '700', color: '#ffffff', borderBottom: '2px solid #dee2e6', fontSize: '0.9rem' }}>Location</th>
                        <th style={{ width: "14%", padding: '12px 8px', fontWeight: '700', color: '#ffffff', borderBottom: '2px solid #dee2e6', fontSize: '0.9rem' }}>Type</th>
                        <th style={{ width: "14%", padding: '12px 8px', fontWeight: '700', color: '#ffffff', borderBottom: '2px solid #dee2e6', fontSize: '0.9rem' }}>Price</th>
                        <th style={{ width: "15%", padding: '12px 8px', fontWeight: '700', color: '#ffffff', borderBottom: '2px solid #dee2e6', fontSize: '0.9rem' }}>Status</th>
                        <th style={{ width: "14%", padding: '12px 8px', fontWeight: '700', color: '#ffffff', borderBottom: '2px solid #dee2e6', fontSize: '0.9rem', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentProperties.map((property) => (
                        <tr key={property._id} className="align-middle" style={{ borderBottom: '1px solid #dee2e6' }}>
                          <td style={{ padding: '10px 8px' }}>
                            <div className="property-image-container" style={{ width: '60px', height: '50px', overflow: 'hidden', borderRadius: '6px' }}>
                              <img
                                src={getImageUrl(property.photosAndVideo?.[0])}
                                alt={property.propertyLocation || 'Property'}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  console.log('Image failed to load:', e.target.src);
                                  e.target.src = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
                                }}
                                onLoad={() => {
                                  console.log('Image loaded successfully:', property.photosAndVideo?.[0]);
                                }}
                              />
                            </div>
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <div>
                              <div className="fw-medium" style={{ fontSize: '0.85rem', color: '#212529' }}>
                                <div style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {property.propertyLocation}
                                </div>
                              </div>
                              <small className="text-muted" style={{ fontSize: '0.75rem' }}>{property.areaDetails} sqft</small>
                            </div>
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <div>
                              <span className="badge bg-primary" style={{ fontSize: '0.7rem', padding: '4px 8px' }}>
                                {property.propertyType}
                              </span>
                              {property.residentialType && (
                                <div><small className="text-muted" style={{ fontSize: '0.7rem' }}>{property.residentialType}</small></div>
                              )}
                              {property.commercialType && (
                                <div><small className="text-muted" style={{ fontSize: '0.7rem' }}>{property.commercialType}</small></div>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <div className="fw-semibold text-success" style={{ fontSize: '0.8rem' }}>
                              ₹{property.price?.toLocaleString() || 'N/A'}
                            </div>
                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>{property.purpose}</small>
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                              {property.postedDate 
                                ? new Date(property.postedDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
                                : 'N/A'
                              }
                            </small>
                            <div>
                              <span className="badge bg-info" style={{ fontSize: '0.7rem', padding: '4px 6px' }}>
                                {property.availability}
                              </span>
                              {property.isSold && (
                                <span className="badge bg-danger ms-1" style={{ fontSize: '0.7rem', padding: '4px 6px' }}>
                                  Sold
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                            <div className="d-flex gap-1 justify-content-center align-items-center flex-wrap" style={{ minWidth: '200px' }}>
                              {/* View Details Button */}
                              <button
                                className="btn btn-sm btn-outline-info"
                                onClick={() => handleViewDetails(property)}
                                title="View Property Details"
                                style={{ 
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  minWidth: '32px',
                                  height: '28px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <FaEye />
                              </button>
                              
                              {/* Mark as Sold Button */}
                              <button
                                className={`btn btn-sm ${property.isSold ? 'btn-success' : 'btn-outline-success'}`}
                                onClick={() => handleMarkSold(property._id)}
                                title={property.isSold ? "Unmark as Sold" : "Mark as Sold"}
                                style={{ 
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  minWidth: '32px',
                                  height: '28px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <FaCheckCircle />
                              </button>
                              
                              {/* Approval/Rejection Buttons */}
                              {property.status === 'pending' && (
                                <>
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => handleApprove(property._id)}
                                    title="Approve Property"
                                    style={{ 
                                      padding: '4px 8px',
                                      fontSize: '11px',
                                      minWidth: '32px',
                                      height: '28px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    <FaCheck />
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleReject(property._id)}
                                    title="Reject Property"
                                    style={{ 
                                      padding: '4px 8px',
                                      fontSize: '11px',
                                      minWidth: '32px',
                                      height: '28px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    <FaTimes />
                                  </button>
                                </>
                              )}
                              
                              {/* Delete Button - Allow deletion of sold properties */}
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(property._id, property.propertyLocation)}
                                title="Delete Property"
                                style={{ 
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  minWidth: '32px',
                                  height: '28px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination - Enhanced Design */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-4 pagination-wrapper">
                  <button
                    className="btn btn-primary btn-paginate"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    ⬅ Previous
                  </button>
                  <span className="page-info">
                    Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                  </span>
                  <button
                    className="btn btn-primary btn-paginate"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next ➡
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Property Details Modal */}
      {showModal && selectedProperty && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <FaHome className="me-2" />
                  Property Details - {selectedProperty.propertyLocation}
                  {selectedProperty.isSold && (
                    <span className="badge bg-danger ms-2">Sold</span>
                  )}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-4">
                  {/* Property Images Section */}
                  <div className="col-lg-6">
                    <div className="property-details-section">
                      <h6> Property Gallery</h6>
                      {selectedProperty.photosAndVideo && selectedProperty.photosAndVideo.length > 0 ? (
                        <div className="property-image-gallery">
                          {selectedProperty.photosAndVideo.map((image, index) => (
                            <img
                              key={index}
                              src={getImageUrl(image)}
                              alt={`Property ${index + 1}`}
                              className="img-fluid"
                              style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                              onError={(e) => {
                                console.log('Modal image failed to load:', e.target.src);
                                e.target.src = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="no-images-placeholder">
                          <FaHome className="display-4 mb-3" />
                          <p className="text-muted mb-0">No images available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Property Basic Information */}
                  <div className="col-lg-6">
                    <div className="property-details-section">
                      <h6> Basic Information</h6>
                      <div className="card">
                        <div className="card-body">
                          <div className="property-info-row">
                            <strong> Location:</strong>
                            <span>{selectedProperty.propertyLocation || 'N/A'}</span>
                          </div>
                          <div className="property-info-row">
                            <strong> Property Type:</strong>
                            <span className="badge bg-primary">{selectedProperty.propertyType || 'N/A'}</span>
                          </div>
                          <div className="property-info-row">
                            <strong> Subtype:</strong>
                            <span>{selectedProperty.residentialType || selectedProperty.commercialType || 'N/A'}</span>
                          </div>
                          <div className="property-info-row">
                            <strong> Area:</strong>
                            <span>{selectedProperty.areaDetails || 'N/A'} sqft</span>
                          </div>
                          <div className="property-info-row">
                            <strong> Price:</strong>
                            <span className="text-success fw-bold fs-5">
                              ₹{selectedProperty.price?.toLocaleString() || 'N/A'}
                            </span>
                          </div>
                          <div className="property-info-row">
                            <strong> Purpose:</strong>
                            <span className="badge bg-info">{selectedProperty.purpose || 'N/A'}</span>
                          </div>
                          <div className="property-info-row">
                            <strong> Availability:</strong>
                            <span className={`badge ${
                              selectedProperty.availability === 'Ready to Move' 
                                ? 'bg-success' 
                                : 'bg-warning text-dark'
                            }`}>
                              {selectedProperty.availability || 'Unknown'}
                            </span>
                          </div>
                          {selectedProperty.isSold && (
                            <div className="property-info-row">
                              <strong> Status:</strong>
                              <span className="badge bg-danger">Sold</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="col-lg-6">
                    <div className="property-details-section">
                      <h6>🔧 Additional Features</h6>
                      <div className="card">
                        <div className="card-body">
                          <div className="property-info-row">
                            <strong> Furnishing:</strong>
                            <span>{selectedProperty.furnishingStatus || 'Not specified'}</span>
                          </div>
                          <div className="property-info-row">
                            <strong> Parking:</strong>
                            <span>{selectedProperty.parking || 'Not specified'}</span>
                          </div>
                          <div className="property-info-row">
                            <strong> Status:</strong>
                            <span className={`badge ${
                              selectedProperty.status === 'approved' ? 'bg-success' :
                              selectedProperty.status === 'pending' ? 'bg-warning text-dark' :
                              'bg-danger'
                            }`}>
                              {selectedProperty.status || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact & Timeline */}
                  <div className="col-lg-6">
                    <div className="property-details-section">
                      <h6> Contact & Timeline</h6>
                      <div className="card">
                        <div className="card-body">
                          <div className="property-info-row">
                            <strong> Contact:</strong>
                            <span className="fw-bold">{selectedProperty.contactNumber || 'Not provided'}</span>
                          </div>
                          <div className="property-info-row">
                            <strong> Posted Date:</strong>
                            <span>{
                              selectedProperty.postedDate 
                                ? new Date(selectedProperty.postedDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })
                                : 'N/A'
                            }</span>
                          </div>
                          <div className="property-info-row">
                            <strong> Posted Time:</strong>
                            <span>{
                              selectedProperty.postedDate 
                                ? new Date(selectedProperty.postedDate).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : 'N/A'
                            }</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedProperty.description && (
                    <div className="col-12">
                      <div className="property-details-section">
                        <h6> Property Description</h6>
                        <div className="property-description">
                          {selectedProperty.description}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary "
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
                <div className="d-flex gap-2">
                  {/* Mark as Sold Button in Modal */}
                  <button
                    className={`btn ${selectedProperty.isSold ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => {
                      handleMarkSold(selectedProperty._id);
                      setShowModal(false);
                    }}
                    title={selectedProperty.isSold ? "Unmark as Sold" : "Mark as Sold"}
                  >
                    <FaCheckCircle className="me-2" />
                    {selectedProperty.isSold ? 'Unmark as Sold' : 'Mark as Sold'}
                  </button>
                  
                  {selectedProperty.status === 'pending' && (
                    <>
                      <button
                        className="btn btn-success"
                        onClick={() => {
                          handleApprove(selectedProperty._id);
                          setShowModal(false);
                        }}
                      >
                        <FaCheck className="me-2" />
                        Approve
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => {
                          handleReject(selectedProperty._id);
                          setShowModal(false);
                        }}
                      >
                        <FaTimes className="me-2" />
                        Reject
                      </button>
                    </>
                  )}
                  {/* Allow deletion of sold properties in modal */}
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => {
                      handleDelete(selectedProperty._id, selectedProperty.propertyLocation);
                    }}
                  >
                    <FaTrash className="me-2" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {/* Delete Confirmation Modal - Compact Design */}
      {showDeleteConfirm && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(3px)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '380px' }}>
            <div className="modal-content" style={{ borderRadius: '0.5rem', overflow: 'hidden', border: 'none' }}>
              <div 
                className="modal-header border-0" 
                style={{ 
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  padding: '0.875rem 1.25rem'
                }}
              >
                <h6 className="modal-title mb-0 text-white d-flex align-items-center" style={{ fontSize: '1.05rem', fontWeight: '600' }}>
                  <FaTrash className="me-2" style={{ fontSize: '1.1rem' }} />
                  Delete Property
                </h6>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={cancelDelete}
                  style={{ fontSize: '0.75rem' }}
                ></button>
              </div>
              <div className="modal-body" style={{ padding: '1.5rem 1.25rem' }}>
                <div className="text-center">
                  <p className="mb-2" style={{ fontSize: '0.95rem', color: '#374151', fontWeight: '500' }}>
                    Are you sure you want to delete
                  </p>
                  <p className="mb-3" style={{ fontSize: '1rem', color: '#1f2937', fontWeight: '700' }}>
                    "{propertyToDelete?.name}"?
                  </p>
                  <div 
                    className="alert alert-warning py-2 px-3 mb-0" 
                    style={{ 
                      fontSize: '0.875rem',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fde68a',
                      borderRadius: '0.375rem'
                    }}
                  >
                    <strong> Warning:</strong> This action cannot be undone.
                  </div>
                </div>
              </div>
              <div 
                className="modal-footer border-0" 
                style={{ 
                  padding: '0.75rem 1.25rem',
                  backgroundColor: '#f9fafb'
                }}
              >
                <button
                  type="button"
                  className="btn btn-sm btn-light"
                  onClick={cancelDelete}
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    padding: '0.5rem 1.25rem',
                    border: '1px solid #d1d5db'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={confirmDelete}
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    padding: '0.5rem 1.5rem',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    border: 'none',
                    color: 'white'
                  }}
                >
                  <FaTrash className="me-1" style={{ fontSize: '0.875rem' }} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
            <div className="modal-content">
              <div className="modal-header bg-success text-white" style={{ padding: '0.75rem 1rem' }}>
                <h6 className="modal-title mb-0">
                  <FaCheck className="me-2" />
                  Success
                </h6>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowSuccessModal(false)}
                  style={{ fontSize: '0.875rem' }}
                ></button>
              </div>
              <div className="modal-body" style={{ padding: '1.25rem' }}>
                <div className="text-center">
                  <FaCheck className="text-success" style={{ fontSize: '2.5rem' }} />
                  <p className="mt-2 mb-0" style={{ fontSize: '0.9rem' }}>{modalMessage}</p>
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '0.75rem 1rem' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-success"
                  onClick={() => setShowSuccessModal(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
            <div className="modal-content">
              <div className="modal-header bg-danger text-white" style={{ padding: '0.75rem 1rem' }}>
                <h6 className="modal-title mb-0">
                  <FaTimes className="me-2" />
                  Error
                </h6>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowErrorModal(false)}
                  style={{ fontSize: '0.875rem' }}
                ></button>
              </div>
              <div className="modal-body" style={{ padding: '1.25rem' }}>
                <div className="text-center">
                  <FaTimes className="text-danger" style={{ fontSize: '2.5rem' }} />
                  <p className="mt-2 mb-0" style={{ fontSize: '0.9rem' }}>{modalMessage}</p>
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '0.75rem 1rem' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => setShowErrorModal(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentPage;