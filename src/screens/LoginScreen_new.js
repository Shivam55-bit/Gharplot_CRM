import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  StatusBar,
  Animated,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import api from "../services/api"; // your API
import authApi from "../services/authApi"; // your custom API functions

const LoginScreen = () => {
  const navigation = useNavigation();
  const [loginMode, setLoginMode] = useState("phone"); // phone or email
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    Keyboard.dismiss();

    if (loginMode === "phone" && phone.length < 10) {
      alert("Please enter a valid phone number");
      return;
    }
    if (loginMode === "email" && (!email || !password)) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      let res;

      if (loginMode === "phone") {
        // Call the phone OTP API
        res = await authApi.sendPhoneOtp(phone);
        if (res.success) {
          setLoading(false);
          alert(res.message || "OTP sent successfully");
          // Navigate to OTP screen with phone number and OTP (for testing, remove otp param in production)
          navigation.navigate("OtpScreen", { phone, mode: "phone" });
        } else {
          setLoading(false);
          alert(res.message || "Failed to send OTP");
        }
      } else {
        res = await authApi.login(email, password);
        if (res.token) {
          setLoading(false);
          navigation.replace("Home");
        } else {
          setLoading(false);
          alert(res.message || "Invalid credentials");
        }
      }
    } catch (error) {
      console.log("Login error:", error);
      setLoading(false);
      alert(error.message || "Something went wrong. Try again!");
    }
  };

  const LogoImage = require("../assets/New_logo.png");

  return (
    <LinearGradient
      colors={["#0f2027", "#203a43", "#2c5364"]}
      style={styles.gradientBackground}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <Animated.View
              style={[
                styles.container,
                { opacity: fadeAnim, transform: [{ translateY }] },
              ]}
            >
              {/* Logo Section */}
              <View style={styles.logoContainer}>
                <Image source={LogoImage} style={styles.logo} />
                <Text style={styles.brandName}>GharPlot.in</Text>
                <Text style={styles.tagline}>Find Your Dream Home</Text>
              </View>

              {/* Login Card */}
              <View style={styles.card}>
                <Text style={styles.title}>Welcome Back 👋</Text>

                {/* Mode Switch */}
                <View style={styles.switchContainer}>
                  <TouchableOpacity
                    onPress={() => setLoginMode("phone")}
                    style={[
                      styles.switchButton,
                      loginMode === "phone" && styles.activeButton,
                    ]}
                  >
                    <Text
                      style={[
                        styles.switchText,
                        loginMode === "phone" && styles.activeText,
                      ]}
                    >
                      Phone
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setLoginMode("email")}
                    style={[
                      styles.switchButton,
                      loginMode === "email" && styles.activeButton,
                    ]}
                  >
                    <Text
                      style={[
                        styles.switchText,
                        loginMode === "email" && styles.activeText,
                      ]}
                    >
                      Email
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Input Fields */}
                {loginMode === "phone" ? (
                  <View
                    style={[
                      styles.inputContainer,
                      focusedInput === "phone" && styles.focused,
                    ]}
                  >
                    <Icon name="call-outline" size={20} color="#007bff" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter phone number"
                      placeholderTextColor="#aaa"
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                      onFocus={() => setFocusedInput("phone")}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </View>
                ) : (
                  <>
                    <View
                      style={[
                        styles.inputContainer,
                        focusedInput === "email" && styles.focused,
                      ]}
                    >
                      <Icon name="mail-outline" size={20} color="#007bff" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor="#aaa"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                        onFocus={() => setFocusedInput("email")}
                        onBlur={() => setFocusedInput(null)}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>

                    <View
                      style={[
                        styles.inputContainer,
                        focusedInput === "password" && styles.focused,
                      ]}
                    >
                      <Icon name="lock-closed-outline" size={20} color="#007bff" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor="#aaa"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                        onFocus={() => setFocusedInput("password")}
                        onBlur={() => setFocusedInput(null)}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Icon
                          name={showPassword ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color="#999"
                        />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      onPress={() => navigation.navigate("ForgotPasswordScreen")}
                      style={styles.forgotContainer}
                    >
                      <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* Login Button */}
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={loading ? ["#ccc", "#aaa"] : ["#007bff", "#0056d2"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.loginButton}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.loginText}>
                          {loginMode === "phone" ? "Send OTP" : "Login"}
                        </Text>
                        <Icon name="arrow-forward" size={18} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Redirect to Signup */}
                <TouchableOpacity onPress={() => navigation.navigate("SignupScreen")}>
                  <Text style={styles.signupText}>
                    Don't have an account?{" "}
                    <Text style={styles.signupBold}>Sign up</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  gradientBackground: { flex: 1 },
  container: {
    paddingHorizontal: 24,
    paddingTop: 90,
    paddingBottom: 50,
  },
  logoContainer: { alignItems: "center", marginBottom: 40 },
  logo: {
    width: 95,
    height: 95,
    resizeMode: "contain",
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 8,
  },
  brandName: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    marginTop: 10,
  },
  tagline: { color: "#cfd8dc", fontSize: 14, marginTop: 4 },
  card: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 20,
  },
  switchContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  switchButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  activeButton: {
    backgroundColor: "#007bff",
  },
  switchText: {
    color: "#ddd",
    fontSize: 15,
    fontWeight: "500",
  },
  activeText: {
    color: "#fff",
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    height: 55,
  },
  focused: {
    borderColor: "#007bff",
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: "#fff", fontSize: 15 },
  forgotContainer: {
    alignSelf: "flex-end",
    marginBottom: 15,
  },
  forgotText: {
    color: "#007bff",
    fontSize: 14,
    fontWeight: "600",
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 22,
    shadowColor: "#007bff",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    marginTop: 10,
  },
  loginText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "700", 
    marginRight: 6 
  },
  signupText: { 
    textAlign: "center", 
    color: "#ddd", 
    fontSize: 14, 
    marginTop: 20 
  },
  signupBold: { 
    color: "#fff", 
    fontWeight: "700" 
  },
});