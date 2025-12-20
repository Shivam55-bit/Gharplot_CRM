/**
 * CRM Enquiry Management API
 * Handles all enquiry related API calls
 */
import { CRM_BASE_URL, getCRMAuthHeaders, handleCRMResponse } from './crmAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get Auth Token with priority order
const getToken = async () => {
  const adminToken = await AsyncStorage.getItem('adminToken');
  const employeeToken = await AsyncStorage.getItem('employeeToken');
  const genericToken = await AsyncStorage.getItem('token');
  
  return adminToken || employeeToken || genericToken;
};

// Common Headers
const getAuthHeaders = async () => {
  const token = await getToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Get all manual enquiries
 */
export const getAllEnquiries = async () => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/inquiry/all`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    
    const data = await handleCRMResponse(response);
    return {
      success: true,
      data: data.data || data,
      message: data.message || 'Manual enquiries fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching manual enquiries:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch manual enquiries',
      data: []
    };
  }
};

/**
 * Get client/user enquiries
 */
export const getUserEnquiries = async () => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/api/inquiry/get-enquiries`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    
    const data = await handleCRMResponse(response);
    return {
      success: true,
      data: data.data || data,
      message: data.message || 'Enquiries fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching user enquiries:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch user enquiries',
      data: []
    };
  }
};

/**
 * Fetch both client and manual enquiries in parallel
 */
export const getAllEnquiriesMerged = async () => {
  try {
    const [userResponse, manualResponse] = await Promise.allSettled([
      getUserEnquiries(),
      getAllEnquiries()
    ]);
    
    let mergedData = [];
    let stats = { total: 0, client: 0, manual: 0 };
    
    // Process user/client enquiries
    if (userResponse.status === 'fulfilled' && userResponse.value?.success) {
      const clientEnquiries = (userResponse.value.data || []).map(enquiry => {
        // Safely extract data from nested objects
        const buyerData = enquiry.buyerId || {};
        const propertyData = enquiry.propertyId || {};
        const assignmentData = enquiry.assignment || null;
        
        return {
          _id: enquiry._id,
          source: 'client',
          enquiryType: 'Inquiry',
          clientName: buyerData.fullName || enquiry.fullName || 'N/A',
          email: buyerData.email || enquiry.email || 'N/A',
          contactNumber: buyerData.phone || enquiry.contactNumber || 'N/A',
          propertyType: propertyData.propertyType || 'N/A',
          propertyLocation: propertyData.propertyLocation || 'N/A',
          price: propertyData.price || 'N/A',
          status: enquiry.status || 'new',
          createdAt: enquiry.createdAt,
          assignment: assignmentData ? {
            _id: assignmentData._id,
            employeeId: assignmentData.employeeId || null,
            assignedAt: assignmentData.assignedAt
          } : null,
          // Only include essential flat properties
          propertyId: enquiry.propertyId?._id || null,
          buyerId: enquiry.buyerId?._id || null,
          ownerId: enquiry.ownerId?._id || null
        };
      });
      mergedData = [...mergedData, ...clientEnquiries];
      stats.client = clientEnquiries.length;
    }
    
    // Process manual enquiries
    if (manualResponse.status === 'fulfilled' && manualResponse.value?.success) {
      const manualEnquiries = (manualResponse.value.data || []).map(enquiry => ({
        _id: enquiry._id,
        source: 'manual',
        enquiryType: 'ManualInquiry',
        clientName: enquiry.clientName || 'N/A',
        email: enquiry.email || 'N/A',
        contactNumber: enquiry.contactNumber || 'N/A',
        propertyType: enquiry.productType || enquiry.propertyType || 'N/A',
        propertyLocation: enquiry.location || 'N/A',
        price: 'N/A',
        status: enquiry.caseStatus || enquiry.status || 'new',
        createdAt: enquiry.createdAt,
        assignment: enquiry.assignment || null,
        // Manual enquiry specific fields
        s_No: enquiry.s_No,
        ClientCode: enquiry.ClientCode,
        ProjectCode: enquiry.ProjectCode,
        caseStatus: enquiry.caseStatus,
        source_detail: enquiry.source,
        majorComments: enquiry.majorComments,
        address: enquiry.address,
        weekOrActionTaken: enquiry.weekOrActionTaken,
        actionPlan: enquiry.actionPlan,
        referenceBy: enquiry.referenceBy
      }));
      mergedData = [...mergedData, ...manualEnquiries];
      stats.manual = manualEnquiries.length;
    }
    
    stats.total = mergedData.length;
    
    return {
      success: true,
      data: mergedData,
      stats: stats
    };
  } catch (error) {
    console.error('Error fetching merged enquiries:', error);
    return {
      success: false,
      message: 'Failed to fetch enquiries',
      data: [],
      stats: { total: 0, client: 0, manual: 0 }
    };
  }
};

/**
 * Add manual enquiry
 */
export const addManualEnquiry = async (enquiryData) => {
  try {
    console.log('🚀 Starting manual enquiry creation...');
    console.log('📝 Form data:', JSON.stringify(enquiryData, null, 2));
    
    const headers = await getAuthHeaders();
    console.log('🔐 Auth headers:', JSON.stringify(headers, null, 2));
    
    const url = `${CRM_BASE_URL}/api/inquiry/create`;
    console.log('🌐 API URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(enquiryData),
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response statusText:', response.statusText);
    
    // Get response text first to see what we're getting
    const responseText = await response.text();
    console.log('📡 Response body:', responseText);
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('❌ Response was:', responseText.substring(0, 200));
      return {
        success: false,
        message: 'Server returned invalid response. Please check backend server.',
        data: null
      };
    }
    
    // Check if request was successful
    if (!response.ok) {
      console.error('❌ HTTP error:', response.status, data);
      return {
        success: false,
        message: data.message || data.error || `Server error: ${response.status}`,
        data: null
      };
    }
    
    console.log('✅ API Response data:', JSON.stringify(data, null, 2));
    
    return {
      success: data.success !== false, // Consider success if not explicitly false
      data: data.data || data,
      message: data.message || 'Enquiry created successfully'
    };
  } catch (error) {
    console.error('❌ Error adding manual enquiry:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    return {
      success: false,
      message: error.message || 'Failed to create manual inquiry',
      data: null
    };
  }
};

/**
 * Get available employees for assignment
 */
export const getAvailableEmployees = async () => {
  try {
    const adminToken = await AsyncStorage.getItem('adminToken');
    const response = await fetch(`${CRM_BASE_URL}/admin/leads/available-employees`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
    });
    
    const data = await handleCRMResponse(response);
    return {
      success: true,
      data: data.data || data,
      message: data.message || 'Employees fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching available employees:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch available employees',
      data: []
    };
  }
};

/**
 * Get available roles for auto assignment
 */
export const getAvailableRoles = async () => {
  try {
    const adminToken = await AsyncStorage.getItem('adminToken');
    const response = await fetch(`${CRM_BASE_URL}/admin/roles/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error fetching available roles:', error);
    throw error;
  }
};

/**
 * Assign enquiries to employee
 */
export const assignEnquiriesToEmployee = async (assignmentData) => {
  try {
    const adminToken = await AsyncStorage.getItem('adminToken');
    const response = await fetch(`${CRM_BASE_URL}/admin/leads/assign`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(assignmentData),
    });
    
    const data = await handleCRMResponse(response);
    return {
      success: true,
      data: data.data || data,
      message: data.message || 'Enquiries assigned successfully'
    };
  } catch (error) {
    console.error('Error assigning enquiries:', error);
    return {
      success: false,
      message: error.message || 'Failed to assign enquiries',
      data: null
    };
  }
};

/**
 * Unassign enquiry from employee
 */
export const unassignEnquiry = async (enquiryId, enquiryType) => {
  try {
    const adminToken = await AsyncStorage.getItem('adminToken');
    const response = await fetch(`${CRM_BASE_URL}/admin/leads/unassign`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        enquiryId,
        enquiryType
      }),
    });
    
    return await handleCRMResponse(response);
  } catch (error) {
    console.error('Error unassigning enquiry:', error);
    throw error;
  }
};

/**
 * Create reminder for enquiry
 */
export const createReminder = async (reminderData) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/employee/reminders/create`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(reminderData),
    });
    
    const data = await response.json();
    return {
      success: data.success !== false,
      message: data.message || 'Reminder created successfully',
      data: data.data || data
    };
  } catch (error) {
    console.error('Error creating reminder:', error);
    return {
      success: false,
      message: error.message || 'Failed to create reminder',
      data: null
    };
  }
};

/**
 * Create reminder from lead/enquiry with all details
 */
export const createReminderFromLead = async (reminderData) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/employee/reminders/create-from-lead`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(reminderData),
    });
    
    const data = await response.json();
    return {
      success: data.success !== false,
      message: data.message || 'Reminder created from lead successfully',
      data: data.data || data
    };
  } catch (error) {
    console.error('Error creating reminder from lead:', error);
    return {
      success: false,
      message: error.message || 'Failed to create reminder from lead',
      data: null
    };
  }
};

/**
 * Create follow-up for enquiry
 * Endpoint matching web: /employee/follow-ups/create
 */
export const createFollowUp = async (followUpData) => {
  try {
    const response = await fetch(`${CRM_BASE_URL}/employee/follow-ups/create`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(followUpData),
    });
    
    const data = await response.json();
    return {
      success: data.success !== false,
      message: data.message || 'Follow-up created successfully',
      data: data.data || data
    };
  } catch (error) {
    console.error('Error creating follow-up:', error);
    return {
      success: false,
      message: error.message || 'Failed to create follow-up',
      data: null
    };
  }
};

export default {
  getAllEnquiries,
  getUserEnquiries,
  getAllEnquiriesMerged,
  addManualEnquiry,
  getAvailableEmployees,
  getAvailableRoles,
  assignEnquiriesToEmployee,
  unassignEnquiry,
  createReminder,
  createReminderFromLead,
  createFollowUp,
};
