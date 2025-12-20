# Property Management Module Integration Guide

## Overview
The Property Management module is a complete solution for managing properties in the GharPlot CRM app with API integration, role-based authentication, and real-time data updates.

## Module Structure
```
src/screens/CRM/PropertyManagement/
├── PropertyDashboard.js          # Main dashboard with overview
├── PropertyList.js               # Property listing with search/filters
├── PropertyAnalytics.js          # Analytics and insights
└── index.js                      # Module exports and navigation config

src/services/
└── propertyService.js            # API service layer

src/crm/crmscreens/Admin/
└── PropertyManagementScreen.js   # Enhanced existing screen (updated)
```

## Features Implemented
✅ **API Integration**: Complete integration with https://abc.bhoomitechzone.us
✅ **Role-based Authentication**: Automatic admin/employee endpoint detection
✅ **Real-time Data**: Pull-to-refresh and automatic data loading
✅ **Search & Filters**: Property filtering by type, status, location
✅ **Analytics**: Comprehensive property insights and statistics
✅ **Error Handling**: Robust error states and retry mechanisms
✅ **Loading States**: Smooth user experience with loading indicators
✅ **Responsive Design**: Optimized for mobile devices
✅ **Admin Controls**: Delete functionality for admin users

## Quick Integration

### 1. Import Components
```javascript
import {
  PropertyDashboard,
  PropertyList,
  PropertyAnalytics,
  PropertyManagementRoutes,
  registerPropertyManagementRoutes
} from './src/screens/CRM/PropertyManagement';
```

### 2. Add Navigation Routes
In your navigation setup (e.g., `AdminNavigator.js`):

```javascript
import { registerPropertyManagementRoutes } from '../screens/CRM/PropertyManagement';

// In your Stack.Navigator
{registerPropertyManagementRoutes(Stack)}
```

Or manually:
```javascript
<Stack.Screen name="PropertyDashboard" component={PropertyDashboard} />
<Stack.Screen name="PropertyList" component={PropertyList} />
<Stack.Screen name="PropertyAnalytics" component={PropertyAnalytics} />
```

### 3. Navigation Examples
```javascript
// Navigate to Property Dashboard
navigation.navigate('PropertyDashboard');

// Navigate to Property List with filters
navigation.navigate('PropertyList', { 
  initialTab: 'rent',
  searchQuery: 'Mumbai' 
});

// Navigate to Analytics
navigation.navigate('PropertyAnalytics');
```

## API Configuration

### Endpoints Used
- **Admin Properties**: `/admin/getAllProperties`
- **Employee Properties**: `/employee/getAllProperties`
- **Delete Property**: `/admin/deleteProperty/{id}`
- **Property Analytics**: `/admin/getPropertyAnalytics`

### Authentication
The module automatically detects user role from AsyncStorage:
- `adminToken`: Admin user with full access
- `employeeToken`: Employee user with limited access

### Sample API Response
```javascript
{
  "properties": [
    {
      "id": 1,
      "title": "Luxury Villa",
      "location": "Mumbai",
      "type": "Villa",
      "status": "Active",
      "price": 50000000,
      "images": ["url1", "url2"],
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Component Usage

### PropertyDashboard
Main overview screen with statistics and quick navigation.

```javascript
<PropertyDashboard />
```

**Features:**
- Property count statistics
- Revenue overview
- Quick navigation cards
- Role-based UI elements
- Pull-to-refresh functionality

### PropertyList
Complete property listing with advanced features.

```javascript
<PropertyList 
  initialTab="all"           // 'all', 'buy', 'rent'
  searchQuery=""             // Initial search query
/>
```

**Features:**
- Tab-based filtering (All, Buy, Rent)
- Search functionality
- 2-column grid layout
- Admin delete buttons
- Empty and loading states
- Pull-to-refresh

### PropertyAnalytics
Detailed analytics and insights screen.

```javascript
<PropertyAnalytics />
```

**Features:**
- Property type breakdown
- Status distribution
- Location insights
- Revenue analytics
- Performance metrics

## Customization

### Theming
Update colors in each component:
```javascript
const theme = {
  primary: '#4F46E5',
  secondary: '#06B6D4',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  background: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280'
};
```

### API Service Extension
Extend `propertyService.js` for additional endpoints:
```javascript
export const addProperty = async (propertyData) => {
  // Implementation
};

export const updateProperty = async (id, propertyData) => {
  // Implementation
};
```

## Error Handling

The module includes comprehensive error handling:

1. **Network Errors**: Retry mechanisms and user feedback
2. **Authentication Errors**: Automatic token refresh
3. **API Errors**: Error messages and fallback states
4. **Loading States**: Skeleton screens and indicators

## Performance Optimizations

- **Lazy Loading**: Components load data only when needed
- **Caching**: API responses cached for better performance
- **Efficient Rendering**: FlatList for large data sets
- **Image Optimization**: Placeholder images for failed loads

## Testing

### Manual Testing Checklist
- [ ] Dashboard loads with correct statistics
- [ ] Property list displays in 2-column grid
- [ ] Search functionality works
- [ ] Tab filtering works (All/Buy/Rent)
- [ ] Admin users can delete properties
- [ ] Pull-to-refresh updates data
- [ ] Analytics screen shows insights
- [ ] Error states display correctly
- [ ] Loading states work smoothly

### API Testing
Use the provided test files to verify API integration:
```bash
# Test API endpoints
node test-real-apis.js
```

## Troubleshooting

### Common Issues

1. **Properties not loading**
   - Check token in AsyncStorage
   - Verify API endpoint availability
   - Check network connectivity

2. **Delete not working**
   - Ensure user has admin role
   - Check delete API endpoint

3. **Images not displaying**
   - Verify image URLs in API response
   - Check network permissions

### Debug Mode
Enable debug logging in `propertyService.js`:
```javascript
const DEBUG = __DEV__;
if (DEBUG) console.log('API Response:', data);
```

## Future Enhancements

Potential improvements for the module:
- [ ] Property details screen
- [ ] Add/Edit property functionality
- [ ] Advanced filters (price range, amenities)
- [ ] Map view integration
- [ ] Push notifications
- [ ] Offline data caching
- [ ] Image upload functionality
- [ ] Property comparison feature

## Support

For issues or questions regarding this module:
1. Check the error logs in React Native debugger
2. Verify API endpoints are working
3. Test with different user roles (admin/employee)
4. Review the integration steps above

The Property Management module is production-ready and includes all necessary error handling, loading states, and user feedback mechanisms for a smooth user experience.