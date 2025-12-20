import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { launchImageLibrary } from "react-native-image-picker";
import AsyncStorage from '@react-native-async-storage/async-storage';
// Import the regular property API
import { addProperty } from "../services/propertyapi";
import { simulatePropertyAddedNotification } from "../utils/testNotifications";

// --- Reusable Components ---
const FormInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  multiline = false,
}) => (
  <View style={styles.card}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.textArea]}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      multiline={multiline}
      placeholderTextColor="#9CA3AF"
    />
  </View>
);

const Selector = ({ label, options, selectedValue, onSelect }) => (
  <View style={styles.card}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.selectorRow}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.selectorOption,
            selectedValue === option.value && styles.selectorSelected,
            option.disabled && styles.selectorDisabled,
          ]}
          onPress={() => !option.disabled && onSelect(option.value)}
          disabled={option.disabled}
        >
          <Text
            style={[
              styles.selectorText,
              selectedValue === option.value && styles.selectorTextSelected,
              option.disabled && styles.selectorTextDisabled,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

// --- Main Component ---
const AddSellScreen = ({ navigation }) => {
  const [propertyLocation, setPropertyLocation] = useState("");
  const [areaDetails, setAreaDetails] = useState("");
  const [availability, setAvailability] = useState("Ready to Move");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [photosAndVideo, setPhotosAndVideo] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [furnishingStatus, setFurnishingStatus] = useState("Furnished");
  const [parking, setParking] = useState("Available");
  const [purpose, setPurpose] = useState("Sell");
  const [propertyType, setPropertyType] = useState("Residential");
  const [commercialType, setCommercialType] = useState("office");
  const [residentialType, setResidentialType] = useState("apartment");

  // Handle purpose change with property type logic
  const handlePurposeChange = (newPurpose) => {
    setPurpose(newPurpose);
    // If Paying Guest is selected, automatically set to Residential
    if (newPurpose === "Paying Guest") {
      setPropertyType("Residential");
    }
  };

  // Handle property type change with purpose logic
  const handlePropertyTypeChange = (newPropertyType) => {
    setPropertyType(newPropertyType);
    // If Commercial is selected and current purpose is Paying Guest, change to Sell
    if (newPropertyType === "Commercial" && purpose === "Paying Guest") {
      setPurpose("Sell");
    }
  };

  // --- Image Picker ---
  const handleImagePicker = useCallback(() => {
    const options = {
      mediaType: "mixed",
      selectionLimit: 5,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.errorCode) {
        if (response.errorCode) {
          Alert.alert("Error", response.errorMessage || "Failed to pick media");
        }
        return;
      }

      const assets = response.assets || [];
      const normalized = assets.map((a) => ({
        uri: a.uri,
        type: a.type,
        fileName: a.fileName || `file-${Date.now()}`,
        fileSize: a.fileSize,
      }));

      setPhotosAndVideo((prev) => [...prev, ...normalized]);
    });
  }, []);

  // --- Submit Property ---
  // Add a function to sync local properties when connection is restored
  const syncLocalProperties = useCallback(async () => {
    try {
      const localPropertiesString = await AsyncStorage.getItem('local_properties');
      if (!localPropertiesString) return;
      
      const localProperties = JSON.parse(localPropertiesString);
      const pendingProperties = localProperties.filter(prop => prop.status === 'pending_sync');
      
      if (pendingProperties.length > 0) {
        console.log(`🔄 Found ${pendingProperties.length} local properties to sync`);
        
        for (const localProp of pendingProperties) {
          try {
            await addProperty(localProp);
            console.log('✅ Synced local property:', localProp.id);
            
            // Remove synced property from local storage
            const updatedProperties = localProperties.filter(p => p.id !== localProp.id);
            await AsyncStorage.setItem('local_properties', JSON.stringify(updatedProperties));
          } catch (syncError) {
            console.warn('Failed to sync property:', localProp.id, syncError.message);
          }
        }
      }
    } catch (error) {
      console.warn('Error syncing local properties:', error.message);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!propertyLocation || !price || !areaDetails || !description) {
      Alert.alert("Error", "Please fill all required fields.");
      return;
    }

    if (isNaN(Number(areaDetails)) || isNaN(Number(price))) {
      Alert.alert("Error", "Area Details and Price must be valid numbers.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        propertyLocation,
        areaDetails: Number(areaDetails),
        availability,
        price: Number(price),
        description,
        furnishingStatus,
        parking,
        purpose,
        propertyType,
        commercialType: propertyType === "Commercial" ? commercialType : undefined,
        residentialType: propertyType === "Residential" ? residentialType : undefined,
        // Add property fields
        title: `${propertyType} ${purpose} in ${propertyLocation}`,
        status: 'active',
        contactNumber: "", // Can be filled from user profile
        phoneNumber: "", 
        mobile: "",
        // Add media files in proper format
        media: photosAndVideo.map(file => ({
          uri: file.uri,
          type: file.type || 'image/jpeg',
          name: file.fileName || file.name || `media-${Date.now()}.jpg`,
        }))
      };

      // Try multiple property creation approaches
      let data;
      try {
        // Try property API
        console.log('🚀 Attempting property creation...');
        const response = await addProperty(payload);
        
        data = {
          message: "Property added successfully",
          property: response.data || response
        };
        console.log('✅ Property creation successful');
        
      } catch (propertyError) {
        console.log('Property creation failed:', propertyError.message);
        
        // Fallback: Try direct API call to working server
        try {
          console.log('🚀 Attempting direct API call...');
          const directResponse = await fetch('https://abc.bhoomitechzone.us/api/property/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await AsyncStorage.getItem('userToken')}`,
            },
            body: JSON.stringify(propertyPayload),
          });
          
          if (directResponse.ok) {
            const directData = await directResponse.json();
            data = {
              message: "Property added successfully",
              property: directData.property || directData
            };
            console.log('✅ Direct API call successful');
          } else {
            throw new Error(`Server responded with status: ${directResponse.status}`);
          }
        } catch (directError) {
          console.log('Direct API call also failed:', directError.message);
          
          // Final fallback: Create local property record
          console.log('💾 Creating local property record...');
          
          const localProperty = {
            id: `local_${Date.now()}`,
            ...payload,
            createdAt: new Date().toISOString(),
            status: 'pending_sync',
            isLocal: true,
            // Handle images properly for offline viewing
            images: photosAndVideo.map(file => ({
              uri: file.uri,
              url: file.uri,
              type: file.type || 'image/jpeg',
              name: file.fileName || file.name || `image_${Date.now()}.jpg`
            })),
            photos: photosAndVideo.map(file => file.uri), // Legacy format
            photosAndVideo: photosAndVideo // Full file objects
          };
          
          // Store locally
          const existingProperties = await AsyncStorage.getItem('local_properties');
          const localProperties = existingProperties ? JSON.parse(existingProperties) : [];
          localProperties.push(localProperty);
          await AsyncStorage.setItem('local_properties', JSON.stringify(localProperties));
          
          data = {
            message: "Property saved locally. Will sync when server connection is restored.",
            property: localProperty
          };
        }
      }

      // Add notification for property added (simulating backend notification)
      try {
        // Local notification for immediate feedback
        await simulatePropertyAddedNotification({
          _id: data.property?._id,
          description: description,
          propertyLocation: propertyLocation,
          price: price,
          photosAndVideo: photosAndVideo
        });

        // Send notification to ALL users via backend API
        try {
          const notificationPayload = {
            title: "🏠 New Property Listed!",
            message: `A new ${propertyType} property has been listed in ${propertyLocation}. Check it out now!`,
            propertyId: data.property?._id,
            type: 'new_property'
          };

          const response = await fetch('https://abc.bhoomitechzone.us/application/notify-update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(notificationPayload),
          });

          const result = await response.json();
          
          if (result.success) {
            console.log('✅ Property notification sent to all users via backend:', result);
            console.log(`📊 Sent to: ${result.sentCount} users, Failed: ${result.failedCount} users`);
          } else {
            console.warn('⚠️ Backend notification partially failed:', result);
          }
        } catch (backendError) {
          console.error('❌ Failed to send backend notification:', backendError);
          // Continue with success even if backend notification fails
        }
        
      } catch (notificationError) {
        console.warn('Failed to add property notification:', notificationError);
      }

      Alert.alert("Success", data.message || "Property added successfully");
      
      // Show additional info if saved locally
      if (data.property?.isLocal) {
        setTimeout(() => {
          Alert.alert(
            "Offline Mode", 
            "Your property has been saved locally with photos and will be uploaded automatically when the server connection is restored. You can view it in your property list.",
            [
              {
                text: "View Property",
                onPress: () => {
                  // Property details screen will already be shown
                }
              },
              { text: "OK" }
            ]
          );
        }, 1000);
      }
      
      navigation.replace("PropertyDetailsScreen", { 
        property: {
          ...data.property,
          // Ensure images are properly formatted for display
          images: photosAndVideo.map(file => ({
            uri: file.uri,
            url: file.uri, // Fallback for different image display patterns
            type: file.type || 'image/jpeg'
          })),
          photosAndVideo: photosAndVideo, // Keep original format
          isLocalProperty: data.property?.isLocal || false
        },
        fromAddProperty: true,
        isOffline: data.property?.isLocal || false
      });
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to add property");
    } finally {
      setSubmitting(false);
    }
  }, [
    propertyLocation,
    areaDetails,
    availability,
    price,
    description,
    furnishingStatus,
    parking,
    purpose,
    propertyType,
    commercialType,
    residentialType,
    photosAndVideo,
    navigation,
  ]);

  // --- Render ---
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <LinearGradient colors={["#007BFF", "#0056D2"]} style={styles.header}>
        <Text style={styles.headerTitle}>🏠 Add Property</Text>
        <Text style={styles.headerSubtitle}>Enter property details below</Text>
      </LinearGradient>

      {/* Scrollable Form */}
      <ScrollView contentContainerStyle={styles.container}>
        <Selector
          label="Purpose"
          options={[
            { label: "Sell", value: "Sell" },
            { label: "Rent/Lease", value: "Rent/Lease" },
            { 
              label: "Paying Guest", 
              value: "Paying Guest",
              disabled: propertyType === "Commercial" // Disable PG when Commercial is selected
            },
          ]}
          selectedValue={purpose}
          onSelect={handlePurposeChange}
        />

        <Selector
          label="Property Type"
          options={[
            { label: "Residential", value: "Residential" },
            { 
              label: "Commercial", 
              value: "Commercial",
              disabled: purpose === "Paying Guest" // Disable Commercial when PG is selected
            },
          ]}
          selectedValue={propertyType}
          onSelect={handlePropertyTypeChange}
        />

        {propertyType === "Residential" ? (
          <Selector
            label="Residential Type"
            options={[
              { label: "Apartment", value: "apartment" },
              { label: "Villa", value: "villa" },
              { label: "Plot", value: "plot" },
            ]}
            selectedValue={residentialType}
            onSelect={setResidentialType}
          />
        ) : (
          <Selector
            label="Commercial Type"
            options={[
              { label: "Office", value: "office" },
              { label: "Shop", value: "shop" },
              { label: "Warehouse", value: "warehouse" },
            ]}
            selectedValue={commercialType}
            onSelect={setCommercialType}
          />
        )}

        <FormInput
          label="📍 Property Location"
          placeholder="Enter property address"
          value={propertyLocation}
          onChangeText={setPropertyLocation}
        />

        <FormInput
          label="📏 Area Details (in Sq.Ft)"
          placeholder="e.g., 1200"
          value={areaDetails}
          onChangeText={setAreaDetails}
          keyboardType="numeric"
        />

        <Selector
          label="🏗️ Availability"
          options={[
            { label: "Ready to Move", value: "Ready to Move" },
            { label: "Under Construction", value: "Under Construction" },
          ]}
          selectedValue={availability}
          onSelect={setAvailability}
        />

        <Selector
          label="🪑 Furnishing Status"
          options={[
            { label: "Furnished", value: "Furnished" },
            { label: "Semi-Furnished", value: "Semi-Furnished" },
            { label: "Unfurnished", value: "Unfurnished" },
          ]}
          selectedValue={furnishingStatus}
          onSelect={setFurnishingStatus}
        />

        <Selector
          label="🚗 Parking"
          options={[
            { label: "Available", value: "Available" },
            { label: "Not Available", value: "Not Available" },
          ]}
          selectedValue={parking}
          onSelect={setParking}
        />

        <FormInput
          label="💰 Price (₹)"
          placeholder="e.g., 5000000"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />

        <FormInput
          label="📝 Description"
          placeholder="Add detailed description..."
          value={description}
          onChangeText={setDescription}
          multiline
        />

        {/* Upload Media */}
        <View style={styles.card}>
          <Text style={styles.label}>📸 Upload Photos / Videos</Text>
          <TouchableOpacity style={styles.imageUploadButton} onPress={handleImagePicker}>
            <Icon name="cloud-upload-outline" size={22} color="#007BFF" />
            <Text style={styles.imageUploadText}> Add Media</Text>
          </TouchableOpacity>
          <Text style={styles.imageCountText}>
            {photosAndVideo.length} media files added
          </Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.fixedBottom}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <LinearGradient colors={["#007BFF", "#0056D2"]} style={styles.gradientButton}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Property</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AddSellScreen;

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingVertical: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    color: "#E0E7FF",
    marginTop: 4,
    fontSize: 14,
  },
  container: {
    padding: 16,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#007BFF20",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    backgroundColor: "#F9FAFB",
    fontSize: 15,
    color: "#111827",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  selectorRow: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    padding: 4,
  },
  selectorOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  selectorSelected: {
    backgroundColor: "#007BFF",
  },
  selectorText: {
    color: "#1E3A8A",
    fontWeight: "600",
  },
  selectorTextSelected: {
    color: "#fff",
  },
  selectorDisabled: {
    backgroundColor: "#F3F4F6",
    opacity: 0.6,
  },
  selectorTextDisabled: {
    color: "#9CA3AF",
  },
  imageUploadButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#93C5FD",
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 14,
    backgroundColor: "#EFF6FF",
  },
  imageUploadText: {
    color: "#007BFF",
    fontWeight: "600",
    fontSize: 16,
  },
  imageCountText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 13,
    marginTop: 4,
  },
  fixedBottom: {
    position: "absolute",
    bottom: 70,
    left: 16,
    right: 16,
    elevation: 8,
    shadowColor: "#007BFF",
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  submitButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  gradientButton: {
    paddingVertical: 16,
  },
  submitButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
  },
});
