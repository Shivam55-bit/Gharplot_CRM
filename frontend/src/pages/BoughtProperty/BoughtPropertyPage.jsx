import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/apiConfig.jsx";
import "./BoughtPropertyPage.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
  FaHome, 
  FaSearch, 
  FaFilter, 
  FaMapMarkerAlt,
  FaRupeeSign,
  FaCalendarAlt,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaBuilding,
  FaChartLine,
  FaTimes,
  FaInfoCircle,
  FaCheckCircle,
  FaImage,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";

const BoughtPropertyPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const itemsPerPage = 9;

  // Fetch bought properties
  useEffect(() => {
    const fetchBoughtProperties = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/properties/all-bought-properties`);
        console.log("Bought Properties Response:", response.data);
        
        if (response.data.data) {
          setProperties(response.data.data);
          // No need to track sold properties separately since we're removing the mark sold functionality
        } else {
          setError("Failed to fetch bought properties");
        }
      } catch (err) {
        console.error("Error fetching bought properties:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBoughtProperties();
  }, []);

  // Filter properties
  const filteredProperties = properties.filter((item) => {
    const property = item.propertyId;
    if (!property) return false;
    
    const matchesSearch = 
      property.propertyLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.residentialType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.commercialType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.propertyType?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "All" || property.propertyType === filterType;
    
    return matchesSearch && matchesType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProperties = filteredProperties.slice(startIndex, startIndex + itemsPerPage);

  // Calculate statistics
  const totalBought = properties.length;
  const totalRevenue = properties.reduce((sum, item) => sum + (item.propertyId?.price || 0), 0);
  const residentialCount = properties.filter(item => item.propertyId?.propertyType === "Residential").length;
  const commercialCount = properties.filter(item => item.propertyId?.propertyType === "Commercial").length;
  const soldCount = properties.filter(item => item.propertyId?.isSold).length;

  // Format currency
  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Open modal with property details
  const openDetailsModal = (item) => {
    setSelectedProperty(item);
    setCurrentImageIndex(0);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedProperty(null);
    setCurrentImageIndex(0);
  };

  // Handle keyboard events for modal
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && showModal) {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showModal]);

  // Get image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    // Remove leading slash if present
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${API_BASE_URL}/${cleanPath}`;
  };

  // Next image in carousel
  const nextImage = () => {
    if (selectedProperty?.propertyId?.photosAndVideo) {
      setCurrentImageIndex((prev) => 
        prev === selectedProperty.propertyId.photosAndVideo.length - 1 ? 0 : prev + 1
      );
    }
  };

  // Previous image in carousel
  const prevImage = () => {
    if (selectedProperty?.propertyId?.photosAndVideo) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedProperty.propertyId.photosAndVideo.length - 1 : prev - 1
      );
    }
  };

  return (
    <div className="bought-property-container mt-5" style={{
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      minHeight: '100vh',
      padding: '20px'
    }}>
      {/* Header Section */}
      <div className="bought-header" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        padding: '30px',
        marginBottom: '30px',
        color: 'white',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: '0.3'
        }} />
        
        <div className="header-content" style={{ position: 'relative', zIndex: 2 }}>
          <div className="title-section" style={{ marginBottom: '30px' }}>
            <h1 className="page-title" style={{
              fontSize: '3rem',
              fontWeight: '800',
              margin: '0 0 10px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              textShadow: '0 4px 8px rgba(0,0,0,0.3)'
            }}>
              <FaHome style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '15px',
                borderRadius: '15px',
                fontSize: '2.5rem'
              }} />
              Bought Properties
            </h1>
            <p style={{
              fontSize: '1.2rem',
              opacity: '0.9',
              fontWeight: '300',
              letterSpacing: '0.5px'
            }}>Manage and track all purchased properties with advanced analytics</p>
          </div>
            
          {/* Enhanced Statistics Cards */}
          <div className="stats-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px'
          }}>
            <div className="stat-card primary" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '20px',
              padding: '25px',
              color: 'white',
              boxShadow: '0 15px 35px rgba(102, 126, 234, 0.3)',
              transform: 'translateY(0)',
              transition: 'all 0.3s ease',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div className="stat-info">
                  <span style={{
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    display: 'block',
                    marginBottom: '8px'
                  }}>{totalBought}</span>
                  <span style={{
                    fontSize: '0.9rem',
                    opacity: '0.9',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Total Bought</span>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '15px',
                  padding: '15px',
                  fontSize: '1.8rem'
                }}>
                  <FaBuilding />
                </div>
              </div>
            </div>
            
            <div className="stat-card success" style={{
              background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
              borderRadius: '20px',
              padding: '25px',
              color: 'white',
              boxShadow: '0 15px 35px rgba(72, 187, 120, 0.3)',
              transform: 'translateY(0)',
              transition: 'all 0.3s ease',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div className="stat-info">
                  <span style={{
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    display: 'block',
                    marginBottom: '8px'
                  }}>{formatCurrency(totalRevenue)}</span>
                  <span style={{
                    fontSize: '0.9rem',
                    opacity: '0.9',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Total Revenue</span>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '15px',
                  padding: '15px',
                  fontSize: '1.8rem'
                }}>
                  <FaRupeeSign />
                </div>
              </div>
            </div>
            
            <div className="stat-card info" style={{
              background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
              borderRadius: '20px',
              padding: '25px',
              color: 'white',
              boxShadow: '0 15px 35px rgba(66, 153, 225, 0.3)',
              transform: 'translateY(0)',
              transition: 'all 0.3s ease',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div className="stat-info">
                  <span style={{
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    display: 'block',
                    marginBottom: '8px'
                  }}>{residentialCount}</span>
                  <span style={{
                    fontSize: '0.9rem',
                    opacity: '0.9',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Residential</span>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '15px',
                  padding: '15px',
                  fontSize: '1.8rem'
                }}>
                  <FaHome />
                </div>
              </div>
            </div>
            
            <div className="stat-card warning" style={{
              background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
              borderRadius: '20px',
              padding: '25px',
              color: 'white',
              boxShadow: '0 15px 35px rgba(237, 137, 54, 0.3)',
              transform: 'translateY(0)',
              transition: 'all 0.3s ease',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div className="stat-info">
                  <span style={{
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    display: 'block',
                    marginBottom: '8px'
                  }}>{commercialCount}</span>
                  <span style={{
                    fontSize: '0.9rem',
                    opacity: '0.9',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Commercial</span>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '15px',
                  padding: '15px',
                  fontSize: '1.8rem'
                }}>
                  <FaChartLine />
                </div>
              </div>
            </div>
            
            <div className="stat-card" style={{
              background: 'linear-gradient(135deg, #9f7aea 0%, #805ad5 100%)',
              borderRadius: '20px',
              padding: '25px',
              color: 'white',
              boxShadow: '0 15px 35px rgba(159, 122, 234, 0.3)',
              transform: 'translateY(0)',
              transition: 'all 0.3s ease',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div className="stat-info">
                  <span style={{
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    display: 'block',
                    marginBottom: '8px'
                  }}>{soldCount}</span>
                  <span style={{
                    fontSize: '0.9rem',
                    opacity: '0.9',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Sold</span>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '15px',
                  padding: '15px',
                  fontSize: '1.8rem'
                }}>
                  <FaCheckCircle />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters Section */}
      <div className="filters-section" style={{
        background: 'white',
        borderRadius: '20px',
        padding: '25px',
        marginBottom: '30px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{
          display: 'flex',
          gap: '20px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div className="search-box" style={{
            position: 'relative',
            flex: '1',
            minWidth: '300px'
          }}>
            <FaSearch style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af',
              fontSize: '1.1rem',
              zIndex: 2
            }} />
            <input
              type="text"
              placeholder="Search by location, buyer name, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '15px 20px 15px 50px',
                border: '2px solid #e2e8f0',
                borderRadius: '15px',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                background: '#f8fafc',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.background = 'white';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.background = '#f8fafc';
              }}
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '15px 20px',
              border: '2px solid #e2e8f0',
              borderRadius: '15px',
              fontSize: '1rem',
              background: 'white',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '200px',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
            }}
          >
            <option value="All">All Categories</option>
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading bought properties...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-container">
          <h3>Error Loading Properties</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Properties Grid */}
      {!loading && !error && (
        <>
          {currentProperties.length === 0 ? (
            <div className="empty-state">
              <FaHome className="empty-icon" />
              <h3>No Bought Properties Found</h3>
              <p>No properties match your current filters.</p>
            </div>
          ) : (
            <>
              <div className="properties-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                gap: '25px',
                padding: '0'
              }}>
                {currentProperties.map((item) => {
                  const property = item.propertyId;
                  if (!property) return null;
                  
                  // Check if property is sold
                  const isPropertySold = property.isSold;
                  
                  return (
                    <div key={item._id} style={{
                      background: 'white',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)';
                    }}>
                      
                      {/* Enhanced Card Header */}
                      <div style={{
                        background: property.propertyType === 'Residential' 
                          ? 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)'
                          : 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
                        padding: '20px',
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '-50%',
                          right: '-50%',
                          width: '100%',
                          height: '100%',
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: '50%',
                          transform: 'rotate(45deg)'
                        }} />
                        
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          position: 'relative',
                          zIndex: 2
                        }}>
                          <span style={{
                            background: 'rgba(255,255,255,0.2)',
                            padding: '8px 16px',
                            borderRadius: '25px',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {property.propertyType}
                          </span>
                          <span style={{
                            fontSize: '1.4rem',
                            fontWeight: '700',
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                          }}>
                            {formatCurrency(property.price || 0)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Enhanced Card Body */}
                      <div style={{ padding: '25px' }}>
                        <h3 style={{
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          margin: '0 0 20px 0',
                          color: '#1a202c',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <FaMapMarkerAlt style={{ color: '#667eea', fontSize: '1.1rem' }} />
                          {property.propertyLocation || "Unknown Location"}
                        </h3>
                        
                        <div style={{
                          display: 'grid',
                          gap: '15px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            background: '#f8fafc',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <FaBuilding style={{ color: '#667eea', fontSize: '1rem' }} />
                            <span style={{ fontSize: '0.9rem', color: '#4a5568', fontWeight: '500' }}>
                              {property.residentialType || property.commercialType || "N/A"}
                            </span>
                          </div>
                          
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            background: '#f8fafc',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <FaCalendarAlt style={{ color: '#48bb78', fontSize: '1rem' }} />
                            <span style={{ fontSize: '0.9rem', color: '#4a5568', fontWeight: '500' }}>
                              Bought: {formatDate(item.createdAt)}
                            </span>
                          </div>
                          
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            background: '#f8fafc',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <FaHome style={{ color: '#ed8936', fontSize: '1rem' }} />
                            <span style={{ fontSize: '0.9rem', color: '#4a5568', fontWeight: '500' }}>
                              {property.areaDetails || "N/A"} sqft
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Enhanced Card Footer */}
                      <div style={{
                        padding: '0 25px 25px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {isPropertySold && (
                            <span style={{
                              background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                              color: 'white',
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              fontWeight: '600'
                            }}>
                              ✅ SOLD
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={() => openDetailsModal(item)}
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '25px',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(1.05)';
                            e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                          }}
                        >
                          <FaInfoCircle /> View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  
                  <div className="page-info">
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <button
                    className="page-btn"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Enhanced Details Modal */}
      {showModal && selectedProperty && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.3s ease'
        }} onClick={(e) => {
          if (e.target === e.currentTarget) {
            closeModal();
          }
        }}>
          <div style={{
            background: 'white',
            borderRadius: '25px',
            width: '100%',
            maxWidth: '1200px',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
            animation: 'slideUp 0.4s ease',
            border: '1px solid #e2e8f0'
          }} onClick={(e) => {
            e.stopPropagation();
          }}>
            
            {/* Enhanced Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '25px 30px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-50%',
                width: '100%',
                height: '100%',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%',
                transform: 'rotate(45deg)'
              }} />
              
              <div style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h2 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    margin: '0 0 8px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <FaInfoCircle style={{
                      background: 'rgba(255,255,255,0.2)',
                      padding: '10px',
                      borderRadius: '12px',
                      fontSize: '1.5rem'
                    }} />
                    Property Details
                  </h2>
                  <p style={{
                    margin: 0,
                    opacity: 0.9,
                    fontSize: '1.1rem',
                    fontWeight: '300'
                  }}>
                    {selectedProperty.propertyId?.propertyLocation || "Property Information"}
                  </p>
                </div>
                
                <button 
                  onClick={closeModal} 
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: 'white',
                    width: '45px',
                    height: '45px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.3)';
                    e.target.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.2)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Enhanced Modal Body */}
            <div style={{
              padding: '0',
              maxHeight: 'calc(90vh - 120px)',
              overflowY: 'auto',
              overflowX: 'hidden'
            }}>
              
              {/* Enhanced Property Images Carousel */}
              {selectedProperty.propertyId?.photosAndVideo && selectedProperty.propertyId.photosAndVideo.length > 0 && (
                <div style={{
                  padding: '30px',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <h3 style={{
                    fontSize: '1.4rem',
                    fontWeight: '700',
                    margin: '0 0 20px 0',
                    color: '#1a202c',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <FaImage style={{
                      color: '#667eea',
                      background: '#f0f4ff',
                      padding: '8px',
                      borderRadius: '10px',
                      fontSize: '1.2rem'
                    }} />
                    Property Gallery ({currentImageIndex + 1} / {selectedProperty.propertyId.photosAndVideo.length})
                  </h3>
                  
                  <div style={{
                    borderRadius: '20px',
                    overflow: 'hidden',
                    position: 'relative',
                    background: '#f8fafc'
                  }}>
                    <div style={{ position: 'relative' }}>
                      <img 
                        src={getImageUrl(selectedProperty.propertyId.photosAndVideo[currentImageIndex])} 
                        alt={`Property ${currentImageIndex + 1}`}
                        style={{
                          width: '100%',
                          height: '400px',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/800x400/f8fafc/9ca3af?text=Image+Not+Available';
                        }}
                      />
                      
                      {selectedProperty.propertyId.photosAndVideo.length > 1 && (
                        <>
                          <button 
                            onClick={prevImage}
                            style={{
                              position: 'absolute',
                              left: '20px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'rgba(0,0,0,0.6)',
                              border: 'none',
                              color: 'white',
                              width: '50px',
                              height: '50px',
                              borderRadius: '50%',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.2rem',
                              transition: 'all 0.3s ease',
                              backdropFilter: 'blur(10px)'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'rgba(0,0,0,0.8)';
                              e.target.style.transform = 'translateY(-50%) scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'rgba(0,0,0,0.6)';
                              e.target.style.transform = 'translateY(-50%) scale(1)';
                            }}
                          >
                            <FaChevronLeft />
                          </button>
                          
                          <button 
                            onClick={nextImage}
                            style={{
                              position: 'absolute',
                              right: '20px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'rgba(0,0,0,0.6)',
                              border: 'none',
                              color: 'white',
                              width: '50px',
                              height: '50px',
                              borderRadius: '50%',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.2rem',
                              transition: 'all 0.3s ease',
                              backdropFilter: 'blur(10px)'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'rgba(0,0,0,0.8)';
                              e.target.style.transform = 'translateY(-50%) scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'rgba(0,0,0,0.6)';
                              e.target.style.transform = 'translateY(-50%) scale(1)';
                            }}
                          >
                            <FaChevronRight />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Enhanced Thumbnail Navigation */}
                    {selectedProperty.propertyId.photosAndVideo.length > 1 && (
                      <div style={{
                        padding: '20px',
                        display: 'flex',
                        gap: '10px',
                        overflowX: 'auto',
                        scrollbarWidth: 'thin'
                      }}>
                        {selectedProperty.propertyId.photosAndVideo.map((image, index) => (
                          <div 
                            key={index} 
                            onClick={() => setCurrentImageIndex(index)}
                            style={{
                              width: '80px',
                              height: '60px',
                              borderRadius: '10px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: index === currentImageIndex ? '3px solid #667eea' : '3px solid transparent',
                              transition: 'all 0.3s ease',
                              flexShrink: 0
                            }}
                          >
                            <img 
                              src={getImageUrl(image)} 
                              alt={`Thumbnail ${index + 1}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/80x60/f8fafc/9ca3af?text=N/A';
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Enhanced Property Information Sections */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '30px',
                padding: '30px'
              }}>
                
                {/* Property Information */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '20px',
                  padding: '25px',
                  border: '1px solid #e2e8f0'
                }}>
                  <h3 style={{
                    fontSize: '1.4rem',
                    fontWeight: '700',
                    margin: '0 0 20px 0',
                    color: '#1a202c',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <FaBuilding style={{
                      color: '#667eea',
                      background: 'white',
                      padding: '8px',
                      borderRadius: '10px',
                      fontSize: '1.2rem'
                    }} />
                    Property Info
                  </h3>
                  
                  <div style={{ display: 'grid', gap: '15px' }}>
                    {[
                      { icon: FaMapMarkerAlt, label: 'Location', value: selectedProperty.propertyId?.propertyLocation || "N/A", color: '#e53e3e' },
                      { icon: FaBuilding, label: 'Type', value: selectedProperty.propertyId?.propertyType || "N/A", color: '#667eea' },
                      { icon: FaHome, label: 'Category', value: selectedProperty.propertyId?.residentialType || selectedProperty.propertyId?.commercialType || "N/A", color: '#38a169' },
                      { icon: FaRupeeSign, label: 'Price', value: formatCurrency(selectedProperty.propertyId?.price || 0), color: '#d69e2e' },
                      { icon: FaChartLine, label: 'Area', value: `${selectedProperty.propertyId?.areaDetails || "N/A"} sqft`, color: '#805ad5' },
                      { icon: FaCheckCircle, label: 'Availability', value: selectedProperty.propertyId?.availability || "N/A", color: '#319795' }
                    ].map((item, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: 'white',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        transition: 'all 0.3s ease'
                      }}>
                        <item.icon style={{
                          color: item.color,
                          fontSize: '1.1rem',
                          minWidth: '20px'
                        }} />
                        <div style={{ flex: 1 }}>
                          <span style={{
                            fontSize: '0.8rem',
                            color: '#718096',
                            fontWeight: '500',
                            display: 'block',
                            marginBottom: '2px'
                          }}>{item.label}</span>
                          <span style={{
                            fontSize: '0.95rem',
                            color: '#2d3748',
                            fontWeight: '600'
                          }}>{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seller Information */}
                <div style={{
                  background: '#f0f8ff',
                  borderRadius: '20px',
                  padding: '25px',
                  border: '1px solid #bee3f8'
                }}>
                  <h3 style={{
                    fontSize: '1.4rem',
                    fontWeight: '700',
                    margin: '0 0 20px 0',
                    color: '#1a202c',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <FaUser style={{
                      color: '#4299e1',
                      background: 'white',
                      padding: '8px',
                      borderRadius: '10px',
                      fontSize: '1.2rem'
                    }} />
                    Seller Details
                  </h3>
                  
                  <div style={{ display: 'grid', gap: '15px' }}>
                    {[
                      { icon: FaUser, label: 'Name', value: selectedProperty.propertyId?.userId?.fullName || "N/A", color: '#4299e1' },
                      { icon: FaEnvelope, label: 'Email', value: selectedProperty.propertyId?.userId?.email || "N/A", color: '#38a169' },
                      { icon: FaPhone, label: 'Phone', value: selectedProperty.propertyId?.userId?.phone || "N/A", color: '#d69e2e' },
                      { icon: FaMapMarkerAlt, label: 'Location', value: selectedProperty.propertyId?.userId?.city && selectedProperty.propertyId?.userId?.state ? `${selectedProperty.propertyId?.userId?.city}, ${selectedProperty.propertyId?.userId?.state}` : selectedProperty.propertyId?.userId?.city || selectedProperty.propertyId?.userId?.state || "N/A", color: '#e53e3e' },
                      { icon: FaCalendarAlt, label: 'Posted', value: formatDate(selectedProperty.propertyId?.postedDate), color: '#805ad5' },
                      { icon: FaChartLine, label: 'Visits', value: selectedProperty.propertyId?.visitCount || 0, color: '#319795' }
                    ].map((item, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: 'white',
                        borderRadius: '10px',
                        border: '1px solid #bee3f8',
                        transition: 'all 0.3s ease'
                      }}>
                        <item.icon style={{
                          color: item.color,
                          fontSize: '1.1rem',
                          minWidth: '20px'
                        }} />
                        <div style={{ flex: 1 }}>
                          <span style={{
                            fontSize: '0.8rem',
                            color: '#718096',
                            fontWeight: '500',
                            display: 'block',
                            marginBottom: '2px'
                          }}>{item.label}</span>
                          <span style={{
                            fontSize: '0.95rem',
                            color: '#2d3748',
                            fontWeight: '600'
                          }}>{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Enhanced Buyer Information */}
              <div style={{
                padding: '0 30px 30px',
              }}>
                <div style={{
                  background: '#f0fff4',
                  borderRadius: '20px',
                  padding: '25px',
                  border: '1px solid #c6f6d5'
                }}>
                  <h3 style={{
                    fontSize: '1.4rem',
                    fontWeight: '700',
                    margin: '0 0 20px 0',
                    color: '#1a202c',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <FaUser style={{
                      color: '#48bb78',
                      background: 'white',
                      padding: '8px',
                      borderRadius: '10px',
                      fontSize: '1.2rem'
                    }} />
                    Buyer Details
                  </h3>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '15px'
                  }}>
                    {[
                      { icon: FaUser, label: 'Name', value: selectedProperty.userId?.fullName || "N/A", color: '#48bb78' },
                      { icon: FaEnvelope, label: 'Email', value: selectedProperty.userId?.email || "N/A", color: '#38a169' },
                      { icon: FaPhone, label: 'Phone', value: selectedProperty.userId?.phone || "N/A", color: '#d69e2e' },
                      { icon: FaMapMarkerAlt, label: 'Location', value: selectedProperty.userId?.city && selectedProperty.userId?.state ? `${selectedProperty.userId?.city}, ${selectedProperty.userId?.state}` : selectedProperty.userId?.city || selectedProperty.userId?.state || "N/A", color: '#e53e3e' },
                      { icon: FaCalendarAlt, label: 'Purchase Date', value: formatDate(selectedProperty.createdAt), color: '#805ad5' }
                    ].map((item, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: 'white',
                        borderRadius: '10px',
                        border: '1px solid #c6f6d5',
                        transition: 'all 0.3s ease'
                      }}>
                        <item.icon style={{
                          color: item.color,
                          fontSize: '1.1rem',
                          minWidth: '20px'
                        }} />
                        <div style={{ flex: 1 }}>
                          <span style={{
                            fontSize: '0.8rem',
                            color: '#718096',
                            fontWeight: '500',
                            display: 'block',
                            marginBottom: '2px'
                          }}>{item.label}</span>
                          <span style={{
                            fontSize: '0.95rem',
                            color: '#2d3748',
                            fontWeight: '600'
                          }}>{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Property Description */}
                  {selectedProperty.propertyId?.description && (
                    <div style={{
                      marginTop: '20px',
                      padding: '20px',
                      background: 'white',
                      borderRadius: '15px',
                      border: '1px solid #c6f6d5'
                    }}>
                      <h4 style={{
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        margin: '0 0 10px 0',
                        color: '#2d3748',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <FaInfoCircle style={{ color: '#48bb78' }} />
                        Description
                      </h4>
                      <p style={{
                        margin: 0,
                        fontSize: '0.95rem',
                        color: '#4a5568',
                        lineHeight: '1.6'
                      }}>
                        {selectedProperty.propertyId.description}
                      </p>
                    </div>
                  )}

                  {/* Sold Status */}
                  {selectedProperty.propertyId?.isSold && (
                    <div style={{
                      marginTop: '20px',
                      padding: '20px',
                      background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                      borderRadius: '15px',
                      color: 'white',
                      textAlign: 'center'
                    }}>
                      <FaCheckCircle style={{
                        fontSize: '2rem',
                        marginBottom: '10px'
                      }} />
                      <h4 style={{
                        fontSize: '1.3rem',
                        fontWeight: '700',
                        margin: '0',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}>
                        ✅ PROPERTY SOLD
                      </h4>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Toast Container for notifications */}
      <ToastContainer />
    </div>
  );
};

export default BoughtPropertyPage;