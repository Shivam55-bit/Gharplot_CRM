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

// Location functionality removed

// API imports
import {
    getRecentProperties,
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
        primary: "#1E90FF",        // Blue
        primaryLight: "#4BA3FF",   // Lighter blue
        primaryDark: "#1873CC",    // Darker blue
        secondary: "#1E90FF",      // Blue accent
        secondaryLight: "#87CEEB", // Light blue
        background: "#F8FAFC",
        white: "#FFFFFF",
        black: "#1A1A1A",          // Black from logo
        greyLight: "#E2E8F0",
        greyMedium: "#64748B",
        greyDark: "#1E293B",
        accent: "#1E90FF",         // Blue accent
        star: "#FBBF24",
        overlay: "rgba(26,26,26,0.85)",
        overlayLight: "rgba(26,26,26,0.4)",
        notification: "#EF4444",
        lightBackground: "rgba(30, 144, 255, 0.05)",
        success: "#1E90FF",
        warning: "#F59E0B",
        danger: "#EF4444",
    },
    GRADIENTS: {
        primary: ["#4BA3FF", "#1E90FF", "#1873CC"],      // Blue gradient
        secondary: ["#4BA3FF", "#1E90FF", "#1873CC"],    // Blue gradient
        accent: ["#4BA3FF", "#1E90FF", "#1873CC"],       // Blue gradient
        warm: ["#FCD34D", "#F59E0B", "#D97706"],
        cool: ["#67E8F9", "#06B6D4", "#0891B2"],
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

// Location geocoding functionality removed

const Homescreen = ({ navigation }) => {

    // Debug function to check login status (for testing)
    const checkLoginStatus = async () => {
        const credentials = await getStoredCredentials();
        
        Alert.alert(
            'Login Status Debug',
            `Legacy Login: ${credentials.isLoggedIn}\nToken: ${credentials.token ? 'Present' : 'None'}\nUser ID: ${credentials.userId || 'None'}`,
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

    // Local Properties States (user's own properties)
    const [localProperties, setLocalProperties] = useState([]);
    const [isLocalPropertiesLoading, setIsLocalPropertiesLoading] = useState(true);
    const [localPropertiesError, setLocalPropertiesError] = useState(null);

    // All Properties States
    const [allProperties, setAllProperties] = useState([]);
    const [isAllPropertiesLoading, setIsAllPropertiesLoading] = useState(true);
    const [allPropertiesError, setAllPropertiesError] = useState(null);

    // UI States
    const [hasUnreadMessages, setHasUnreadMessages] = useState(true);
    const [notificationCount, setNotificationCount] = useState(0);

    // Location states removed - no longer using location-based filtering
    
    // Add ref to track mount and prevent double loading
    const isInitialMount = useRef(true);
    const hasLoadedData = useRef(false);
    const userLoginSession = useRef(Date.now()); // Track login session

    // Current logged-in user ID
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // Location fetching functionality removed

    // Load User's Local Properties
    const loadLocalProperties = async () => {
        try {
            setIsLocalPropertiesLoading(true);
            setLocalPropertiesError(null);
            
            console.log('📱 Loading user local properties...');
            
            // Load from AsyncStorage
            const localPropertiesString = await AsyncStorage.getItem('local_properties');
            
            if (localPropertiesString) {
                const savedLocalProperties = JSON.parse(localPropertiesString);
                console.log('✅ Found', savedLocalProperties.length, 'local properties');
                
                // Format local properties for home screen display
                const formattedLocalProperties = savedLocalProperties.map(property => ({
                    ...property,
                    _id: property.id || property._id,
                    id: property.id || property._id,
                    title: property.title || `${property.propertyType} ${property.purpose} in ${property.propertyLocation}`,
                    price: property.price,
                    location: property.propertyLocation,
                    propertyLocation: property.propertyLocation,
                    description: property.description,
                    isUserProperty: true, // Mark as user's property
                    isLocal: true, // Mark as local property
                    stableKey: `local_${property.id}`,
                    processedImageUrl: property.photosAndVideo?.[0]?.uri || property.images?.[0]?.uri || FALLBACK_IMAGE_URI
                }));
                
                setLocalProperties(formattedLocalProperties);
            } else {
                console.log('📱 No local properties found');
                setLocalProperties([]);
            }
        } catch (error) {
            console.error('❌ Error loading local properties:', error);
            setLocalPropertiesError(error.message);
            setLocalProperties([]);
        } finally {
            setIsLocalPropertiesLoading(false);
        }
    };

    // Load All Properties
    const loadAllProperties = async () => {
        setIsAllPropertiesLoading(true);
        setAllPropertiesError(null);
        try {
            console.log('🏘️ Loading all properties');
            const properties = await getAllProperties();
            const validProperties = Array.isArray(properties) ? properties : [];
            setAllProperties(validProperties);
            console.log(`✅ Loaded ${validProperties.length} properties`);
        } catch (error) {
            console.error('❌ Error loading all properties:', error);
            setAllPropertiesError('Could not load properties. Tap to retry.');
            setAllProperties([]);
        } finally {
            setIsAllPropertiesLoading(false);
        }
    };

    // Location loading removed - no longer using location-based filtering

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
            
            const properties = await getRecentProperties(50); // Get more properties, but display only 15
            const validProperties = Array.isArray(properties) ? properties : [];
            
            // Batch state updates to prevent multiple re-renders
            setFeaturedProperties(validProperties);
            setIsFeaturedLoading(false);
            console.log(`✅ Featured loaded: ${validProperties.length} properties (displaying 15)`);
        } catch (e) {
            console.error("Featured Properties Error:", e);
            setFeaturedError("Could not load recent properties. Tap to retry.");
            setFeaturedProperties([]); // Set empty array on error
            setIsFeaturedLoading(false);
        }
        
        // Also load local properties whenever featured properties are loaded
        try {
            await loadLocalProperties();
        } catch (localError) {
            console.warn('⚠️ Failed to load local properties:', localError.message);
        }
    };

    // Load Properties - ONLY for manual refresh (pull to refresh)
    const loadProperties = useCallback(async () => {
        console.log('🔄 Manual refresh triggered');
        if (!isRefreshing) {
            setIsFeaturedLoading(true);
            setIsAllPropertiesLoading(true);
        }

        await Promise.all([
            loadFeaturedProperties(),
            loadAllProperties(),
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
                setIsInitialLoading(false);
                return;
            }
            
            // Set initial loading state
            setIsInitialLoading(true);
            setIsFeaturedLoading(true);
            setIsAllPropertiesLoading(true);
            
            // Small delay to prevent flash of loading state
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Load all data in parallel
            await Promise.all([
                loadFeaturedProperties(),
                loadAllProperties(),
                loadFavorites(),
                loadUserAvatar(), // Load avatar here to prevent focus reload
            ]);
            
            // Location settings removed - no longer using location-based filtering
            
            // Mark initial mount as complete and data as loaded
            isInitialMount.current = false;
            hasLoadedData.current = true;
            
            // Remove initial loading overlay
            setIsInitialLoading(false);
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

        // Listen for focus to reload notification count (but not properties)
        const focusListener = navigation.addListener('focus', () => {
            // Only reload notification count, don't reload properties to prevent blink
            loadNotificationCount();
        });

        return () => {
            notificationAddedListener.remove();
            notificationCountUpdatedListener.remove();
            focusListener(); // In React Navigation v6+, this is a function, not an object with remove()
        };
    }, [navigation]);

    // Fetch current user ID on mount
    useEffect(() => {
        const fetchCurrentUserId = async () => {
            try {
                const userId = await AsyncStorage.getItem('userId');
                if (userId) {
                    setCurrentUserId(userId);
                    console.log('✅ Current user ID loaded:', userId);
                }
            } catch (error) {
                console.error('❌ Error fetching current user ID:', error);
            }
        };
        fetchCurrentUserId();
    }, []);

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
                <TouchableOpacity onPress={onSeeAllPress} activeOpacity={0.8}>
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
            // Check if the property belongs to the current user
            const propertyOwnerId = item?.userId || item?.ownerId || item?.postedBy?._id || item?.postedBy || item?.user?._id || item?.user;
            
            // Debug logs
            console.log('🔍 Property ownership check (Featured):');
            console.log('   Current User ID:', currentUserId);
            console.log('   Property Owner ID:', propertyOwnerId);
            console.log('   Property Data:', {
                userId: item?.userId,
                ownerId: item?.ownerId,
                postedBy: item?.postedBy,
                user: item?.user
            });
            
            if (currentUserId && propertyOwnerId && currentUserId === String(propertyOwnerId)) {
                // User owns this property, show details directly
                console.log('✅ User owns this property (featured section), showing details directly');
                navigation.navigate('PropertyDetailsScreen', { property: item });
                return;
            } else {
                console.log('❌ Property ownership check failed or property belongs to another user');
            }

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

    // For All Properties section
    const openPropertyForInquiry = (item) => {
        // Check if the property belongs to the current user
        const propertyOwnerId = item?.userId || item?.ownerId || item?.postedBy?._id || item?.postedBy || item?.user?._id || item?.user;
        
        // Debug logs
        console.log('🔍 Property ownership check (All Properties):');
        console.log('   Current User ID:', currentUserId);
        console.log('   Property Owner ID:', propertyOwnerId);
        console.log('   Property Data:', {
            userId: item?.userId,
            ownerId: item?.ownerId,
            postedBy: item?.postedBy,
            user: item?.user
        });
        
        if (currentUserId && propertyOwnerId && currentUserId === String(propertyOwnerId)) {
            // User owns this property, show details directly
            console.log('✅ User owns this property (all properties section), showing details directly');
            navigation.navigate('PropertyDetailsScreen', { property: item });
        } else {
            // Otherwise, show inquiry form
            console.log('❌ Property ownership check failed or property belongs to another user');
            navigation.navigate('PropertyInquiryFormScreen', { property: item });
        }
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

    // Complete notification system test
    const handleAddTestNotifications = async () => {
        try {
            Alert.alert(
                'Notification Test',
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
                            const { quickFixFCMIssues } = await import('../utils/fcmTestService');
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

    // Distance-based filtering removed

    // Memoize featured properties - Include user's local properties at the top
    const processedFeaturedProperties = useMemo(() => {
        console.log('🖼️ Processing featured properties (STABLE) with local properties');
        
        // Start with user's local properties (shown first)
        let allProperties = [];
        
        // Add local properties at the top
        if (localProperties && localProperties.length > 0) {
            console.log('📱 Adding', localProperties.length, 'local properties to featured');
            allProperties = [...localProperties];
        }
        
        // Add server properties (excluding user's own server properties)
        if (featuredProperties && featuredProperties.length > 0) {
            const serverProperties = featuredProperties
                .filter(item => {
                    // Filter out properties posted by the current user (server properties only)
                    const propertyOwnerId = item?.userId || item?.ownerId || item?.postedBy?._id || item?.postedBy || item?.user?._id || item?.user;
                    const isOwnProperty = currentUserId && propertyOwnerId && currentUserId === String(propertyOwnerId);
                    
                    if (isOwnProperty) {
                        console.log('🚫 Hiding own server property from featured:', item._id);
                    }
                    
                    return !isOwnProperty; // Exclude own server properties
                });
            
            allProperties = [...allProperties, ...serverProperties];
        }
        
        // Process all properties for display
        return allProperties.map((item, index) => {
            if (item.isLocal) {
                // For local properties, use the stored image URI directly
                return {
                    ...item,
                    processedImageUrl: item.processedImageUrl || FALLBACK_IMAGE_URI,
                    stableKey: item.stableKey || `local_${item.id}_${index}`,
                    isUserProperty: true
                };
            } else {
                // For server properties, process images as before
                const firstImage = getFirstImageUrl(item.photosAndVideo);
                let imageUrl;
                if (firstImage && typeof firstImage === 'string' && firstImage.startsWith('file://')) {
                    imageUrl = firstImage;
                } else {
                    imageUrl = formatImageUrl(firstImage) || FALLBACK_IMAGE_URI;
                }
                
                return {
                    ...item,
                    processedImageUrl: imageUrl,
                    stableKey: `featured_${item._id || index}`,
                    isUserProperty: false
                };
            }
        });
    }, [featuredProperties, localProperties, currentUserId]);

    // Limit featured properties to 15 for home screen display
    const displayedFeaturedProperties = useMemo(() => {
        return processedFeaturedProperties.slice(0, 15);
    }, [processedFeaturedProperties]);

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
        if (displayedFeaturedProperties.length === 0) {
            return <Text style={styles.noDataText}>No recent estates found.</Text>;
        }

        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScrollContainer}
            >
                {displayedFeaturedProperties.map((item, index) => {
                    // Better image processing with multiple fallbacks
                    let imageUri = FALLBACK_IMAGE_URI;
                    
                    // First priority: use processedImageUrl if available
                    if (item.processedImageUrl && item.processedImageUrl !== FALLBACK_IMAGE_URI) {
                        imageUri = item.processedImageUrl;
                    }
                    // Second priority: process photosAndVideo array
                    else if (item.photosAndVideo && Array.isArray(item.photosAndVideo) && item.photosAndVideo.length > 0) {
                        const firstImageData = item.photosAndVideo[0];
                        const rawUri = firstImageData?.uri || firstImageData;
                        
                        if (rawUri && typeof rawUri === 'string') {
                            // Use local file URIs directly
                            if (rawUri.startsWith('file://')) {
                                imageUri = rawUri;
                            } 
                            // Format server URIs
                            else {
                                const formattedUri = formatImageUrl(rawUri);
                                if (formattedUri && formattedUri !== 'https://placehold.co/600x400/CCCCCC/888888?text=No+Image') {
                                    imageUri = formattedUri;
                                }
                            }
                        }
                    }
                    // Third priority: check for single image property
                    else if (item.image) {
                        const formattedUri = formatImageUrl(item.image);
                        if (formattedUri && formattedUri !== 'https://placehold.co/600x400/CCCCCC/888888?text=No+Image') {
                            imageUri = formattedUri;
                        }
                    }

                    return (
                        <TouchableOpacity
                            key={item.stableKey}
                            style={styles.featuredHouseCard}
                            onPress={() => openProperty(item)}
                            activeOpacity={0.9}
                        >
                            {/* Property Image - Simple Image for better performance */}
                            <View style={styles.featuredHouseImageContainer}>
                                <Image
                                    source={{ uri: imageUri }}
                                    style={styles.featuredHouseImage}
                                    resizeMode="cover"
                                    onError={() => {
                                        console.warn('Featured: Failed to load image:', imageUri);
                                    }}
                                    onLoad={() => {
                                        // console.log('Featured: Successfully loaded image:', imageUri);
                                    }}
                                />
                                
                                {/* Favorite Icon - Top Left */}
                                <TouchableOpacity 
                                    onPress={() => toggleFavorite(item._id)} 
                                    style={styles.featuredHouseFavoriteIcon}
                                    activeOpacity={0.7}
                                >
                                    <Icon
                                        name={favorites.includes(item._id) ? "heart" : "heart-outline"}
                                        size={20}
                                        color={favorites.includes(item._id) ? "#EF4444" : "#64748B"}
                                    />
                                </TouchableOpacity>

                                {/* Property Type Badge - Bottom Left */}
                                <View style={styles.propertyTypeBadge}>
                                    <Text style={styles.propertyTypeText}>
                                        {item.purpose || 'Apartment'}
                                    </Text>
                                </View>

                                {/* User Property Badge - Bottom Right */}
                                {item.isUserProperty && (
                                    <View style={styles.userPropertyBadge}>
                                        <Icon name="person" size={12} color="#FFFFFF" />
                                        <Text style={styles.userPropertyText}>My Property</Text>
                                    </View>
                                )}
                            </View>

                            {/* Property Details - Right Side */}
                            <View style={styles.featuredHouseDetails}>
                                {/* Title */}
                                <Text style={styles.featuredHouseTitle} numberOfLines={2}>
                                    {item.description || 'Sky Dandelions Apartment'}
                                </Text>

                                {/* Location */}
                                <View style={styles.featuredHouseLocation}>
                                    <Icon name="location-outline" size={12} color="#64748B" />
                                    <Text style={styles.featuredHouseLocationText} numberOfLines={1}>
                                        {item.propertyLocation || 'Jakarta, Indonesia'}
                                    </Text>
                                </View>

                                {/* Spacer to push price to bottom */}
                                <View style={{ flex: 1 }} />

                                {/* Price */}
                                <Text style={styles.featuredHousePrice}>
                                    {formatPrice(item.price)}
                                    {(item.purpose === 'rent' || item.purpose === 'lease') && (
                                        <Text style={styles.featuredHousePriceUnit}>/month</Text>
                                    )}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        );
    };

    // Process all properties and filter out user's own properties
    const displayedAllProperties = useMemo(() => {
        console.log('🏘️ Processing all properties');
        
        if (!allProperties || allProperties.length === 0) {
            return [];
        }
        
        const processed = allProperties
            .filter(item => {
                // Filter out properties posted by the current user
                const propertyOwnerId = item?.userId || item?.ownerId || item?.postedBy?._id || item?.postedBy || item?.user?._id || item?.user;
                const isOwnProperty = currentUserId && propertyOwnerId && currentUserId === String(propertyOwnerId);
                
                if (isOwnProperty) {
                    console.log('🚫 Hiding own property:', item._id);
                    return false;
                }
                return true;
            })
            .map((item, index) => {
                const firstImage = getFirstImageUrl(item.photosAndVideo);
                const imageUrl = formatImageUrl(firstImage) || FALLBACK_IMAGE_URI;
                
                return {
                    ...item,
                    processedImageUrl: imageUrl,
                    stableKey: `all_${item._id || index}`
                };
            });
        
        console.log('🎯 All Properties:', processed.length);
        return processed;
    }, [allProperties, currentUserId]);

    // Render All Properties Content
    const renderAllPropertiesContent = () => {
        if (isAllPropertiesLoading) {
            return <ActivityIndicator size="large" color={theme.COLORS.primary} style={styles.loaderStyle} />;
        }
        if (allPropertiesError) {
            return (
                <TouchableOpacity onPress={loadAllProperties} style={styles.retryContainer}>
                    <Text style={[styles.errorText, { color: theme.COLORS.greyMedium }]}>⚠️ {allPropertiesError}</Text>
                    <Text style={styles.retryText}>Tap to Retry</Text>
                </TouchableOpacity>
            );
        }
        if (displayedAllProperties.length === 0) {
            return <Text style={styles.noDataText}>No properties found.</Text>;
        }

        // Show all properties
        const limitedProperties = displayedAllProperties;

        return (
            <View style={styles.nearbyGrid}>
                {limitedProperties.map((item, index) => {
                    // Better image processing with multiple fallbacks
                    let imageUri = FALLBACK_IMAGE_URI;
                    
                    // First priority: use processedImageUrl if available
                    if (item.processedImageUrl && item.processedImageUrl !== FALLBACK_IMAGE_URI) {
                        imageUri = item.processedImageUrl;
                    }
                    // Second priority: process photosAndVideo array
                    else if (item.photosAndVideo && Array.isArray(item.photosAndVideo) && item.photosAndVideo.length > 0) {
                        const firstImageData = item.photosAndVideo[0];
                        const rawUri = firstImageData?.uri || firstImageData;
                        
                        if (rawUri && typeof rawUri === 'string') {
                            // Use local file URIs directly
                            if (rawUri.startsWith('file://')) {
                                imageUri = rawUri;
                            } 
                            // Format server URIs
                            else {
                                const formattedUri = formatImageUrl(rawUri);
                                if (formattedUri && formattedUri !== 'https://placehold.co/600x400/CCCCCC/888888?text=No+Image') {
                                    imageUri = formattedUri;
                                }
                            }
                        }
                    }
                    // Third priority: check for single image property
                    else if (item.image) {
                        const formattedUri = formatImageUrl(item.image);
                        if (formattedUri && formattedUri !== 'https://placehold.co/600x400/CCCCCC/888888?text=No+Image') {
                            imageUri = formattedUri;
                        }
                    }

                    return (
                        <TouchableOpacity
                            key={item.stableKey}
                            style={styles.nearbyCard}
                            onPress={() => openPropertyForInquiry(item)}
                            activeOpacity={0.9}
                        >
                            {/* Property Image */}
                            <Image
                                source={{ uri: imageUri }}
                                style={styles.nearbyImage}
                                resizeMode="cover"
                                defaultSource={require('../assets/icon-placeholder.js')}
                                onError={() => {
                                    console.warn('Failed to load image:', imageUri);
                                }}
                                onLoad={() => {
                                    // console.log('Successfully loaded image:', imageUri);
                                }}
                            />

                            {/* Property Details */}
                            <View style={styles.nearbyInfo}>
                                {/* Title */}
                                <Text style={styles.nearbyTitle} numberOfLines={1}>
                                    {item.description || 'Property Name'}
                                </Text>

                                {/* Location */}
                                <View style={styles.locationRow}>
                                    <Icon name="location-outline" size={13} color="#64748B" />
                                    <Text style={styles.nearbyLocation} numberOfLines={1}>
                                        {item.propertyLocation || 'Unknown Location'}
                                    </Text>
                                </View>

                                {/* Price */}
                                <Text style={styles.nearbyPrice}>
                                    {formatPrice(item.price)}
                                    {(item.purpose === 'rent' || item.purpose === 'lease') && (
                                        <Text style={styles.featuredHousePriceUnit}>/month</Text>
                                    )}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    // Manual location selection functionality removed

    // Stable render key
    const stableRenderKey = 'home_stable_v3';

    // Show initial loading overlay to prevent blink
    if (isInitialLoading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Image
                    source={require("../assets/Blue_logo.png")}
                    style={{ width: width * 0.5, height: height * 0.15, resizeMode: 'contain', marginBottom: 20 }}
                />
                <ActivityIndicator size="large" color={theme.COLORS.primary} />
                <Text style={{ marginTop: 16, fontSize: 16, color: theme.COLORS.lightText, fontWeight: '600' }}>Loading Properties...</Text>
            </SafeAreaView>
        );
    }

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
                        {/* CRM Button */}
                        <TouchableOpacity
                            style={styles.crmIconContainer}
                            onPress={() => navigation.navigate('AdminLogin')}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#4BA3FF', '#1E90FF', '#1873CC']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.crmGradient}
                            >
                                <View style={styles.crmIconInner}>
                                    <Icon 
                                        name="business-outline" 
                                        size={18} 
                                        color={theme.COLORS.white} 
                                    />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.notificationIconContainer}
                            onPress={handleNotificationPress}
                            onLongPress={handleAddTestNotifications}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={theme.GRADIENTS.primary}
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
                </View>
            </View>

            {/* Content with keyboard avoiding */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 60 }}
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
                    {/* Get Started With Section */}
                    <View style={styles.getStartedSection}>
                        <Text style={styles.getStartedTitle}>Get Started with</Text>
                        <View style={styles.quickActionsRow}>
                            {startedItems.map((item) => (
                                <View key={item.id} style={styles.actionButtonWrapper}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        activeOpacity={0.7}
                                        onPress={() => handleQuickAction(item.screen)}
                                    >
                                        <View style={styles.actionIconCircle}>
                                            <Icon 
                                                name={item.icon} 
                                                size={28} 
                                                color="#1F2937" 
                                            />
                                        </View>
                                    </TouchableOpacity>
                                    <Text style={styles.actionButtonLabel}>{item.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Featured Houses */}
                    {renderSectionHeader(
                        "Featured Properties",
                        true,
                        () => navigation.navigate('AllPropertiesScreen', { category: 'Featured' })
                    )}
                    {renderFeaturedContent()}

                    {/* All Properties */}
                    {renderSectionHeader(
                        "All Properties",
                        true,
                        () => navigation.navigate('AllPropertiesScreen', { category: 'All' })
                    )}
                    {renderAllPropertiesContent()}
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
        backgroundColor: '#F8FAFC',
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
    },
    fixedBannerContainer: {
        position: 'absolute',
        top: 0,
        width: "100%",
        zIndex: 1,
        overflow: 'hidden',
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
        width: width * 0.35,
        height: height * 0.09,
        resizeMode: 'contain',
        maxWidth: width * 0.6,
        flexShrink: 1,
        marginLeft: -2,
        transform: [{ translateX: -10 }, { translateY: -20 }],
    },
    headerRightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    postPropertyButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 16,
        // borderRadius: 16,
        justifyContent: 'center',
        minWidth: 110,
        backgroundColor: 'transparent',
        transform: [{ translateX: 20 }, { translateY: -5 }],
    },
    postPropertyText: {
        color: '#1E90FF',
        fontWeight: "800",
        fontSize: 14,
        letterSpacing: -0.3,
    },
    freeBadge: {
        backgroundColor: '#1E90FF',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 6,
        shadowColor: "#1E90FF",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 3,
    },
    freeText: {
        color: '#FFFFFF',
        fontWeight: "900",
        fontSize: 9,
        letterSpacing: 0.5,
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
        transform: [{ translateX: 0 }, { translateY: -5 }],
    },
    notificationGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
        shadowColor: "#1E90FF",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 10,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    notificationIconInner: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    crmIconContainer: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: 'transparent',
        marginLeft: theme.SPACING.s,
        overflow: 'visible',
        transform: [{ translateX: 0 }, { translateY: -5 }],
    },
    crmGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 3,
        shadowColor: "#1E90FF",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    crmIconInner: {
        width: '100%',
        height: '100%',
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    notificationBadgeHeader: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#EF4444',
        borderRadius: 12,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        zIndex: 6,
        shadowColor: "#EF4444",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
        elevation: 8,
        borderWidth: 2.5,
        borderColor: '#FFFFFF',
    },
    notificationBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: -0.3,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        paddingHorizontal: 18,
        borderWidth: 2,
        borderColor: 'rgba(30, 144, 255, 0.15)',
        shadowColor: "#1E90FF",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 12,
    },
    searchInput: {
        flex: 1,
        paddingHorizontal: 12,
        fontSize: 15,
        color: '#1F2937',
        fontWeight: '600',
        paddingVertical: Platform.OS === 'ios' ? 12 : 0,
    },
    scrollableContent: {
        flex: 1
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.SPACING.l,
        marginTop: 28,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: '#0F172A',
        letterSpacing: -0.5,
        flex: 1,
    },
    seeAllText: {
        color: '#1E90FF',
        fontWeight: '600',
        fontSize: 14,
        letterSpacing: -0.2,
    },
    nearbyInfoText: {
        fontSize: 13,
        color: '#475569',
        marginHorizontal: theme.SPACING.l,
        marginTop: -4,
        marginBottom: 16,
        fontWeight: '600',
        backgroundColor: 'rgba(30, 144, 255, 0.05)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#1E90FF',
        shadowColor: "#1E90FF",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    getStartedSection: {
        paddingHorizontal: theme.SPACING.l,
        marginTop: 16,
        marginBottom: 10,
    },
    getStartedTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: '#374151',
        marginBottom: 12,
        letterSpacing: 0,
    },
    quickActionsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 8,
    },
    actionButtonWrapper: {
        flex: 1,
        alignItems: 'center',
        maxWidth: 80,
    },
    actionButton: {
        width: '100%',
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: '#87CEEB',
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderRadius: 18,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 3,
        aspectRatio: 1,
    },
    actionIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    actionButtonLabel: {
        fontSize: 16,
        fontWeight: "700",
        color: '#1F2937',
        letterSpacing: -0.2,
        marginTop: 10,
        textAlign: 'center',
    },
    horizontalScrollContainer: {
        paddingHorizontal: theme.SPACING.l,
        paddingBottom: 24,
        paddingTop: 4,
    },
    featuredCard: {
        width: width * 0.75,
        height: height * 0.28,
        marginRight: 16,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    featuredImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
    },
    featuredOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 20,
    },
    favoriteIconContainer: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 8,
        borderRadius: 20,
        zIndex: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    featuredInfo: {
        padding: 16,
        paddingBottom: 20,
    },
    featuredTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 6,
        letterSpacing: -0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    featuredLocation: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 8,
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    featuredPrice: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.8,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    nearbyGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: theme.SPACING.l,
        marginBottom: 10,
        marginTop: 4,
    },
    nearbyCard: {
        width: (width - theme.SPACING.l * 2 - 12) / 2,
        marginBottom: 16,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    nearbyMediaContainer: {
        position: 'relative',
        width: '100%',
    },
    nearbyFavoriteIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 6,
        borderRadius: 20,
        zIndex: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    nearbyImage: {
        width: '100%',
        height: 120,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        resizeMode: 'cover',
        backgroundColor: '#E5E7EB',
    },
    nearbyInfo: {
        padding: 12,
        paddingBottom: 14,
        backgroundColor: '#FFFFFF',
    },
    nearbyTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 6,
        letterSpacing: -0.3,
        lineHeight: 18,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    nearbyLocation: {
        fontSize: 11,
        color: '#64748B',
        marginLeft: 4,
        flex: 1,
        fontWeight: '500',
        lineHeight: 14,
    },
    priceRatingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    nearbyPrice: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E90FF',
        letterSpacing: -0.5,
    },
    pricePerMonth: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 3,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#F59E0B',
        marginLeft: 3,
    },
    loaderStyle: {
        padding: theme.SPACING.xl,
    },
    retryContainer: {
        padding: theme.SPACING.xl,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        margin: theme.SPACING.l,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    errorText: {
        fontSize: 16,
        color: '#EF4444',
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
    },
    retryText: {
        fontSize: 14,
        color: '#1E90FF',
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
    noDataText: {
        textAlign: 'center',
        padding: theme.SPACING.xl,
        color: '#64748B',
        fontSize: 15,
        fontWeight: '600',
    },
    floatingChatButton: {
        position: 'absolute',
        bottom: 80,
        right: 20,
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        shadowColor: "#1E90FF",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 20,
    },
    chatButtonInnerGlass: {
        width: '100%',
        height: '100%',
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderWidth: 3,
        borderColor: 'rgba(30, 144, 255, 0.3)',
        overflow: 'hidden',
    },
    notificationBadgeGlass: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#EF4444',
        borderWidth: 3,
        borderColor: '#FFFFFF',
        shadowColor: "#EF4444",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
        elevation: 8,
    },
    locationFilterContainer: {
        padding: 18,
        marginHorizontal: theme.SPACING.l,
        marginBottom: 20,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderWidth: 2,
        borderColor: 'rgba(30, 144, 255, 0.15)',
        shadowColor: '#1E90FF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    locationText: {
        fontSize: 15,
        color: '#0F172A',
        fontWeight: '800',
        marginLeft: 10,
        flex: 1,
        letterSpacing: -0.3,
    },
    locationButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1E90FF',
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 14,
        flex: 1,
        gap: 8,
        shadowColor: '#1E90FF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    editLocationButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderWidth: 2,
        borderColor: '#1E90FF',
    },
    locationButtonText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 13,
        letterSpacing: -0.3,
    },
    editLocationText: {
        color: '#1E90FF',
        fontWeight: '800',
        fontSize: 14,
        letterSpacing: -0.3,
    },
    distanceFilterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
        backgroundColor: 'rgba(30, 144, 255, 0.05)',
        padding: 12,
        borderRadius: 12,
    },
    distanceText: {
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '700',
    },
    distanceInput: {
        width: 65,
        height: 44,
        borderWidth: 2,
        borderColor: '#1E90FF',
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 10,
        shadowColor: '#1E90FF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    applyButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: '#1E90FF',
        borderRadius: 12,
        shadowColor: '#1E90FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    applyButtonText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 14,
        letterSpacing: -0.3,
    },
    manualLocationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 10,
    },
    manualLocationInput: {
        flex: 1,
        height: 50,
        borderWidth: 2,
        borderColor: '#1E90FF',
        borderRadius: 16,
        paddingHorizontal: 16,
        fontSize: 15,
        color: '#0F172A',
        backgroundColor: '#FFFFFF',
        fontWeight: '700',
        shadowColor: '#1E90FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButton: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1E90FF',
        borderRadius: 16,
        shadowColor: '#1E90FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 15,
    },
    disabledButton: {
        opacity: 0.5,
    },
    distanceUnitText: {
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '700',
        marginRight: 8,
    },
    selectedLocationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    selectedLocationText: {
        flex: 1,
        fontSize: 13,
        color: '#059669',
        fontWeight: '800',
        marginLeft: 8,
        letterSpacing: -0.3,
    },
    clearLocationButton: {
        padding: 6,
    },
    quickLocationsContainer: {
        marginBottom: 16,
    },
    quickLocationsTitle: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '700',
        marginBottom: 10,
        letterSpacing: -0.2,
    },
    quickLocationsScroll: {
        paddingRight: theme.SPACING.l,
    },
    quickLocationButton: {
        backgroundColor: 'rgba(30, 144, 255, 0.08)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 10,
        borderWidth: 2,
        borderColor: 'rgba(30, 144, 255, 0.2)',
        shadowColor: '#1E90FF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    quickLocationText: {
        fontSize: 13,
        color: '#1E90FF',
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    featuredMediaContainer: {
        position: 'relative',
        borderRadius: 28,
        overflow: 'hidden',
        height: '100%',
    },
    featuredMediaCard: {
        borderRadius: 28,
        height: '100%',
    },
    featuredMediaImage: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
    },
    nearbyMediaCard: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    // Featured Houses Card Styles (Enhanced Horizontal Layout)
    featuredHouseCard: {
        flexDirection: 'row',
        width: width * 0.87,
        height: 170,
        marginRight: 18,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        shadowColor: "#1E90FF",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(30, 144, 255, 0.08)',
    },
    featuredHouseImageContainer: {
        position: 'relative',
        width: '46%',
        height: '100%',
        backgroundColor: '#F1F5F9',
    },
    featuredHouseMediaCard: {
        width: '100%',
        height: '100%',
        borderRadius: 0,
    },
    featuredHouseImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    featuredHouseFavoriteIcon: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    propertyTypeBadge: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        backgroundColor: '#1E90FF',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 8,
        shadowColor: "#1E90FF",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    propertyTypeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.3,
        textTransform: 'capitalize',
    },
    userPropertyBadge: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: '#10B981', // Green color for user's property
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#10B981",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    userPropertyText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '700',
        marginLeft: 3,
    },
    featuredHouseDetails: {
        flex: 1,
        padding: 14,
        paddingLeft: 16,
        paddingRight: 14,
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
    },
    featuredHouseTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 5,
        letterSpacing: -0.4,
        lineHeight: 20,
    },
    featuredHouseRating: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    featuredHouseRatingText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0F172A',
        marginLeft: 5,
    },
    featuredHouseLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingVertical: 2,
    },
    featuredHouseLocationText: {
        fontSize: 12,
        color: '#64748B',
        marginLeft: 5,
        flex: 1,
        fontWeight: '600',
        letterSpacing: -0.1,
    },
    featuredHousePrice: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E90FF',
        letterSpacing: -0.8,
    },
    featuredHousePriceUnit: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
        letterSpacing: -0.2,
    },
    // Residential Card Styles (Horizontal List)
    residentialCard: {
        width: width * 0.75,
        marginRight: 16,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.8)',
    },
    residentialImageContainer: {
        width: '100%',
        height: 140,
        backgroundColor: '#F1F5F9',
    },
    residentialMediaCard: {
        width: '100%',
        height: '100%',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    residentialImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    residentialDetails: {
        padding: 14,
        paddingTop: 12,
    },
    residentialTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    residentialLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    residentialLocationText: {
        fontSize: 13,
        color: '#64748B',
        marginLeft: 4,
        flex: 1,
        fontWeight: '600',
    },
    residentialPriceRatingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    residentialPrice: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    residentialRating: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    residentialRatingText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0F172A',
        marginLeft: 4,
    },
});
