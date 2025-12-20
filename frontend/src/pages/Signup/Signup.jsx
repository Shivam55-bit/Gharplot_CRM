import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import "./Signup.css";
import { Link } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";

const Signup = () => {
  const navigate = useNavigate();
  const { adminSignup } = useAdmin();
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full Name is required";
    if (!formData.email.match(/^\S+@\S+\.\S+$/)) newErrors.email = "Valid email required";
    if (!formData.phone.match(/^\d{10}$/)) newErrors.phone = "Enter 10 digit phone number";
    if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (!formData.terms) newErrors.terms = "You must accept terms & conditions";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setApiError("");
    setApiSuccess("");
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
    } else {
      setErrors({});
      setIsLoading(true);
      
      try {
        const result = await adminSignup(formData);
        
        if (result.success) {
          console.log("Signup successful:", result.data);
          setApiSuccess("Account created successfully! Please login to continue.");
          
          // Redirect to login page after successful signup
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          setApiError(result.message || "Signup failed. Please try again.");
        }
      } catch (error) {
        console.error("Signup error:", error);
        setApiError("Network error. Please check your connection and try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="signup-container d-flex flex-column flex-lg-row">
      {/* ===== Left Section ===== */}
      <div className="signup-form-section d-flex flex-column justify-content-center align-items-center p-4 p-lg-5">
        <div className="w-100" style={{ maxWidth: "400px" }}>
          <h6 className="step-text mb-3">
            <span className="step-number">01</span> Personal Details
          </h6>

          <h3 className="fw-bold mb-2">Join PropertyHub Pro</h3>
          <p className="text-muted small mb-4">
            Start managing properties like a pro. Free forever, no credit card needed.
          </p>

          {/* ===== Form ===== */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <input
                type="text"
                className={`form-control ${errors.fullName ? "is-invalid" : ""}`}
                placeholder="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
              {errors.fullName && <div className="invalid-feedback">{errors.fullName}</div>}
            </div>

            <div className="mb-3">
              <input
                type="email"
                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                placeholder="Email Address"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>

            <div className="mb-3">
              <input
                type="tel"
                className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                placeholder="Mobile Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
              {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
            </div>

            <div className="mb-3 position-relative">
              <input
                type={showPassword ? "text" : "password"}
                className={`form-control ${errors.password ? "is-invalid" : ""}`}
                placeholder="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <span 
                className="position-absolute end-0 top-50 translate-middle-y pe-3 cursor-pointer"
                style={{ cursor: "pointer", zIndex: 2 }}
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
              </span>
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>

            <div className="mb-3 position-relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
                placeholder="Confirm Password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <span 
                className="position-absolute end-0 top-50 translate-middle-y pe-3 cursor-pointer"
                style={{ cursor: "pointer", zIndex: 2 }}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <i className={showConfirmPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
              </span>
              {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
            </div>

            <div className="form-check mb-3">
              <input
                type="checkbox"
                className={`form-check-input ${errors.terms ? "is-invalid" : ""}`}
                id="termsCheck"
                name="terms"
                checked={formData.terms}
                onChange={handleChange}
              />
              <label htmlFor="termsCheck" className="form-check-label small">
                By clicking here you confirm that you agree with our terms & conditions
              </label>
              {errors.terms && <div className="invalid-feedback d-block">{errors.terms}</div>}
            </div>

            {/* API Error Display */}
            {apiError && (
              <div className="alert alert-danger mb-3" role="alert">
                {apiError}
              </div>
            )}

            {/* API Success Display */}
            {apiSuccess && (
              <div className="alert alert-success mb-3" role="alert">
                {apiSuccess}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-100 rounded-pill py-2 mb-3" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating Account...
                </>
              ) : (
                "CREATE MY ACCOUNT"
              )}
            </button>

            <div className="text-center mb-2 text-muted small">or sign up with</div>

            <div className="d-flex justify-content-center gap-3 mb-3">
              {/* Google */}
              <button
                type="button"
                className="btn rounded-circle d-flex align-items-center justify-content-center"
                style={{ backgroundColor: "#db4437", color: "#fff", width: "45px", height: "45px" }}
              >
                <i className="bi bi-google fs-5"></i>
              </button>

              {/* Facebook */}
              <button
                type="button"
                className="btn rounded-circle d-flex align-items-center justify-content-center"
                style={{ backgroundColor: "#4267B2", color: "#fff", width: "45px", height: "45px" }}
              >
                <i className="bi bi-facebook fs-5"></i>
              </button>
            </div>

            <div className="text-center">
             If you have an account?{" "}
              <Link to="/login" className="text-decoration-none fw-semibold text-danger">
                Login
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* ===== Right Section ===== */}
      <div className="signup-info-section d-none d-lg-flex flex-column justify-content-center align-items-center text-white text-center p-5 position-relative">
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

export default Signup;