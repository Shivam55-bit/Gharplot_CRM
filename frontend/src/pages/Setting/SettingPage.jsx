import React, { useState } from "react";
import {
  Settings,
  Home,
  Wrench,
  Users,
  Bell,
  Palette,
  Shield,
  Plug,
  Server,
  FileText,
  Save,
  Upload,
  Mail,
  Phone,
  Globe,
  DollarSign,
} from "lucide-react";
import "./SettingPage.css";

const SettingPage = () => {
  const [activeTab, setActiveTab] = useState("general");

  const menuItems = [
    { id: "general", icon: <Settings size={18} />, label: "General" },
    { id: "property", icon: <Home size={18} />, label: "Property Management" },
    { id: "services", icon: <Wrench size={18} />, label: "Service Management" },
    { id: "users", icon: <Users size={18} />, label: "User & Roles" },
    { id: "notifications", icon: <Bell size={18} />, label: "Notifications" },
    { id: "appearance", icon: <Palette size={18} />, label: "Appearance" },
    { id: "security", icon: <Shield size={18} />, label: "Security" },
    { id: "integrations", icon: <Plug size={18} />, label: "Integrations" },
    { id: "backup", icon: <Server size={18} />, label: "Backup" },
    { id: "legal", icon: <FileText size={18} />, label: "Legal & Policy" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="settings-card">
            <div className="card-header">
              <h4>
                <div className="header-icon">
                  <Settings size={24} />
                </div>
                General Settings
              </h4>
              <p>Configure your platform's basic information and preferences</p>
            </div>
            <div className="card-content">
              <div className="row g-2">
                <div className="col-lg-6">
                  <div className="form-group">
                    <label className="form-label">Platform Name</label>
                    <input
                      className="form-control"
                      placeholder="Enter platform name"
                      defaultValue="PropertyHub Pro"
                    />
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="form-group">
                    <label className="form-label">Business Email</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Enter business email"
                      defaultValue="admin@propertyhub.com"
                    />
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      className="form-control"
                      placeholder="Enter phone number"
                      defaultValue="+1 (555) 123-4567"
                    />
                  </div>
                </div>
                <div className="col-lg-6 m-0 p-0">
                  <div className="form-group">
                    <label className="form-label">Default Currency</label>
                    <select className="form-select">
                      <option>INR (₹)</option>
                      <option>USD ($)</option>
                      <option>EUR (€)</option>
                      <option>GBP (£)</option>
                    </select>
                  </div>
                </div>
                <div className="col-12">
                  <div className="form-group p-0 m-0">
                    <label className="form-label">Platform Logo</label>
                    <div className="file-upload-area">
                      <Upload className="upload-icon" size={48} />
                      <div className="upload-text">
                        Drop your logo here or click to browse
                      </div>
                      <div className="upload-hint">
                        Recommended: 200x60px, PNG or SVG format
                      </div>
                      <input
                        type="file"
                        style={{ display: "none" }}
                        accept="image/*"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="action-buttons">
                <button className="btn-save">
                  <Save size={18} />
                  Save Changes
                </button>
                <button className="btn-secondary">Reset to Default</button>
              </div>
            </div>
          </div>
        );

      case "property":
        return (
          <div className="settings-card">
            <div className="card-header">
              <h4>
                <div className="header-icon">
                  <Home size={24} />
                </div>
                Property Management
              </h4>
              <p>Configure property listing and approval settings</p>
            </div>
            <div className="card-content">
              <div className="row g-4">
                <div className="col-lg-6">
                  <div className="form-group">
                    <label className="form-label">Approval Mode</label>
                    <select className="form-select">
                      <option>Auto Approval</option>
                      <option>Manual Review</option>
                      <option>Hybrid Mode</option>
                    </select>
                    <small className="form-text">
                      Choose how new property listings are approved
                    </small>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="form-group">
                    <label className="form-label">
                      Default Listing Duration
                    </label>
                    <div className="input-group">
                      <input
                        className="form-control"
                        placeholder="30"
                        defaultValue="30"
                      />
                      <span className="input-group-text">days</span>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="form-group">
                    <label className="form-label">Property Categories</label>
                    <select className="form-select">
                      <option>Buy / Rent / Sell</option>
                      <option>Buy Only</option>
                      <option>Rent Only</option>
                      <option>Commercial Only</option>
                    </select>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="form-group">
                    <label className="form-label">Commission Rate</label>
                    <div className="input-group">
                      <input
                        className="form-control"
                        placeholder="2.5"
                        defaultValue="2.5"
                      />
                      <span className="input-group-text">%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="action-buttons">
                <button className="btn-save">
                  <Save size={18} />
                  Save Property Settings
                </button>
              </div>
            </div>
          </div>
        );

      case "services":
        return (
          <div className="settings-card">
            <div className="card-header">
              <h4>
                <div className="header-icon">
                  <Wrench size={24} />
                </div>
                Service Management
              </h4>
              <p>Configure service offerings and pricing</p>
            </div>
            <div className="card-content">
              <div className="row g-4">
                <div className="col-lg-6">
                  <div className="form-group">
                    <label className="form-label">Available Services</label>
                    <select className="form-select">
                      <option>All Services</option>
                      <option>Cleaning Only</option>
                      <option>Painting Only</option>
                      <option>Plumbing Only</option>
                      <option>Custom Selection</option>
                    </select>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="form-group">
                    <label className="form-label">Base Service Charge</label>
                    <div className="input-group">
                      <span className="input-group-text">₹</span>
                      <input
                        className="form-control"
                        placeholder="500"
                        defaultValue="500"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="action-buttons">
                <button className="btn-save">
                  <Save size={18} />
                  Save Service Settings
                </button>
              </div>
            </div>
          </div>
        );

      case "users":
        return (
          <div className="settings-card">
            <div className="card-header">
              <h4>
                <div className="header-icon">
                  <Users size={24} />
                </div>
                User & Roles Management
              </h4>
              <p>Manage admin, agents, and service partners with permissions</p>
            </div>
            <div className="card-content">
              <div className="row g-4">
                <div className="col-lg-4">
                  <div className="feature-card">
                    <div className="feature-header">
                      <div className="feature-icon">
                        <Users size={20} />
                      </div>
                      <div>
                        <h5 className="feature-title">Admin Users</h5>
                        <p className="feature-description">
                          Full platform access
                        </p>
                      </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span style={{ color: "#64748b" }}>
                        Active: <strong style={{ color: "#1e293b" }}>3</strong>
                      </span>
                      <button className="btn-secondary btn-sm">Manage</button>
                    </div>
                  </div>
                </div>

                <div className="col-lg-4 w-50">
                  <div className="feature-card">
                    <div className="feature-header">
                      <div className="feature-icon">
                        <Home size={20} />
                      </div>
                      <div>
                        <h5 className="feature-title">Property Agents</h5>
                        <p className="feature-description">
                          Property management access
                        </p>
                      </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span style={{ color: "#64748b" }}>
                        Active: <strong style={{ color: "#1e293b" }}>12</strong>
                      </span>
                      <button className="btn-secondary btn-sm">Manage</button>
                    </div>
                  </div>
                </div>

                <div className="col-lg-4 w-50">
                  <div className="feature-card">
                    <div className="feature-header">
                      <div className="feature-icon">
                        <Wrench size={20} />
                      </div>
                      <div>
                        <h5 className="feature-title">Service Partners</h5>
                        <p className="feature-description">
                          Service provider access
                        </p>
                      </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span style={{ color: "#64748b" }}>
                        Active: <strong style={{ color: "#1e293b" }}>8</strong>
                      </span>
                      <button className="btn-secondary btn-sm">Manage</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-4 mt-2">
                <div className="col-lg-6">
                  <div className="form-group">
                    <label className="form-label">Default User Role</label>
                    <select className="form-select">
                      <option>Property Agent</option>
                      <option>Service Partner</option>
                      <option>Viewer</option>
                    </select>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="form-group">
                    <label className="form-label">Registration Approval</label>
                    <select className="form-select">
                      <option>Manual Approval Required</option>
                      <option>Auto Approve</option>
                      <option>Email Verification Only</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="action-buttons">
                <button className="btn-save">
                  <Save size={18} />
                  Save User Settings
                </button>
                <button className="btn-secondary">Add New User</button>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="settings-card">
            <div className="card-header">
              <h4>
                <div className="header-icon">
                  <Bell size={24} />
                </div>
                Notification Settings
              </h4>
              <p>Configure notification preferences and delivery methods</p>
            </div>
            <div className="card-content">
              <div className="feature-card">
                <div className="feature-header">
                  <div className="feature-icon">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h5 className="feature-title">Email Notifications</h5>
                    <p className="feature-description">
                      Receive updates via email
                    </p>
                  </div>
                </div>
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="emailNotif"
                    defaultChecked
                  />
                  <label
                    className="form-check-label"
                    htmlFor="emailNotif"
                    style={{ color: "#1e293b" }}
                  >
                    <strong>Enable Email Notifications</strong>
                    <br />
                    <small style={{ color: "#64748b" }}>
                      Get notified about new properties, bookings, and system
                      updates
                    </small>
                  </label>
                </div>
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="emailDaily"
                  />
                  <label
                    className="form-check-label"
                    htmlFor="emailDaily"
                    style={{ color: "#1e293b" }}
                  >
                    <strong>Daily Summary</strong>
                    <br />
                    <small style={{ color: "#64748b" }}>
                      Receive daily activity summary
                    </small>
                  </label>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-header">
                  <div className="feature-icon">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h5 className="feature-title">SMS Notifications</h5>
                    <p className="feature-description">
                      Receive critical alerts via SMS
                    </p>
                  </div>
                </div>
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="smsNotif"
                  />
                  <label
                    className="form-check-label"
                    htmlFor="smsNotif"
                    style={{ color: "#1e293b" }}
                  >
                    <strong>Enable SMS Notifications</strong>
                    <br />
                    <small style={{ color: "#64748b" }}>
                      Critical alerts and urgent notifications
                    </small>
                  </label>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-header">
                  <div className="feature-icon">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h5 className="feature-title">Push Notifications</h5>
                    <p className="feature-description">
                      Browser and app notifications
                    </p>
                  </div>
                </div>
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="pushNotif"
                    defaultChecked
                  />
                  <label
                    className="form-check-label"
                    htmlFor="pushNotif"
                    style={{ color: "#1e293b" }}
                  >
                    <strong>Enable Push Notifications</strong>
                    <br />
                    <small style={{ color: "#64748b" }}>
                      Real-time notifications in browser
                    </small>
                  </label>
                </div>
              </div>

              <div className="action-buttons">
                <button className="btn-save">
                  <Save size={18} />
                  Update Notifications
                </button>
                <button className="btn-secondary">Test Notifications</button>
              </div>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="settings-card">
            <div className="card-header">
              <h4>
                <div className="header-icon">
                  <Palette size={24} />
                </div>
                Appearance & Theme
              </h4>
              <p>Customize the look and feel of your platform</p>
            </div>
            <div className="card-content">
              <div className="feature-card">
                <div className="feature-header">
                  <div className="feature-icon">
                    <Palette size={20} />
                  </div>
                  <div>
                    <h5 className="feature-title">Theme Selection</h5>
                    <p className="feature-description">
                      Choose your preferred color scheme
                    </p>
                  </div>
                </div>
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="theme"
                    id="light"
                  />
                  <label
                    className="form-check-label"
                    htmlFor="light"
                    style={{ color: "#1e293b" }}
                  >
                    <strong>Light Theme</strong> - Clean and bright interface
                  </label>
                </div>
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="theme"
                    id="dark"
                    defaultChecked
                  />
                  <label
                    className="form-check-label"
                    htmlFor="dark"
                    style={{ color: "#1e293b" }}
                  >
                    <strong>Dark Theme</strong> - Easy on the eyes for extended
                    use
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="theme"
                    id="auto"
                  />
                  <label
                    className="form-check-label"
                    htmlFor="auto"
                    style={{ color: "#1e293b" }}
                  >
                    <strong>Auto</strong> - Matches system preference
                  </label>
                </div>
              </div>
              <div className="action-buttons">
                <button className="btn-save">
                  <Save size={18} />
                  Apply Theme
                </button>
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="settings-card">
            <div className="card-header">
              <h4>
                <div className="header-icon">
                  <Shield size={24} />
                </div>
                Security Settings
              </h4>
              <p>Manage authentication and security preferences</p>
            </div>
            <div className="card-content">
              <div className="feature-card">
                <div className="feature-header">
                  <div className="feature-icon">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h5 className="feature-title">Two-Factor Authentication</h5>
                    <p className="feature-description">
                      Add an extra layer of security
                    </p>
                  </div>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="2fa"
                  />
                  <label
                    className="form-check-label"
                    htmlFor="2fa"
                    style={{ color: "#1e293b" }}
                  >
                    Enable Two-Factor Authentication
                  </label>
                </div>
              </div>

              <div className="row g-4">
                <div className="col-lg-6">
                  <div className="form-group">
                    <label className="form-label">Session Timeout</label>
                    <div className="input-group">
                      <input
                        className="form-control"
                        placeholder="30"
                        defaultValue="30"
                      />
                      <span className="input-group-text">minutes</span>
                    </div>
                    <small className="form-text">
                      Automatically log out inactive users
                    </small>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="form-group">
                    <label className="form-label">Password Policy</label>
                    <select className="form-select">
                      <option>Strong (12+ chars, mixed case, symbols)</option>
                      <option>Medium (8+ chars, mixed case)</option>
                      <option>Basic (6+ chars)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="action-buttons">
                <button className="btn-save">
                  <Save size={18} />
                  Update Security
                </button>
              </div>
            </div>
          </div>
        );

      case "integrations":
        return (
          <div className="settings-card">
            <div className="card-header">
              <h4>
                <div className="header-icon">
                  <Plug size={24} />
                </div>
                Integrations
              </h4>
              <p>Connect external APIs and services</p>
            </div>
            <div className="card-content">
              <div className="row g-4">
                <div className="col-lg-6">
                  <div className="form-group">
                    <label className="form-label">Google Maps API Key</label>
                    <input
                      className="form-control"
                      placeholder="Enter your Google Maps API key"
                    />
                    <small className="form-text">
                      Required for location services and mapping
                    </small>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="form-group">
                    <label className="form-label">Razorpay API Key</label>
                    <input
                      className="form-control"
                      placeholder="Enter your Razorpay key"
                    />
                    <small className="form-text">For payment processing</small>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="form-group">
                    <label className="form-label">Email Service Provider</label>
                    <select className="form-select">
                      <option>SendGrid</option>
                      <option>Mailgun</option>
                      <option>Amazon SES</option>
                      <option>SMTP</option>
                    </select>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="form-group">
                    <label className="form-label">SMS Gateway</label>
                    <select className="form-select">
                      <option>Twilio</option>
                      <option>AWS SNS</option>
                      <option>TextLocal</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="action-buttons">
                <button className="btn-save">
                  <Save size={18} />
                  Save Integrations
                </button>
              </div>
            </div>
          </div>
        );

      case "backup":
        return (
          <div className="settings-card">
            <div className="card-header">
              <h4>
                <div className="header-icon">
                  <Server size={24} />
                </div>
                Backup & Recovery
              </h4>
              <p>
                Manage data backups and recovery options to secure your platform
              </p>
            </div>
            <div className="card-content">
              <div className="row g-4">
                <div className="col-lg-6">
                  <div className="feature-card">
                    <div className="feature-header">
                      <div className="feature-icon">
                        <Save size={20} />
                      </div>
                      <div>
                        <h5 className="feature-title">Manual Backup</h5>
                        <p className="feature-description">
                          Download complete platform backup
                        </p>
                      </div>
                    </div>
                    <div className="backup-info mb-3">
                      <small style={{ color: "#64748b" }}>
                        Last backup:{" "}
                        <strong style={{ color: "#1e293b" }}>2 days ago</strong>
                      </small>
                      <br />
                      <small style={{ color: "#64748b" }}>
                        Size:{" "}
                        <strong style={{ color: "#1e293b" }}>2.4 GB</strong>
                      </small>
                    </div>
                    <button className="btn-secondary w-100">
                      <Server size={16} />
                      Download Backup
                    </button>
                  </div>
                </div>

                <div className="col-lg-6">
                  <div className="feature-card">
                    <div className="feature-header">
                      <div className="feature-icon">
                        <Settings size={20} />
                      </div>
                      <div>
                        <h5 className="feature-title">Auto Backup</h5>
                        <p className="feature-description">
                          Schedule automatic backups
                        </p>
                      </div>
                    </div>
                    <div className="backup-info mb-3">
                      <small style={{ color: "#64748b" }}>
                        Status: <strong className="text-success">Active</strong>
                      </small>
                      <br />
                      <small style={{ color: "#64748b" }}>
                        Next backup:{" "}
                        <strong style={{ color: "#1e293b" }}>
                          Tonight at 2:00 AM
                        </strong>
                      </small>
                    </div>
                    <button className="btn-save w-100">
                      <Settings size={16} />
                      Configure Schedule
                    </button>
                  </div>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-header">
                  <div className="feature-icon">
                    <Settings size={20} />
                  </div>
                  <div>
                    <h5 className="feature-title">Backup Settings</h5>
                    <p className="feature-description">
                      Configure backup preferences
                    </p>
                  </div>
                </div>
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="form-label">Backup Frequency</label>
                      <select className="form-select">
                        <option>Daily</option>
                        <option>Weekly</option>
                        <option>Monthly</option>
                        <option>Custom</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="form-label">Retention Period</label>
                      <select className="form-select">
                        <option>30 days</option>
                        <option>90 days</option>
                        <option>1 year</option>
                        <option>Forever</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="form-label">Storage Location</label>
                      <select className="form-select">
                        <option>Local Server</option>
                        <option>AWS S3</option>
                        <option>Google Drive</option>
                        <option>Dropbox</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row g-3 mt-2">
                  <div className="col-md-6">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="encryptBackup"
                        defaultChecked
                      />
                      <label
                        className="form-check-label"
                        htmlFor="encryptBackup"
                        style={{ color: "#1e293b" }}
                      >
                        <strong>Encrypt Backups</strong>
                        <br />
                        <small style={{ color: "#64748b" }}>
                          Add encryption for security
                        </small>
                      </label>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="emailBackup"
                      />
                      <label
                        className="form-check-label"
                        htmlFor="emailBackup"
                        style={{ color: "#1e293b" }}
                      >
                        <strong>Email Notifications</strong>
                        <br />
                        <small style={{ color: "#64748b" }}>
                          Get notified when backup completes
                        </small>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="action-buttons">
                <button className="btn-save">
                  <Save size={18} />
                  Save Backup Settings
                </button>
                <button className="btn-secondary">Create Backup Now</button>
              </div>
            </div>
          </div>
        );

      case "legal":
        return (
          <div className="settings-card">
            <div className="card-header">
              <h4>
                <div className="header-icon">
                  <FileText size={24} />
                </div>
                Legal & Policy
              </h4>
              <p>Manage legal documents and privacy policies</p>
            </div>
            <div className="card-content">
              <div className="feature-card">
                <div className="feature-header">
                  <div className="feature-icon">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h5 className="feature-title">Privacy Policy</h5>
                    <p className="feature-description">
                      Customize your privacy policy content
                    </p>
                  </div>
                </div>
                <textarea
                  className="form-control"
                  rows="6"
                  placeholder="Enter your privacy policy content..."
                  defaultValue="Your privacy is important to us. This policy explains how we collect, use, and protect your information when you use our property management platform..."
                />
              </div>

              <div className="feature-card">
                <div className="feature-header">
                  <div className="feature-icon">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h5 className="feature-title">Terms of Service</h5>
                    <p className="feature-description">
                      Define the terms and conditions
                    </p>
                  </div>
                </div>
                <textarea
                  className="form-control"
                  rows="6"
                  placeholder="Enter your terms of service..."
                  defaultValue="By using our platform, you agree to these terms and conditions. These terms govern your use of our property management services..."
                />
              </div>

              <div className="row g-4">
                <div className="col-lg-6">
                  <div className="form-group">
                    <label className="form-label">GDPR Compliance</label>
                    <select className="form-select">
                      <option>Enabled</option>
                      <option>Disabled</option>
                    </select>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="form-group">
                    <label className="form-label">Cookie Policy</label>
                    <select className="form-select">
                      <option>Required + Analytics</option>
                      <option>Required Only</option>
                      <option>All Cookies</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="action-buttons">
                <button className="btn-save">
                  <Save size={18} />
                  Save Legal Documents
                </button>
                <button className="btn-secondary">Preview Policy</button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="settings-page-wrapper ">
      <div className="settings-container">
        <div className="settings-header">
          <h1>
            <Settings size={32} />
            Platform Settings
          </h1>
          <p>Manage and configure your property management platform</p>
        </div>

        <div className="row g-0">
          <div className="col-xl-3 col-lg-4">
            <div className="settings-sidebar">
              <div className="sidebar-header p-0 m-0 d-flex flex-column align-items-center justify-content-center">
                <h3>Settings Menu</h3>
              </div>
              <hr className="border border-2 border-secondary" />

              <ul className="settings-menu">
                {menuItems.map((item) => (
                  <li
                    key={item.id}
                    className={`menu-item ${
                      activeTab === item.id ? "active" : ""
                    }`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <div className="menu-icon">{item.icon}</div>
                    <span className="menu-label">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="col-xl-9 col-lg-8">
            <div className="settings-main-content">{renderContent()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingPage;
