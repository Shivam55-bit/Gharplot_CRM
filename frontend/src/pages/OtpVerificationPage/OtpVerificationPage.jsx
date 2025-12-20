import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import 'bootstrap-icons/font/bootstrap-icons.css';
import "./OtpVerificationPage.css";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const OtpVerificationPage = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [errors, setErrors] = useState({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [email, setEmail] = useState(""); 
  
  const inputRefs = useRef([]);

  // Get email from localStorage on component mount
  useEffect(() => {
    const storedEmail = localStorage.getItem('verificationEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // If no email found, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  // Timer countdown effect
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Handle OTP input change
  const handleChange = (index, value) => {
    if (isNaN(value)) return; // Only allow numbers
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Clear errors when user starts typing
    if (errors.otp) {
      setErrors({});
    }
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setOtp(newOtp);
    
    // Focus the last filled input or next empty one
    const lastFilledIndex = Math.min(pastedData.length - 1, 5);
    inputRefs.current[lastFilledIndex]?.focus();
  };

  // Validate OTP
  const validate = () => {
    const newErrors = {};
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      newErrors.otp = "Please enter all 6 digits";
    } else if (!/^\d{6}$/.test(otpString)) {
      newErrors.otp = "OTP must contain only numbers";
    }
    
    return newErrors;
  };

  // Handle form submission
const handleSubmit = async (e) => {
  e.preventDefault();
  const validationErrors = validate();
  setErrors(validationErrors);

  if (Object.keys(validationErrors).length === 0) {
    setIsVerifying(true);
    const otpString = otp.join("");

    try {
      const response = await axios.post(
        "http://abc.ridealmobility.com/admin/verify-otp",
        { 
          email: email, 
          otp: otpString 
        }
      );

      console.log("OTP Verification Response:", response.data);

      //  Check if verification was successful
      if (response.data.success || response.data.message === "2FA enabled successfully") {
        // Show success toast notification
        toast.success(" OTP verified successfully! Redirecting to Dashboard...", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        // Clear temporary storage
        localStorage.removeItem("verificationEmail");

        // Set authentication flag
        localStorage.setItem("isAuthenticated", "true");

        // Navigate to dashboard after short delay
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      } else {
        // Clear OTP inputs and focus on first input for retry
        setOtp(["", "", "", "", "", ""]);
        setErrors({ otp: response.data.message || "Invalid OTP" });
        toast.error(" " + (response.data.message || "Invalid OTP. Please try again."), {
          position: "top-right",
          autoClose: 3000,
        });
        // Focus on first input
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      const errorMessage = error.response?.data?.message || "Invalid OTP. Please try again.";
      // Clear OTP inputs and focus on first input for retry
      setOtp(["", "", "", "", "", ""]);
      setErrors({ otp: errorMessage });
      toast.error(" " + errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
      // Focus on first input
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } finally {
      setIsVerifying(false);
    }
  }
};


// Handle resend OTP
const handleResendOtp = async () => {
  setIsResending(true);
  setTimer(60);
  setOtp(["", "", "", "", "", ""]);
  setErrors({});

  try {
    const response = await axios.post(
      "http://abc.ridealmobility.com/admin/send-otp",
      { email: email }
    );

    if (response.data.success || response.data) {
      toast.success(" New OTP sent successfully to your email!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } else {
      toast.error(" " + (response.data.message || "Failed to resend OTP"), {
        position: "top-right",
        autoClose: 3000,
      });
    }
  } catch (error) {
    console.error("Error resending OTP:", error);
    toast.error(" " + (error.response?.data?.message || "Something went wrong while resending OTP"), {
      position: "top-right",
      autoClose: 3000,
    });
  } finally {
    setIsResending(false);
  }
};

  // Format timer display
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Toast Container */}
      <ToastContainer />
      
      <div className="otppage-container d-flex flex-column flex-lg-row">
      {/* ===== Left Section ===== */}
      <div className="otppage-form-section d-flex flex-column justify-content-center align-items-center p-4 p-lg-5">
        <div className="w-100" style={{ maxWidth: "400px" }}>
          <h6 className="otppage-step-text mb-3">
            <span className="otppage-step-number">02</span> Email Verification
          </h6>

          <h3 className="fw-bold mb-2">Verify Your Email</h3>
          <p className="text-muted small mb-4">
            We've sent a 6-digit verification code to <strong>{email}</strong>. 
            Please enter the code below to continue.
          </p>

          {/* ===== Form ===== */}
          <form onSubmit={handleSubmit} noValidate>
            {/* OTP Input Fields */}
            <div className="mb-3">
              <label className="form-label small text-muted mb-2">
                Enter 6-Digit Code
              </label>
              <div className="otppage-inputs-container d-flex justify-content-between gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength="1"
                    className={`form-control otppage-input text-center ${
                      errors.otp ? "otppage-input-error" : ""
                    }`}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                  />
                ))}
              </div>
              {errors.otp && (
                <div className="otppage-error-message mt-2">{errors.otp}</div>
              )}
              {/* Clear OTP button */}
              {otp.some(digit => digit !== "") && (
                <div className="text-center mt-2">
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 text-decoration-none text-danger"
                    onClick={() => {
                      setOtp(["", "", "", "", "", ""]);
                      setErrors({});
                      inputRefs.current[0]?.focus();
                    }}
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    Clear OTP
                  </button>
                </div>
              )}
            </div>

            {/* Timer and Resend */}
            <div className="text-center mb-4">
              {timer > 0 ? (
                <p className="small text-muted mb-2">
                  <i className="bi bi-clock me-1"></i>
                  Resend code in {formatTimer(timer)}
                </p>
              ) : (
                <div className="mb-2">
                  <p className="small text-muted mb-2">Didn't receive the code?</p>
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 text-decoration-none"
                    onClick={handleResendOtp}
                    disabled={isResending}
                  >
                    {isResending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-arrow-clockwise me-1"></i>
                        Resend Code
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              className="btn btn-primary w-100 rounded-pill py-2 mb-3"
              disabled={otp.join('').length !== 6 || isVerifying}
            >
              {isVerifying ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Verifying...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  VERIFY CODE
                </>
              )}
            </button>

            {/* Back to Login */}
            <div className="text-center small">
              <button 
                type="button"
                onClick={() => navigate('/login')}
                className="btn btn-link text-decoration-none text-muted p-0"
              >
                <i className="bi bi-arrow-left me-1"></i>
                Back to Login
              </button>
            </div>

            {/* Help Text */}
            <div className="text-center mt-3 p-3 bg-light rounded-3">
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Having trouble? Check your spam folder or contact support.
              </small>
            </div>
          </form>
        </div>
      </div>

      {/* ===== Right Section ===== */}
      <div className="otppage-info-section d-none d-lg-flex flex-column justify-content-center align-items-center text-white text-center p-5">
        <div className="otppage-info-overlay"></div>
        <div className="z-2 position-relative">
          <div className="otppage-info-logo bg-white rounded-4 p-4 mb-4 shadow">
            <i className="bi bi-shield-check text-success fs-1"></i>
          </div>
          <blockquote className="blockquote">
            "Your security is our priority. We use email verification to ensure 
            your account remains safe and protected from unauthorized access."
          </blockquote>
          <footer className="blockquote-footer text-light mt-2">
            <span className="fw-bold">Security Team</span>
          </footer>
          
          {/* Security Features */}
          <div className="mt-4">
            <div className="d-flex align-items-center justify-content-center mb-2">
              <i className="bi bi-lock-fill me-2"></i>
              <small>256-bit SSL Encryption</small>
            </div>
            <div className="d-flex align-items-center justify-content-center">
              <i className="bi bi-clock-fill me-2"></i>
              <small>Code expires in 10 minutes</small>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default OtpVerificationPage;
