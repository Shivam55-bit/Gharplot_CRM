import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./SecurityPage.css";
import { Eye, EyeOff, Key, Smartphone, Shield } from "lucide-react";
import { API_BASE_URL } from "../../config/apiConfig.jsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SecurityPage = () => {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [twoFAEnabled, setTwoFAEnabled] = useState(false);
    const [passwordChanged, setPasswordChanged] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isToggling2FA, setIsToggling2FA] = useState(false);
    const [apiError, setApiError] = useState("");
    const [apiSuccess, setApiSuccess] = useState("");

    // Check 2FA status on component mount
    useEffect(() => {
        const stored2FAStatus = localStorage.getItem("is2FAEnabled");
        if (stored2FAStatus === "true") {
            setTwoFAEnabled(true);
        }
    }, []);

    const handlePasswordChange = async () => {
        // Client-side validation
        if (!oldPassword || !newPassword || !confirmPassword) {
            setApiError("All fields are required!");
            return;
        }
        if (newPassword !== confirmPassword) {
            setApiError("New passwords do not match!");
            return;
        }
        if (newPassword.length < 6) {
            setApiError("New password must be at least 6 characters!");
            return;
        }

        setIsLoading(true);
        setApiError("");
        setApiSuccess("");

        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                setApiError("Authentication token not found. Please login again.");
                return;
            }

            const response = await fetch(`${API_BASE_URL}/admin/admin-change-password`, {
                method: 'PUT', //  Must match backend
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword: oldPassword,
                    newPassword: newPassword,
                    confirmNewPassword: confirmPassword,
                }),
            });

            const resultText = await response.text();
            let result;
            try {
                result = JSON.parse(resultText);
            } catch {
                result = { message: resultText };
            }

            if (!response.ok) {
                throw new Error(result.message || `HTTP ${response.status}`);
            }

            // Success
            setApiSuccess(result.message || "Password updated successfully!");
            setPasswordChanged(true);
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");

            setTimeout(() => {
                setPasswordChanged(false);
                setApiSuccess("");
            }, 3000);

        } catch (error) {
            console.error("Change password error:", error);
            setApiError(error.message || "Unknown error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle2FA = () => {
        setIsToggling2FA(true);
        
        // Toggle 2FA status
        const newStatus = !twoFAEnabled;
        
        // Save to localStorage
        localStorage.setItem("is2FAEnabled", newStatus.toString());
        
        // Update state
        setTwoFAEnabled(newStatus);
        
        // Show success message
        toast.success(`2FA ${newStatus ? 'enabled' : 'disabled'} successfully!`, {
            position: "top-right",
            autoClose: 3000,
        });
        
        setIsToggling2FA(false);
    };

    const togglePasswordVisibility = (field) => {
        if (field === "old") setShowOldPassword(!showOldPassword);
        if (field === "new") setShowNewPassword(!showNewPassword);
        if (field === "confirm") setShowConfirmPassword(!showConfirmPassword);
    };

    return (
        <div className="security-page-container mt-5">
            <ToastContainer />
            {passwordChanged && <div className="success-toast">✓ Password updated successfully!</div>}

            <div className="header-section text-center px-3">
                <div className="d-flex align-items-center justify-content-center gap-3 mb-2">
                    <Shield size={40} />
                    <h1 className="header-title mt-1">Security Settings</h1>
                </div>
                <p className="header-subtitle me-3 text-secondary">Manage your account security and privacy preferences</p>
            </div>

            <div className="container-wrapper">
                <div className="row-custom">
                    {/* Password Management */}
                    <div className="security-card">
                        <div className="card-header-custom card-header-blue-gradient">
                            <h2 className="card-title text-light"><Key size={20} /> Change Password</h2>
                        </div>
                        <div className="card-body-custom">
                            {["old", "new", "confirm"].map((field, idx) => {
                                const isOld = field === "old";
                                const isNew = field === "new";
                                const value = isOld ? oldPassword : isNew ? newPassword : confirmPassword;
                                const show = isOld ? showOldPassword : isNew ? showNewPassword : showConfirmPassword;
                                const placeholder = isOld ? "Enter current password" : isNew ? "Enter new password" : "Confirm new password";
                                const setter = isOld ? setOldPassword : isNew ? setNewPassword : setConfirmPassword;

                                return (
                                    <div className="form-group mb-3" key={idx}>
                                        <label className="form-label">{isOld ? "Current Password" : isNew ? "New Password" : "Confirm New Password"}</label>
                                        <div className="password-input-wrapper">
                                            <input type={show ? "text" : "password"} className="form-control" placeholder={placeholder} value={value} onChange={(e) => setter(e.target.value)} />
                                            <button type="button" className="toggle-password" onClick={() => togglePasswordVisibility(field)}>
                                                {show ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {apiError && <div className="alert alert-danger mb-3">{apiError}</div>}
                            {apiSuccess && <div className="alert alert-success mb-3">{apiSuccess}</div>}

                            <button type="button" className="btn-primary-custom" onClick={handlePasswordChange} disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Updating Password...
                                    </>
                                ) : "Update Password"}
                            </button>
                        </div>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div className="security-card">
                        <div className="card-header-custom card-header-green-gradient">
                            <h2 className="card-title text-light"><Smartphone size={20} /> Two-Factor Auth</h2>
                        </div>
                        <div className="card-body-custom">
                            <div className={`status-badge ${twoFAEnabled ? "enabled" : ""}`}>
                                <span className="status-icon">{twoFAEnabled ? "✓" : "✗"}</span>
                                <div>
                                    <div className="status-text">{twoFAEnabled ? "Enabled" : "Disabled"}</div>
                                    <div className="status-desc">{twoFAEnabled ? "Your account is protected" : "Enable for extra security"}</div>
                                </div>
                            </div>
                            <p className="twofa-description">{twoFAEnabled ? "Two-factor authentication adds an extra layer of security." : "Enable two-factor authentication to secure your account."}</p>
                            <button 
                                type="button" 
                                className={`btn-custom ${twoFAEnabled ? "btn-danger-custom" : "btn-success-custom"}`} 
                                onClick={handleToggle2FA}
                                disabled={isToggling2FA}
                            >
                                {isToggling2FA ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        {twoFAEnabled ? "Disabling..." : "Enabling..."}
                                    </>
                                ) : (
                                    twoFAEnabled ? "Disable 2FA" : "Enable 2FA"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecurityPage;