import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import { checkAutoLogin } from '../utils/authManager';

const { width } = Dimensions.get("window");
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const circleRadius = 70;
  const circleCircumference = 2 * Math.PI * circleRadius;



  useEffect(() => {
    // Start animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2000, // Reduced duration for faster loading
        useNativeDriver: false,
      }),
    ]).start();

    // Check login status after animations complete
    const timer = setTimeout(() => {
      console.log('🚀 SplashScreen: Starting auto-login check...');
      checkAutoLogin(navigation);
    }, 3000); // Reduced to 3 seconds

    return () => clearTimeout(timer);
  }, []);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circleCircumference, 0],
  });

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

      <Animated.View
        style={[
          styles.centerContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo with Animated Circle */}
        <View style={styles.logoWrapper}>
          <Svg width={180} height={180} style={styles.circularProgress}>
            <Defs>
              <SvgLinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#007bff" stopOpacity="1" />
                <Stop offset="100%" stopColor="#00b4d8" stopOpacity="1" />
              </SvgLinearGradient>
            </Defs>

            <Circle
              cx="90"
              cy="90"
              r={circleRadius}
              stroke="rgba(0,0,0,0.05)"
              strokeWidth="10"
              fill="none"
            />

            <AnimatedCircle
              cx="90"
              cy="90"
              r={circleRadius}
              stroke="url(#progressGradient)"
              strokeWidth="10"
              fill="none"
              strokeDasharray={circleCircumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin="90, 90"
            />
          </Svg>

          <View style={styles.logoCircle}>
            <Image
              source={require("../assets/Blue_logo.png")} // your blue logo
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        <Text style={styles.title}>Gharplot.in</Text>
        <Text style={styles.subtitle}>Your Dream Home Awaits</Text>
      </Animated.View>

      {/* Progress Bar */}
      <View style={styles.bottomContainer}>
        <View style={styles.progressBackground}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff", // White background
    alignItems: "center",
    justifyContent: "center",
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 25,
  },
  circularProgress: {
    position: "absolute",
  },
  logoCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#e3f2fd",
  },
  logo: {
    width: 90,
    height: 90,
  },
  title: {
    fontSize: 36,
    color: "#007bff", // Primary blue
    fontWeight: "800",
    letterSpacing: 1.2,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#343a40", // Dark gray
    marginTop: 5,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 70,
    alignItems: "center",
    width: width * 0.65,
  },
  progressBackground: {
    width: "100%",
    height: 8,
    borderRadius: 20,
    backgroundColor: "#e9ecef",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007bff",
    borderRadius: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#495057",
    letterSpacing: 1,
    fontWeight: "600",
  },
});

export default SplashScreen;
