/**
 * propertyapi.js
 * Service layer for property-related API calls.
 * This file handles saving/unsaving/fetching shortlisted properties.
 */

// Import the necessary API utility functions from your core API file.
// Adjust the path as necessary based on your folder structure.
import { postWithQuery, get, deleteWithQuery, post, BASE_URL } from './api.js'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- API Endpoints ---
const PROPERTY_SAVE_ENDPOINT = '/api/properties/save';
const PROPERTY_SAVED_ALL_ENDPOINT = '/api/properties/saved/all';
const PROPERTY_REMOVE_ENDPOINT = '/api/properties/remove';


/**
 * Calls the API to save or unsave a property to the user's shortlist.
 * cURL: POST /api/properties/save?propertyId=PROPERTY_ID
 * * @param {string} propertyId The ID of the property to toggle save status for.
 * @returns {Promise<object>} The API response data (e.g., confirmation message).
 */
export const toggleSaveProperty = async (propertyId) => {
    if (!propertyId) {
        throw new Error("Property ID is required for saving/unsaving.");
    }
    
    // The query object holds the parameters that go into the URL: ?propertyId=...
    const queryParams = { propertyId };
    
    // The request body is empty as per your cURL example
    const requestBody = {};

    try {
        const response = await postWithQuery(
            PROPERTY_SAVE_ENDPOINT, 
            queryParams, 
            requestBody
        );
        
        console.log(`Property save status updated for ID ${propertyId}:`, response);
        return response; 

    } catch (error) {
        // Re-throw the error so the calling component can handle it
        console.error(`Failed to toggle property save status for ID ${propertyId}:`, error);
        throw error;
    }
};

/**
 * GET: Fetch all properties saved (shortlisted) by the logged-in user.
 * This is the function used by the SavedScreen to show ONLY saved properties.
 * It is fixed to handle the specific API response structure (data nested under 'savedProperties').
 * cURL: GET /api/properties/saved/all
 * * @returns {Promise<Array<object>>} An array of property objects.
 */
export const getSavedProperties = async () => {
    try {
    const response = await get(PROPERTY_SAVED_ALL_ENDPOINT);
    console.log('[propertyapi] getSavedProperties raw response:', response);
        // --- FIX: Extract data from the 'savedProperties' field ---
        if (response && Array.isArray(response.savedProperties)) {
             // Return the array of saved properties directly
             return response.savedProperties;
        }
        
        // Fallback for unexpected formats (e.g., if API returns a direct array or 'data' key)
        if (Array.isArray(response)) {
            return response;
        }
        if (response && Array.isArray(response.data)) {
            return response.data;
        }
        
        // If the expected array is not found, return an empty array
        return [];
    } catch (error) {
        console.error('Failed to fetch saved properties:', error);
        // Throw the error so the calling component (SavedScreen) can handle it
        throw error;
    }
};

/**
 * DELETE: Explicitly remove a saved property for the logged-in user.
 * cURL: DELETE /api/properties/remove?propertyId=PROPERTY_ID
 * * @param {string} propertyId The ID of the saved property to remove.
 * @returns {Promise<object>} The API response data.
 */
export const removeSavedProperty = async (propertyId) => {
    if (!propertyId) throw new Error('Property ID is required to remove saved property.');
    try {
        const response = await deleteWithQuery(PROPERTY_REMOVE_ENDPOINT, { propertyId });
        console.log(`Property removed from shortlist: ${propertyId}`, response);
        return response;
    } catch (err) {
        console.error('Failed to remove saved property:', err);
        throw err;
    }
};

/**
 * GET: Fetch properties the current user has listed for rent (their rentals)
 * cURL: GET /api/properties/my-rent with Authorization header
 */
export const getMyRentProperties = async () => {
    try {
        const response = await get('/api/properties/my-rent');
        console.log('[propertyapi] getMyRentProperties response:', response);

        // Expecting an array of properties or an object with a data/properties field
        if (Array.isArray(response)) return response;
        if (response && Array.isArray(response.properties)) return response.properties;
        if (response && Array.isArray(response.data)) return response.data;

        // If response contains savedProperties (unlikely here) or wrapped
        if (response && Array.isArray(response.savedProperties)) return response.savedProperties;

        return [];
    } catch (err) {
        console.error('Failed to fetch my rent properties:', err);
        throw err;
    }
};

/**
 * GET: Fetch properties the current user has listed for sale
 * cURL: GET /api/properties/my-sell-properties (requires Authorization)
 */
export const getMySellProperties = async () => {
    try {
        const response = await get('/api/properties/my-sell-properties');
        console.log('[propertyapi] getMySellProperties response:', response);

        if (Array.isArray(response)) return response;
        if (response && Array.isArray(response.properties)) return response.properties;
        if (response && Array.isArray(response.data)) return response.data;

        // Fallbacks
        if (response && Array.isArray(response.savedProperties)) return response.savedProperties;

        return [];
    } catch (err) {
        console.error('Failed to fetch my sell properties:', err);
        throw err;
    }
};

/**
 * GET: Fetch other properties for sale/buy listing for the marketplace
 * cURL: GET /api/properties/allOther
 */
export const getAllOtherProperties = async () => {
    try {
        const response = await get('/api/properties/allOther');
        console.log('[propertyapi] getAllOtherProperties response:', response);

        // The endpoint returns an array of properties (as per your example)
        if (Array.isArray(response)) return response;

        // Fallback shapes
        if (response && Array.isArray(response.data)) return response.data;
        if (response && Array.isArray(response.properties)) return response.properties;

        return [];
    } catch (err) {
        console.error('Failed to fetch allOther properties:', err);
        throw err;
    }
};

/**
 * Create a new property (with optional media files).
 * If `files` is provided (array of { uri, type, fileName }), this will upload multipart/form-data.
 * Otherwise it will POST JSON to the API using the shared `post` helper.
 * @param {Object} data The property fields
 * @param {Array} files Optional array of file objects returned by image picker
 */
export const addProperty = async (data = {}, files = []) => {
    // Use the correct API endpoint pattern matching other services
    const endpointUrl = `${BASE_URL.replace(/\/+$/, '')}/api/property/create`;

    // If there are no files, use the JSON POST helper which handles token and errors
    if (!files || files.length === 0) {
        // reuse post helper from api.js (expects endpoint path without base)
        try {
            return await post('api/property/create', data);
        } catch (err) {
            console.error('[propertyapi] addProperty (json) failed:', err);
            throw err;
        }
    }

    // Otherwise upload multipart/form-data via XHR so content:// URIs are handled robustly on Android
    const formData = new FormData();
    // Append scalar fields
    Object.keys(data || {}).forEach((k) => {
        if (data[k] !== undefined && data[k] !== null) {
            formData.append(k, String(data[k]));
        }
    });

    // Append files under the 'photosAndVideo' field (backend expects this)
    files.forEach((f, idx) => {
        formData.append('photosAndVideo', {
            uri: f.uri,
            type: f.type || 'image/jpeg',
            name: f.fileName || f.name || `file-${Date.now()}-${idx}.jpg`,
        });
    });

    const token = await AsyncStorage.getItem('userToken');

    return new Promise((resolve, reject) => {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', endpointUrl);
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }

            xhr.onload = () => {
                const status = xhr.status;
                const text = xhr.responseText;
                try {
                    const json = JSON.parse(text);
                    if (status >= 200 && status < 300) resolve(json);
                    else reject({ status, body: json });
                } catch (e) {
                    if (status >= 200 && status < 300) resolve({ raw: text });
                    else reject({ status, body: text });
                }
            };

            xhr.onerror = (e) => reject(new Error('Network request failed'));
            xhr.send(formData);
        } catch (err) {
            reject(err);
        }
    });
};

/**
 * Update an existing property (with optional media files).
 * PUT /property/edit/:propertyId
 * Accepts FormData (fields + photosAndVideo files).
 * @param {string} propertyId
 * @param {object} data
 * @param {Array} files Array of file objects { uri, type, fileName }
 */
export const updateProperty = async (propertyId, data = {}, files = []) => {
    if (!propertyId) throw new Error('propertyId is required for updateProperty');

    const apiRoot = BASE_URL.replace(/\/+$/, '');
    const endpointUrl = `${apiRoot}/property/edit/${propertyId}`;
    // Some servers accept edit at /property/edit/:id (no /api). Try server root fallback later if needed
    const serverRootFallback = apiRoot.replace(/\/api$/, '') || apiRoot;

    const formData = new FormData();
    // Append scalar fields (use keys expected by backend per your curl)
    const fieldMap = {
        propertyLocation: data.propertyLocation || data.location || data.propertyLocation,
        description: data.description,
        price: data.price,
        areaDetails: data.areaDetails || data.sqft || data.area || data.areaDetails,
        purpose: data.purpose || data.type || data.propertyPurpose,
    };

    Object.keys(fieldMap).forEach(k => {
        const v = fieldMap[k];
        if (v !== undefined && v !== null) formData.append(k, String(v));
    });

    // Append files under 'photosAndVideo' if provided
    (files || []).forEach((f, idx) => {
        if (!f) return;
        if (typeof f === 'string') {
            formData.append('photosAndVideo', {
                uri: f,
                type: 'image/jpeg',
                name: `file-${Date.now()}-${idx}.jpg`,
            });
        } else if (f.uri) {
            formData.append('photosAndVideo', {
                uri: f.uri,
                type: f.type || 'image/jpeg',
                name: f.fileName || f.name || `file-${Date.now()}-${idx}.jpg`,
            });
        }
    });

    const token = await AsyncStorage.getItem('userToken');

    // Helper to send XHR and return parsed response or throw { status, body }
    const sendXhr = (method, url, fd) => new Promise((resolve, reject) => {
        try {
            console.log('[propertyapi] sendXhr', method, url, 'files=', (files || []).length);
            const xhr = new XMLHttpRequest();
            xhr.open(method, url);
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.onload = () => {
                const status = xhr.status;
                const text = xhr.responseText;
                try {
                    const json = JSON.parse(text);
                    if (status >= 200 && status < 300) resolve(json);
                    else reject({ status, body: json });
                } catch (e) {
                    if (status >= 200 && status < 300) resolve({ raw: text });
                    else reject({ status, body: text });
                }
            };
            xhr.onerror = () => reject(new Error('Network request failed'));
            xhr.send(fd);
        } catch (err) {
            reject(err);
        }
    });

    // Try strategy: 1) PUT to apiRoot (/api) 2) POST with _method=PUT to apiRoot 3) try serverRootFallback
    try {
        console.log('[propertyapi] attempting PUT to', endpointUrl, 'fieldMap=', fieldMap);
        return await sendXhr('PUT', endpointUrl, formData);
    } catch (err) {
        console.warn('[propertyapi] PUT failed:', err && err.status || err);
        // If the error is a cast to ObjectId, there's nothing client can do. Re-throw.
        if (err && err.body && typeof err.body === 'object' && err.body.message && /Cast to ObjectId/i.test(JSON.stringify(err.body))) {
            throw err;
        }

        // Attempt POST with _method=PUT (some servers don't accept PUT+FormData)
        try {
            formData.append('_method', 'PUT');
            console.log('[propertyapi] attempting POST (method override) to', endpointUrl);
            return await sendXhr('POST', endpointUrl, formData);
        } catch (err2) {
            console.warn('[propertyapi] POST override failed:', err2 && err2.status || err2);
            // Try without /api prefix as last resort
            try {
                const fallbackUrl = `${serverRootFallback.replace(/\/+$/, '')}/property/edit/${propertyId}`;
                console.log('[propertyapi] attempting PUT to fallback URL', fallbackUrl);
                return await sendXhr('PUT', fallbackUrl, formData);
            } catch (err3) {
                console.error('[propertyapi] all update attempts failed');
                // rethrow last error
                throw err3 || err2 || err;
            }
        }
    }
};

// Function to fetch nearby properties
export const fetchNearbyProperties = async (lat, lng, distance) => {
    const url = `https://abc.ridealmobility.com/property/nearby?lat=${lat}&lng=${lng}&distance=${distance}`;
    const token = await AsyncStorage.getItem('jwtToken'); // Replace 'jwtToken' with the actual key if different

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data; // Assuming the API returns an array of properties
    } catch (error) {
        console.error('Error fetching nearby properties:', error);
        throw error;
    }
};