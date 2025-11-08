import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Animated,
  Platform,
  SafeAreaView,
  Linking,
  Modal,
  StatusBar,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import MediaCard from "../components/MediaCard";
import {
  formatImageUrl,
  formatPrice,
  getRecentProperties,
  getNearbyProperties,
} from "../services/homeApi";

const { width, height } = Dimensions.get("window");
const GALLERY_HEIGHT = Math.round(height * 0.44);
const DOT_SIZE = 8;

// --- Colors ---
const colors = {
  // switch to blue primary/accent
  primary: "#1E90FF",
  accent: "#5DA9F6",
  white: "#FFFFFF",
  background: "#F5F8FF",
  text: "#222",
  muted: "#6B7280",
};

// --- Amenity Icons ---
const getAmenityIcon = (name) => {
  switch (name) {
    case "Gym": return "barbell-outline";
    case "Pool": return "water-outline";
    case "Balcony": return "sunny-outline";
    case "Security": return "shield-checkmark-outline";
    case "Parking": return "car-outline";
    case "Lift": return "business-outline";
    case "Park": return "leaf-outline";
    default: return "flash-outline";
  }
};

const PropertyDetailsScreen = ({ navigation, route }) => {
  const { property: routeProperty, itemId, user: routeUser, fromAddProperty } = route?.params || {};
  const [property, setProperty] = useState(routeProperty || null);
  const [loading, setLoading] = useState(!routeProperty);
  
  // Smart back navigation handler
  const handleBackPress = () => {
    if (fromAddProperty) {
      // If coming from AddSellScreen, navigate to Home
      navigation.navigate('Home');
    } else {
      // Otherwise, use normal back navigation
      navigation.goBack();
    }
  };
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showFullscreenMedia, setShowFullscreenMedia] = useState(false);
  const [fullscreenMediaIndex, setFullscreenMediaIndex] = useState(0);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (property) return;

    const fetchAndFind = async () => {
      setLoading(true);
      try {
        const [recent, nearby] = await Promise.all([
          getRecentProperties(20),
          getNearbyProperties(0, 0),
        ]);

        const all = [...(recent || []), ...(nearby || [])];
        const found = all.find((p) => p._id === itemId || p.id === itemId);
        if (found) setProperty(found);
      } catch (err) {
        console.warn("Property lookup failed", err);
      } finally {
        setLoading(false);
      }
    };

    if (itemId) fetchAndFind();
    else setLoading(false);
  }, [itemId]);

  // Check if inquiry was already submitted for this property
  useEffect(() => {
    const checkInquiryStatus = async () => {
      if (property) {
        try {
          const propertyId = property._id || property.id || property.propertyId;
          if (propertyId) {
            const inquiryFlag = await AsyncStorage.getItem(`inquirySubmitted:${propertyId}`);
            setInquirySubmitted(!!inquiryFlag);
          }
        } catch (error) {
          console.warn('Failed to check inquiry status:', error);
        }
      }
    };

    checkInquiryStatus();
  }, [property]);

  // Listen for navigation focus to update inquiry status
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Re-check inquiry status when screen is focused
      if (property) {
        const checkInquiryStatus = async () => {
          try {
            const propertyId = property._id || property.id || property.propertyId;
            if (propertyId) {
              const inquiryFlag = await AsyncStorage.getItem(`inquirySubmitted:${propertyId}`);
              setInquirySubmitted(!!inquiryFlag);
            }
          } catch (error) {
            console.warn('Failed to check inquiry status:', error);
          }
        };
        checkInquiryStatus();
      }
    });

    return unsubscribe;
  }, [navigation, property]);

  // Handle inquiry button press
  const handleInquiryPress = async () => {
    if (inquirySubmitted) {
      Alert.alert(
        'Inquiry Already Submitted',
        'You have already submitted an inquiry for this property. The agent will contact you soon.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Navigate to inquiry form
    navigation.navigate('PropertyInquiryFormScreen', { property });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ fontSize: 16, color: colors.text }}>
          Property details not available 😟
        </Text>
        <TouchableOpacity style={{ marginTop: 12 }} onPress={handleBackPress}>
          <Text style={{ color: colors.primary, fontWeight: "700" }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Prepare media items for MediaCard with better error handling
  const mediaItems = property.photosAndVideo?.length
    ? property.photosAndVideo.map(media => {
        const uri = formatImageUrl(media.uri || media) || media.uri || media;
        const isVideoFile = uri?.toLowerCase().includes('.mp4') || 
                           uri?.toLowerCase().includes('.mov') || 
                           uri?.toLowerCase().includes('.avi') ||
                           uri?.toLowerCase().includes('.mkv') ||
                           uri?.toLowerCase().includes('.webm') ||
                           media.type?.toLowerCase().includes('video');
        
        console.log('🔍 Processing media:', { 
          originalMedia: media, 
          uri, 
          isVideoFile, 
          type: media.type,
          extension: uri?.split('.').pop()?.toLowerCase()
        });
        
        return {
          uri: uri,
          type: isVideoFile ? 'video/mp4' : 'image/jpeg'
        };
      })
    : property.images?.length 
    ? property.images.map((imageUrl, index) => {
        const uri = formatImageUrl(imageUrl) || imageUrl;
        const isVideoFile = uri?.toLowerCase().includes('.mp4') || 
                           uri?.toLowerCase().includes('.mov') || 
                           uri?.toLowerCase().includes('.avi') ||
                           uri?.toLowerCase().includes('.mkv') ||
                           uri?.toLowerCase().includes('.webm');
        
        console.log('🖼️ Processing image as media:', { uri, isVideoFile });
        
        return {
          uri: uri,
          type: isVideoFile ? 'video/mp4' : 'image/jpeg'
        };
      })
    : [{ uri: formatImageUrl(null), type: 'image/jpeg' }];

  // Enhanced debugging
  console.log('🏠 Property data:', {
    hasPhotosAndVideo: !!property.photosAndVideo,
    photosAndVideoLength: property.photosAndVideo?.length || 0,
    hasImages: !!property.images,
    imagesLength: property.images?.length || 0,
    sampleData: property.photosAndVideo?.[0] || property.images?.[0],
    propertyKeys: Object.keys(property || {})
  });

  const title = property.title || property.description || "Property";
  const price =
    typeof property.price === "number"
      ? formatPrice(property.price)
      : property.price || "N/A";

  const keyDetails = [
    { label: property.bedrooms || property.propertyType, icon: "bed-outline" },
    {
      label: property.areaDetails
        ? `${property.areaDetails} sq.ft`
        : property.size,
      icon: "resize-outline",
    },
    { label: property.furnishingStatus || property.status, icon: "cube-outline" },
  ].filter((d) => d.label);

  // --- Static Google Map URL ---
  const latitude = property.latitude || 37.78825;
  const longitude = property.longitude || -122.4324;
  // 🚨 REMINDER: Replace YOUR_API_KEY with an actual Google Maps API key
  // Use blue marker instead of orange
  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=600x300&markers=color:blue%7C${latitude},${longitude}&key=YOUR_API_KEY`;

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const handleMediaPress = (media, index) => {
    console.log('Media pressed:', media, 'Index:', index);
    console.log('All media items:', mediaItems);
    setFullscreenMediaIndex(index);
    setShowFullscreenMedia(true);
  };

  const closeFullscreenMedia = () => {
    setShowFullscreenMedia(false);
  };

  const renderAmenity = ({ item }) => (
    <View style={styles.amenityCard}>
      <View style={styles.amenityIconWrap}>
        <Icon name={getAmenityIcon(item)} size={18} color={colors.primary} />
      </View>
      <Text style={styles.amenityText} numberOfLines={1}>
        {item}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Gallery with Video Support */}
      <View style={styles.galleryContainer}>
        <MediaCard
          mediaItems={mediaItems}
          fallbackImage="https://via.placeholder.com/400x300/5da9f6/FFFFFF?text=Property+Image"
          imageStyle={styles.galleryMediaImage}
          showControls={true}
          autoPlay={false}
          loop={false}
          onMediaPress={handleMediaPress}
          style={styles.galleryMediaCard}
        />

        {/* Header Buttons Overlay */}
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.glassButton} onPress={handleBackPress}>
            <Icon name="chevron-back" size={20} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.glassButton}>
            <Icon name="heart-outline" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Media Counter */}
        {mediaItems.length > 1 && (
          <View style={styles.mediaCounter}>
            <Text style={styles.mediaCounterText}>
              {mediaItems.length} media files
            </Text>
          </View>
        )}

        <View style={styles.curveBottom} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 160 }}>
        <View style={styles.infoCard}>
          {routeUser ? (
            <View style={styles.userBanner}>
              <Text style={styles.userBannerText}>Viewing as: {routeUser.name} • {routeUser.phone}</Text>
            </View>
          ) : null}
          
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>{price}</Text>
            {property.propertyLocation && (
              <Text style={styles.locationText} numberOfLines={1}>
                📍 {property.propertyLocation}
              </Text>
            )}
          </View>
          
          <Text style={styles.titleText}>{title}</Text>

          {/* Enhanced Property Details */}
          <View style={styles.detailsRow}>
            {keyDetails.map((d, i) => (
              <View key={i} style={styles.detailPill}>
                <Icon name={d.icon} size={14} color={colors.primary} />
                <Text style={styles.detailPillText}>{d.label}</Text>
              </View>
            ))}
          </View>

          {/* Property Status and Type */}
          <View style={styles.propertyMetaRow}>
            {property.purpose && (
              <View style={[styles.metaPill, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                <Text style={[styles.metaPillText, { color: '#22C55E' }]}>
                  {property.purpose}
                </Text>
              </View>
            )}
            {property.propertyType && (
              <View style={[styles.metaPill, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Text style={[styles.metaPillText, { color: '#3B82F6' }]}>
                  {property.propertyType}
                </Text>
              </View>
            )}
            {property.availability && (
              <View style={[styles.metaPill, { backgroundColor: 'rgba(251, 146, 60, 0.1)' }]}>
                <Text style={[styles.metaPillText, { color: '#FB923C' }]}>
                  {property.availability}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Debug Info for Media (Only in development) */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Media Debug Info</Text>
            <Text style={styles.sectionText}>
              Total Media Items: {mediaItems.length}{'\n'}
              {mediaItems.map((item, index) => 
                `${index + 1}. ${item.type.toUpperCase()}: ${item.uri?.substring(0, 50)}...`
              ).join('\n')}
            </Text>
          </View>
        )}

        {/* About Section */}
        {property.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this property</Text>
            <Text style={styles.sectionText}>{property.description}</Text>
          </View>
        ) : null}

        {/* Amenities */}
        {property.amenities?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <FlatList
              data={property.amenities}
              renderItem={renderAmenity}
              keyExtractor={(item, i) => i.toString()}
              numColumns={3}
              columnWrapperStyle={styles.amenityRow}
              scrollEnabled={false}
            />
          </View>
        ) : null}

        {/* Static Map */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location on Map</Text>
          <TouchableOpacity onPress={openInGoogleMaps} activeOpacity={0.9}>
            <Image source={{ uri: staticMapUrl }} style={styles.mapImage} resizeMode="cover" />
            <View style={styles.mapOverlay}>
              <Text style={styles.mapOverlayText}>Tap to open in Google Maps</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBarWrap}>
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={[styles.actionBtn, { marginRight: 10 }]}
            onPress={handleInquiryPress}
          >
            <Icon 
              name={inquirySubmitted ? "checkmark-circle-outline" : "document-text-outline"} 
              size={18} 
              color={colors.white} 
            />
            <Text style={styles.actionText}>
              {inquirySubmitted ? "Inquiry Sent" : "Send Inquiry"}
            </Text>
          </TouchableOpacity>

          {/* 🎯 FIX APPLIED HERE for "No receiver ID" error */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.chatBtn]}
            onPress={() => {
              // Priority check: Full object > simple ID > alternative field
              const chatUser = property.postedBy || property.userId || property.owner; 

              if (!chatUser) {
                console.warn("No property owner/agent information found to start chat.");
                // You can add an alert/toast here to inform the user
                return;
              }

              navigation.navigate("ChatDetailScreen", {
                // Pass the found user object or ID
                user: chatUser,
                propertyId: property._id || property.id,
                propertyTitle: property.title || "Property",
              });
            }}
          >
            <Icon name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>Chat</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Fullscreen Media Modal */}
      <Modal
        visible={showFullscreenMedia}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFullscreenMedia}
      >
        <StatusBar hidden />
        <View style={styles.fullscreenModalContainer}>
          <MediaCard
            mediaItems={mediaItems}
            fallbackImage="https://via.placeholder.com/400x300/5da9f6/FFFFFF?text=Property+Image"
            imageStyle={styles.fullscreenMediaImage}
            showControls={true}
            autoPlay={true}
            loop={false}
            style={styles.fullscreenMediaCard}
          />
          
          {/* Close Button */}
          <TouchableOpacity 
            style={styles.fullscreenCloseButton} 
            onPress={closeFullscreenMedia}
          >
            <Icon name="close" size={24} color={colors.white} />
          </TouchableOpacity>
          
          {/* Media Info */}
          <View style={styles.fullscreenMediaInfo}>
            <Text style={styles.fullscreenMediaTitle}>{title}</Text>
            <Text style={styles.fullscreenMediaPrice}>{price}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: "center", alignItems: "center" },
  galleryContainer: { 
    height: GALLERY_HEIGHT, 
    width,
    position: 'relative',
  },
  galleryMediaCard: {
    width: '100%',
    height: GALLERY_HEIGHT,
    borderRadius: 0,
  },
  galleryMediaImage: {
    width: '100%',
    height: GALLERY_HEIGHT,
    borderRadius: 0,
  },
  headerButtons: {
    position: "absolute",
    top: Platform.OS === "ios" ? 42 : 18,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  glassButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  mediaCounter: {
    position: "absolute",
    top: Platform.OS === "ios" ? 90 : 66,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  mediaCounterText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  curveBottom: {
    position: "absolute",
    bottom: -1,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  content: { flex: 1, marginTop: -20 },
  infoCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 6,
  },
  priceRow: { flexDirection: "row", justifyContent: "space-between" },
  priceText: { fontSize: 22, fontWeight: "900", color: colors.primary },
  locationText: { color: colors.muted, fontSize: 13, flexShrink: 1 },
  titleText: { fontSize: 20, fontWeight: "800", color: colors.text, marginTop: 8 },
  detailsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 12 },
    detailPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30,144,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  detailPillText: { marginLeft: 8, color: colors.primary, fontWeight: "700" },
  propertyMetaRow: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(107, 114, 128, 0.1)",
  },
  metaPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  section: { marginTop: 18, marginHorizontal: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.primary, marginBottom: 8 },
  sectionText: { color: colors.muted, lineHeight: 22, fontSize: 14 },
  amenityRow: { justifyContent: "space-between" },
  amenityCard: {
    flex: 1,
    margin: 6,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 3,
  },
  amenityIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(30,144,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  amenityText: { marginTop: 8, fontSize: 12, color: colors.muted, fontWeight: "600" },
  mapImage: {
    width: "100%",
    height: 220,
    borderRadius: 16,
  },
  userBanner: {
    backgroundColor: 'rgba(30,144,255,0.06)',
    padding: 8,
    borderRadius: 10,
    marginBottom: 10,
  },
  userBannerText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  mapOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  mapOverlayText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  bottomBarWrap: { position: "absolute", left: 0, right: 0, bottom: 18, alignItems: "center" },
  bottomBar: {
    width: width - 40,
    borderRadius: 18,
    backgroundColor: colors.white,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    justifyContent: "center",
  },
  chatBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(93,169,246,0.2)",
  },
  actionText: { color: colors.white, fontWeight: "800", fontSize: 15 },
  
  // Fullscreen Modal Styles
  fullscreenModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenMediaCard: {
    width: width,
    height: height * 0.8,
    borderRadius: 0,
  },
  fullscreenMediaImage: {
    width: width,
    height: height * 0.8,
    borderRadius: 0,
  },
  fullscreenCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  fullscreenMediaInfo: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
  },
  fullscreenMediaTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  fullscreenMediaPrice: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default PropertyDetailsScreen;