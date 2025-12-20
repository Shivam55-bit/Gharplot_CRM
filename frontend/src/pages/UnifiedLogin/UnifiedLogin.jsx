import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../Login/Login.css";
import { Link } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";
import { usePermissions } from "../../context/PermissionContext";
import axios from "axios";
import { API_BASE_URL } from "../../config/apiConfig.jsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const UnifiedLogin = () => {
  const navigate = useNavigate();
  const { adminLogin } = useAdmin();
  const { login: employeeLogin } = usePermissions();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    loginType: "admin" // admin or employee
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  //  Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  //  Handle Login Type Change
  const handleLoginTypeChange = (type) => {
    setFormData({ ...formData, loginType: type });
    setApiError("");
    setErrors({});
  };

  //  Basic Validation
  const validate = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    return newErrors;
  };

  //  Handle Admin Login
  const handleAdminLogin = async () => {
    try {
      const result = await adminLogin({
        email: formData.email,
        password: formData.password
      });

      if (result.success) {
        console.log("Admin login successful:", result.data);
        
        // Check if 2FA is enabled using localStorage
        const is2FAEnabled = localStorage.getItem("is2FAEnabled") === "true";
        
        if (is2FAEnabled) {
          // 2FA is enabled - follow the existing OTP flow
          toast.success("Admin login successful! Sending OTP to your email...", {
            position: "top-right",
            autoClose: 3000,
          });

          // Save email for OTP verification
          localStorage.setItem("verificationEmail", formData.email);
          
          // Step 2: Send OTP to email after successful login
          try {
            const otpResponse = await axios.post(
              "http://abc.ridealmobility.com/admin/send-otp",
              { email: formData.email }
            );
            
            if (otpResponse.data) {
              console.log("OTP sent successfully:", otpResponse.data);
              
              toast.success("OTP sent to your email. Redirecting...", {
                position: "top-right",
                autoClose: 2000,
              });
              
              setTimeout(() => {
                navigate("/otp-verification");
              }, 1500);
            }
          } catch (otpError) {
            console.error("Error sending OTP:", otpError);
            toast.error("Login successful but failed to send OTP. Please try again.", {
              position: "top-right",
              autoClose: 4000,
            });
          }
        } else {
          // 2FA is disabled - redirect directly to dashboard
          toast.success("Admin login successful! Redirecting to dashboard...", {
            position: "top-right",
            autoClose: 2000,
          });
          
          localStorage.setItem("isAuthenticated", "true");
          
          setTimeout(() => {
            navigate("/dashboard");
          }, 1500);
        }
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error("Admin login error:", error);
      return { 
        success: false, 
        message: error.message || "Admin login failed. Please check your credentials." 
      };
    }
  };

  //  Handle Employee Login
  const handleEmployeeLogin = async () => {
    try {
      const result = await employeeLogin(formData.email, formData.password);
      
      if (result.success) {
        toast.success("Employee login successful! Redirecting to dashboard...", {
          position: "top-right",
          autoClose: 2000,
        });
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
        
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error("Employee login error:", error);
      return { 
        success: false, 
        message: error.message || "Employee login failed. Please check your credentials." 
      };
    }
  };

  //  Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    setApiError("");

    if (Object.keys(validationErrors).length === 0) {
      setIsLoading(true);

      try {
        let result;
        
        if (formData.loginType === "admin") {
          result = await handleAdminLogin();
        } else {
          result = await handleEmployeeLogin();
        }

        if (!result.success) {
          const errorMessage = result.message || "Login failed. Please check your credentials and try again.";
          setApiError(errorMessage);
          toast.error(errorMessage, {
            position: "top-right",
            autoClose: 3000,
          });
        }
      } catch (error) {
        console.error("Login error:", error);
        const errorMessage = error.message || "Network error. Please check your connection and try again.";
        setApiError(errorMessage);
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 4000,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      {/* Toast Container */}
      <ToastContainer />
      
      <div className="loginpage-container d-flex flex-column flex-lg-row">
        {/* Left Form Section */}
        <div className="loginpage-form-section d-flex flex-column justify-content-center align-items-center p-4 p-lg-5">
          <div className="w-100" style={{ maxWidth: "400px" }}>
            <h6 className="loginpage-step-text mb-3">
              <span className="loginpage-step-number">01</span> Login Details
            </h6>

            <h3 className="fw-bold mb-2">Welcome Back!</h3>
            <p className="text-muted small mb-4">
              Login to continue accessing your {formData.loginType === "admin" ? "Admin" : "Employee"} dashboard.
            </p>

            {/* Login Type Selector */}
            <div className="mb-4">
              <div className="btn-group w-100" role="group">
                <input
                  type="radio"
                  className="btn-check"
                  name="loginType"
                  id="admin-type"
                  checked={formData.loginType === "admin"}
                  onChange={() => handleLoginTypeChange("admin")}
                />
                <label 
                  className={`btn btn-outline-primary ${formData.loginType === "admin" ? "active" : ""}`} 
                  htmlFor="admin-type"
                >
                  <i className="bi bi-shield-check me-2"></i>
                  Admin Login
                </label>

                <input
                  type="radio"
                  className="btn-check"
                  name="loginType"
                  id="employee-type"
                  checked={formData.loginType === "employee"}
                  onChange={() => handleLoginTypeChange("employee")}
                />
                <label 
                  className={`btn btn-outline-primary ${formData.loginType === "employee" ? "active" : ""}`} 
                  htmlFor="employee-type"
                >
                  <i className="bi bi-person-badge me-2"></i>
                  Employee Login
                </label>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div className="mb-3 position-relative">
                <i className="bi bi-envelope loginpage-input-icon"></i>
                <input
                  type="email"
                  name="email"
                  className={`form-control loginpage-input ps-5 ${
                    errors.email ? "is-invalid" : ""
                  }`}
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <div className="invalid-feedback">{errors.email}</div>
                )}
              </div>

              {/* Password */}
              <div className="mb-3 position-relative">
                <i className="bi bi-lock loginpage-input-icon"></i>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className={`form-control loginpage-input ps-5 ${
                    errors.password ? "is-invalid" : ""
                  }`}
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <span 
                  className="position-absolute end-0 top-50 translate-middle-y pe-3 cursor-pointer"
                  style={{ cursor: "pointer", zIndex: 2 }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                </span>
                {errors.password && (
                  <div className="invalid-feedback">{errors.password}</div>
                )}
              </div>

              {/* Error Messages */}
              {apiError && (
                <div className="alert alert-danger mb-3">{apiError}</div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary w-100 rounded-pill py-2 mb-3"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {formData.loginType === "admin" ? "Authenticating Admin..." : "Authenticating Employee..."}
                  </>
                ) : (
                  `LOGIN AS ${formData.loginType.toUpperCase()}`
                )}
              </button>

              {/* Forgot Password Link - Only show for admin */}
              {formData.loginType === "admin" && (
                <div className="text-center mb-3">
                  <Link to="/forgot-password" className="text-decoration-none text-muted small">
                    Forgot Password?
                  </Link>
                </div>
              )}

              {/* Divider - Only show for admin */}
              {formData.loginType === "admin" && (
                <>
                  <div className="d-flex align-items-center my-3">
                    <hr className="flex-grow-1" />
                    <span className="mx-2 text-muted small">or continue with</span>
                    <hr className="flex-grow-1" />
                  </div>

                  {/* Social Login Buttons - Only for admin */}
                  <div className="d-flex justify-content-center gap-3 mb-4">
                    <button
                      type="button"
                      className="btn rounded-circle d-flex align-items-center justify-content-center"
                      style={{ backgroundColor: "#db4437", color: "#fff", width: "45px", height: "45px" }}
                    >
                      <i className="bi bi-google fs-5"></i>
                    </button>
                    <button
                      type="button"
                      className="btn rounded-circle d-flex align-items-center justify-content-center"
                      style={{ backgroundColor: "#4267B2", color: "#fff", width: "45px", height: "45px" }}
                    >
                      <i className="bi bi-facebook fs-5"></i>
                    </button>
                  </div>

                  {/* Sign Up Link - Only for admin */}
                  <div className="text-center">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-decoration-none fw-semibold text-danger">
                      Sign Up
                    </Link>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>

        {/* Right Info Section */}
        <div className="loginpage-info-section d-none d-lg-flex flex-column justify-content-center align-items-center text-white text-center p-5 position-relative">
          <div className="info-overlay position-absolute top-0 start-0 w-100 h-100 bg-dark opacity-50"></div>
          <div className="z-2 position-relative">
            <div className="info-logo bg-white rounded-4 p-4 mb-4 shadow">
              <i className={`bi ${formData.loginType === "admin" ? "bi-shield-check" : "bi-person-badge"} text-primary fs-1`}></i>
            </div>
            <blockquote className="blockquote text-light">
              {formData.loginType === "admin" 
                ? "Transform property management with our comprehensive admin panel. Streamline operations, manage listings, and grow your real estate business with powerful tools designed for success."
                : "Access your employee dashboard to manage your assigned tasks, view client information, and collaborate with your team efficiently."
              }
            </blockquote>
            <footer className="blockquote-footer text-light mt-3">
              <span className="fw-bold">PropertyHub Pro</span>
              <br />
              <small>
                {formData.loginType === "admin" 
                  ? "Your Complete Property Management Solution" 
                  : "Empowering Your Team's Productivity"
                }
              </small>
            </footer>
          </div>
        </div>
      </div>
    </>
  );
};

export default UnifiedLogin;