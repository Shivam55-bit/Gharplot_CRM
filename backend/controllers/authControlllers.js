import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";
import axios from "axios";




dotenv.config();




let otpStore = {}; // temporary in-memory OTP store

// ====================== SEND OTP ======================
export const sendPhoneOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    // Validation
    if (!phone) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });
    }

    // 🔹 Check if phone exists in DB
    const existingUser = await User.findOne({ phone });
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "Phone number not registered" });
    }

    // 🔹 Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    // 🔹 Store OTP temporarily
    otpStore[phone] = otp;

    // 🔹 Construct Renflair API URL
    const url = `${process.env.RENFLAIR_SMS_URL}?API=${process.env.RENFLAIR_API_KEY}&PHONE=${phone}&OTP=${otp}`;

    // 🔹 Send OTP via Renflair SMS API
    const response = await axios.get(url);
    console.log("Renflair API Response:", response.data);

    // 🔹 Save OTP + expiry in user DB
    existingUser.resetOtp = otp;
    existingUser.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry
    await existingUser.save();

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${phone}`,
      otp, // ⚠️ only for testing — remove in production
    });
  } catch (error) {
    console.error("Send OTP Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send OTP" });
  }
};

// ====================== VERIFY OTP + GENERATE TOKEN ======================
export const verifyPhoneOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Validation
    if (!phone || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Phone and OTP are required" });
    }

    // 🔹 Check if user exists
    const user = await User.findOne({ phone });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Phone number not found" });
    }

    // 🔹 Verify OTP
    const storedOtp = otpStore[phone];
    const isOtpValid =
      storedOtp &&
      storedOtp == otp &&
      user.otpExpiry &&
      new Date(user.otpExpiry) > new Date();

    if (!isOtpValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    //  OTP verified → remove it from memory + DB
    delete otpStore[phone];
    user.isPhoneVerified = true;
    user.isOtpVerified = true;
    user.resetOtp = null;
    await user.save();

    //  Generate JWT Token
    const token = jwt.sign(
      { id: user._id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    //  Return success response
    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Verify OTP Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Error verifying OTP" });
  }
};

//  Step 5: Final Signup
export const signup = async (req, res) => {
  try {
    const { fullName, email, phone, state, city, street, pinCode, password } =
      req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      email,
      phone,
      state,
      city,
      street,
      pinCode,
      password: hashedPassword,
      isEmailVerified: true, //  after OTP flow
      isPhoneVerified: true,
    });

    // await newUser.save();
    const savedUser = await newUser.save();

    // const token = jwt.sign({ id: newUser._id }, "secret123", {
    //   expiresIn: "1d",
    // });
  console.log("Saved user:", savedUser);
    res.json({ success: true, user: newUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// LOGIN CONTROLLER
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1 Check if email and password provided
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // 2 Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3 Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 4 Update last login date
    user.lastLogin = new Date();
    await user.save();

    // 5 Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "mysecretkey",
      { expiresIn: "24h" }
    );

    // 6 Send response
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        date: user.createdAt, // user registration date
        lastLogin: user.lastLogin, // recently added
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// google auth
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: "Token missing" });
    }

    //  Verify token with Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    //  Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = await User.create({
        name,
        email,
        googleId: sub,
      });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      success: true,
      message: "Google login successful",
      user: {
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid Google token",
      error: error.message,
    });
  }
};


