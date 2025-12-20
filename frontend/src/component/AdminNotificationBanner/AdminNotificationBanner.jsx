import React from 'react';
import './AdminNotificationBanner.css';
import { FaHome } from 'react-icons/fa';

const AdminNotificationBanner = ({ tenantCount = 74 }) => {
  return (
    <div className="container admin-banner-container my-3">
      <div className="admin-banner-content">
        
        {/* Left Section: Icon + Text */}
        <div className="banner-left">
          <div className="banner-icon-wrapper">
            <FaHome className="banner-icon" />
          </div>

          <div className="banner-text-content">
            <div className="main-message">
              <strong className="tenant-count">{tenantCount} Tenant</strong> has been submitted recently, please check it out!
            </div>
            <div className="sub-message">
              There are some issues found — review them and approve.
            </div>
          </div>
        </div>

        {/* Right Section: Button */}
        <button className="review-button" type="button">
          Review Listings
        </button>
      </div>
    </div>
  );
};

export default AdminNotificationBanner;
