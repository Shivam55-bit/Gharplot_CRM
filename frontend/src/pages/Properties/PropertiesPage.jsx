// src/components/PropertiesPage.jsx
import React, { useState, useMemo } from "react";
import "./PropertiesPage.css";
import PropertyCard from "./PropertyCard";
import { useAdmin } from "../../context/AdminContext";
import { FaSearch, FaFilter, FaHome, FaBuilding, FaChevronLeft, FaChevronRight, FaPlus } from "react-icons/fa";
import axios from "axios";
import { API_BASE_URL } from "../../config/apiConfig";
import { toast } from "react-toastify";

function PropertiesPage() {
  const { allProperties, loading, error, refreshAllData } = useAdmin();
  
  // Debug logging
  console.log('🏠 PropertiesPage render:', { 
    hasProperties: !!allProperties, 
    propertiesCount: allProperties?.length || 0,
    loading, 
    error 
  });
  
  const [typeFilter, setTypeFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // Show 12 properties per page
  const [isPageChanging, setIsPageChanging] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [propertyForm, setPropertyForm] = useState({
    propertyLocation: "",
    areaDetails: "",
    availability: "Ready to Move",
    price: "",
    description: "",
    furnishingStatus: "Furnished",
    parking: "Available",
    purpose: "Sell",
    propertyType: "Commercial",
    commercialType: "office",
    bedrooms: "1",
    bathrooms: "2",
    floorNumber: "1",
    totalFloors: "5",
    facingDirection: "East",
    contactNumber: "",
    photosAndVideo: null
  });

  const handlePostProperty = async (e) => {
    e.preventDefault();
    
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      toast.error('Admin token not found. Please login again.');
      return;
    }

    const formData = new FormData();
    
    // Log what we're sending
    console.log('📤 Preparing to send property data:', propertyForm);
    
    Object.keys(propertyForm).forEach(key => {
      if (key === 'photosAndVideo') {
        if (propertyForm[key]) {
          formData.append(key, propertyForm[key]);
          console.log(`✅ Appending ${key}:`, propertyForm[key].name, propertyForm[key].type);
        } else {
          console.log(`⚠️ Skipping ${key}: no file selected`);
        }
      } else {
        formData.append(key, propertyForm[key]);
        console.log(`✅ Appending ${key}:`, propertyForm[key]);
      }
    });

    // Log FormData entries
    console.log('📋 FormData entries:');
    for (let pair of formData.entries()) {
      console.log(pair[0], ':', pair[1]);
    }

    // Close modal immediately
    setShowPropertyModal(false);
    
    // Show loading toast
    toast.info('📤 Posting property...');

    // Reset form
    setPropertyForm({
      propertyLocation: "",
      areaDetails: "",
      availability: "Ready to Move",
      price: "",
      description: "",
      furnishingStatus: "Furnished",
      parking: "Available",
      purpose: "Sell",
      propertyType: "Commercial",
      commercialType: "office",
      bedrooms: "1",
      bathrooms: "2",
      floorNumber: "1",
      totalFloors: "5",
      facingDirection: "East",
      contactNumber: "",
      photosAndVideo: null
    });

    try {
      console.log('🚀 Sending POST request to:', `${API_BASE_URL}/property/admin/add`);
      
      const response = await axios.post(`${API_BASE_URL}/property/admin/add`, formData, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      console.log('✅ Response received:', response.data);

      if (response.data.success) {
        toast.success('✅ Property posted successfully!');
        
        // Refresh properties data without page reload
        await refreshAllData();
      }
    } catch (error) {
      console.error('❌ Error posting property:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error headers:', error.response?.headers);
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to post property');
    }
  };

  if (loading) return (
    <div className="text-center mt-5" style={{ padding: '50px' }}>
      <div style={{ fontSize: '18px', color: '#667eea' }}>
        <div className="spinner-border" role="status" style={{ marginBottom: '20px' }}>
          <span className="sr-only">Loading...</span>
        </div>
        <p>Loading properties...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="text-center mt-5" style={{ padding: '50px' }}>
      <p className="text-danger">Error loading properties: {error}</p>
      <button 
        onClick={() => window.location.reload()} 
        style={{
          padding: '10px 20px',
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        Retry
      </button>
    </div>
  );
  
  // Show empty state instead of "no properties" to avoid confusion during loading
  const hasNoProperties = !allProperties || allProperties.length === 0;

  // Unique Residential & Commercial categories
  const safeProperties = allProperties || [];
  const residentialCats = Array.from(
    new Set(
      safeProperties
        .filter((p) => p.propertyType === "Residential")
        .map((p) => p.residentialType)
    )
  ).filter(Boolean);

  const commercialCats = Array.from(
    new Set(
      safeProperties
        .filter((p) => p.propertyType === "Commercial")
        .map((p) => p.commercialType)
    )
  ).filter(Boolean);

  // Filtered list with pagination
  const { paginatedProperties, totalFiltered, totalPages } = useMemo(() => {
    // First apply filters
    const filtered = safeProperties.filter((p) => {
      // Search filter - check location and purpose
      const matchesSearch = 
        !searchTerm || 
        p.propertyLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.purpose?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Type filter
      if (typeFilter !== "All" && p.propertyType !== typeFilter) return false;
      
      // Category filter
      if (categoryFilter !== "All") {
        if (p.propertyType === "Residential")
          return p.residentialType === categoryFilter;
        if (p.propertyType === "Commercial")
          return p.commercialType === categoryFilter;
      }
      
      return matchesSearch;
    });

    // Calculate pagination
    const total = filtered.length;
    const totalPagesCalc = Math.ceil(total / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);

    return {
      paginatedProperties: paginated,
      totalFiltered: total,
      totalPages: totalPagesCalc
    };
  }, [safeProperties, searchTerm, typeFilter, categoryFilter, currentPage, itemsPerPage]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, categoryFilter]);

  // Dynamic counts
  const totalProperties = safeProperties.length;
  const residentialCount = safeProperties.filter(
    (p) => p.propertyType === "Residential"
  ).length;
  const commercialCount = safeProperties.filter(
    (p) => p.propertyType === "Commercial"
  ).length;

  // Pagination handlers
  const handlePageChange = (page) => {
    setIsPageChanging(true);
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Brief delay to show loading state
    setTimeout(() => {
      setIsPageChanging(false);
    }, 200);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  return (
    <div className="properties-page mt-5">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-content">
          <div className="title-section">
            <h1 className="page-title">Property Management</h1>
            <p className="page-subtitle">Manage and oversee all property listings</p>
          </div>
          
          <button 
            onClick={() => setShowPropertyModal(true)}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s'
            }}
            onMouseOver={e => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.target.style.transform = 'translateY(0)'}
          >
            <FaPlus /> Post Property
          </button>
          
          <div className="stats-overview">
            <div className="stat-card">
              <span className="stat-number">{totalProperties}</span>
              <span className="stat-label">Total Properties</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{residentialCount}</span>
              <span className="stat-label">Residential</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{commercialCount}</span>
              <span className="stat-label">Commercial</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-header">
          <h3 className="filter-title">
            <FaFilter className="filter-icon" />
            Filter Properties
          </h3>
          <div className="showing-count">
            Showing <span className="count-highlight">{totalFiltered}</span> of {totalProperties} properties
          </div>
        </div>
        
        <div className="filter-controls">
          {/* Search Bar */}
          <div className="filter-group search-group">
            <label className="filter-label">Search</label>
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search by location or purpose..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Property Type</label>
            <select
              className="filter-select"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCategoryFilter("All");
              }}
            >
              <option value="All">All Types</option>
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Category</label>
            <select
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              {(typeFilter === "All" || typeFilter === "Residential") &&
                residentialCats.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              {(typeFilter === "All" || typeFilter === "Commercial") &&
                commercialCats.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="properties-grid-section">
        {/* Results Summary */}
        {!hasNoProperties && totalFiltered > 0 && (
          <div className="results-summary">
            <p className="results-text">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalFiltered)} of {totalFiltered} properties
              {searchTerm && ` for "${searchTerm}"`}
            </p>
            <div className="pagination-info">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}

        {hasNoProperties ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FaHome />
            </div>
            <h3>No Properties Available</h3>
            <p>Start by posting your first property using the "Post Property" button above.</p>
          </div>
        ) : paginatedProperties.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FaHome />
            </div>
            <h3>No Properties Found</h3>
            <p>No properties match your current filter criteria.</p>
          </div>
        ) : (
          <>
            <div className={`properties-grid ${isPageChanging ? 'loading' : ''}`}>
              {isPageChanging ? (
                // Show skeleton loading cards during page transition
                [...Array(Math.min(itemsPerPage, paginatedProperties.length))].map((_, index) => (
                  <div key={`skeleton-${index}`} className="property-skeleton">
                    <div className="skeleton-image"></div>
                    <div className="skeleton-content">
                      <div className="skeleton-line skeleton-title"></div>
                      <div className="skeleton-line skeleton-meta"></div>
                      <div className="skeleton-line skeleton-details"></div>
                      <div className="skeleton-line skeleton-footer"></div>
                    </div>
                  </div>
                ))
              ) : (
                paginatedProperties.map((p) => <PropertyCard key={p._id} property={p} />)
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <div className="pagination-controls">
                  <button
                    className="pagination-btn prev-btn"
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                  >
                    <FaChevronLeft />
                    Previous
                  </button>

                  <div className="pagination-numbers">
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNum = index + 1;
                      const isCurrentPage = pageNum === currentPage;
                      
                      // Show first page, last page, current page, and 2 pages around current
                      const showPage = 
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        Math.abs(pageNum - currentPage) <= 2;

                      if (!showPage) {
                        // Show ellipsis
                        if (pageNum === currentPage - 3 || pageNum === currentPage + 3) {
                          return (
                            <span key={pageNum} className="pagination-ellipsis">
                              ...
                            </span>
                          );
                        }
                        return null;
                      }

                      return (
                        <button
                          key={pageNum}
                          className={`pagination-btn page-btn ${isCurrentPage ? 'active' : ''}`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    className="pagination-btn next-btn"
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Post Property Modal */}
      {showPropertyModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '30px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Post New Property</h2>
              <button onClick={() => setShowPropertyModal(false)} style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer'
              }}>×</button>
            </div>

            <form onSubmit={handlePostProperty}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Location</label>
                  <input type="text" required value={propertyForm.propertyLocation}
                    onChange={e => setPropertyForm({...propertyForm, propertyLocation: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Area (sq ft)</label>
                  <input type="text" required value={propertyForm.areaDetails}
                    onChange={e => setPropertyForm({...propertyForm, areaDetails: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Price</label>
                  <input type="text" required value={propertyForm.price}
                    onChange={e => setPropertyForm({...propertyForm, price: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Contact Number</label>
                  <input type="text" required value={propertyForm.contactNumber}
                    onChange={e => setPropertyForm({...propertyForm, contactNumber: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Availability</label>
                  <select value={propertyForm.availability}
                    onChange={e => setPropertyForm({...propertyForm, availability: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}>
                    <option>Ready to Move</option>
                    <option>Under Construction</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Purpose</label>
                  <select value={propertyForm.purpose}
                    onChange={e => setPropertyForm({...propertyForm, purpose: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}>
                    <option>Sell</option>
                    <option>Rent</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Property Type</label>
                  <select value={propertyForm.propertyType}
                    onChange={e => setPropertyForm({...propertyForm, propertyType: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}>
                    <option>Commercial</option>
                    <option>Residential</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Commercial Type</label>
                  <select value={propertyForm.commercialType}
                    onChange={e => setPropertyForm({...propertyForm, commercialType: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}>
                    <option value="office">Office</option>
                    <option value="shop">Shop</option>
                    <option value="warehouse">Warehouse</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Bedrooms</label>
                  <input type="text" value={propertyForm.bedrooms}
                    onChange={e => setPropertyForm({...propertyForm, bedrooms: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Bathrooms</label>
                  <input type="text" value={propertyForm.bathrooms}
                    onChange={e => setPropertyForm({...propertyForm, bathrooms: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Floor Number</label>
                  <input type="text" value={propertyForm.floorNumber}
                    onChange={e => setPropertyForm({...propertyForm, floorNumber: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Total Floors</label>
                  <input type="text" value={propertyForm.totalFloors}
                    onChange={e => setPropertyForm({...propertyForm, totalFloors: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Furnishing</label>
                  <select value={propertyForm.furnishingStatus}
                    onChange={e => setPropertyForm({...propertyForm, furnishingStatus: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}>
                    <option>Furnished</option>
                    <option>Semi-Furnished</option>
                    <option>Unfurnished</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Parking</label>
                  <select value={propertyForm.parking}
                    onChange={e => setPropertyForm({...propertyForm, parking: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}>
                    <option>Available</option>
                    <option>Not Available</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Facing Direction</label>
                  <select value={propertyForm.facingDirection}
                    onChange={e => setPropertyForm({...propertyForm, facingDirection: e.target.value})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}>
                    <option>East</option>
                    <option>West</option>
                    <option>North</option>
                    <option>South</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Photo/Video</label>
                  <input type="file" accept="image/*,video/*"
                    onChange={e => setPropertyForm({...propertyForm, photosAndVideo: e.target.files[0]})}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Description</label>
                <textarea required value={propertyForm.description}
                  onChange={e => setPropertyForm({...propertyForm, description: e.target.value})}
                  rows="3"
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowPropertyModal(false)} style={{
                  padding: '10px 20px',
                  background: '#ccc',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}>Cancel</button>
                <button type="submit" style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}>Post Property</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PropertiesPage;