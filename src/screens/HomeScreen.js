import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ImageBackground,
    ScrollView,
    Dimensions,
    SafeAreaView,
    TextInput,
    Platform,
    ActivityIndicator,
    Alert,
    RefreshControl,
    StatusBar,
    KeyboardAvoidingView,
    Keyboard,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { getNotificationCount, addTestNotifications } from '../utils/notificationManager';
import { getStoredCredentials, clearUserCredentials } from '../utils/authManager';
import { runCompleteNotificationTest } from '../utils/notificationTest';
import { runChatDiagnostics } from '../utils/chatDiagnostics';
import { runCompleteFCMTest, showFCMTestResults, sendTestFCMNotification } from '../utils/fcmTestService';
import { testAllNotificationStates, createFirebaseTestPayload, debugNotificationIssues, forceTestNotification } from '../utils/notificationTestHelper';
import { showQuickNotificationStatus } from '../utils/notificationStatus';

// Import MediaCard component
import MediaCard from '../components/MediaCard';

// Location Service - Using react-native-geolocation-service
import { getCurrentLocation } from '../utils/locationService';

// Validate import
if (typeof getCurrentLocation !== 'function') {
    console.error('❌ getCurrentLocation is not a function:', typeof getCurrentLocation);
} else {
    console.log('✅ HomeScreen: locationService imported successfully');
}

// API imports
import {
    getRecentProperties,
    getNearbyProperties,
    getAllProperties,
    formatImageUrl,
    formatPrice,
    getSavedPropertiesIds,
    getFirstImageUrl
} from '../services/homeApi';
import { toggleSaveProperty, removeSavedProperty, getMySellProperties } from '../services/propertyapi';
import { getCurrentUserProfile } from '../services/userapi';

// Theme & Layout Constants
const { width, height } = Dimensions.get("window");

const theme = {
    COLORS: {
        primary: "#1E90FF",
        secondary: "#4CAF50",
        background: "#f8f9fa",
        white: "#FFFFFF",
        black: "#111111",
        greyLight: "#EFEFEF",
        greyMedium: "#888",
        greyDark: "#333",
        accent: "#5DA9F6",
        star: "#FFD700",
        overlay: "rgba(0,0,0,0.8)",
        overlayLight: "rgba(0,0,0,0.3)",
        notification: "#E74C3C",
        lightBackground: "#F0F8FF",
    },
    SPACING: {
        xs: 4, s: 8, m: 16, l: 20, xl: 32,
    },
    FONT_SIZES: {
        caption: 12, body: 14, h4: 16, h3: 18, h2: 22, h1: 28,
    },
    RADIUS: {
        s: 8, m: 15, l: 20, full: 99,
    },
};

// Static Data
const startedItems = [
    { id: "1", icon: "home", label: "Buy", color: "#87c1fbff", screen: 'BuyScreen' },
    { id: "2", icon: "pricetag", label: "Sell", color: "#87c1fbff", screen: 'SellScreen' },
    { id: "3", icon: "business", label: "Rent", color: "#87c1fbff", screen: 'RentScreen' },
];

// Layout Calculation
const BANNER_HEIGHT_RATIO = 0.31;
const SEARCH_BAR_HEIGHT = 50;
const OVERLAP_AMOUNT = SEARCH_BAR_HEIGHT / 2;
const BANNER_HEIGHT = height * BANNER_HEIGHT_RATIO;
const FIXED_HEADER_HEIGHT = BANNER_HEIGHT + OVERLAP_AMOUNT;
const FALLBACK_IMAGE_URI = "https://via.placeholder.com/400x200/5da9f6/FFFFFF?text=Property+Image";

// Chat Button Component
const ChatButton = ({ onPress, theme, hasUnreadMessages }) => (
    <TouchableOpacity
        style={styles.floatingChatButton}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={styles.chatButtonInnerGlass}>
            <Icon name="chatbubbles-outline" size={34} color={theme.COLORS.primary} />
        </View>
        {hasUnreadMessages && <View style={styles.notificationBadgeGlass} />}
    </TouchableOpacity>
);

// Update the getCityNameFromCoords function to handle unknown street gracefully
const getCityNameFromCoords = async (latitude, longitude) => {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
        const response = await fetch(url, { headers: { 'User-Agent': 'GharplotApp/1.0' } });

        if (!response.ok) {
            const txt = await response.text().catch(() => '');
            console.warn('[getCityNameFromCoords] Non-OK response', response.status, txt.slice ? txt.slice(0, 200) : txt);
            return 'Unknown Location';
        }

        const contentType = (response.headers.get('content-type') || '').toLowerCase();
        let data = null;

        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text().catch(() => '');
            const trimmed = (text || '').trim();
            if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                try {
                    data = JSON.parse(trimmed);
                } catch (err) {
                    console.warn('[getCityNameFromCoords] Failed to parse JSON, content:', trimmed.slice(0, 200));
                    data = null;
                }
            } else {
                console.warn('[getCityNameFromCoords] Non-JSON response from geocoding service:', trimmed.slice(0, 200));
                data = null;
            }
        }

        if (!data) return 'Unknown Location';

        const address = data.address || {};
        const cityName = address.city || address.town || address.village || address.county || address.state || 'Unknown Location';
        const streetName = address.road || address.neighbourhood || '';
        return streetName ? `${streetName}, ${cityName}` : cityName;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return 'Unknown Location';
    }
};

const Homescreen = ({ navigation }) => {
    // Debug function to check login status (for testing)
    const checkLoginStatus = async () => {
        const credentials = await getStoredCredentials();
        Alert.alert(
            'Login Status Debug',
            `Logged In: ${credentials.isLoggedIn}\nToken: ${credentials.token ? 'Present' : 'None'}\nUser ID: ${credentials.userId || 'None'}`,
            [
                { text: 'OK' },
                { 
                    text: 'Clear Login (Test)', 
                    onPress: async () => {
                        await clearUserCredentials();
                        Alert.alert('Cleared', 'Login cleared! Close and reopen app to test.');
                    }
                }
            ]
        );
    };

    // State Initialization
    const [favorites, setFavorites] = useState([]);
    const [avatar, setAvatar] = useState(null);
    const [avatarVersion, setAvatarVersion] = useState(Date.now());
    const [searchQuery, setSearchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Featured Properties States
    const [featuredProperties, setFeaturedProperties] = useState([]);
    const [isFeaturedLoading, setIsFeaturedLoading] = useState(true);
    const [featuredError, setFeaturedError] = useState(null);

    // Nearby Properties States
    const [nearbyProperties, setNearbyProperties] = useState([]);
    const [isNearbyLoading, setIsNearbyLoading] = useState(true);
    const [nearbyError, setNearbyError] = useState(null);

    // UI States
    const [hasUnreadMessages, setHasUnreadMessages] = useState(true);
    const [notificationCount, setNotificationCount] = useState(0);

    // Location States - INDEPENDENT from signup
    const [userLocation, setUserLocation] = useState({ latitude: 28.7041, longitude: 77.1025 }); // Default: Delhi
    const [cityName, setCityName] = useState('Delhi, India');
    const [isLocating, setIsLocating] = useState(false);
    const [manualLocationInput, setManualLocationInput] = useState(''); // Manual input field
    const [selectedManualLocation, setSelectedManualLocation] = useState(''); // Actually selected location
    
    // Nearby API response additional data
    const [nearbyDistance, setNearbyDistance] = useState('');
    const [nearbyCount, setNearbyCount] = useState(0);

    // Add state for distance filter
    const [searchDistance, setSearchDistance] = useState(20); // Default distance in km
    const [tempDistance, setTempDistance] = useState('20'); // Temporary input value

    // Remove dependency on signup - manual location management
    const [isEditingLocation, setIsEditingLocation] = useState(false);
    
    // Add ref to track mount and prevent double loading
    const isInitialMount = useRef(true);
    const hasLoadedData = useRef(false);
    const userLoginSession = useRef(Date.now()); // Track login session

    // Fetch User Location with City Name - Using locationService
    const fetchUserLocation = async () => {
        console.log('🔍 fetchUserLocation called');
        
        // Safety check - prevent multiple simultaneous calls
        if (isLocating) {
            console.log('⚠️ Location fetch already in progress, skipping...');
            return;
        }
        
        setIsLocating(true);
        
        try {
            console.log('📡 Calling getCurrentLocation...');
            
            // Validate getCurrentLocation exists
            if (typeof getCurrentLocation !== 'function') {
                console.error('❌ getCurrentLocation function is not available!');
                Alert.alert('Error', 'Location service not available. Please restart the app.');
                setIsLocating(false);
                return;
            }
            
            // Use the new location service with full error wrapping
            const result = await getCurrentLocation({
                showAlert: true,
                timeout: 15000,
                maximumAge: 10000,
                enableHighAccuracy: true,
            }).catch(err => {
                console.error('❌ getCurrentLocation threw error:', err);
                throw err;
            });

            if (!result || typeof result.latitude !== 'number' || typeof result.longitude !== 'number') {
                console.error('❌ Invalid location result:', result);
                Alert.alert('Error', 'Failed to get valid location coordinates.');
                setIsLocating(false);
                return;
            }

            const { latitude, longitude } = result;
            console.log('✅ Location fetched successfully:', { latitude, longitude });

            // Update state with new location
            setUserLocation({ latitude, longitude });
            
            // Save location to AsyncStorage
            try {
                await AsyncStorage.setItem('userLocation', JSON.stringify({ latitude, longitude }));
                console.log('✅ Location saved to AsyncStorage');
            } catch (saveError) {
                console.warn('⚠️ Failed to save location:', saveError);
                // Continue even if save fails
            }

            // Get city name from coordinates
            try {
                const city = await getCityNameFromCoords(latitude, longitude);
                setCityName(city);
                console.log('✅ City name fetched:', city);
            } catch (cityError) {
                console.warn('⚠️ Failed to get city name:', cityError);
                setCityName('Unknown Location');
            }
            
            // Load nearby properties with new location
            try {
                await loadNearbyProperties(latitude, longitude);
                console.log('✅ Nearby properties loaded');
            } catch (propertiesError) {
                console.warn('⚠️ Failed to load nearby properties:', propertiesError);
            }
            
            setIsLocating(false);
            console.log('✅ fetchUserLocation completed successfully');
            
        } catch (error) {
            // Comprehensive error logging
            console.error('❌ fetchUserLocation CAUGHT ERROR:');
            console.error('Error type:', error?.constructor?.name);
            console.error('Error message:', error?.message);
            console.error('Error code:', error?.code);
            console.error('Full error:', JSON.stringify(error, null, 2));
            
            if (error?.stack) {
                console.error('Stack trace:', error.stack);
            }
            
            setIsLocating(false);
            
            // Don't show alert if locationService already showed one
            if (!error?.message?.includes('permission') && !error?.message?.includes('GPS')) {
                Alert.alert(
                    'Location Error',
                    'Failed to get your location. Please check your GPS settings and try again.',
                    [{ text: 'OK' }]
                );
            }
        }
    };

    // Load All Properties - NOW USES NEW API ENDPOINT FOR ALL PROPERTIES
    const loadNearbyProperties = async (lat, lng) => {
        setIsNearbyLoading(true);
        setNearbyError(null);
        try {
            console.log(`🌐 Loading ALL properties from new API endpoint (no limit)`);

            // Use the new getAllProperties API to load ALL properties without limit
            const allProperties = await getAllProperties(); // Get ALL properties from API (no limit)
            
            // Ensure we have a valid array
            const validProperties = Array.isArray(allProperties) ? allProperties : [];
            
            setNearbyProperties(validProperties);
            setNearbyDistance(`All Properties`); 
            setNearbyCount(validProperties.length);
            
            console.log(`✅ Loaded ${validProperties.length} properties from ALL properties API`);
        } catch (e) {
            console.error("All Properties Error:", e);
            setNearbyError("Could not load properties. Tap to retry.");
            // Set empty array on error to prevent undefined issues
            setNearbyProperties([]);
            setNearbyCount(0);
        } finally {
            setIsNearbyLoading(false);
        }
    };

    // Load Saved Location - MANUAL ONLY (No Auto-fetch)
    useEffect(() => {
        const loadSavedLocation = async () => {
            try {
                const savedLocation = await AsyncStorage.getItem('userLocation');
                if (savedLocation) {
                    let latitude = null;
                    let longitude = null;
                    try {
                        const parsed = JSON.parse(savedLocation);
                        latitude = parsed.latitude;
                        longitude = parsed.longitude;
                    } catch (err) {
                        console.warn('[loadSavedLocation] savedLocation not JSON, attempting numeric fallback:', savedLocation.slice ? savedLocation.slice(0,200) : savedLocation);
                        const matches = (savedLocation || '').match(/-?\d+(?:\.\d+)?/g) || [];
                        if (matches.length >= 2) {
                            latitude = Number(matches[0]);
                            longitude = Number(matches[1]);
                        }
                    }

                    if (latitude != null && longitude != null) {
                        setUserLocation({ latitude, longitude });
                        const city = await getCityNameFromCoords(latitude, longitude);
                        setCityName(city);

                        // Load nearby properties based on saved location (only if not initial mount)
                        if (!isInitialMount.current) {
                            loadNearbyProperties(latitude, longitude);
                        }
                    } else {
                        console.log('📍 No valid saved location. Using default Delhi location.');
                        // Use default Delhi coordinates (only if not initial mount)
                        if (!isInitialMount.current) {
                            loadNearbyProperties(28.7041, 77.1025);
                        }
                    }
                } else {
                    console.log('📍 No saved location. Using default Delhi location.');
                    // Use default Delhi coordinates (only if not initial mount)
                    if (!isInitialMount.current) {
                        loadNearbyProperties(28.7041, 77.1025);
                    }
                }
            } catch (error) {
                console.error('❌ Error loading saved location:', error);
                console.log('📍 Using default Delhi location.');
                // Use default Delhi coordinates on error (only if not initial mount)
                if (!isInitialMount.current) {
                    loadNearbyProperties(28.7041, 77.1025);
                }
            }
        };

        loadSavedLocation();
    }, []);

    // Load Favorites
    const loadFavorites = async () => {
        try {
            const savedIds = await getSavedPropertiesIds();
            setFavorites(savedIds);
        } catch (e) {
            console.error("Failed to load saved properties:", e);
        }
    };

    // Load Featured Properties (Recent) - ANTI-BLINK VERSION
    const loadFeaturedProperties = async () => {
        try {
            setFeaturedError(null);
            console.log('🏠 Loading featured properties (anti-blink version)');
            
            const properties = await getRecentProperties(8); // Get 8 recent properties for featured
            const validProperties = Array.isArray(properties) ? properties : [];
            
            setFeaturedProperties(validProperties);
            console.log(`✅ Featured loaded: ${validProperties.length} properties`);
        } catch (e) {
            console.error("Featured Properties Error:", e);
            setFeaturedError("Could not load recent properties. Tap to retry.");
            setFeaturedProperties([]); // Set empty array on error
        } finally {
            setIsFeaturedLoading(false);
        }
    };

    // Load Properties - ONLY for manual refresh (pull to refresh)
    const loadProperties = useCallback(async () => {
        console.log('🔄 Manual refresh triggered');
        if (!isRefreshing) {
            setIsFeaturedLoading(true);
            setIsNearbyLoading(true);
        }

        await Promise.all([
            loadFeaturedProperties(),
            loadNearbyProperties(), // No parameters needed since it loads recent properties
            loadFavorites(),
        ]);

        setIsRefreshing(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // No dependencies - always use current state values

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadProperties();
    }, [loadProperties]);

    // Initial data load - OPTIMIZED for second-time login prevention + Independent location
    useEffect(() => {
        const initialLoad = async () => {
            console.log('🚀 Initial load started - Session:', userLoginSession.current);
            
            // Prevent double loading on second login
            if (hasLoadedData.current) {
                console.log('⏭️ Data already loaded, skipping...');
                return;
            }
            
            setIsFeaturedLoading(true);
            setIsNearbyLoading(true);
            
            // Load all data in parallel
            await Promise.all([
                loadFeaturedProperties(),
                loadFavorites(),
                loadUserAvatar(), // Load avatar here to prevent focus reload
            ]);
            
            // Load saved location settings (independent from user profile)
            try {
                const savedLocation = await AsyncStorage.getItem('userLocation');
                const savedLocationName = await AsyncStorage.getItem('selectedLocationName');
                
                let lat = 28.7041; // Default Delhi
                let lng = 77.1025;
                let locationName = 'Delhi, India';
                
                if (savedLocation) {
                    try {
                        const parsed = JSON.parse(savedLocation);
                        if (parsed.latitude && parsed.longitude) {
                            lat = parsed.latitude;
                            lng = parsed.longitude;
                            setUserLocation({ latitude: lat, longitude: lng });
                            console.log('📍 Using saved coordinates:', lat, lng);
                        }
                    } catch (e) {
                        console.log('📍 Using default Delhi coordinates');
                    }
                }
                
                if (savedLocationName) {
                    locationName = savedLocationName;
                    setSelectedManualLocation(savedLocationName);
                    setCityName(savedLocationName);
                    console.log('📍 Using saved location name:', savedLocationName);
                } else {
                    setCityName(locationName);
                }
                
                // Load recent properties (no location dependency needed)
                await loadNearbyProperties();
                
            } catch (error) {
                console.error('Error loading saved settings:', error);
                // Fallback - still load recent properties
                await loadNearbyProperties();
            }
            
            // Mark initial mount as complete and data as loaded
            isInitialMount.current = false;
            hasLoadedData.current = true;
            console.log('✅ Initial load complete - Recent properties system ready');
        };
        
        initialLoad();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array - only run once on mount

    // REMOVED location change effect since we're now showing recent properties instead of location-based

    // Load user avatar - OPTIMIZED to prevent second login reload
    const loadUserAvatar = useCallback(async () => {
        try {
            const data = await getCurrentUserProfile();
            const avatarUrl = (Array.isArray(data.photosAndVideo) && data.photosAndVideo.length > 0)
                ? data.photosAndVideo[0]
                : (data.avatar || null);
            setAvatar(avatarUrl);
            setAvatarVersion(Date.now());
        } catch (e) {
            console.warn('Failed to load user avatar:', e);
        }
    }, []);

    // Listen for saved property updates
    useEffect(() => {
        const listener = DeviceEventEmitter.addListener('savedListUpdated', (event) => {
            if (event.action === 'removed') {
                setFavorites(prev => prev.filter(id => id !== event.propertyId));
            } else if (event.action === 'added') {
                setFavorites(prev => [...prev, event.propertyId]);
            }
        });

        return () => listener.remove();
    }, []);

    // Listen for notification updates
    useEffect(() => {
        // Load initial notification count
        loadNotificationCount();

        // Listen for notification events
        const notificationAddedListener = DeviceEventEmitter.addListener('notificationAdded', (event) => {
            setNotificationCount(event.count);
        });

        const notificationCountUpdatedListener = DeviceEventEmitter.addListener('notificationCountUpdated', (count) => {
            setNotificationCount(count);
        });

        // Listen for focus to reload notification count
        const focusListener = navigation.addListener('focus', () => {
            loadNotificationCount();
        });

        return () => {
            notificationAddedListener.remove();
            notificationCountUpdatedListener.remove();
            focusListener(); // In React Navigation v6+, this is a function, not an object with remove()
        };
    }, [navigation]);

    // REMOVED useFocusEffect - This was causing second-time login blinking!
    // All data loads happen only once on mount now
    // User avatar and favorites are loaded in initial load, no need to reload on focus

    // Component Logic
    const toggleFavorite = async (id) => {
        const isCurrentlySaved = favorites.includes(id);
        setFavorites((prev) => (isCurrentlySaved ? prev.filter((f) => f !== id) : [...prev, id]));
        try {
            if (isCurrentlySaved) {
                await removeSavedProperty(id);
                DeviceEventEmitter.emit('savedListUpdated', { propertyId: id, action: 'removed' });
            } else {
                await toggleSaveProperty(id);
                DeviceEventEmitter.emit('savedListUpdated', { propertyId: id, action: 'added' });
            }
        } catch (e) {
            console.error('Failed to toggle save', e);
            Alert.alert('Error', isCurrentlySaved ? 'Could not remove saved property.' : 'Could not save property.');
            setFavorites((prev) => (isCurrentlySaved ? [...prev, id] : prev.filter((f) => f !== id)));
        }
    };

    // Update the renderSectionHeader function to handle 'See All' click
    const renderSectionHeader = (title, showSeeAll = false, onSeeAllPress) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {showSeeAll && (
                <TouchableOpacity onPress={onSeeAllPress}>
                    <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const handleQuickAction = (screenName) => {
        navigation.navigate(screenName);
    };

    const openProperty = async (item) => {
        try {
            const pid = item?._id || item?.id || item?.propertyId || null;
            if (!pid) {
                navigation.navigate('PropertyDetailsScreen', { property: item });
                return;
            }

            const flag = await AsyncStorage.getItem(`inquirySubmitted:${pid}`);
            if (flag) {
                navigation.navigate('PropertyDetailsScreen', { property: item });
            } else {
                navigation.navigate('PropertyInquiryFormScreen', { property: item });
            }
        } catch (e) {
            navigation.navigate('PropertyInquiryFormScreen', { property: item });
        }
    };

    // For Recent Estates section - always open inquiry form
    const openPropertyForInquiry = (item) => {
        navigation.navigate('PropertyInquiryFormScreen', { property: item });
    };

    const handleChatPress = () => {
        setHasUnreadMessages(false);
        navigation.navigate('ChatListScreen');
    };

    const handleNotificationPress = () => {
        navigation.navigate('NotificationList');
    };

    // Load notification count
    const loadNotificationCount = async () => {
        try {
            const count = await getNotificationCount();
            setNotificationCount(count);
        } catch (error) {
            console.error('Error loading notification count:', error);
        }
    };

    // Complete notification system test (including FCM and backend API)
    const handleAddTestNotifications = async () => {
        try {
            Alert.alert(
                'Notification & FCM Test',
                'Choose test type:',
                [
                    {
                        text: '📊 Quick Status',
                        onPress: async () => {
                            await showQuickNotificationStatus();
                        }
                    },
                    {
                        text: 'FCM Quick Test',
                        onPress: async () => {
                            Alert.alert('Testing FCM', 'Sending test FCM notification...');
                            const result = await sendTestFCMNotification();
                            await loadNotificationCount();
                            
                            Alert.alert(
                                result.success ? '✅ FCM Test Sent' : '❌ FCM Test Failed',
                                result.success 
                                    ? `Test notification sent via ${result.method}\nToken: ${result.token?.substring(0, 20)}...` 
                                    : `Error: ${result.error}`
                            );
                        }
                    },
                    {
                        text: 'FCM Full Diagnostics',
                        onPress: async () => {
                            Alert.alert('Running FCM Tests', 'Please wait while we test Firebase Cloud Messaging...');
                            const results = await runCompleteFCMTest();
                            await loadNotificationCount();
                            showFCMTestResults(results);
                        }
                    },
                    {
                        text: 'Fix FCM Issues',
                        onPress: async () => {
                            Alert.alert('Fixing FCM', 'Attempting to fix common FCM issues...');
                            const { quickFixFCMIssues } = require('../utils/fcmTestService');
                            const fixResult = await quickFixFCMIssues();
                            await loadNotificationCount();
                            
                            Alert.alert(
                                fixResult.success ? '🔧 FCM Fixes Applied' : '❌ Fix Attempt Failed',
                                fixResult.fixes.join('\n') + '\n\nTap "FCM Full Diagnostics" to test again.',
                                [{ text: 'OK' }]
                            );
                        }
                    },
                    {
                        text: 'Local Only',
                        onPress: async () => {
                            await addTestNotifications();
                            await loadNotificationCount();
                            Alert.alert('Success', 'Local test notifications added! Check the notification icon.');
                        }
                    },
                    {
                        text: 'Complete Test',
                        onPress: async () => {
                            Alert.alert('Running Tests', 'Please wait while we test the complete notification system...');
                            const results = await runCompleteNotificationTest();
                            await loadNotificationCount();
                            
                            const successCount = Object.values(results).filter(r => r.success).length;
                            const totalTests = Object.keys(results).length;
                            
                            Alert.alert(
                                'Test Results',
                                `Passed: ${successCount}/${totalTests} tests\n\n` +
                                `Local Storage: ${results.localStorage.success ? '✅' : '❌'}\n` +
                                `Backend API: ${results.backend.success ? '✅' : '❌'}\n` +
                                `FCM Token: ${results.fcmToken.success ? '✅' : '❌'}\n\n` +
                                'Check console for detailed logs.',
                                [{ text: 'OK' }]
                            );
                        }
                    },
                    {
                        text: 'Chat Test',
                        onPress: async () => {
                            Alert.alert('Running Tests', 'Testing chat system...');
                            const results = await runChatDiagnostics();
                            
                            Alert.alert(
                                'Chat Test Results',
                                `Auth: ${results.auth.success ? '✅' : '❌'}\n` +
                                `Endpoints: ${results.endpoints.success ? '✅' : '❌'}\n` +
                                `Socket: ${results.socket.success ? '✅' : '❌'}\n\n` +
                                'Check console for detailed logs.',
                                [{ text: 'OK' }]
                            );
                        }
                    },
                    {
                        text: '🧪 All States Test',
                        onPress: async () => {
                            Alert.alert('Testing All States', 'Testing notifications in foreground, background, and closed states...');
                            const results = await testAllNotificationStates();
                            await loadNotificationCount();
                        }
                    },
                    {
                        text: '🔍 Debug Issues',
                        onPress: async () => {
                            const debugResults = await debugNotificationIssues();
                            await loadNotificationCount();
                        }
                    },
                    {
                        text: '📋 Firebase Payload',
                        onPress: async () => {
                            await createFirebaseTestPayload();
                        }
                    },
                    {
                        text: '🚨 Force Test',
                        onPress: async () => {
                            await forceTestNotification();
                            await loadNotificationCount();
                        }
                    },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to run tests: ' + error.message);
        }
    };

    const handleSearchSubmit = () => {
        if (searchQuery.trim()) {
            navigation.navigate('ServicesScreen', { query: searchQuery.trim() });
            Keyboard.dismiss();
        }
    };

    const handleVoiceSearch = () => {
        Alert.alert('Voice Search', 'Voice search feature coming soon!');
    };

    // Function to handle distance change
    const handleDistanceChange = (distance) => {
        setSearchDistance(distance);
        if (userLocation) {
            loadNearbyProperties(userLocation.latitude, userLocation.longitude);
        }
    };

    // Memoize featured properties - ULTIMATE ANTI-BLINK VERSION
    const processedFeaturedProperties = useMemo(() => {
        if (!featuredProperties || featuredProperties.length === 0) {
            console.log('🚫 No featured properties to process');
            return [];
        }
        
        console.log('🖼️ Processing featured properties (STABLE):', featuredProperties.length);
        
        return featuredProperties.map((item, index) => {
            const firstImage = getFirstImageUrl(item.photosAndVideo);
            const imageUrl = formatImageUrl(firstImage) || FALLBACK_IMAGE_URI;
            
            return {
                ...item,
                processedImageUrl: imageUrl,
                stableKey: `featured_${item._id || index}` // Add stable key
            };
        });
    }, [featuredProperties]); // Simple dependency to prevent over-optimization

    // Render Featured Content
    const renderFeaturedContent = () => {
        if (isFeaturedLoading) {
            return <ActivityIndicator size="large" color={theme.COLORS.primary} style={styles.loaderStyle} />;
        }
        if (featuredError) {
            return (
                <TouchableOpacity onPress={loadProperties} style={styles.retryContainer}>
                    <Text style={styles.errorText}>⚠️ {featuredError}</Text>
                    <Text style={styles.retryText}>Tap to Retry</Text>
                </TouchableOpacity>
            );
        }
        if (processedFeaturedProperties.length === 0) {
            return <Text style={styles.noDataText}>No recent estates found.</Text>;
        }

        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScrollContainer}
            >
                {processedFeaturedProperties.map((item, index) => {
                    // Prepare media items for MediaCard
                    const mediaItems = item.photosAndVideo && item.photosAndVideo.length > 0 
                        ? item.photosAndVideo.map(media => ({
                            uri: formatImageUrl(media.uri || media) || media.uri || media,
                            type: media.type || (media.uri?.includes('.mp4') || media.uri?.includes('.mov') || media.uri?.includes('.avi') ? 'video' : 'image')
                        }))
                        : [{ uri: item.processedImageUrl, type: 'image' }];

                    return (
                        <TouchableOpacity
                            key={item.stableKey} // Use stable key instead of _id
                            style={styles.featuredCard}
                            onPress={() => openProperty(item)}
                            activeOpacity={0.9}
                        >
                            <View style={styles.featuredMediaContainer}>
                                <MediaCard
                                    mediaItems={mediaItems}
                                    fallbackImage={FALLBACK_IMAGE_URI}
                                    imageStyle={styles.featuredMediaImage}
                                    showControls={true}
                                    autoPlay={false}
                                    style={styles.featuredMediaCard}
                                />
                                <LinearGradient 
                                    colors={["transparent", theme.COLORS.overlay]} 
                                    style={styles.featuredOverlay} 
                                />
                                <TouchableOpacity 
                                    onPress={() => toggleFavorite(item._id)} 
                                    style={styles.favoriteIconContainer}
                                >
                                    <Icon
                                        name={favorites.includes(item._id) ? "heart" : "heart-outline"}
                                        size={22}
                                        color={favorites.includes(item._id) ? theme.COLORS.accent : theme.COLORS.white}
                                    />
                                </TouchableOpacity>
                                <View style={styles.featuredInfo}>
                                    <Text style={styles.featuredTitle} numberOfLines={1}>
                                        {item.description || 'Property'}
                                    </Text>
                                    <Text style={styles.featuredLocation}>
                                        {item.propertyLocation || 'Unknown Location'}
                                    </Text>
                                    <Text style={styles.featuredPrice}>{formatPrice(item.price)}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        );
    };

    // Memoize nearby properties - ULTIMATE ANTI-BLINK VERSION  
    const processedNearbyProperties = useMemo(() => {
        if (!nearbyProperties || nearbyProperties.length === 0) {
            console.log('🚫 No nearby properties to process');
            return [];
        }
        
        console.log('🏡 Processing nearby properties (STABLE):', nearbyProperties.length);
        
        return nearbyProperties.map((item, index) => {
            const firstImage = getFirstImageUrl(item.photosAndVideo);
            const imageUrl = formatImageUrl(firstImage) || FALLBACK_IMAGE_URI;
            
            return {
                ...item,
                processedImageUrl: imageUrl,
                stableKey: `nearby_${item._id || index}` // Add stable key
            };
        });
    }, [nearbyProperties]); // Simple dependency

    // Render Nearby Content
    // Render Recent Properties Content (formerly nearby)
    const renderNearbyContent = () => {
        return (
            <View>
                {/* Recent Properties Listing - No location filters needed */}
                {isNearbyLoading ? (
                    <ActivityIndicator size="large" color={theme.COLORS.primary} style={styles.loaderStyle} />
                ) : nearbyError ? (
                    <TouchableOpacity onPress={() => loadNearbyProperties()} style={styles.retryContainer}>
                        <Text style={[styles.errorText, { color: theme.COLORS.greyMedium }]}>⚠️ {nearbyError}</Text>
                        <Text style={styles.retryText}>Tap to Retry</Text>
                    </TouchableOpacity>
                ) : processedNearbyProperties.length === 0 ? (
                    <Text style={styles.noDataText}>
                        No recent properties found.
                    </Text>
                ) : (
                    <View style={styles.nearbyGrid}>
                        {processedNearbyProperties.map((item, index) => {
                            // Prepare media items for MediaCard
                            const mediaItems = item.photosAndVideo && item.photosAndVideo.length > 0 
                                ? item.photosAndVideo.map(media => ({
                                    uri: formatImageUrl(media.uri || media) || media.uri || media,
                                    type: media.type || (media.uri?.includes('.mp4') || media.uri?.includes('.mov') || media.uri?.includes('.avi') ? 'video' : 'image')
                                }))
                                : [{ uri: item.processedImageUrl, type: 'image' }];

                            return (
                                <TouchableOpacity
                                    key={item.stableKey} // Use stable key instead of _id
                                    style={styles.nearbyCard}
                                    onPress={() => openPropertyForInquiry(item)}
                                    activeOpacity={0.9}
                                >
                                    <MediaCard
                                        mediaItems={mediaItems}
                                        fallbackImage={FALLBACK_IMAGE_URI}
                                        imageStyle={styles.nearbyImage}
                                        showControls={true}
                                        autoPlay={false}
                                        style={styles.nearbyMediaCard}
                                    />
                                    <View style={styles.nearbyInfo}>
                                        <Text style={styles.nearbyTitle} numberOfLines={1}>
                                            {item.description || 'Estate'}
                                        </Text>
                                        <View style={styles.locationRow}>
                                            <Icon name="location-outline" size={14} color={theme.COLORS.greyMedium} />
                                            <Text style={styles.nearbyLocation} numberOfLines={1}>
                                                {item.propertyLocation || 'Unknown'}
                                            </Text>
                                        </View>
                                        <Text style={styles.nearbyPrice}>{formatPrice(item.price)}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </View>
        );
    };

    // Function to fetch coordinates from a manually entered location
    const getCoordsFromLocation = async (location) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`,
                {
                    headers: { 'User-Agent': 'GharplotApp/1.0' }
                }
            );
            const data = await response.json();
            if (data.length > 0) {
                const { lat, lon } = data[0];
                return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
            }
            return null;
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    };

    // Quick location suggestions for popular cities
    const popularLocations = [
        'Delhi', 'Mumbai', 'Bangalore', 'Pune', 'Hyderabad', 
        'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow'
    ];

    const handleQuickLocationSelect = async (locationName) => {
        setManualLocationInput(locationName);
        setIsLocating(true);
        
        try {
            const coords = await getCoordsFromLocation(locationName);
            if (coords) {
                setUserLocation(coords);
                setCityName(locationName);
                setSelectedManualLocation(locationName);
                
                await AsyncStorage.setItem('userLocation', JSON.stringify(coords));
                await AsyncStorage.setItem('selectedLocationName', locationName);
                
                await loadNearbyProperties(coords.latitude, coords.longitude);
                setManualLocationInput('');
                
                console.log('✅ Quick location selected:', locationName);
            }
        } catch (error) {
            console.error('Error selecting quick location:', error);
        } finally {
            setIsLocating(false);
        }
    };

    // Handle manual location save - with improved UX
    // Handle manual location save - COMPLETELY INDEPENDENT from signup/user profile
    const handleSaveManualLocation = async () => {
        const locationInput = manualLocationInput.trim();
        
        if (!locationInput) {
            Alert.alert('Invalid Input', 'Please enter a valid location name or address.');
            return;
        }

        // Show loading state
        setIsLocating(true);
        
        try {
            console.log('🔍 Searching for location:', locationInput);
            const coords = await getCoordsFromLocation(locationInput);
            
            if (coords) {
                // Update location state with new coordinates
                setUserLocation(coords);
                setCityName(locationInput);
                setSelectedManualLocation(locationInput);

                // Save to AsyncStorage for persistence
                await AsyncStorage.setItem('userLocation', JSON.stringify(coords));
                await AsyncStorage.setItem('selectedLocationName', locationInput);
                console.log('✅ Manual location saved:', locationInput, coords);

                // Load nearby properties based on new coordinates
                await loadNearbyProperties(coords.latitude, coords.longitude);

                // Clear input and exit editing mode
                setManualLocationInput('');
                setIsEditingLocation(false);
                
                Alert.alert('Success', `🎯 Location set to: ${locationInput}\n\nNow showing properties near this location!`);
            } else {
                Alert.alert(
                    'Location Not Found', 
                    `Could not find "${locationInput}". Please try:\n• Different spelling\n• City name only\n• Full address with city`
                );
            }
        } catch (error) {
            console.error('❌ Error setting manual location:', error);
            Alert.alert('Error', 'Failed to set location. Please check your internet connection and try again.');
        } finally {
            setIsLocating(false);
        }
    };

    // 🚀 FINAL NUCLEAR ANTI-BLINK - Stable render key
    const stableRenderKey = useMemo(() => 
        `home_${featuredProperties.length}_${nearbyProperties.length}`, 
        [featuredProperties.length, nearbyProperties.length]
    );

    return (
        <SafeAreaView style={styles.container} key={stableRenderKey}>
            {/* Fixed Banner Container */}
            <View style={[styles.fixedBannerContainer, { height: BANNER_HEIGHT }]}>
                <Image
                    source={require("../assets/image_banner7.png")}
                    style={[styles.bannerImage, { height: BANNER_HEIGHT }]}
                />

                {/* Header Row */}
                <View style={styles.headerRow}>
                    <TouchableOpacity 
                        activeOpacity={0.85} 
                        onPress={() => navigation.navigate('ProfileScreen')}
                    >
                        <Image 
                            style={styles.logo} 
                            source={require("../assets/Blue_logo.png")} 
                        />
                    </TouchableOpacity>

                    <View style={styles.headerRightContainer}>
                        <TouchableOpacity 
                            style={styles.postPropertyButton} 
                            onPress={() => handleQuickAction('AddSell')}
                        >
                            <Text style={styles.postPropertyText}>Post property</Text>
                            <View style={styles.freeBadge}>
                                <Text style={styles.freeText}>FREE</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.notificationIconContainer}
                            onPress={handleNotificationPress}
                            onLongPress={handleAddTestNotifications}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={["#6fb1ff", "#2f86f6"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.notificationGradient}
                            >
                                <View style={styles.notificationIconInner}>
                                    <Icon 
                                        name="notifications-outline" 
                                        size={20} 
                                        color={theme.COLORS.white} 
                                    />
                                </View>
                            </LinearGradient>

                            {notificationCount > 0 && (
                                <View style={styles.notificationBadgeHeader}>
                                    <Text style={styles.notificationBadgeText}>
                                        {notificationCount > 9 ? '9+' : notificationCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Fixed Search Bar */}
            <View style={[styles.fixedSearchBarContainer, { top: BANNER_HEIGHT - OVERLAP_AMOUNT }]}>
                <View style={[styles.searchBar, { height: SEARCH_BAR_HEIGHT }]}>
                    <TouchableOpacity onLongPress={checkLoginStatus} activeOpacity={0.7}>
                        <Icon name="search" size={20} color={theme.COLORS.greyMedium} />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by services or category"
                        placeholderTextColor={theme.COLORS.greyMedium}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearchSubmit}
                        returnKeyType="search"
                    />
                    <TouchableOpacity onPress={handleVoiceSearch}>
                        <Icon name="mic" size={20} color={theme.COLORS.greyMedium} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content with keyboard avoiding */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 100 }}
                    style={[styles.scrollableContent, { marginTop: FIXED_HEADER_HEIGHT }]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.COLORS.primary}
                        />
                    }
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Quick Actions */}
                    <View style={styles.quickActionsContainer}>
                        {startedItems.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.iconCard}
                                activeOpacity={0.8}
                                onPress={() => handleQuickAction(item.screen)}
                            >
                                <LinearGradient
                                    colors={["#9cc8eb", "#5da9f6"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.iconCircle}
                                >
                                    <View style={styles.iconInnerRing}>
                                        <Icon 
                                            name={item.icon} 
                                            size={width * 0.07} 
                                            color={theme.COLORS.white} 
                                        />
                                    </View>
                                </LinearGradient>
                                <Text style={styles.iconLabel}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Featured Houses */}
                    {renderSectionHeader(
                        "Explore Recent Estates",
                        true,
                        () => navigation.navigate('AllPropertiesScreen', { category: 'Featured' })
                    )}
                    {renderFeaturedContent()}

                    {/* All Properties (Second Section) */}
                    {renderSectionHeader(
                        `All Available Properties (${nearbyProperties.length} properties)`,
                        true,
                        () => navigation.navigate('AllPropertiesScreen', { category: 'All' })
                    )}
                    {nearbyDistance && nearbyProperties.length > 0 && (
                        <Text style={styles.nearbyInfoText}>
                            {nearbyDistance} - Complete property listing
                        </Text>
                    )}

                    {renderNearbyContent()}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Floating Chat Button */}
            <ChatButton
                onPress={handleChatPress}
                theme={theme}
                hasUnreadMessages={hasUnreadMessages}
            />
        </SafeAreaView>
    );
};

export default Homescreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.COLORS.background,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
    },
    fixedBannerContainer: {
        position: 'absolute',
        top: 0,
        width: "100%",
        zIndex: 1,
    },
    fixedSearchBarContainer: {
        position: 'absolute',
        width: '100%',
        zIndex: 2,
        paddingHorizontal: theme.SPACING.l,
    },
    bannerImage: {
        width: "100%",
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        position: "absolute",
        top: Platform.OS === 'ios' ? 36 : (StatusBar.currentHeight ? Math.max(2, StatusBar.currentHeight - 10) : 4),
        left: theme.SPACING.l,
        right: theme.SPACING.l,
        zIndex: 3,
    },
    logo: {
        width: width * 0.46,
        height: height * 0.12,
        resizeMode: 'contain',
        maxWidth: width * 0.75,
        flexShrink: 1,
        marginLeft: -2,
        transform: [{ translateX: -20 }, { translateY: -30 }],
    },
    headerRightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    postPropertyButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: theme.SPACING.s,
        paddingHorizontal: theme.SPACING.m,
        borderRadius: theme.RADIUS.m,
        justifyContent: 'center',
        minWidth: 110,
        transform: [{ translateX: -25 }, { translateY: -23 }],
    },
    postPropertyText: {
        color: theme.COLORS.primary,
        fontWeight: "bold",
        fontSize: theme.FONT_SIZES.body,
    },
    freeBadge: {
        backgroundColor: theme.COLORS.secondary,
        borderRadius: theme.RADIUS.s,
        paddingHorizontal: theme.SPACING.xs,
        marginLeft: theme.SPACING.xs,
    },
    freeText: {
        color: theme.COLORS.white,
        fontWeight: "bold",
        fontSize: 10,
    },
    notificationIconContainer: {
        width: 46,
        height: 46,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: 'transparent',
        marginLeft: theme.SPACING.s,
        overflow: 'visible',
        transform: [{ translateX: -34 }, { translateY: -22 }],
    },
    notificationGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 7,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    notificationIconInner: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationBadgeHeader: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: theme.COLORS.notification,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 3,
        zIndex: 6,
    },
    notificationBadgeText: {
        color: theme.COLORS.white,
        fontSize: 10,
        fontWeight: '700',
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.COLORS.white,
        borderRadius: theme.RADIUS.m,
        paddingHorizontal: theme.SPACING.m,
        borderWidth: 1,
        borderColor: theme.COLORS.greyLight,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
    },
    searchInput: {
        flex: 1,
        paddingHorizontal: theme.SPACING.s,
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.greyDark,
        paddingVertical: Platform.OS === 'ios' ? theme.SPACING.s : 0,
    },
    scrollableContent: {
        flex: 1
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.SPACING.l,
        marginTop: theme.SPACING.l,
        marginBottom: theme.SPACING.m,
    },
    sectionTitle: {
        fontSize: theme.FONT_SIZES.h3,
        fontWeight: "700",
        color: theme.COLORS.black,
    },
    seeAllText: {
        color: theme.COLORS.primary,
        fontWeight: '600',
        fontSize: theme.FONT_SIZES.body,
    },
    nearbyInfoText: {
        fontSize: theme.FONT_SIZES.small,
        color: theme.COLORS.greyMedium,
        marginHorizontal: theme.SPACING.l,
        marginTop: -theme.SPACING.s,
        marginBottom: theme.SPACING.s,
        fontStyle: 'italic',
    },
    quickActionsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingHorizontal: theme.SPACING.l,
        marginTop: theme.SPACING.xl,
        transform: [{ translateY: -12 }],
    },
    iconCard: {
        alignItems: "center",
        width: width * 0.26,
    },
    iconCircle: {
        width: width * 0.18,
        height: width * 0.18,
        borderRadius: theme.RADIUS.m,
        justifyContent: "center",
        alignItems: "center",
        padding: width * 0.02,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 6,
    },
    iconInnerRing: {
        width: '86%',
        height: '86%',
        borderRadius: theme.RADIUS.m * 0.8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    iconLabel: {
        fontSize: theme.FONT_SIZES.body,
        fontWeight: "600",
        textAlign: "center",
        color: theme.COLORS.greyDark,
        marginTop: theme.SPACING.s,
    },
    horizontalScrollContainer: {
        paddingHorizontal: theme.SPACING.l,
        paddingBottom: theme.SPACING.l,
    },
    featuredCard: {
        width: width * 0.75,
        height: height * 0.25,
        marginRight: theme.SPACING.m,
        borderRadius: theme.RADIUS.l,
        overflow: 'hidden',
    },
    featuredImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
    },
    featuredOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: theme.RADIUS.l,
    },
    favoriteIconContainer: {
        position: 'absolute',
        top: theme.SPACING.m,
        right: theme.SPACING.m,
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: theme.SPACING.xs,
        borderRadius: theme.RADIUS.full,
        zIndex: 5,
    },
    featuredInfo: {
        padding: theme.SPACING.m,
    },
    featuredTitle: {
        fontSize: theme.FONT_SIZES.h4,
        fontWeight: '700',
        color: theme.COLORS.white,
    },
    featuredLocation: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.greyLight,
        marginBottom: theme.SPACING.xs,
    },
    featuredPrice: {
        fontSize: theme.FONT_SIZES.h3,
        fontWeight: 'bold',
        color: theme.COLORS.white,
    },
    nearbyGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: theme.SPACING.l,
        marginBottom: theme.SPACING.l,
    },
    nearbyCard: {
        width: (width - theme.SPACING.l * 2 - theme.SPACING.m) / 2,
        marginBottom: theme.SPACING.m,
        borderRadius: theme.RADIUS.m,
        backgroundColor: theme.COLORS.white,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    nearbyImage: {
        width: '100%',
        height: 100,
        borderTopLeftRadius: theme.RADIUS.m,
        borderTopRightRadius: theme.RADIUS.m,
        resizeMode: 'cover',
    },
    nearbyInfo: {
        padding: theme.SPACING.s,
    },
    nearbyTitle: {
        fontSize: theme.FONT_SIZES.body,
        fontWeight: '700',
        color: theme.COLORS.black,
        marginBottom: theme.SPACING.xs,
    },
    locationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.SPACING.s,
    },
    nearbyLocation: {
        fontSize: theme.FONT_SIZES.caption,
        color: theme.COLORS.greyMedium,
        marginLeft: 2,
    },
    priceRatingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: theme.SPACING.xs,
    },
    nearbyPrice: {
        fontSize: theme.FONT_SIZES.h4,
        fontWeight: 'bold',
        color: theme.COLORS.primary,
    },
    pricePerMonth: {
        fontSize: theme.FONT_SIZES.caption,
        fontWeight: 'normal',
        color: theme.COLORS.greyMedium,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.COLORS.lightBackground,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    ratingText: {
        fontSize: theme.FONT_SIZES.caption,
        fontWeight: '600',
        color: theme.COLORS.greyDark,
        marginLeft: 3,
    },
    loaderStyle: {
        padding: theme.SPACING.xl,
    },
    retryContainer: {
        padding: theme.SPACING.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        fontSize: theme.FONT_SIZES.h4,
        color: theme.COLORS.notification,
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: theme.SPACING.xs,
    },
    retryText: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.greyMedium,
        textDecorationLine: 'underline',
    },
    noDataText: {
        textAlign: 'center',
        padding: theme.SPACING.xl,
        color: theme.COLORS.greyMedium,
        fontSize: theme.FONT_SIZES.body,
    },
    floatingChatButton: {
        position: 'absolute',
        bottom: 80,
        right: theme.SPACING.m,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 15,
    },
    chatButtonInnerGlass: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        overflow: 'hidden',
    },
    notificationBadgeGlass: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 15,
        height: 15,
        borderRadius: 7.5,
        backgroundColor: theme.COLORS.notification,
        borderWidth: 2,
        borderColor: theme.COLORS.white,
    },
    locationFilterContainer: {
        padding: theme.SPACING.m,
        marginHorizontal: theme.SPACING.l,
        marginBottom: theme.SPACING.m,
        borderRadius: theme.RADIUS.m,
        backgroundColor: theme.COLORS.white,
        borderWidth: 1,
        borderColor: theme.COLORS.greyLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.SPACING.s,
    },
    locationText: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.greyDark,
        fontWeight: '600',
        marginLeft: 8,
        flex: 1,
    },
    locationButtonsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: theme.SPACING.s,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.COLORS.primary,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: theme.RADIUS.s,
        flex: 1,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    editLocationButton: {
        backgroundColor: theme.COLORS.white,
        borderWidth: 1.5,
        borderColor: theme.COLORS.primary,
    },
    locationButtonText: {
        color: theme.COLORS.white,
        fontWeight: '700',
        fontSize: theme.FONT_SIZES.caption,
    },
    editLocationText: {
        color: theme.COLORS.primary,
        fontWeight: '700',
        fontSize: theme.FONT_SIZES.body,
        textDecorationLine: 'underline',
    },
    distanceFilterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: theme.SPACING.s,
    },
    distanceText: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.greyDark,
        fontWeight: '600',
    },
    distanceInput: {
        width: 60,
        height: 40,
        borderWidth: 1,
        borderColor: theme.COLORS.greyLight,
        borderRadius: theme.RADIUS.s,
        textAlign: 'center',
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.greyDark,
        backgroundColor: theme.COLORS.lightBackground,
        marginHorizontal: theme.SPACING.s,
    },
    applyButton: {
        paddingVertical: theme.SPACING.xs,
        paddingHorizontal: theme.SPACING.m,
        backgroundColor: theme.COLORS.primary,
        borderRadius: theme.RADIUS.s,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    applyButtonText: {
        color: theme.COLORS.white,
        fontWeight: '700',
        fontSize: theme.FONT_SIZES.body,
    },
    manualLocationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.SPACING.m,
        gap: 8,
    },
    manualLocationInput: {
        flex: 1,
        height: 46,
        borderWidth: 1.5,
        borderColor: theme.COLORS.primary,
        borderRadius: theme.RADIUS.s,
        paddingHorizontal: theme.SPACING.m,
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.greyDark,
        backgroundColor: theme.COLORS.white,
        fontWeight: '500',
    },
    saveButton: {
        width: 46,
        height: 46,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.COLORS.secondary,
        borderRadius: theme.RADIUS.s,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    saveButtonText: {
        color: theme.COLORS.white,
        fontWeight: '700',
        fontSize: theme.FONT_SIZES.body,
    },
    disabledButton: {
        opacity: 0.5,
    },
    distanceUnitText: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.greyDark,
        fontWeight: '600',
        marginRight: theme.SPACING.s,
    },
    // New styles for independent location selection
    selectedLocationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.COLORS.lightBackground,
        borderRadius: theme.RADIUS.s,
        paddingHorizontal: theme.SPACING.m,
        paddingVertical: theme.SPACING.s,
        marginBottom: theme.SPACING.s,
        borderWidth: 1,
        borderColor: theme.COLORS.secondary,
    },
    selectedLocationText: {
        flex: 1,
        fontSize: theme.FONT_SIZES.caption,
        color: theme.COLORS.greyDark,
        fontWeight: '600',
        marginLeft: 6,
    },
    clearLocationButton: {
        padding: 4,
    },
    // Quick location buttons styles
    quickLocationsContainer: {
        marginBottom: theme.SPACING.m,
    },
    quickLocationsTitle: {
        fontSize: theme.FONT_SIZES.caption,
        color: theme.COLORS.greyDark,
        fontWeight: '600',
        marginBottom: theme.SPACING.s,
    },
    quickLocationsScroll: {
        paddingRight: theme.SPACING.l,
    },
    quickLocationButton: {
        backgroundColor: theme.COLORS.lightBackground,
        borderRadius: theme.RADIUS.s,
        paddingHorizontal: theme.SPACING.m,
        paddingVertical: theme.SPACING.s,
        marginRight: theme.SPACING.s,
        borderWidth: 1,
        borderColor: theme.COLORS.primary,
    },
    quickLocationText: {
        fontSize: theme.FONT_SIZES.caption,
        color: theme.COLORS.primary,
        fontWeight: '600',
    },
    // MediaCard related styles
    featuredMediaContainer: {
        position: 'relative',
        borderRadius: theme.RADIUS.l,
        overflow: 'hidden',
    },
    featuredMediaCard: {
        borderRadius: theme.RADIUS.l,
    },
    featuredMediaImage: {
        width: '100%',
        height: 180,
        borderRadius: theme.RADIUS.l,
    },
    nearbyMediaCard: {
        borderTopLeftRadius: theme.RADIUS.m,
        borderTopRightRadius: theme.RADIUS.m,
    },
});