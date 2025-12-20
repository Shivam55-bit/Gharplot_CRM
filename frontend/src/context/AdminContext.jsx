import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig.jsx";

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [allPropertyCount, setAllPropertyCount] = useState(0);
  const [allBoughtPropertyCount, setAllBoughtPropertyCount] = useState(0);
  const [admin, setAdmin] = useState(null);

  // Helper function to get the current auth token (admin or employee)
  const getCurrentAuthToken = () => {
    const adminToken = localStorage.getItem("adminToken");
    const employeeToken = localStorage.getItem("employeeToken");
    
    // Prioritize admin token if both exist
    return adminToken || employeeToken;
  };

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = getCurrentAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Helper function to check if current user is employee
  const isEmployee = () => {
    return localStorage.getItem("employeeToken") && !localStorage.getItem("adminToken");
  };

  // Helper function to get API base path based on user type
  const getApiBasePath = () => {
    return isEmployee() ? "/employee/dashboard" : "/api";
  };
  const [allProperties, setAllProperties] = useState([]);
  const [boughtProperties, setBoughtProperties] = useState([]);
  const [rentProperties, setRentProperties] = useState([]);
  const [recentProperties, setRecentProperties] = useState([]);
  const [lastSeenTimestamp, setLastSeenTimestamp] = useState(null);
  const [rentPropertyCount, setRentPropertyCount] = useState(0);
  const [subCategoryCounts, setSubCategoryCounts] = useState({
    Residential: [],
    Commercial: [],
  });
  const [revenueData, setRevenueData] = useState({
    totalRevenue: 0,
    residentialRevenue: 0,
    commercialRevenue: 0,
    monthlyRevenue: [],
    dailyRevenue: [],
  });
  const [growthData, setGrowthData] = useState({
    totalRevenue: 0,
    residentialRevenue: 0,
    commercialRevenue: 0,
    monthlyRevenue: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Add previous data states for comparison
  const [previousData, setPreviousData] = useState({
    totalProperties: 0,
    boughtProperties: 0,
    residential: 0,
    commercial: 0,
    rent: 0,
    timestamp: Date.now(),
  });

  //  Fetch All Properties
  const fetchAllProperties = async () => {
    try {
      setError(null);
      const authToken = getCurrentAuthToken();
      const basePath = getApiBasePath();
      console.log("🔑 Fetching properties with token:", authToken ? "Present" : "Missing");
      console.log("🔑 Token type:", localStorage.getItem("adminToken") ? "Admin" : "Employee");
      console.log("🔑 API Path:", `${basePath}/properties/all`);
      
      const res = await axios.get(`${API_BASE_URL}${basePath}/properties/all`, {
        headers: getAuthHeaders()
      });
      console.log("Raw API Response for all properties:", res.data);

      if (res.data.success) {
        setAllPropertyCount(
          res.data.totalProperty || res.data.data?.length || 0
        );
        setAllProperties(res.data.data || []); //  only store the actual array

        // Log first property to see structure
        if (res.data.data && res.data.data.length > 0) {
          console.log("First property structure:", res.data.data[0]);
          console.log("Property keys:", Object.keys(res.data.data[0]));
        }
      } else {
        // Handle case where success is false but no error
        setAllPropertyCount(0);
        setAllProperties([]);
      }
    } catch (err) {
      console.error("Error fetching all properties:", err);
      setError(
        err.response?.status === 404
          ? "Properties endpoint not found"
          : err.message
      );
      // Set fallback values
      setAllPropertyCount(0);
      setAllProperties([]);
    }
  };

  //  Fetch Bought Properties
  const fetchBoughtProperties = async () => {
    try {
      setError(null);
      const res = await axios.get(
        `${API_BASE_URL}/api/properties/all-bought-properties`,
        { headers: getAuthHeaders() }
      );

      if (res.data) {
        setAllBoughtPropertyCount(
          res.data.totalProperty || res.data.data?.length || 0
        );
        setBoughtProperties(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching bought properties:", err);
      if (err.response?.status === 404) {
        console.log("Bought properties endpoint not found, using fallback");
        setAllBoughtPropertyCount(0);
        setBoughtProperties([]);
      } else {
        setError(err.message);
        setAllBoughtPropertyCount(0);
        setBoughtProperties([]);
      }
    }
  };

  //  Fetch Rent Properties
  const fetchRentProperties = async () => {
    try {
      setError(null);
      const basePath = getApiBasePath();
      const res = await axios.get(`${API_BASE_URL}${basePath}/properties/rent`, {
        headers: getAuthHeaders()
      });
      console.log("Rent properties API response:", res.data);

      if (res.data) {
        setRentPropertyCount(
          res.data.totalProperty || res.data.data?.length || 0
        );
        setRentProperties(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching rent properties:", err);
      if (err.response?.status === 404) {
        console.log("Rent properties endpoint not found, using fallback");
        setRentPropertyCount(0);
        setRentProperties([]);
      } else {
        setError(err.message);
        setRentPropertyCount(0);
        setRentProperties([]);
      }
    }
  };

  //  Fetch Recent Properties
  const fetchRecentProperties = async () => {
    try {
      console.log("Starting to fetch recent properties...");
      setError(null);
      const basePath = getApiBasePath();
      const res = await axios.get(`${API_BASE_URL}${basePath}/properties/recent`, {
        headers: getAuthHeaders()
      });
      console.log("Recent properties API response:", res.data);

      if (res.data && res.data.properties) {
        console.log("Setting recent properties:", res.data.properties);
        setRecentProperties(res.data.properties);
      } else if (res.data && res.data.data) {
        // Handle different response structure
        setRecentProperties(res.data.data);
      } else {
        console.log("No properties found in response");
        setRecentProperties([]);
      }
    } catch (err) {
      console.error("Error fetching recent properties:", err);
      if (err.response?.status === 404) {
        console.log(
          "Recent properties endpoint not found, generating fallback from all properties"
        );
        // Generate recent properties from allProperties if available
        if (allProperties && allProperties.length > 0) {
          const recentFallback = allProperties.slice(
            0,
            Math.min(5, allProperties.length)
          );
          console.log("Generated fallback recent properties:", recentFallback);
          setRecentProperties(recentFallback);
        } else {
          setRecentProperties([]);
        }
      } else {
        setError(err.message);
        setRecentProperties([]);
      }
    } finally {
      console.log("Finished fetching recent properties");
    }
  };

  // Mark recent properties as seen by storing current timestamp
  const markRecentPropertiesAsSeen = useCallback(() => {
    const currentTime = new Date().toISOString();
    setLastSeenTimestamp(currentTime);
    // Store in localStorage for persistence
    localStorage.setItem('lastSeenPropertiesTimestamp', currentTime);
    console.log('Marked properties as seen at:', currentTime);
  }, []);

  // Get count of unseen recent properties (properties added after last seen timestamp)
  const getUnseenPropertyCount = useCallback(() => {
    if (!recentProperties || recentProperties.length === 0) {
      return 0;
    }
    
    // If no last seen timestamp, all properties are new
    if (!lastSeenTimestamp) {
      console.log('No last seen timestamp - showing all properties:', recentProperties.length);
      return recentProperties.length;
    }
    
    // Count properties that were posted/created after the last seen timestamp
    const unseenCount = recentProperties.filter(property => {
      const propertyDate = new Date(property.postedDate || property.createdAt);
      const lastSeenDate = new Date(lastSeenTimestamp);
      return propertyDate > lastSeenDate;
    }).length;
    
    console.log('Unseen property count:', unseenCount, 'out of', recentProperties.length, '(last seen:', lastSeenTimestamp, ')');
    return unseenCount;
  }, [recentProperties, lastSeenTimestamp]);

  // Calculate percentage change between current and previous values
  const calculatePercentageChange = (current, previous) => {
    if (previous === 0 || previous === null || previous === undefined) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  };

  // Update previous data for comparison
  const updatePreviousData = useCallback((currentData) => {
    setPreviousData({
      totalProperties: currentData.totalProperties || 0,
      boughtProperties: currentData.boughtProperties || 0,
      residential: currentData.residential || 0,
      commercial: currentData.commercial || 0,
      rent: currentData.rent || 0,
      timestamp: Date.now(),
    });
  }, []);

  // Get current data snapshot
  const getCurrentDataSnapshot = useCallback(() => {
    const residentialTotal =
      subCategoryCounts.Residential?.reduce(
        (sum, item) => sum + item.count,
        0
      ) || 0;
    const commercialTotal =
      subCategoryCounts.Commercial?.reduce(
        (sum, item) => sum + item.count,
        0
      ) || 0;

    return {
      totalProperties: allPropertyCount || 0, // allPropertyCount is already a number
      boughtProperties: allBoughtPropertyCount?.count || 0,
      residential: residentialTotal,
      commercial: commercialTotal,
      rent: rentPropertyCount || 0,
    };
  }, [
    allPropertyCount,
    allBoughtPropertyCount,
    subCategoryCounts,
    rentPropertyCount,
  ]);

  // Get dynamic percentage changes for dashboard cards
  const getDynamicChanges = () => {
    // Get current data
    const currentData = getCurrentDataSnapshot();

    // Check if we have previous data for comparison
    const timeDifference = Date.now() - previousData.timestamp;
    const hasValidPreviousData = timeDifference > 5000; // Only compare if data is at least 5 seconds old

    if (
      hasValidPreviousData &&
      (previousData.totalProperties !== 0 ||
        previousData.boughtProperties !== 0 ||
        previousData.residential !== 0 ||
        previousData.commercial !== 0 ||
        previousData.rent !== 0)
    ) {
      // Use real data comparison
      console.log("Using real data comparison:", { currentData, previousData });

      const totalChange = calculatePercentageChange(
        currentData.totalProperties,
        previousData.totalProperties
      );
      const boughtChange = calculatePercentageChange(
        currentData.boughtProperties,
        previousData.boughtProperties
      );
      const residentialChange = calculatePercentageChange(
        currentData.residential,
        previousData.residential
      );
      const commercialChange = calculatePercentageChange(
        currentData.commercial,
        previousData.commercial
      );
      const rentChange = calculatePercentageChange(
        currentData.rent,
        previousData.rent
      );

      // Update previous data for next comparison
      updatePreviousData(currentData);

      return {
        totalProperties: {
          change: Math.abs(totalChange),
          positive: totalChange >= 0,
        },
        boughtProperties: {
          change: Math.abs(boughtChange),
          positive: boughtChange >= 0,
        },
        residential: {
          change: Math.abs(residentialChange),
          positive: residentialChange >= 0,
        },
        commercial: {
          change: Math.abs(commercialChange),
          positive: commercialChange >= 0,
        },
        rent: { change: Math.abs(rentChange), positive: rentChange >= 0 },
      };
    } else {
      // Initialize previous data if this is the first load
      if (
        previousData.timestamp === 0 ||
        (currentData.totalProperties > 0 && previousData.totalProperties === 0)
      ) {
        updatePreviousData(currentData);
        console.log("Initializing previous data:", currentData);
      }

      // Return small default changes for first load
      return {
        totalProperties: { change: 2.5, positive: true },
        boughtProperties: { change: 1.8, positive: true },
        residential: { change: 3.2, positive: true },
        commercial: { change: 1.1, positive: false },
        rent: { change: 0.9, positive: true },
      };
    }
  };

  //  Fetch Sub Category Counts
  const fetchSubCategoryCounts = async () => {
    try {
      setError(null);
      const basePath = getApiBasePath();
      const res = await axios.get(
        `${API_BASE_URL}${basePath}/subcategory-counts`,
        { headers: getAuthHeaders() }
      );
      console.log("Sub category API response:", res.data);

      if (res.data) {
        setSubCategoryCounts(res.data);
      }
    } catch (err) {
      console.error("Error fetching sub category counts:", err);
      if (err.response?.status === 404) {
        console.log(
          "Sub category counts endpoint not found, generating from available data"
        );
        // Generate subcategory counts from allProperties if available
        generateSubCategoryCountsFromProperties();
      } else {
        setError(err.message);
        setSubCategoryCounts({ Residential: [], Commercial: [] });
      }
    }
  };

  // Generate subcategory counts from existing properties data
  const generateSubCategoryCountsFromProperties = useCallback(() => {
    try {
      const residential = {};
      const commercial = {};

      allProperties.forEach((property) => {
        if (
          property.propertyType === "Residential" &&
          property.residentialType
        ) {
          residential[property.residentialType] =
            (residential[property.residentialType] || 0) + 1;
        } else if (
          property.propertyType === "Commercial" &&
          property.commercialType
        ) {
          commercial[property.commercialType] =
            (commercial[property.commercialType] || 0) + 1;
        }
      });

      const residentialArray = Object.entries(residential).map(
        ([name, count]) => ({ name, count })
      );
      const commercialArray = Object.entries(commercial).map(
        ([name, count]) => ({ name, count })
      );

      setSubCategoryCounts({
        Residential: residentialArray,
        Commercial: commercialArray,
      });

      console.log("Generated subcategory counts:", {
        Residential: residentialArray,
        Commercial: commercialArray,
      });
    } catch (err) {
      console.error("Error generating subcategory counts:", err);
      setSubCategoryCounts({ Residential: [], Commercial: [] });
    }
  }, [allProperties]);

  //  Fetch Revenue Data from Bought Properties API
  const fetchRevenueData = async () => {
    try {
      setError(null);
      
      // Fetch bought properties data
      const basePath = getApiBasePath();
      const res = await axios.get(`${API_BASE_URL}${basePath}/properties/bought`, {
        headers: getAuthHeaders()
      });
      console.log("Bought Properties API response for revenue:", res.data);

      if (res.data && res.data.data) {
        // Process bought properties to generate revenue data
        const boughtProps = res.data.data;
        
        let totalRevenue = 0;
        let residentialRevenue = 0;
        let commercialRevenue = 0;
        const monthlyRevenueMap = {};
        const dailyRevenueMap = {}; // New: Track daily revenue

        // Process each bought property
        boughtProps.forEach((item) => {
          const property = item.propertyId;
          if (!property) return;

          const price = parseFloat(property.price) || 0;
          totalRevenue += price;

          // Categorize by property type
          if (property.propertyType === 'Residential') {
            residentialRevenue += price;
          } else if (property.propertyType === 'Commercial') {
            commercialRevenue += price;
          }

          // Group by month
          const date = new Date(item.createdAt || item.boughtDate || new Date());
          const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const monthName = date.toLocaleString('en-US', { month: 'short' });
          
          // New: Group by date for daily tracking
          const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

          if (!monthlyRevenueMap[monthYear]) {
            monthlyRevenueMap[monthYear] = {
              month: monthName,
              year: date.getFullYear(),
              totalRevenue: 0,
              residentialRevenue: 0,
              commercialRevenue: 0,
              date: date,
            };
          }

          // New: Track daily revenue
          if (!dailyRevenueMap[dateKey]) {
            dailyRevenueMap[dateKey] = {
              date: dateKey,
              totalRevenue: 0,
              residentialRevenue: 0,
              commercialRevenue: 0,
            };
          }

          monthlyRevenueMap[monthYear].totalRevenue += price;
          dailyRevenueMap[dateKey].totalRevenue += price;
          
          if (property.propertyType === 'Residential') {
            monthlyRevenueMap[monthYear].residentialRevenue += price;
            dailyRevenueMap[dateKey].residentialRevenue += price;
          } else if (property.propertyType === 'Commercial') {
            monthlyRevenueMap[monthYear].commercialRevenue += price;
            dailyRevenueMap[dateKey].commercialRevenue += price;
          }
        });

        // Convert to array and sort by date (last 12 months)
        let monthlyRevenue = Object.values(monthlyRevenueMap)
          .sort((a, b) => a.date - b.date)
          .slice(-12)
          .map(({ month, totalRevenue, residentialRevenue, commercialRevenue }) => ({
            month,
            totalRevenue,
            residentialRevenue,
            commercialRevenue,
          }));

        // New: Convert daily data to array and sort
        let dailyRevenue = Object.values(dailyRevenueMap)
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        // If no monthly data, create default structure for last 12 months
        if (monthlyRevenue.length === 0) {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const currentMonth = new Date().getMonth();
          monthlyRevenue = [];
          for (let i = 0; i < 12; i++) {
            const monthIndex = (currentMonth - 11 + i + 12) % 12;
            monthlyRevenue.push({
              month: months[monthIndex],
              totalRevenue: 0,
              residentialRevenue: 0,
              commercialRevenue: 0,
            });
          }
        }

        const revenueDataFromAPI = {
          totalRevenue,
          residentialRevenue,
          commercialRevenue,
          monthlyRevenue,
          dailyRevenue, // New: Include daily revenue data
        };

        console.log("Processed revenue data from bought properties:", revenueDataFromAPI);
        setRevenueData(revenueDataFromAPI);
      } else {
        // If no data, set empty state
        setRevenueData({
          totalRevenue: 0,
          residentialRevenue: 0,
          commercialRevenue: 0,
          monthlyRevenue: [],
          dailyRevenue: [], // New: Include daily revenue data
        });
      }
    } catch (err) {
      console.error("Error fetching revenue data from bought properties:", err);
      if (err.response?.status === 404) {
        console.log(
          "Bought properties endpoint not found, generating from all properties"
        );
        // Generate revenue data from allProperties if available
        generateRevenueDataFromProperties();
      } else {
        setError(err.message);
        setRevenueData({
          totalRevenue: 0,
          residentialRevenue: 0,
          commercialRevenue: 0,
          monthlyRevenue: [],
          dailyRevenue: [], // New: Include daily revenue data
        });
      }
    }
  };

  //  Fetch Growth Data from Revenue API (for Growth Statistics Chart)
  const fetchGrowthData = async () => {
    try {
      setError(null);
      const basePath = getApiBasePath();
      const res = await axios.get(`${API_BASE_URL}${basePath}/revenue`, {
        headers: getAuthHeaders()
      });
      console.log("Growth Statistics API response:", res.data);

      if (res.data && res.data.success) {
        setGrowthData({
          totalRevenue: res.data.totalRevenue || 0,
          residentialRevenue: res.data.residentialRevenue || 0,
          commercialRevenue: res.data.commercialRevenue || 0,
          monthlyRevenue: res.data.monthlyRevenue || [],
        });
      } else {
        setGrowthData({
          totalRevenue: 0,
          residentialRevenue: 0,
          commercialRevenue: 0,
          monthlyRevenue: [],
        });
      }
    } catch (err) {
      console.error("Error fetching growth statistics data:", err);
      setGrowthData({
        totalRevenue: 0,
        residentialRevenue: 0,
        commercialRevenue: 0,
        monthlyRevenue: [],
      });
    }
  };

  // Generate revenue data from existing properties
  const generateRevenueDataFromProperties = useCallback(() => {
    try {
      let totalRevenue = 0;
      let residentialRevenue = 0;
      let commercialRevenue = 0;
      const monthlyRevenue = [];

      allProperties.forEach((property) => {
        const price = parseFloat(property.price) || 0;
        totalRevenue += price;

        if (property.propertyType === "Residential") {
          residentialRevenue += price;
        } else if (property.propertyType === "Commercial") {
          commercialRevenue += price;
        }
      });

      // Generate dummy monthly data for the last 12 months
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      for (let i = 0; i < 12; i++) {
        monthlyRevenue.push({
          month: months[i],
          revenue: Math.floor(
            totalRevenue / 12 + Math.random() * (totalRevenue / 6)
          ),
        });
      }

      setRevenueData({
        totalRevenue,
        residentialRevenue,
        commercialRevenue,
        monthlyRevenue,
        dailyRevenue: [], // Add empty daily revenue
      });

      console.log("Generated revenue data:", {
        totalRevenue,
        residentialRevenue,
        commercialRevenue,
      });
    } catch (err) {
      console.error("Error generating revenue data:", err);
      setRevenueData({
        totalRevenue: 0,
        residentialRevenue: 0,
        commercialRevenue: 0,
        monthlyRevenue: [],
        dailyRevenue: [], // Add empty daily revenue
      });
    }
  }, [allProperties]);

  // Function to manually refresh all data
  const refreshAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Execute all data fetching functions in parallel
      await Promise.all([
        fetchAllProperties(),
        fetchBoughtProperties(),
        fetchRentProperties(),
        fetchRecentProperties(),
        fetchSubCategoryCounts(),
        fetchRevenueData(),
        fetchGrowthData()
      ]);
    } catch (err) {
      console.error("Error refreshing data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete Property function
  const deleteProperty = async (propertyId) => {
    try {
      setLoading(true);
      setError(null);

      console.log("Deleting property with ID:", propertyId);
      const response = await axios.delete(
        `${API_BASE_URL}/property/delete/${propertyId}`,
        { headers: getAuthHeaders() }
      );

      console.log("Property deleted successfully:", response.data);

      // Refresh all property data after deletion
      await fetchAllProperties();
      await fetchRecentProperties();
      await fetchBoughtProperties();
      await fetchRentProperties();
      await fetchSubCategoryCounts();

      return { success: true, message: "Property deleted successfully" };
    } catch (err) {
      console.error("Error deleting property:", err);
      setError(err.message);
      return { 
        success: false, 
        message: err.response?.data?.message || err.message 
      };
    } finally {
      setLoading(false);
    }
  };

  // Admin Signup function
  const adminSignup = async (signupData) => {
    try {
      setLoading(true);
      setError(null);

      // Prepare data for API - convert phone to mobileNumber if needed
      const apiData = {
        fullName: signupData.fullName,
        email: signupData.email,
        mobileNumber: signupData.phone || signupData.mobileNumber,
        password: signupData.password,
      };

      console.log("Signing up admin:", apiData);
      const response = await fetch(`${API_BASE_URL}/admin/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();
      console.log("Admin signup response:", result);

      if (!response.ok) {
        throw new Error(result.message || `Signup failed: ${response.status}`);
      }

      return { success: true, data: result };
    } catch (err) {
      console.error("Error during admin signup:", err);
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Admin Login function
  const adminLogin = async (loginData) => {
    try {
      setLoading(true);
      setError(null);

      console.log("Logging in admin:", { email: loginData.email });
      
      // Try the main API first
      let response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
        }),
      });

      // If the main API fails, try the fallback URL
      if (!response.ok) {
        console.log("Main API failed with status:", response.status, "Trying fallback URL");
        const FALLBACK_API_URL = "https://abc.bhoomitechzone.us";
        response = await fetch(`${FALLBACK_API_URL}/admin/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: loginData.email,
            password: loginData.password,
          }),
        });
      }

      const result = await response.json();
      console.log("Admin login response:", result);

      if (!response.ok) {
        // Provide more descriptive error messages based on status code
        let errorMessage = "";
        switch (response.status) {
          case 401:
            errorMessage = "Invalid email or password. Please check your credentials.";
            break;
          case 404:
            errorMessage = "Login service not found. Please contact support.";
            break;
          case 500:
            errorMessage = "Server error. Please try again later or contact support.";
            break;
          case 503:
            errorMessage = "Service unavailable. Please try again later.";
            break;
          default:
            errorMessage = result.message || `Login failed with status ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Store token and admin data
      localStorage.setItem("adminToken", result.token);
      localStorage.setItem("adminData", JSON.stringify(result.user || result.admin));
      localStorage.setItem("isAuthenticated", "true"); // Set for backward compatibility
      setAdmin(result.user || result.admin);

      return { success: true, data: result };
    } catch (err) {
      console.error("Error during admin login:", err);
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedAdmin = localStorage.getItem("adminData");
    const savedEmployee = localStorage.getItem("employeeData");
    const authToken = getCurrentAuthToken();
    const savedLastSeenTimestamp = localStorage.getItem("lastSeenPropertiesTimestamp");

    // Set admin data if admin is logged in
    if (savedAdmin && localStorage.getItem("adminToken")) {
      setAdmin(JSON.parse(savedAdmin));
      console.log(" Token & admin restored from localStorage");
    } 
    // Set employee data if employee is logged in
    else if (savedEmployee && localStorage.getItem("employeeToken")) {
      const employeeData = JSON.parse(savedEmployee);
      setAdmin({ name: employeeData.name, email: employeeData.email, role: 'employee' });
      console.log(" Token & employee restored from localStorage");
    }

    // Set authorization header if any token exists
    if (authToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
    }

    if (savedLastSeenTimestamp) {
      setLastSeenTimestamp(savedLastSeenTimestamp);
      console.log(" Last seen timestamp restored:", savedLastSeenTimestamp);
    }
  }, []);

  // Fetch all data in parallel for better performance
  useEffect(() => {
    const fetchDataInParallel = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Execute all data fetching functions in parallel
        await Promise.all([
          fetchAllProperties(),
          fetchBoughtProperties(),
          fetchRentProperties(),
          fetchRecentProperties(),
          fetchSubCategoryCounts(),
          fetchRevenueData(),
          fetchGrowthData()
        ]);
      } catch (err) {
        console.error("Error fetching data in parallel:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDataInParallel();
  }, []);

  // Generate fallback data when properties are loaded but other endpoints fail
  useEffect(() => {
    if (allProperties.length > 0) {
      // Only generate fallbacks if the arrays are empty (indicating API failures)
      if (
        subCategoryCounts.Residential.length === 0 &&
        subCategoryCounts.Commercial.length === 0
      ) {
        generateSubCategoryCountsFromProperties();
      }
      if (revenueData.totalRevenue === 0) {
        generateRevenueDataFromProperties();
      }
    }
  }, [
    allProperties,
    subCategoryCounts.Residential.length,
    subCategoryCounts.Commercial.length,
    revenueData.totalRevenue,
  ]);

  // Track data changes and update previous data for comparison
  useEffect(() => {
    const currentData = getCurrentDataSnapshot();

    // Only update if data has actually changed
    if (
      currentData.totalProperties !== previousData.totalProperties ||
      currentData.boughtProperties !== previousData.boughtProperties ||
      currentData.residential !== previousData.residential ||
      currentData.commercial !== previousData.commercial ||
      currentData.rent !== previousData.rent
    ) {
      // Wait a bit before updating to ensure we have stable data
      const timeoutId = setTimeout(() => {
        console.log("Data changed, updating previous data:", {
          from: previousData,
          to: currentData,
        });
        setPreviousData({
          ...currentData,
          timestamp: Date.now(),
        });
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [
    allPropertyCount,
    allBoughtPropertyCount,
    subCategoryCounts,
    rentPropertyCount,
    previousData,
    getCurrentDataSnapshot,
  ]);

  return (
    <AdminContext.Provider
      value={{
        admin,
        setAdmin,
        allProperties,
        allPropertyCount,
        boughtProperties,
        allBoughtPropertyCount,
        rentProperties,
        rentPropertyCount,
        recentProperties,
        subCategoryCounts,
        revenueData,
        growthData,
        fetchAllProperties,
        fetchBoughtProperties,
        fetchRentProperties,
        fetchRecentProperties,
        fetchSubCategoryCounts,
        fetchRevenueData,
        fetchGrowthData,
        markRecentPropertiesAsSeen,
        getUnseenPropertyCount,
        getDynamicChanges,
        getCurrentDataSnapshot,
        updatePreviousData,
        previousData,
        deleteProperty,
        adminSignup,
        adminLogin,
        refreshAllData, // Add refresh function
        loading,
        error,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);
export default AdminContext;