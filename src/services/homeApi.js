// This file handles backend API calls for property data.
// Import BASE_URL to correctly construct image paths
import { get as apiGet, BASE_URL } from './api.js'; 

// --- MOCK DATA FALLBACKS (Kept for Robustness) ---
const generateMockProperty = (id, isNearby = false) => {
    const prices = [1200, 2500, 3800, 1500, 5000, 2900, 950, 4200];
    const locations = ["San Francisco, CA", "Seattle, WA", "New York, NY", "Austin, TX", "Miami, FL", "Denver, CO"];
    const descriptions = ["Modern Penthouse", "Cozy Family Home", "Urban Studio Apartment", "Luxury Beachfront Villa", "Historic Loft", "Suburban Gem"];
    
    const index = id % prices.length;

    return {
        _id: `prop-${id}`,
        description: descriptions[index],
        propertyLocation: `${locations[index]} ${isNearby ? '(Nearby)' : ''}`,
        price: prices[index] * 1000,
        photosAndVideo: [`photo_url_${id}.jpg`], 
    };
};

export const fetchRecentProperties = () => {
    return new Promise(resolve => {
        setTimeout(() => {
            const properties = Array.from({ length: 5 }, (_, i) => generateMockProperty(i + 1));
            resolve(properties);
        }, 1000);
    });
};

export const fetchNearbyProperties = () => {
    return new Promise(resolve => {
        setTimeout(() => {
            const properties = Array.from({ length: 6 }, (_, i) => generateMockProperty(i + 7, true));
            resolve(properties);
        }, 1500);
    });
};

// --- CORE UTILITIES ---

/**
 * Check if a file is a video based on its extension or MIME type
 * @param {string} fileUrl - File URL or path
 * @returns {boolean} True if the file is a video
 */
export const isVideoFile = (fileUrl) => {
    if (!fileUrl || typeof fileUrl !== 'string') return false;
    
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.3gp', '.flv'];
    const lowerUrl = fileUrl.toLowerCase();
    
    return videoExtensions.some(ext => lowerUrl.includes(ext));
};

/**
 * Get the first image (non-video) from photosAndVideo array
 * @param {Array} photosAndVideo - Array of photo/video URLs
 * @returns {string|null} First image URL or null if no images found
 */
export const getFirstImageUrl = (photosAndVideo) => {
    if (!Array.isArray(photosAndVideo) || photosAndVideo.length === 0) {
        return null;
    }
    
    // Find the first non-video file
    const firstImage = photosAndVideo.find(item => !isVideoFile(item));
    return firstImage || null;
};

/**
 * Formats an image URL, handles Base64, and constructs a full URL from server paths.
 * FIX: This now correctly handles "uploads/..." paths using BASE_URL.
 * @param {string} imageData - A URL, a raw Base64 string, or a server file path (e.g., "uploads/image.jpeg").
 * @returns {string} A displayable image URI.
 */
export const formatImageUrl = (imageData) => {
    if (!imageData) {
        return 'https://placehold.co/600x400/CCCCCC/888888?text=No+Image';
    }
    
    // Ensure imageData is a string
    if (typeof imageData !== 'string') {
        console.warn('formatImageUrl: imageData is not a string:', typeof imageData, imageData);
        return 'https://placehold.co/600x400/CCCCCC/888888?text=Invalid+Image';
    }
    
    // Normalize Windows backslashes to forward slashes
    imageData = imageData.replace(/\\+/g, '/');
    
    // 1. If it's a server file path (like "uploads/123.jpeg" or "/uploads/123.jpeg"), prepend BASE_URL.
    if (/^\/?uploads\//.test(imageData)) {
        const baseUrlClean = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
        // remove leading slash from imageData so we don't double\/join
        const cleanPath = imageData.replace(/^\/+/, '');
        return `${baseUrlClean}/${cleanPath}`;
    }

    // 2. Check if it's a raw Base64 string (long, non-URL, no prefix)
    if (!imageData.startsWith('http') && !imageData.startsWith('file:') && !imageData.includes('data:') && imageData.length > 500) { 
          // Assuming JPEG format for common use case
          return `data:image/jpeg;base64,${imageData}`;
    }

    // 3. Handle mock image URLs (for fallback testing)
    if (imageData.startsWith('photo_url_')) {
        const dimensions = imageData.includes('Nearby') ? '400x300' : '600x400';
        const color = imageData.includes('1') ? '4CAF50' : '1E90FF'; 
        return `https://placehold.co/${dimensions}/${color}/FFFFFF?text=Property`;
    }

    // 4. Return the URL or pre-formatted data URI
    return imageData; 
};

/**
 * Formats the property price into Indian Rupees (₹)
 */
export const formatPrice = (price) => {
    if (!price || isNaN(price)) return '₹0';
    
    // Convert to Indian Rupees format
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
};

// --- API FUNCTIONS (Updated for backend consistency) ---

/**
 * Fetch recent properties from ALL users including current user's own properties
 * UPDATED: Now uses /api/properties/recent/all instead of /api/properties/recent
 * This ensures user can see their own posted properties in recent listings
 */
export async function getRecentProperties(limit = 5) {
    try {
        // Use the NEW endpoint that shows ALL recent properties including user's own
        const res = await apiGet('/api/properties/recent/all', { limit }); 
        
        // Backend returns { message: "...", properties: [...] }
        if (res && Array.isArray(res.properties)) {
            console.log(`✅ Loaded ${res.properties.length} recent properties from /api/properties/recent/all`);
            return res.properties;
        }
        
        // If response structure is unexpected, try to handle it
        if (Array.isArray(res)) {
            console.log(`✅ Loaded ${res.length} recent properties (direct array)`);
            return res;
        }
        
        throw new Error('Unexpected API response structure for recent properties.');
    } catch (err) {
        console.warn('getRecentProperties failed, falling back to mock:', err.message);
        return fetchRecentProperties();
    }
}

// Add logging to capture API request and response details in getNearbyProperties
// Add reverse geocoding utility
async function reverseGeocode(latitude, longitude) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
        const response = await fetch(url, { headers: { 'User-Agent': 'GharplotApp/1.0' } });

        // If we didn't get a successful response, try to read body safely and return fallback
        if (!response.ok) {
            const txt = await response.text().catch(() => '');
            console.warn('[reverseGeocode] Non-OK response', response.status, txt.slice ? txt.slice(0, 200) : txt);
            return 'Unknown Location';
        }

        const contentType = (response.headers.get('content-type') || '').toLowerCase();
        let data = null;

        if (contentType.includes('application/json')) {
            // Normal JSON response
            data = await response.json();
        } else {
            // Some servers (or rate-limit HTML/text) may return non-JSON. Safely attempt to parse, else fallback.
            const text = await response.text().catch(() => '');
            // Quick heuristic: if it looks like JSON, try to parse
            const trimmed = (text || '').trim();
            if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                try {
                    data = JSON.parse(trimmed);
                } catch (err) {
                    console.warn('[reverseGeocode] Failed to parse text as JSON, content:', trimmed.slice(0, 200));
                    data = null;
                }
            } else {
                // Not JSON (could be HTML or a plain message). Log for debugging and return fallback.
                console.warn('[reverseGeocode] Received non-JSON response from geocoding service:', trimmed.slice(0, 200));
                data = null;
            }
        }

        if (!data) return 'Unknown Location';

        const address = data.address || {};
        const city = address.city || address.town || address.village || address.county || address.state || 'Unknown City';
        const street = address.road || address.neighbourhood || 'Unknown Street';
        return `${street}, ${city}`;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return 'Unknown Location';
    }
}

export async function getNearbyProperties(latitude, longitude, distance = 20) {
    const params = { latitude, longitude, distance };
    console.log('[getNearbyProperties] Request Params:', params); // Log request parameters

    try {
        const response = await apiGet('/property/nearby', params); // Use relative endpoint
        console.log('[getNearbyProperties] API Response:', response); // Log successful response

        if (response.success && Array.isArray(response.data)) {
            // Use the userAddressUsed from API response, fallback to reverse geocoding if not available
            const userLocationName = response.userAddressUsed || await reverseGeocode(latitude, longitude);
            
            return {
                userLocation: userLocationName, // User's location name from API or reverse geocoding
                properties: response.data, // Nearby properties array
                distanceUsed: response.distanceUsed || `${distance} km`, // Distance info from API
                count: response.count || response.data.length, // Number of properties found
                usedLocation: response.usedLocation || { latitude, longitude } // Actual coordinates used
            };
        }

        throw new Error(response.message || 'Unexpected API response structure for nearby properties.');
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.error('[getNearbyProperties] 404 Error: Resource not found');
            throw new Error('Nearby properties not found. Please try again later.');
        }
        console.error('[getNearbyProperties] API Error:', error); // Log error details
        throw error;
    }
}

/**
 * Fetch only the IDs of saved properties for the current user.
 * Returns an array of string IDs. This is a lightweight helper used by UI
 * components (e.g., HomeScreen) to mark favorites without fetching full objects.
 */
export async function getSavedPropertiesIds() {
    try {
        const res = await apiGet('/api/properties/saved/all');
        let arr = [];
        if (res && Array.isArray(res.savedProperties)) arr = res.savedProperties;
        else if (Array.isArray(res.data)) arr = res.data;
        else if (Array.isArray(res)) arr = res;

        // Map to IDs and filter out falsy values
        return arr.map(p => p && (p._id || p.id || p.propertyId)).filter(Boolean);
    } catch (err) {
        console.warn('getSavedPropertiesIds failed:', err.message || err);
        return [];
    }
}

/**
 * Fetch ALL properties from the new API endpoint
 * Endpoint: GET http://abc.ridealmobility.com/api/properties/all
 * This replaces the recent properties API to show all available properties
 */
export async function getAllProperties(limit = null) {
    try {
        console.log(`🏠 Fetching ALL properties from new API endpoint ${limit ? `(limit: ${limit})` : '(no limit)'}`);
        
        // Use the new API endpoint directly
        const response = await fetch('http://abc.ridealmobility.com/api/properties/all', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const res = await response.json();
        console.log('📊 All Properties API Response structure:', Object.keys(res));
        
        // Handle different response structures
        let properties = [];
        if (res && Array.isArray(res.properties)) {
            properties = res.properties;
        } else if (res && Array.isArray(res.data)) {
            properties = res.data;
        } else if (Array.isArray(res)) {
            properties = res;
        } else {
            throw new Error('Unexpected API response structure for all properties.');
        }
        
        // Apply limit only if specified
        const finalProperties = (limit && limit > 0) ? properties.slice(0, limit) : properties;
        
        console.log(`✅ Loaded ${finalProperties.length} properties from ALL properties API ${limit ? `(limited to ${limit})` : '(all properties)'}`);
        return finalProperties;
    } catch (err) {
        console.error('getAllProperties failed:', err.message);
        console.warn('Falling back to recent properties API...');
        
        // Fallback to recent properties if new API fails
        try {
            return await getRecentProperties(limit);
        } catch (fallbackErr) {
            console.error('Fallback to recent properties also failed:', fallbackErr.message);
            return [];
        }
    }
}

/**
 * Fetch services list used by ServicesScreen.
 * Endpoint: GET /api/services
 * Normalizes to an array of service objects under `data`.
 */
export async function getServices() {
    try {
        const res = await apiGet('/api/services');
        if (res && Array.isArray(res.data)) return res.data;
        if (Array.isArray(res)) return res;
        // fallback empty
        return [];
    } catch (err) {
        console.warn('getServices failed:', err && err.message ? err.message : err);
        return [];
    }
}