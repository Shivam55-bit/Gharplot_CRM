import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Login.css";
import "./ForgotPassword.css";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../../config/apiConfig.jsx";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState(() => {
    // Try to get email from localStorage if available
    const savedEmail = localStorage.getItem('forgotPasswordEmail');
    return savedEmail || "";
  });
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP, 3: Reset password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Save email to localStorage whenever it changes
  useEffect(() => {
    if (email) {
      localStorage.setItem('forgotPasswordEmail', email);
    }
  }, [email]);

  // Clean up localStorage when component unmounts
  useEffect(() => {
    return () => {
      localStorage.removeItem('forgotPasswordEmail');
    };
  }, []);

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    console.log("Sending OTP for email:", email);

    setLoading(true);
    try {
      console.log("Sending OTP request to:", `${API_BASE_URL}/admin/forgot-password`);
      console.log("Request body:", { email });
      
      const response = await fetch(`${API_BASE_URL}/admin/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      console.log("OTP response status:", response.status);
      console.log("OTP response headers:", response.headers);
      
      const text = await response.text();
      console.log("OTP response text:", text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        console.error("Response text that failed to parse:", text);
        setError("Invalid response from server. Please try again.");
        return;
      }
      
      console.log("OTP response data:", data);
      console.log("OTP response success:", data.success);

      if (response.ok && data.success) {
        setSuccess(data.message || "OTP sent successfully!");
        setStep(2); // Move to OTP verification step
      } else {
        const errorMessage = data.message || `Failed to send OTP. Server responded with status ${response.status}`;
        console.error("OTP send failed:", errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.error("Error sending OTP:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp) {
      setError("OTP is required");
      return;
    }

    // Ensure OTP is exactly 6 digits as a string (no padding, no conversion)
    const otpString = otp.toString();
    
    if (otpString.length !== 6 || !/^\d{6}$/.test(otpString)) {
      setError("OTP must be exactly 6 digits");
      return;
    }

    // Debug: Log all values before sending
    console.log("=== OTP Verification Debug Info ===");
    console.log("Email from state:", email);
    console.log("OTP from state:", otp);
    console.log("OTP as string:", otpString);
    console.log("Email from localStorage:", localStorage.getItem('forgotPasswordEmail'));
    console.log("Request body will be:", JSON.stringify({ email, otp: otpString }));
    console.log("================================");

    setLoading(true);
    try {
      console.log("Verifying OTP request to:", `${API_BASE_URL}/admin/verify-otp`);
      
      const requestBody = { email, otp: otpString };
      console.log("Request body:", requestBody);
      
      const response = await fetch(`${API_BASE_URL}/admin/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Verify OTP response status:", response.status);
      console.log("Verify OTP response headers:", response.headers);
      
      const text = await response.text();
      console.log("Verify OTP response text:", text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        console.error("Response text that failed to parse:", text);
        setError("Invalid response from server. Please try again.");
        return;
      }
      
      console.log("Verify OTP response data:", data);
      console.log("Verify OTP response success:", data.success);

      if (response.ok && data.success) {
        setSuccess(data.message || "OTP verified successfully!");
        setStep(3); // Move to password reset step
      } else {
        const errorMessage = data.message || `Failed to verify OTP. Server responded with status ${response.status}`;
        console.error("OTP verification failed:", errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.error("Error verifying OTP:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newPassword) {
      setError("New password is required");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Debug: Log all values before sending
    console.log("=== Password Reset Debug Info ===");
    console.log("Email from state:", email);
    console.log("Email from localStorage:", localStorage.getItem('forgotPasswordEmail'));
    console.log("================================");

    setLoading(true);
    try {
      console.log("Reset password request to:", `${API_BASE_URL}/admin/reset-password`);
      console.log("Request body:", { email, newPassword });
      
      const response = await fetch(`${API_BASE_URL}/admin/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, newPassword }),
      });

      console.log("Reset password response status:", response.status);
      console.log("Reset password response headers:", response.headers);
      
      const text = await response.text();
      console.log("Reset password response text:", text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        console.error("Response text that failed to parse:", text);
        setError("Invalid response from server. Please try again.");
        return;
      }
      
      console.log("Reset password response data:", data);
      console.log("Reset password response success:", data.success);

      if (response.ok && data.success) {
        setSuccess(data.message || "Password reset successfully!");
        // Redirect to login page after successful password reset
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        const errorMessage = data.message || `Failed to reset password. Server responded with status ${response.status}`;
        console.error("Password reset failed:", errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.error("Error resetting password:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginpage-container d-flex flex-column flex-lg-row">
      {/* Left Form Section */}
      <div className="loginpage-form-section d-flex flex-column justify-content-center align-items-center p-4 p-lg-5">
        <div className="w-100" style={{ maxWidth: "400px" }}>
          <h6 className="loginpage-step-text mb-3">
            <span className="loginpage-step-number">01</span> Password Recovery
          </h6>

          <h3 className="fw-bold mb-2">Forgot Password?</h3>
          {step === 1 && (
            <p className="text-muted small mb-4">
              Enter your email address and we'll send you a verification code.
            </p>
          )}
          {step === 2 && (
            <p className="text-muted small mb-4">
              Enter the 6-digit verification code sent to your email.
            </p>
          )}
          {step === 3 && (
            <p className="text-muted small mb-4">
              Create a new password for your account.
            </p>
          )}

          {error && <div className="alert alert-danger mb-3">{error}</div>}
          {success && <div className="alert alert-success mb-3">{success}</div>}

          {/* Step 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleSendOtp}>
              <div className="mb-3">
                <input
                  type="email"
                  className="form-control loginpage-input"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 rounded-pill py-2 mb-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Sending OTP...
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </button>
            </form>
          )}

          {/* Step 2: Enter OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control loginpage-input"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    console.log("OTP input value:", value);
                    setOtp(value);
                  }}
                  maxLength="6"
                  required
                />
                <div className="form-text text-muted small">
                  Enter the 6-digit code sent to {email}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 rounded-pill py-2 mb-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  className="btn btn-link text-decoration-none p-0"
                  onClick={handleSendOtp}
                  disabled={loading}
                >
                  Resend Code
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <div className="mb-3 position-relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="form-control loginpage-input"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <span 
                  className="position-absolute end-0 top-50 translate-middle-y pe-3 cursor-pointer"
                  style={{ cursor: "pointer", zIndex: 2 }}
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  <i className={showNewPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                </span>
              </div>

              <div className="mb-3 position-relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control loginpage-input"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <span 
                  className="position-absolute end-0 top-50 translate-middle-y pe-3 cursor-pointer"
                  style={{ cursor: "pointer", zIndex: 2 }}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <i className={showConfirmPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 rounded-pill py-2 mb-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          )}

          {/* Navigation Links */}
          <div className="text-center mt-3">
            <Link to="/login" className="text-decoration-none text-muted small">
              <i className="bi bi-arrow-left me-1"></i> Back to Login
            </Link>
          </div>
        </div>
      </div>

      {/* Right Info Section */}
      <div className="loginpage-info-section d-none d-lg-flex flex-column justify-content-center align-items-center text-white text-center p-5 position-relative">
        <div className="info-overlay position-absolute top-0 start-0 w-100 h-100 bg-dark opacity-50"></div>
        <div className="z-2 position-relative">
          <div className="info-logo bg-white rounded-4 p-4 mb-4 shadow">
            <i className="bi bi-house-door text-primary fs-1"></i>
          </div>
          <blockquote className="blockquote text-light">
            "Transform property management with our comprehensive admin panel. 
            Streamline operations, manage listings, and grow your real estate 
            business with powerful tools designed for success."
          </blockquote>
          <footer className="blockquote-footer text-light mt-3">
            <span className="fw-bold">PropertyHub Pro</span>
            <br />
            <small>Your Complete Property Management Solution</small>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;