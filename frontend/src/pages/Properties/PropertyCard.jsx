import React, { useState, useEffect } from "react";
import "./PropertyCard.css";
import { Modal, Carousel, Button } from "react-bootstrap";
import axios from "axios";
import { API_BASE_URL } from "../../config/apiConfig.jsx";
import { useAdmin } from "../../context/AdminContext";

function PropertyCard({ property }) {
  const { deleteProperty, refreshAllData } = useAdmin();
  const [show, setShow] = useState(false);
  const [isSold, setIsSold] = useState(property.isSold || false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState('');

  // Sync local isSold state with property prop when it changes
  useEffect(() => {
    setIsSold(property.isSold || false);
  }, [property.isSold]);

  // Initialize image when component mounts or property changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    
    // Add safety check for property
    if (!property) return;
    
    const newImageSrc = getImageUrl(
      property?.photosAndVideo && property.photosAndVideo.length > 0
        ? property.photosAndVideo[0]
        : null
    );
    setCurrentImageSrc(newImageSrc);
  }, [property]);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  // Preload images for better performance
  useEffect(() => {
    if (property?.photosAndVideo && property.photosAndVideo.length > 0) {
      // Preload the first 3 images
      const imagesToPreload = property.photosAndVideo.slice(0, 3);
      imagesToPreload.forEach(imagePath => {
        const img = new Image();
        img.src = getImageUrl(imagePath);
      });
    }
  }, [property?.photosAndVideo]);

  const handleMarkSold = async () => {
    try {
      console.log('Attempting to toggle property sold status with ID:', property._id);
      
      // Use PATCH method as specified
      const response = await axios.patch(`${API_BASE_URL}/property/${property._id}/mark-sold`);
      
      console.log('Mark sold response:', response);
      
      if (response.data && response.data.success) {
        // Update the local state
        const newSoldState = !isSold;
        setIsSold(newSoldState);
        
        // Refresh all data to ensure consistency across the app
        await refreshAllData();
        
        handleClose();
      } else {
        console.error(`Failed to update property sold status: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating property sold status:', error);
      console.error('Error response:', error.response);
      
      if (error.response) {
        // Server responded with error status
        console.error(`Error updating property sold status: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        // Request was made but no response received
        console.error('Error updating property sold status: No response from server');
      } else {
        // Something else happened
        console.error(`Error updating property sold status: ${error.message}`);
      }
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    handleClose(); // Close the main modal
    
    try {
      const result = await deleteProperty(property._id);
      
      if (result.success) {
        setModalMessage(`Property "${property.propertyLocation}" has been deleted successfully!`);
        setShowSuccessModal(true);
      } else {
        setModalMessage(`Failed to delete property: ${result.message}`);
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      setModalMessage(`Error deleting property: ${error.message}`);
      setShowErrorModal(true);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Helper function to format the posted date
  const formatPostedDate = (dateString) => {
    if (!dateString) return "Date not available";
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        return "1 day ago";
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return "Invalid date";
    }
  };

  // Test function to check if image URL is accessible
  const testImageAccess = async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return true;
    } catch (error) {
      return false;
    }
  };

  // Helper function to construct image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
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
    
    return fullUrl;
  };

  // Enhanced image error handler
  const handleImageError = (e) => {
    if (!imageError) {
      setImageError(true);
      const fallbackImage = "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
      e.target.src = fallbackImage;
      setCurrentImageSrc(fallbackImage);
    }
  };

  // Image load handler
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <>
      <div className="prop-card">
        <div className="prop-thumb">
          {!imageLoaded && !imageError && (
            <div className="image-loading-placeholder">
              <div className="loading-spinner"></div>
            </div>
          )}
          <img 
            src={currentImageSrc} 
            alt="property"
            onError={handleImageError}
            onLoad={handleImageLoad}
            style={{
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out'
            }}
            loading="lazy"
          />
          <div className="overlay">
            <button className="btn-view" onClick={handleShow}>
              View Details
            </button>
          </div>
        </div>

        <div className="prop-body">
          <h3 className="prop-title">
            {property.propertyLocation}{" "}
            {(isSold || property.isSold) && <span className="sold-tag">Sold</span>}
          </h3>
          <div className="prop-meta">
            <span>
              {property.propertyType}{" "}
              {property.residentialType || property.commercialType
                ? `• ${property.residentialType || property.commercialType}`
                : ""}
            </span>
            <span>• {property.availability}</span>
          </div>
          <p className="prop-details">
            Area: {property.areaDetails} sqft • Price: ₹
            {property.price ? property.price.toLocaleString() : 'Price not available'}
          </p>
          <div className="prop-footer">
            <small className="posted-date">
              Posted: {property?.postedDate ? formatPostedDate(property.postedDate) : 'Date unavailable'}
            </small>
            <small className="property-purpose">
              {property?.purpose || 'For Sale'}
            </small>
          </div>
          
          {/* Debug info - remove this later */}
          {/* <div style={{fontSize: '10px', color: '#999', padding: '4px', borderTop: '1px solid #eee'}}>
            Debug: Photos={property?.photosAndVideo?.length || 0}, Date={property?.postedDate ? 'Yes' : 'No'}
          </div> */}
        </div>
      </div>

      {/* Modal Section */}
      <Modal show={show} onHide={handleClose} centered size="lg">
        <Modal.Header className="modal-header">
          <Modal.Title>Property Details</Modal.Title>
          <button 
            type="button" 
            className="custom-close-btn"
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        </Modal.Header>
        <Modal.Body>
          {/* Carousel */}
          {property?.photosAndVideo && property.photosAndVideo.length > 0 ? (
            <Carousel interval={null} className="mb-4" indicators={true} controls={true}>
              {property.photosAndVideo.map((media, idx) => (
                <Carousel.Item key={idx}>
                  {media.includes("video") || media.includes(".mp4") || media.includes(".mov") ? (
                    <video
                      className="d-block w-100"
                      controls
                      style={{ maxHeight: "450px", objectFit: "cover", borderRadius: "12px" }}
                      preload="metadata"
                    >
                      <source src={getImageUrl(media)} type="video/mp4" />
                    </video>
                  ) : (
                    <img
                      className="d-block w-100"
                      src={getImageUrl(media)}
                      alt={`Property image ${idx + 1}`}
                      style={{ 
                        maxHeight: "450px", 
                        objectFit: "cover",
                        transition: 'opacity 0.3s ease-in-out'
                      }}
                      loading="eager"
                      onError={(e) => {
                        if (!e.target.dataset.errorHandled) {
                          e.target.dataset.errorHandled = 'true';
                          e.target.src = "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
                        }
                      }}
                    />
                  )}
                </Carousel.Item>
              ))}
            </Carousel>
          ) : (
            <div className="no-images-placeholder">
              <img
                src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="No property images available"
                style={{ 
                  maxHeight: "450px", 
                  objectFit: "cover", 
                  width: "100%",
                  borderRadius: "12px"
                }}
              />
            </div>
          )}

          {/* Details */}
          <div className="details-info">
            <h5>{property.propertyLocation}</h5>
            <p>
              <strong>Type:</strong> 
              <span>{property.propertyType} ({property.residentialType || property.commercialType})</span>
            </p>
            <p>
              <strong>Area:</strong> 
              <span>{property.areaDetails} sqft</span>
            </p>
            <p>
              <strong>Price:</strong> 
              <span>₹{property.price ? property.price.toLocaleString() : 'Not specified'}</span>
            </p>
            <p>
              <strong>Status:</strong> 
              <span>{(isSold || property.isSold) ? "Sold" : property.availability}</span>
            </p>
            <p>
              <strong>Purpose:</strong> 
              <span>{property.purpose || 'For Sale'}</span>
            </p>
            <p>
              <strong>Furnishing:</strong> 
              <span>{property.furnishingStatus || 'Not specified'}</span>
            </p>
            <p>
              <strong>Parking:</strong> 
              <span>{property.parking || 'Not specified'}</span>
            </p>
            <p>
              <strong>Posted Date:</strong> 
              <span>{formatPostedDate(property.postedDate)}</span>
            </p>
            <p>
              <strong>Contact:</strong> 
              <span>{property.contactNumber || 'Not provided'}</span>
            </p>
          </div>

          {/* Google Map */}
          <div className="map-container">
            <h6>Location</h6>
            <iframe
              title="property-map"
              width="100%"
              height="300"
              loading="lazy"
              style={{ border: "none" }}
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                property.propertyLocation
              )}&output=embed`}
            ></iframe>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="success" onClick={handleMarkSold}>
            {(isSold || property.isSold) ? 'Unmark as Sold' : 'Mark as Sold'}
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isSold || property.isSold}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal - Compact Design */}
      {showDeleteConfirm && (
        <>
          {/* Custom backdrop for delete modal - Darker overlay */}
          <div 
            className="modal-backdrop fade show" 
            style={{ 
              zIndex: 10049,
              backgroundColor: 'rgba(0, 0, 0, 0.92)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}
            onClick={cancelDelete}
          />
          <Modal 
            show={showDeleteConfirm} 
            onHide={cancelDelete} 
            centered 
            size="sm"
            dialogClassName="compact-delete-modal"
            backdrop={false}
            style={{ zIndex: 10050 }}
          >
            <Modal.Header 
              closeButton 
              className="border-0" 
              style={{ 
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                padding: '0.875rem 1.25rem',
                borderRadius: '0.5rem 0.5rem 0 0'
              }}
            >
              <Modal.Title 
                className="d-flex align-items-center text-white" 
                style={{ 
                  fontSize: '1.05rem', 
                  fontWeight: '600',
                  marginBottom: 0
                }}
              >
                <span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>🗑️</span>
                Delete Property
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: '1.5rem 1.25rem' }}>
              <div className="text-center">
                <p className="mb-2" style={{ fontSize: '0.95rem', color: '#374151', fontWeight: '500' }}>
                  Are you sure you want to delete
                </p>
                <p className="mb-3" style={{ fontSize: '1rem', color: '#1f2937', fontWeight: '700' }}>
                  "{property.propertyLocation}"?
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
                  <strong>⚠️ Warning:</strong> This action cannot be undone.
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer 
              className="border-0" 
              style={{ 
                padding: '0.75rem 1.25rem',
                backgroundColor: '#f9fafb'
              }}
            >
              <Button 
                variant="light" 
                size="sm" 
                onClick={cancelDelete}
                style={{
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  padding: '0.5rem 1.25rem',
                  border: '1px solid #d1d5db'
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                size="sm" 
                onClick={confirmDelete}
                style={{
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  padding: '0.5rem 1.5rem',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: 'none'
                }}
              >
                Delete
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered size="sm">
          <Modal.Header closeButton className="bg-success text-white" style={{ padding: '0.75rem 1rem' }}>
            <Modal.Title style={{ fontSize: '1rem', marginBottom: 0 }}> Success</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: '1.25rem' }}>
            <div className="text-center">
              <div style={{ fontSize: '2.5rem', color: '#059669' }}></div>
              <p className="mt-2 mb-0" style={{ fontSize: '0.9rem' }}>{modalMessage}</p>
            </div>
          </Modal.Body>
          <Modal.Footer style={{ padding: '0.75rem 1rem' }}>
            <Button variant="success" size="sm" onClick={() => setShowSuccessModal(false)}>
              OK
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <Modal show={showErrorModal} onHide={() => setShowErrorModal(false)} centered size="sm">
          <Modal.Header closeButton className="bg-danger text-white" style={{ padding: '0.75rem 1rem' }}>
            <Modal.Title style={{ fontSize: '1rem', marginBottom: 0 }}>❌ Error</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: '1.25rem' }}>
            <div className="text-center">
              <div style={{ fontSize: '2.5rem', color: '#dc2626' }}>❌</div>
              <p className="mt-2 mb-0" style={{ fontSize: '0.9rem' }}>{modalMessage}</p>
            </div>
          </Modal.Body>
          <Modal.Footer style={{ padding: '0.75rem 1rem' }}>
            <Button variant="danger" size="sm" onClick={() => setShowErrorModal(false)}>
              OK
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
}

export default PropertyCard;