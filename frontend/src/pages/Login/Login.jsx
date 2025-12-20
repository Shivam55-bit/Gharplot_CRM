import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Login.css";
import { Link } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";
import axios from "axios";
import { API_BASE_URL } from "../../config/apiConfig.jsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const navigate = useNavigate();
  const { adminLogin } = useAdmin();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  //  Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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

  //  Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    setApiError("");
    setSuccessMessage("");

    if (Object.keys(validationErrors).length === 0) {
      setIsLoading(true);

      try {
        // Step 1 Login API
        const result = await adminLogin(formData);

        if (result.success) {
          console.log("Login successful:", result.data);
          
          // Check if 2FA is enabled using localStorage
          const is2FAEnabled = localStorage.getItem("is2FAEnabled") === "true";
          
          if (is2FAEnabled) {
            // 2FA is enabled - follow the existing OTP flow
            // Show success toast notification
            toast.success(" Login successful! Sending OTP to your email...", {
              position: "top-right",
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
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
                
                // Show OTP sent toast notification
                toast.success(" OTP sent to your email. Redirecting...", {
                  position: "top-right",
                  autoClose: 2000,
                });
                
                // Navigate to OTP verification page
                setTimeout(() => {
                  console.log("navigate to OTP");
                  navigate("/otp-verification");
                }, 1500);
              }
            } catch (otpError) {
              console.error("Error sending OTP:", otpError);
              toast.error(" Login successful but failed to send OTP. Please try again.", {
                position: "top-right",
                autoClose: 4000,
              });
              setIsLoading(false);
            }
          } else {
            // 2FA is disabled - redirect directly to dashboard
            toast.success(" Login successful! Redirecting to dashboard...", {
              position: "top-right",
              autoClose: 2000,
            });
            
            // Set authentication flag
            localStorage.setItem("isAuthenticated", "true");
            
            // Navigate to dashboard after short delay
            setTimeout(() => {
              navigate("/dashboard");
            }, 1500);
          }
        } else {
          // Handle login failure with specific error message
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
            Login to continue accessing your PropertyHub Pro account.
          </p>

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

            {/* Error and Success Messages */}
            {apiError && (
              <div className="alert alert-danger mb-3">{apiError}</div>
            )}
            {successMessage && (
              <div className="alert alert-success mb-3">{successMessage}</div>
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
                  Authenticating...
                </>
              ) : (
                "LOGIN"
              )}
            </button>

            {/* Forgot Password Link */}
            <div className="text-center mb-3">
              <Link to="/forgot-password" className="text-decoration-none text-muted small">
                Forgot Password?
              </Link>
            </div>

            {/* Divider */}
            <div className="d-flex align-items-center my-3">
              <hr className="flex-grow-1" />
              <span className="mx-2 text-muted small">or continue with</span>
              <hr className="flex-grow-1" />
            </div>

            {/* Social Login Buttons */}
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

            {/* Sign Up Link */}
            <div className="text-center">
              Don't have an account?{" "}
              <Link to="/signup" className="text-decoration-none fw-semibold text-danger">
                Sign Up
              </Link>
            </div>
          </form>
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
    </>
  );
};

export default Login;