import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/apiConfig.jsx";
import { FaWrench, FaPlusCircle, FaList, FaTrash, FaEdit, FaTimes } from "react-icons/fa";
import "./ServiceManagementPage.css";

const ServiceManagementPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showDeleteMainModal, setShowDeleteMainModal] = useState(false);
  const [showDeleteTypeModal, setShowDeleteTypeModal] = useState(false);
  const [showEditTypeModal, setShowEditTypeModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [serviceTypeToDelete, setServiceTypeToDelete] = useState(null);
  const [serviceTypeToEdit, setServiceTypeToEdit] = useState(null);
  
  // Form states for adding/editing new service
  const [mainService, setMainService] = useState("");
  const [typeName, setTypeName] = useState("");
  const [adminConfig, setAdminConfig] = useState({
    baseCharges: {
      "1 BHK": 0,
      "2 BHK": 0,
      "3 BHK": 0,
      "4+ BHK": 0,
      "Small (<1000 sq ft)": 0,
      "Medium (1000-3000 sq ft)": 0,
      "Large (>3000 sq ft)": 0,
      "Single Room": 0,
      "Shared Room": 0,
      "Entire Floor": 0,
    },
    distanceRatePerKm: 10
  });
  
  // State for editing
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editingTypeId, setEditingTypeId] = useState(null);
  
  // Calculate counts for display
  const totalServicesCount = services.length;
  const totalServiceTypesCount = services.reduce((total, service) => total + (service.serviceTypes ? service.serviceTypes.length : 0), 0);
  
  // Fetch all services
  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/services`);
      
      // Check if the response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("API endpoint not found or not returning JSON. Please check if the backend service is running.");
      }
      
      const data = await response.json();
      if (data.success) {
        setServices(data.data);
      } else {
        // If API returns success: false, show message but don't treat as error
        setServices([]);
      }
    } catch (err) {
      console.error("Error fetching services:", err);
      // Use sample data as fallback
      loadSampleData();
    } finally {
      setLoading(false);
    }
  };
  
  // Sample data for demonstration (fallback)
  const sampleServices = [
    {
      _id: "1",
      mainService: "Cleaning",
      serviceTypes: [
        {
          typeName: "Office",
          adminConfig: {
            baseCharges: {
              "1 BHK": 500,
              "2 BHK": 800,
              "3 BHK": 1200,
              "4+ BHK": 1500,
              "Small (<1000 sq ft)": 600,
              "Medium (1000-3000 sq ft)": 1000,
              "Large (>3000 sq ft)": 1500,
              "Single Room": 400,
              "Shared Room": 300,
              "Entire Floor": 2000
            },
            distanceRatePerKm: 10
          }
        },
        {
          typeName: "Apartment",
          adminConfig: {
            baseCharges: {
              "1 BHK": 400,
              "2 BHK": 700,
              "3 BHK": 1000,
              "4+ BHK": 1300,
              "Small (<1000 sq ft)": 500,
              "Medium (1000-3000 sq ft)": 800,
              "Large (>3000 sq ft)": 1200,
              "Single Room": 300,
              "Shared Room": 250,
              "Entire Floor": 1800
            },
            distanceRatePerKm: 8
          }
        }
      ]
    },
    {
      _id: "2",
      mainService: "Plumbing",
      serviceTypes: [
        {
          typeName: "Residential",
          adminConfig: {
            baseCharges: {
              "1 BHK": 600,
              "2 BHK": 900,
              "3 BHK": 1300,
              "4+ BHK": 1600,
              "Small (<1000 sq ft)": 700,
              "Medium (1000-3000 sq ft)": 1100,
              "Large (>3000 sq ft)": 1600,
              "Single Room": 500,
              "Shared Room": 400,
              "Entire Floor": 2200
            },
            distanceRatePerKm: 12
          }
        }
      ]
    }
  ];
  
  // Simulate loading sample data
  const loadSampleData = () => {
    setServices(sampleServices);
  };
  
  // Capitalize first letter of a string
  const capitalizeFirstLetter = (string) => {
    if (!string) return string;
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };
  
  // Add new service (using real API)
  const addService = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/services/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mainService: capitalizeFirstLetter(mainService.trim()),
          typeName: capitalizeFirstLetter(typeName.trim()),
          adminConfig
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Reset form
        setMainService("");
        setTypeName("");
        setAdminConfig({
          baseCharges: {
            "1 BHK": 0,
            "2 BHK": 0,
            "3 BHK": 0,
            "4+ BHK": 0,
            "Small (<1000 sq ft)": 0,
            "Medium (1000-3000 sq ft)": 0,
            "Large (>3000 sq ft)": 0,
            "Single Room": 0,
            "Shared Room": 0,
            "Entire Floor": 0,
          },
          distanceRatePerKm: 10
        });
        
        // Refresh services list
        await fetchServices();
      } else {
        setError(data.message || "Failed to add service");
      }
    } catch (err) {
      console.error("Error adding service:", err);
      setError("Error adding service: " + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Open main service delete modal
  const openDeleteMainModal = (service) => {
    setServiceToDelete(service);
    setShowDeleteMainModal(true);
  };
  
  // Close main service delete modal
  const closeDeleteMainModal = () => {
    setShowDeleteMainModal(false);
    setServiceToDelete(null);
  };
  
  // Confirm main service deletion
  const confirmDeleteMainService = async () => {
    if (!serviceToDelete) return;
    
    setLoading(true);
    setError(null);
    closeDeleteMainModal();
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/services/delete-main/${serviceToDelete._id}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh services list
        await fetchServices();
      } else {
        setError(data.message || "Failed to delete service");
      }
    } catch (err) {
      console.error("Error deleting service:", err);
      setError("Error deleting service: " + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Open service type delete modal
  const openDeleteTypeModal = (service, type) => {
    setServiceToDelete(service);
    setServiceTypeToDelete(type);
    setShowDeleteTypeModal(true);
  };
  
  // Close service type delete modal
  const closeDeleteTypeModal = () => {
    setShowDeleteTypeModal(false);
    setServiceToDelete(null);
    setServiceTypeToDelete(null);
  };
  
  // Confirm service type deletion
  const confirmDeleteServiceType = async () => {
    if (!serviceToDelete || !serviceTypeToDelete) return;
    
    setLoading(true);
    setError(null);
    closeDeleteTypeModal();
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/services/delete-type/${serviceToDelete._id}/${serviceTypeToDelete._id}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh services list
        await fetchServices();
      } else {
        setError(data.message || "Failed to delete service type");
      }
    } catch (err) {
      console.error("Error deleting service type:", err);
      setError("Error deleting service type: " + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Open service type edit modal
  const openEditTypeModal = (service, type) => {
    setServiceTypeToEdit({ ...type });
    setEditingServiceId(service._id);
    setEditingTypeId(type._id);
    setTypeName(type.typeName);
    setAdminConfig({ ...type.adminConfig });
    setShowEditTypeModal(true);
  };
  
  // Close service type edit modal
  const closeEditTypeModal = () => {
    setShowEditTypeModal(false);
    setServiceTypeToEdit(null);
    setEditingServiceId(null);
    setEditingTypeId(null);
    setTypeName("");
    setAdminConfig({
      baseCharges: {
        "1 BHK": 0,
        "2 BHK": 0,
        "3 BHK": 0,
        "4+ BHK": 0,
        "Small (<1000 sq ft)": 0,
        "Medium (1000-3000 sq ft)": 0,
        "Large (>3000 sq ft)": 0,
        "Single Room": 0,
        "Shared Room": 0,
        "Entire Floor": 0,
      },
      distanceRatePerKm: 10
    });
  };
  
  // Update service type with correct API endpoint
  const updateServiceType = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/services/update/${editingServiceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          typeId: editingTypeId,
          typeName: capitalizeFirstLetter(typeName.trim()),
          baseCharges: adminConfig.baseCharges,
          distanceRatePerKm: adminConfig.distanceRatePerKm
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh services list
        await fetchServices();
        closeEditTypeModal();
      } else {
        setError(data.message || "Failed to update service type");
      }
    } catch (err) {
      console.error("Error updating service type:", err);
      setError("Error updating service type: " + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle base charge change
  const handleBaseChargeChange = (propertyType, value) => {
    setAdminConfig(prev => ({
      ...prev,
      baseCharges: {
        ...prev.baseCharges,
        [propertyType]: Number(value)
      }
    }));
  };
  
  // Handle focus event to clear default 0 value
  const handleFocus = (e) => {
    if (e.target.value === "0") {
      e.target.value = "";
    }
  };
  
  // Handle blur event to restore 0 if empty
  const handleBlur = (e, propertyType) => {
    if (e.target.value === "") {
      e.target.value = "0";
      handleBaseChargeChange(propertyType, 0);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return (
    // Added mt-5 class to avoid going under the fixed header
    <div className="service-management-page mt-5">
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="page-header">
              <div className="header-content">
                <div>
                  <h2><FaWrench className="service-icon" /> Service Management</h2>
                  <p>Manage service types and configurations</p>
                </div>
                <div className="header-cards ">
                  <div className="header-card">
                    <div className="card-title text-light">Total Services</div>
                    <div className="card-value text-light">{totalServicesCount}</div>
                  </div>
                  <div className="header-card">
                    <div className="card-title text-light">Total Types</div>
                    <div className="card-value text-light">{totalServiceTypesCount}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="row">
            <div className="col-12">
              <div className="alert alert-danger">
                <strong>Error:</strong> {error}
              </div>
            </div>
          </div>
        )}
        
        {/* Add Service Form */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5>
                  <FaPlusCircle className="section-icon" /> 
                  Add New Service
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={addService}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Main Service</label>
                        <input
                          type="text"
                          className="form-control"
                          value={mainService}
                          onChange={(e) => setMainService(e.target.value)}
                          placeholder="e.g. Cleaning, Plumbing"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Service Type</label>
                        <input
                          type="text"
                          className="form-control"
                          value={typeName}
                          onChange={(e) => setTypeName(e.target.value)}
                          placeholder="e.g. Office, Apartment"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-12">
                      <h6>Base Charges Configuration</h6>
                    </div>
                    {Object.entries(adminConfig.baseCharges).map(([propertyType, charge]) => (
                      <div className="col-md-3 col-sm-6" key={propertyType}>
                        <div className="mb-3">
                          <label className="form-label">{propertyType}</label>
                          <input
                            type="number"
                            className="form-control"
                            value={charge}
                            onChange={(e) => handleBaseChargeChange(propertyType, e.target.value)}
                            onFocus={handleFocus}
                            onBlur={(e) => handleBlur(e, propertyType)}
                            min="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Distance Rate Per Km</label>
                        <input
                          type="number"
                          className="form-control"
                          value={adminConfig.distanceRatePerKm}
                          onChange={(e) => setAdminConfig(prev => ({
                            ...prev,
                            distanceRatePerKm: Number(e.target.value)
                          }))}
                          onFocus={handleFocus}
                          onBlur={(e) => {
                            if (e.target.value === "") {
                              setAdminConfig(prev => ({
                                ...prev,
                                distanceRatePerKm: 0
                              }));
                            }
                          }}
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Adding..." : "Add Service"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
        
        {/* Services List */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5><FaList className="section-icon" /> Existing Services</h5>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="text-center">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : services.length === 0 ? (
                  <p className="text-muted">No services found. Add a new service to get started.</p>
                ) : (
                  <div className="services-list">
                    {services.map((service) => (
                      <div key={service._id} className="main-service-row">
                        <div className="main-service-name">
                          {service.mainService}
                          <button 
                            className="btn btn-danger delete-main-service"
                            onClick={() => openDeleteMainModal(service)}
                            title="Delete main service"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                        
                        <div className="service-types-container">
                          {service.serviceTypes.map((type) => (
                            <div key={type._id} className="service-type-badge">
                              {type.typeName}
                              <button 
                                className="btn btn-warning btn-action"
                                onClick={() => openEditTypeModal(service, type)}
                                title="Edit service type"
                              >
                                <FaEdit size={10} />
                              </button>
                              <button 
                                className="btn btn-danger btn-action"
                                onClick={() => openDeleteTypeModal(service, type)}
                                title="Delete service type"
                              >
                                <FaTrash size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        <div className="charges-container">
                          {service.serviceTypes.map((type) => (
                            <div key={type._id} className="charge-card">
                              <div className="charge-card-title">
                                {type.typeName} Charges
                              </div>
                              {Object.entries(type.adminConfig.baseCharges)
                                .filter(([propType, charge]) => charge > 0)
                                .map(([propType, charge]) => (
                                  <div key={propType} className="charge-item">
                                    {propType}: ₹{charge}
                                  </div>
                                ))}
                              <div className="distance-rate">
                                Distance Rate: ₹{type.adminConfig.distanceRatePerKm}/km
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Main Service Modal */}
      {showDeleteMainModal && (
        <div className="service-delete-main-modal-overlay">
          <div className="service-delete-main-modal-content">
            <div className="service-delete-main-modal-header">
              <h5>Confirm Deletion</h5>
              <button 
                className="service-delete-main-modal-close"
                onClick={closeDeleteMainModal}
              >
                <FaTimes />
              </button>
            </div>
            <div className="service-delete-main-modal-body">
              <p>Are you sure you want to delete the main service "<strong>{serviceToDelete?.mainService}</strong>" and all its service types?</p>
              <p className="text-danger">This action cannot be undone.</p>
            </div>
            <div className="service-delete-main-modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={closeDeleteMainModal}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={confirmDeleteMainService}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Service Type Modal */}
      {showDeleteTypeModal && (
        <div className="service-delete-type-modal-overlay">
          <div className="service-delete-type-modal-content">
            <div className="service-delete-type-modal-header">
              <h5>Confirm Deletion</h5>
              <button 
                className="service-delete-type-modal-close"
                onClick={closeDeleteTypeModal}
              >
                <FaTimes />
              </button>
            </div>
            <div className="service-delete-type-modal-body">
              <p>Are you sure you want to delete the service type "<strong>{serviceTypeToDelete?.typeName}</strong>"?</p>
              <p className="text-danger">This action cannot be undone.</p>
            </div>
            <div className="service-delete-type-modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={closeDeleteTypeModal}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={confirmDeleteServiceType}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Service Type Modal */}
      {showEditTypeModal && (
        <div className="service-edit-type-modal-overlay">
          <div className="service-edit-type-modal-content">
            <div className="service-edit-type-modal-header">
              <h5>Edit Service Type</h5>
              <button 
                className="service-edit-type-modal-close"
                onClick={closeEditTypeModal}
              >
                <FaTimes />
              </button>
            </div>
            <div className="service-edit-type-modal-body">
              <form onSubmit={updateServiceType}>
                <div className="mb-3">
                  <label className="form-label">Service Type Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={typeName}
                    onChange={(e) => setTypeName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <h6>Base Charges Configuration</h6>
                  <div className="row">
                    {Object.entries(adminConfig.baseCharges).map(([propertyType, charge]) => (
                      <div className="col-md-6 col-lg-4" key={propertyType}>
                        <div className="mb-2">
                          <label className="form-label small">{propertyType}</label>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={charge}
                            onChange={(e) => handleBaseChargeChange(propertyType, e.target.value)}
                            onFocus={handleFocus}
                            onBlur={(e) => handleBlur(e, propertyType)}
                            min="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Distance Rate Per Km</label>
                  <input
                    type="number"
                    className="form-control"
                    value={adminConfig.distanceRatePerKm}
                    onChange={(e) => setAdminConfig(prev => ({
                      ...prev,
                      distanceRatePerKm: Number(e.target.value)
                    }))}
                    onFocus={handleFocus}
                    onBlur={(e) => {
                      if (e.target.value === "") {
                        setAdminConfig(prev => ({
                          ...prev,
                          distanceRatePerKm: 0
                        }));
                      }
                    }}
                    min="0"
                  />
                </div>
                
                <div className="service-edit-type-modal-footer">
                  <button 
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeEditTypeModal}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Update"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManagementPage;