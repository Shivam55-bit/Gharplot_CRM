# Gharplot App - Property API Endpoints

## Base URL
```
https://abc.ridealmobility.com
```

## Property Management Endpoints

### 1. **Add Property**
- **Endpoint**: `/api/property/add`
- **Full URL**: `https://abc.ridealmobility.com/api/property/add`
- **Method**: `POST`
- **Function**: `addProperty(data, files)`
- **Content-Type**: 
  - `application/json` (without files)
  - `multipart/form-data` (with files)
- **Payload**:
```json
{
  "propertyLocation": "Property Address/Location",
  "description": "Property description",
  "price": 50000,
  "areaDetails": "1200 sq ft",
  "purpose": "rent/sale"
}
```
- **Files**: Array of file objects for photos/videos
```javascript
files = [
  {
    uri: "file://path/to/image.jpg",
    type: "image/jpeg", 
    fileName: "image.jpg"
  }
]
```
- **Response**: Property creation confirmation with property details

### 2. **Update Property**
- **Endpoint**: `/property/edit/{propertyId}`
- **Full URL**: `https://abc.ridealmobility.com/property/edit/{propertyId}`
- **Method**: `PUT`
- **Function**: `updateProperty(propertyId, data, files)`
- **Content-Type**: `multipart/form-data`
- **Payload**:
```json
{
  "propertyLocation": "Updated location",
  "description": "Updated description", 
  "price": 55000,
  "areaDetails": "1300 sq ft",
  "purpose": "rent/sale"
}
```
- **Response**: Updated property details

## Get Property Endpoints

### 3. **Get All Other Properties (Marketplace)**
- **Endpoint**: `/api/properties/allOther`
- **Full URL**: `https://abc.ridealmobility.com/api/properties/allOther`
- **Method**: `GET`
- **Function**: `getAllOtherProperties()`
- **Headers**: `Authorization: Bearer {token}` (optional)
- **Response**: Array of all available properties for marketplace

### 4. **Get My Rent Properties**
- **Endpoint**: `/api/properties/my-rent`
- **Full URL**: `https://abc.ridealmobility.com/api/properties/my-rent`
- **Method**: `GET`
- **Function**: `getMyRentProperties()`
- **Headers**: `Authorization: Bearer {token}` (required)
- **Response**: Array of properties listed by current user for rent

### 5. **Get My Sell Properties**
- **Endpoint**: `/api/properties/my-sell-properties`
- **Full URL**: `https://abc.ridealmobility.com/api/properties/my-sell-properties`
- **Method**: `GET`
- **Function**: `getMySellProperties()`
- **Headers**: `Authorization: Bearer {token}` (required)
- **Response**: Array of properties listed by current user for sale

### 6. **Get Saved Properties**
- **Endpoint**: `/api/properties/saved/all`
- **Full URL**: `https://abc.ridealmobility.com/api/properties/saved/all`
- **Method**: `GET`
- **Function**: `getSavedProperties()`
- **Headers**: `Authorization: Bearer {token}` (required)
- **Response**: Array of properties saved/shortlisted by user

### 7. **Get Nearby Properties**
- **Endpoint**: `/property/nearby`
- **Full URL**: `https://abc.ridealmobility.com/property/nearby?lat={latitude}&lng={longitude}&distance={distance}`
- **Method**: `GET`
- **Function**: `fetchNearbyProperties(lat, lng, distance)`
- **Headers**: `Authorization: Bearer {token}` (required)
- **Query Parameters**:
  - `lat`: Latitude coordinate
  - `lng`: Longitude coordinate  
  - `distance`: Search radius in kilometers
- **Response**: Array of properties near specified location

## Property Save/Unsave Endpoints

### 8. **Save/Unsave Property**
- **Endpoint**: `/api/properties/save?propertyId={propertyId}`
- **Full URL**: `https://abc.ridealmobility.com/api/properties/save?propertyId={propertyId}`
- **Method**: `POST`
- **Function**: `toggleSaveProperty(propertyId)`
- **Headers**: `Authorization: Bearer {token}` (required)
- **Payload**: `{}` (empty body)
- **Response**: Save status confirmation

### 9. **Remove Saved Property**
- **Endpoint**: `/api/properties/remove?propertyId={propertyId}`
- **Full URL**: `https://abc.ridealmobility.com/api/properties/remove?propertyId={propertyId}`
- **Method**: `DELETE`
- **Function**: `removeSavedProperty(propertyId)`
- **Headers**: `Authorization: Bearer {token}` (required)
- **Response**: Removal confirmation

## Usage Examples

### Import Functions
```javascript
import { 
  addProperty,
  updateProperty,
  getAllOtherProperties,
  getMyRentProperties, 
  getMySellProperties,
  getSavedProperties,
  fetchNearbyProperties,
  toggleSaveProperty,
  removeSavedProperty
} from '../services/propertyapi';
```

### Add New Property
```javascript
// Property data
const propertyData = {
  propertyLocation: "123 Main St, Mumbai",
  description: "Beautiful 2BHK apartment with modern amenities",
  price: 45000,
  areaDetails: "1100 sq ft", 
  purpose: "rent"
};

// Files (optional)
const files = [
  {
    uri: "file://path/to/photo1.jpg",
    type: "image/jpeg",
    fileName: "living_room.jpg"
  },
  {
    uri: "file://path/to/video1.mp4", 
    type: "video/mp4",
    fileName: "property_tour.mp4"
  }
];

// Add property
const response = await addProperty(propertyData, files);
console.log("Property added:", response);
```

### Get Properties
```javascript
// Get all marketplace properties
const allProperties = await getAllOtherProperties();

// Get my rental listings
const myRentals = await getMyRentProperties();

// Get my sale listings  
const mySales = await getMySellProperties();

// Get saved properties
const savedProps = await getSavedProperties();

// Get nearby properties
const nearbyProps = await fetchNearbyProperties(19.0760, 72.8777, 5); // Mumbai coordinates, 5km radius
```

### Save/Unsave Properties
```javascript
// Save a property
await toggleSaveProperty("property_id_123");

// Remove from saved list
await removeSavedProperty("property_id_123");
```

### Update Property
```javascript
const updatedData = {
  propertyLocation: "Updated address",
  description: "Updated description",
  price: 50000,
  areaDetails: "1200 sq ft",
  purpose: "sale"
};

const newFiles = [/* new photos/videos */];

await updateProperty("property_id_123", updatedData, newFiles);
```

## Authentication Headers
All authenticated API calls include:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json (for JSON requests)
Content-Type: multipart/form-data (for file uploads)
```

## Response Format
Most endpoints return data in this format:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Property object or array of properties
  }
}
```

Properties are returned with fields like:
- `_id`: Property unique identifier
- `description`: Property description
- `propertyLocation`: Property address/location
- `price`: Property price
- `areaDetails`: Area/size details
- `purpose`: "rent" or "sale"
- `photosAndVideo`: Array of image/video URLs
- `userId`: Owner's user ID
- `createdAt`: Creation timestamp