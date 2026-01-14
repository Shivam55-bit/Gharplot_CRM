/**
 * CRM Enquiry Management API
 * Handles all enquiry related API calls
 */
import { CRM_BASE_URL, getCRMAuthHeaders, handleCRMResponse } from './crmAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Send FCM notification for new enquiry to backend
 * Backend will handle sending notification to relevant users
 */
const sendEnquiryNotification = async (enquiryData) => {
  try {
    const headers = await getAuthHeaders();
    
    const notificationPayload = {
      type: 'enquiry',
      title: 'New Enquiry Created',
      message: `New enquiry from ${enquiryData.clientName || 'Unknown Client'}`,
      data: {
        clientName: enquiryData.clientName,
        contactNumber: enquiryData.contactNumber,
        ClientCode: enquiryData.ClientCode,
        s_No: enquiryData.s_No,
        notificationType: 'enquiry_created'
      }
    };
    
    const response = await fetch(`${CRM_BASE_URL}/api/notification/send`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(notificationPayload),
    });
    
    if (response.ok) {
      console.log('✅ Enquiry notification sent successfully');
    } else {
      console.warn('⚠️ Failed to send enquiry notification:', response.status);
    }
  } catch (error) {
    console.warn('⚠️ Error sending enquiry notification:', error.message);
    // Don't throw error - notification is secondary to enquiry creation
  }
};

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
    
    // Send FCM notification after successful enquiry creation
    if (data.success !== false) {
      try {
        console.log('📤 Sending FCM notification for new enquiry...');
        await sendEnquiryNotification(enquiryData);
      } catch (notifError) {
        console.warn('⚠️ Failed to send enquiry notification:', notifError);
        // Don't fail the enquiry creation if notification fails
      }
    }
    
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

/**
 * Get reminders for a specific enquiry by client info
 */
export const getEnquiryReminders = async (enquiry) => {
  try {
    const headers = await getAuthHeaders();
    
    // Try multiple approaches to find reminders
    let reminders = [];
    
    const enquiryId = enquiry._id || enquiry;
    const clientName = typeof enquiry === 'object' ? enquiry.clientName : null;
    const phone = typeof enquiry === 'object' ? enquiry.contactNumber : null;
    
    console.log('🔍 ===== SEARCHING REMINDERS =====');
    console.log('🔍 Enquiry ID:', enquiryId);
    console.log('🔍 Client Name:', clientName);
    console.log('🔍 Phone:', phone);
    
    // Try admin endpoint first (for admin users)
    console.log('🔍 Trying admin reminders endpoint...');
    let response = await fetch(`${CRM_BASE_URL}/admin/reminders/due-all`, {
      method: 'GET',
      headers,
      timeout: 15000
    });

    let contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      let data = await response.json();
      console.log('📊 Admin API Response:', data.success, 'Total reminders:', data.data?.length || 0);
      
      if (data.success && data.data && data.data.length > 0) {
        // Filter by client name or phone
        reminders = data.data.filter(reminder => {
          const matchName = clientName && reminder.clientName === clientName;
          const matchPhone = phone && reminder.phone === phone;
          const matchContact = phone && reminder.contactNumber === phone;
          
          if (matchName || matchPhone || matchContact) {
            console.log('✓ Match found:', {
              clientName: reminder.clientName,
              phone: reminder.phone,
              contactNumber: reminder.contactNumber,
              note: reminder.note
            });
          }
          
          return matchName || matchPhone || matchContact;
        });
        
        console.log('✅ Filtered admin reminders:', reminders.length);
        
        if (reminders.length > 0) {
          reminders.forEach((r, i) => {
            console.log(`  Reminder ${i + 1}:`, {
              date: r.reminderDateTime,
              note: r.note,
              comment: r.comment,
              status: r.status
            });
          });
          
          return {
            success: true,
            data: reminders,
            message: 'Reminders fetched successfully'
          };
        }
      }
    }
    
    // Fallback: Try employee endpoint
    console.log('🔍 Trying employee reminders endpoint...');
    response = await fetch(`${CRM_BASE_URL}/employee/reminders`, {
      method: 'GET',
      headers,
      timeout: 10000
    });

    contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      let data = await response.json();
      console.log('📊 Employee API Response:', data.success, 'Total reminders:', data.data?.length || 0);
      
      if (data.success && data.data && data.data.length > 0) {
        // Filter reminders by client name or phone
        reminders = data.data.filter(reminder => {
          const matchName = clientName && reminder.clientName === clientName;
          const matchPhone = phone && (reminder.phone === phone || reminder.contactNumber === phone);
          
          if (matchName || matchPhone) {
            console.log('✓ Match found in employee API:', {
              clientName: reminder.clientName,
              phone: reminder.phone,
              note: reminder.note
            });
          }
          
          return matchName || matchPhone;
        });
        
        console.log('✅ Filtered employee reminders:', reminders.length);
        
        if (reminders.length > 0) {
          reminders.forEach((r, i) => {
            console.log(`  Reminder ${i + 1}:`, {
              date: r.reminderDateTime,
              note: r.note,
              status: r.status
            });
          });
          
          return {
            success: true,
            data: reminders,
            message: 'Reminders fetched successfully'
          };
        }
      }
    }

    console.log('⚠️ No reminders found in any endpoint');
    console.log('===== END SEARCHING REMINDERS =====');
    return {
      success: true,
      data: [],
      message: 'No reminders found'
    };
  } catch (error) {
    console.error('❌ Error fetching reminders:', error.message);
    return {
      success: true,
      data: [],
      message: 'Reminders not available'
    };
  }
};

/**
 * Get detailed enquiry by ID with populated reminders and followUps
 * @param {string} enquiryId - The enquiry ID
 * @param {string} source - 'client' or 'manual'
 * @returns {Promise<Object>} - Enquiry with full details
 */
export const getEnquiryDetails = async (enquiryId, source = 'manual') => {
  try {
    const headers = await getAuthHeaders();
    
    // Choose endpoint based on source
    const endpoint = source === 'client' 
      ? `${CRM_BASE_URL}/api/enquiry/${enquiryId}?populate=reminders,followUps`
      : `${CRM_BASE_URL}/api/manual-enquiry/${enquiryId}?populate=reminders,followUps`;
    
    console.log('📋 Fetching enquiry details from:', endpoint);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
      timeout: 10000
    });

    // Check content type before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('⚠️ Server returned non-JSON response - endpoint may not be available');
      // Return basic success with empty data instead of throwing error
      return {
        success: true,
        data: null,
        message: 'Details not available'
      };
    }

    const data = await response.json();
    
    if (!response.ok) {
      console.warn('⚠️ Server returned error:', response.status);
      // Return success with null data instead of failing
      return {
        success: true,
        data: null,
        message: 'Details not available'
      };
    }

    console.log('✅ Enquiry details fetched successfully');
    return {
      success: true,
      data: data.data || data,
      message: 'Enquiry details fetched successfully'
    };
  } catch (error) {
    console.warn('⚠️ Could not fetch enquiry details:', error.message);
    
    // Return success with null data - don't show error to user
    return {
      success: true,
      data: null,
      message: 'Details not available'
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
  getEnquiryDetails,
  getEnquiryReminders,
};
