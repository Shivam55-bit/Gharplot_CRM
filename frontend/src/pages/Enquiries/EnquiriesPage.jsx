import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, User, MapPin, Phone, Mail, Calendar, Home, IndianRupee, Hash, Clock, Bell, X, UserPlus, CheckSquare, Square, Target } from "lucide-react";
import { API_BASE_URL } from "../../config/apiConfig.jsx";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import FollowUpModal from "../../components/FollowUpModal/FollowUpModal.jsx";
import globalReminderService from "../../services/GlobalReminderService.js";
import "react-toastify/dist/ReactToastify.css";
import "./EnquiriesPage.css";
import EnquiryChart from "../../component/EnquiryChart/EnquiryChart.jsx";

const EnquiriesPage = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reminderModal, setReminderModal] = useState({
    isOpen: false,
    data: null
  });
  const audioRef = useRef(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState('all');
  
  // Follow-up states
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  
  // Lead assignment states
  const [selectedEnquiries, setSelectedEnquiries] = useState([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [assignmentPriority, setAssignmentPriority] = useState('medium');
  const [assignmentNote, setAssignmentNote] = useState('');
  
  // Auto assignment states
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false);
  const [roles, setRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [autoAssignLoading, setAutoAssignLoading] = useState(false);
  const [formData, setFormData] = useState({
    s_No: '',
    clientName: '',
    contactNumber: '',
    ClientCode: '',
    ProjectCode: '',
    productType: '',
    location: '',
    date: '',
    caseStatus: '',
    source: '',
    majorComments: '',
    address: '',
    weekActionDateTime: '',
    actionPlan: '',
    referenceBy: ''
  });
  
  // Pagination states
  const [userEnquiriesPage, setUserEnquiriesPage] = useState(1);
  const [manualEnquiriesPage, setManualEnquiriesPage] = useState(1);
  const itemsPerPage = 10;

  // Helper function to get property details with better fallbacks
  const getPropertyDetail = (property, field) => {
    if (!property) return 'N/A';
    
    const fieldMap = {
      id: ['_id', 'id'],
      type: ['propertyType', 'type'],
      subType: ['residentialType', 'commercialType', 'subType'],
      location: ['propertyLocation', 'location', 'address'],
      area: ['areaDetails', 'area', 'size'],
      price: ['price', 'cost']
    };
    
    const possibleFields = fieldMap[field] || [field];
    
    for (const possibleField of possibleFields) {
      if (property[possibleField] !== undefined && property[possibleField] !== null) {
        return property[possibleField];
      }
    }
    
    return 'N/A';
  };

  // ================ enquiry new update V ===============
useEffect(() => {
  if (showAddForm && enquiries) {
    // Serial number = total existing enquiries + 1 (always sequential)
    const nextSerial = enquiries.length;

    // Client Code aur Project Code bhi same logic se
    const nextCount = enquiries.length ;
    const nextClientCode = `CC${String(nextCount).padStart(3, '0')}`;
    const nextProjectCode = `PC${String(nextCount).padStart(3, '0')}`;

    setFormData(prev => ({
      ...prev,
      s_No: nextSerial,                // Ab hamesha 6 aayega agar 5 entries hain
      ClientCode: nextClientCode,      // CC006
      ProjectCode: nextProjectCode,    // PC006
      date: new Date().toISOString().split('T')[0],
      caseStatus: 'Open',
      clientName: '',
      contactNumber: '',
      location: '',
      // baaki fields jo empty hone chahiye
    }));
  }
}, [showAddForm, enquiries]);



  // =================== end ========================

  useEffect(() => {
    fetchAllEnquiries();
    fetchAvailableEmployees();
    fetchAvailableRoles();
  }, []);

  // Auto-generate S.No when form is opened
  useEffect(() => {
    if (showAddForm) {
      if (enquiries.length > 0) {
        // Find the maximum s_No from all enquiries
        const allSNumbers = enquiries.map(enquiry => {
          const sNo = parseInt(enquiry.s_No, 10);
          return isNaN(sNo) ? 0 : sNo;
        });
        const maxSNo = Math.max(...allSNumbers, 0);
        const nextSNo = maxSNo + 1;
        
        console.log('📊 S.No Auto-generation:');
        console.log('  All S.No values:', allSNumbers);
        console.log('  Max S.No found:', maxSNo);
        console.log('  Next S.No (auto-generated):', nextSNo);
        
        setFormData(prev => ({
          ...prev,
          s_No: nextSNo
        }));
      } else {
        // No enquiries exist - start from 1
        console.log('📊 S.No Auto-generation: No enquiries found, starting from 1');
        setFormData(prev => ({
          ...prev,
          s_No: 1
        }));
      }
    }
  }, [showAddForm, enquiries.length]);

  const fetchAllEnquiries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [userEnquiriesRes, manualEnquiriesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/inquiry/get-enquiries`),
        axios.get(`${API_BASE_URL}/api/inquiry/all`)
      ]);
      
      let userEnquiries = [];
      let manualEnquiries = [];
      
      if (userEnquiriesRes.data && userEnquiriesRes.data.data) {
        userEnquiries = userEnquiriesRes.data.data.map(enquiry => ({
          ...enquiry,
          sourceType: 'user',
          buyerId: {
            ...enquiry.buyerId,
            fullName: enquiry.fullName || enquiry.buyerId?.fullName || 'N/A',
            email: enquiry.email || enquiry.buyerId?.email || 'N/A',
            phone: enquiry.contactNumber || enquiry.buyerId?.phone || 'N/A'
          }
        }));
      }
      
      if (manualEnquiriesRes.data && manualEnquiriesRes.data.data) {
        manualEnquiries = manualEnquiriesRes.data.data.map(enquiry => ({
          ...enquiry,
          sourceType: 'manual',
          propertyId: {
            propertyType: enquiry.productType,
            propertyLocation: enquiry.location
          },
          buyerId: {
            fullName: enquiry.clientName,
            phone: enquiry.contactNumber
          },
          ownerId: {
            fullName: 'N/A'
          },
          createdAt: enquiry.createdAt
        }));
      }
      
      const allEnquiries = [...userEnquiries, ...manualEnquiries];
      allEnquiries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setEnquiries(allEnquiries);
    } catch (err) {
      console.error("Error fetching enquiries:", err);
      setError("Failed to fetch enquiries. Please try again later.");
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  };

  // Lead assignment functions
  const fetchAvailableEmployees = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        console.error('Admin token not found');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/admin/leads/available-employees`, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });

      if (response.data.success) {
        setEmployees(response.data.data);
        console.log('Employees loaded:', response.data.data);
        if (response.data.data.length === 0) {
          toast.info('No employees found. Please create employees in Employee Management first.');
        }
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees. Make sure employees exist in the system.');
    }
  };

  const handleEnquirySelection = (enquiryId) => {
    // Find the enquiry to check if it's already assigned
    const enquiry = enquiries.find(e => e._id === enquiryId);
    
    // Don't allow selection of already assigned enquiries
    if (enquiry && enquiry.assignment !== null) {
      toast.warn('Cannot select enquiries that are already assigned to an employee');
      return;
    }
    
    setSelectedEnquiries(prev => 
      prev.includes(enquiryId) 
        ? prev.filter(id => id !== enquiryId)
        : [...prev, enquiryId]
    );
  };

  const handleSelectAll = () => {
    const unassignedEnquiries = enquiries.filter(enquiry => enquiry.assignment === null);
    const unassignedIds = unassignedEnquiries.map(enquiry => enquiry._id);
    
    if (unassignedIds.every(id => selectedEnquiries.includes(id)) && unassignedIds.length > 0) {
      // Deselect all unassigned enquiries
      setSelectedEnquiries(prev => prev.filter(id => !unassignedIds.includes(id)));
    } else {
      // Select all unassigned enquiries
      setSelectedEnquiries(prev => [...new Set([...prev, ...unassignedIds])]);
    }
  };

  const openAssignmentModal = () => {
    if (selectedEnquiries.length === 0) {
      toast.error('Please select enquiries to assign');
      return;
    }
    setShowAssignmentModal(true);
  };

  const closeAssignmentModal = () => {
    setShowAssignmentModal(false);
    setSelectedEmployee('');
    setAssignmentPriority('medium');
    setAssignmentNote('');
  };

  const handleAssignLeads = async () => {
    try {
      if (!selectedEmployee) {
        toast.error('Please select an employee');
        return;
      }

      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        toast.error('Admin token not found');
        return;
      }

      // Format enquiries with type information
      const formattedEnquiries = selectedEnquiries.map(enquiryId => {
        // Find the enquiry in our current data to determine its type
        const enquiry = enquiries.find(e => e._id === enquiryId);
        return {
          enquiryId: enquiryId,
          enquiryType: enquiry?.sourceType === 'manual' ? 'ManualInquiry' : 'Inquiry'
        };
      });

      const assignmentData = {
        enquiries: formattedEnquiries,
        employeeId: selectedEmployee,
        priority: assignmentPriority,
        notes: assignmentNote
      };

      console.log('Sending assignment data:', assignmentData);

      const response = await axios.post(`${API_BASE_URL}/admin/leads/assign`, assignmentData, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });

      if (response.data.success) {
        toast.success(`Successfully assigned ${selectedEnquiries.length} enquiries`);
        setSelectedEnquiries([]);
        closeAssignmentModal();
        // Optionally refresh the enquiries list
        fetchAllEnquiries();
      } else {
        toast.error(response.data.message || 'Failed to assign leads');
      }
    } catch (error) {
      console.error('Error assigning leads:', error);
      toast.error('Failed to assign leads. Please try again.');
    }
  };

  const handleUnassignLead = async (enquiryId, enquiryType) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        toast.error('Admin token not found');
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/admin/leads/unassign`, {
        enquiryId,
        enquiryType
      }, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });

      if (response.data.success) {
        toast.success('Lead unassigned successfully');
        // Refresh enquiries to show updated assignment status
        fetchAllEnquiries();
      } else {
        toast.error(response.data.message || 'Failed to unassign lead');
      }
    } catch (error) {
      console.error('Error unassigning lead:', error);
      toast.error('Failed to unassign lead. Please try again.');
    }
  };

  // Fetch all available roles
  const fetchAvailableRoles = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        toast.error('Admin authentication required');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/admin/roles/`, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });

      if (response.data.success) {
        setRoles(response.data.data || []);
      } else {
        toast.error('Failed to fetch roles');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to fetch roles');
    }
  };

  // Handle auto assignment to employees by roles
  const handleAutoAssignment = async () => {
    try {
      if (selectedRoles.length === 0) {
        toast.error('Please select at least one role');
        return;
      }

      setAutoAssignLoading(true);

      // Get employees from selected roles
      const roleEmployees = employees.filter(emp => 
        selectedRoles.includes(emp.role?._id)
      );

      if (roleEmployees.length === 0) {
        toast.error('No employees found for the selected roles');
        setAutoAssignLoading(false);
        return;
      }

      // Get unassigned enquiries from selection
      const unassignedEnquiries = enquiries.filter(enquiry => 
        selectedEnquiries.includes(enquiry._id) && enquiry.assignment === null
      );

      if (unassignedEnquiries.length === 0) {
        toast.error('No unassigned enquiries selected');
        setAutoAssignLoading(false);
        return;
      }

      // Distribute enquiries equally among employees
      const assignments = [];
      const employeeCount = roleEmployees.length;
      const enquiriesPerEmployee = Math.floor(unassignedEnquiries.length / employeeCount);
      const remainingEnquiries = unassignedEnquiries.length % employeeCount;

      let currentIndex = 0;

      roleEmployees.forEach((employee, empIndex) => {
        const enquiriesToAssign = enquiriesPerEmployee + (empIndex < remainingEnquiries ? 1 : 0);
        
        for (let i = 0; i < enquiriesToAssign; i++) {
          if (currentIndex < unassignedEnquiries.length) {
            const enquiry = unassignedEnquiries[currentIndex];
            assignments.push({
              enquiryId: enquiry._id,
              enquiryType: enquiry.sourceType === 'user' ? 'Inquiry' : 'ManualInquiry',
              employeeId: employee._id,
              priority: 'medium',
              notes: `Auto-assigned based on role: ${employee.role?.name || 'N/A'}`
            });
            currentIndex++;
          }
        }
      });

      // Group assignments by employee for bulk assignment
      const employeeAssignments = {};
      assignments.forEach(assignment => {
        if (!employeeAssignments[assignment.employeeId]) {
          employeeAssignments[assignment.employeeId] = {
            employeeId: assignment.employeeId,
            enquiries: [],
            priority: assignment.priority,
            notes: assignment.notes
          };
        }
        employeeAssignments[assignment.employeeId].enquiries.push({
          enquiryId: assignment.enquiryId,
          enquiryType: assignment.enquiryType
        });
      });

      console.log('Generated assignments:', assignments);
      console.log('Grouped employee assignments:', employeeAssignments);

      // Send bulk assignments to backend
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        toast.error('Admin authentication required');
        setAutoAssignLoading(false);
        return;
      }

      const assignmentPromises = Object.values(employeeAssignments).map(employeeAssignment =>
        axios.post(`${API_BASE_URL}/admin/leads/assign`, employeeAssignment, {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        })
      );

      const results = await Promise.allSettled(assignmentPromises);
      
      // Calculate success and failure counts from bulk assignments
      let totalSuccessCount = 0;
      let totalFailureCount = 0;
      const allErrors = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.data.success) {
          const assignmentData = result.value.data.data;
          totalSuccessCount += assignmentData.assignments?.length || 0;
          if (assignmentData.errors && assignmentData.errors.length > 0) {
            totalFailureCount += assignmentData.errors.length;
            allErrors.push(...assignmentData.errors);
          }
        } else {
          // Entire employee assignment failed
          const employeeAssignment = Object.values(employeeAssignments)[index];
          totalFailureCount += employeeAssignment.enquiries.length;
          
          if (result.status === 'rejected') {
            allErrors.push({
              error: result.reason?.response?.data?.message || result.reason?.message || 'Assignment request failed'
            });
          } else {
            allErrors.push({
              error: result.value?.data?.message || 'Assignment failed'
            });
          }
        }
      });

      // Log detailed error information for debugging
      console.log('Assignment results:', results);
      console.log('All errors:', allErrors);

      if (totalSuccessCount > 0) {
        toast.success(`Successfully auto-assigned ${totalSuccessCount} enquiries to employees`);
      }
      
      if (totalFailureCount > 0) {
        // Get first error message for more specific feedback
        const firstErrorMessage = allErrors[0]?.error || 'Failed to assign some enquiries';
        toast.error(`Failed to assign ${totalFailureCount} enquiries: ${firstErrorMessage}`);
      }

      // Reset states and refresh data
      setSelectedEnquiries([]);
      setSelectedRoles([]);
      setShowAutoAssignModal(false);
      fetchAllEnquiries();

    } catch (error) {
      console.error('Error in auto assignment:', error);
      toast.error('Failed to auto-assign enquiries. Please try again.');
    } finally {
      setAutoAssignLoading(false);
    }
  };

  const userEnquiries = enquiries.filter(enquiry => enquiry.sourceType === 'user');
  const manualEnquiries = enquiries.filter(enquiry => enquiry.sourceType === 'manual');

  const filteredEnquiries = enquiries.filter(enquiry => {
    if (filter === 'all') return true;
    if (filter === 'manual') return enquiry.sourceType === 'manual';
    if (filter === 'user') return enquiry.sourceType === 'user';
    return true;
  });

  const userEnquiriesTotalPages = Math.ceil(userEnquiries.length / itemsPerPage);
  const manualEnquiriesTotalPages = Math.ceil(manualEnquiries.length / itemsPerPage);
  
  const userEnquiriesStartIndex = (userEnquiriesPage - 1) * itemsPerPage;
  const userEnquiriesEndIndex = userEnquiriesStartIndex + itemsPerPage;
  const paginatedUserEnquiries = userEnquiries.slice(userEnquiriesStartIndex, userEnquiriesEndIndex);
  
  const manualEnquiriesStartIndex = (manualEnquiriesPage - 1) * itemsPerPage;
  const manualEnquiriesEndIndex = manualEnquiriesStartIndex + itemsPerPage;
  const paginatedManualEnquiries = manualEnquiries.slice(manualEnquiriesStartIndex, manualEnquiriesEndIndex);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Store weekActionDateTime before processing
      const weekActionDateTime = formData.weekActionDateTime;
      
      console.log('Form submission - weekActionDateTime:', weekActionDateTime);
      console.log('Form submission - s_No:', formData.s_No);
      
      const submitData = {
        ...formData,
        s_No: parseInt(formData.s_No, 10) || 0,
        date: formData.date || new Date().toISOString().split('T')[0]
      };
      
      // Convert weekActionDateTime to readable format for display
      if (weekActionDateTime) {
        const dateObj = new Date(weekActionDateTime);
        const formattedDateTime = dateObj.toLocaleString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        submitData.weekOrActionTaken = formattedDateTime;
        console.log('Formatted Week/Action DateTime:', formattedDateTime);
      }
      
      // Remove empty fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '' || submitData[key] === null || submitData[key] === undefined) {
          delete submitData[key];
        }
      });
      
      console.log('Submit data being sent:', submitData);
      
      const response = await axios.post(`${API_BASE_URL}/api/inquiry/create`, submitData);
      
      if (response.data.success) {
        const createdEnquiry = response.data.data;
        toast.success("Enquiry created successfully!");
        
        // Create reminder if weekActionDateTime is provided
        if (weekActionDateTime && weekActionDateTime.trim() !== '') {
          try {
            console.log('Creating reminder for weekActionDateTime:', weekActionDateTime);
            
            // Parse the local datetime (format: YYYY-MM-DDTHH:mm)
            const dateTimeObj = new Date(weekActionDateTime);
            
            // Validate date
            if (isNaN(dateTimeObj.getTime())) {
              throw new Error('Invalid date/time format');
            }
            
            // Adjust for timezone offset to ensure correct time storage
            // datetime-local gives us: "2025-12-20T10:30" (no timezone info)
            // We need to adjust for the timezone offset to store the correct UTC time
            const timezoneOffset = dateTimeObj.getTimezoneOffset();
            const adjustedDate = new Date(dateTimeObj.getTime() - (timezoneOffset * 60 * 1000));
            const isoString = adjustedDate.toISOString();
            
            console.log('🕐 Reminder Time Conversion:');
            console.log('  Input (datetime-local):', weekActionDateTime);
            console.log('  Date object (local):', dateTimeObj.toLocaleString());
            console.log('  Timezone offset (minutes):', timezoneOffset);
            console.log('  Adjusted date:', adjustedDate.toISOString());
            console.log('  Sending to backend:', isoString);
            console.log('  ✅ Will trigger at exact local time:', dateTimeObj.toLocaleString());
            
            const token = localStorage.getItem('token') || localStorage.getItem('employeeToken') || localStorage.getItem('adminToken');
            
            if (!token) {
              throw new Error('No authentication token found');
            }
            
            // Use create-from-lead endpoint (doesn't require assignmentId)
            // Include all enquiry details for proper popup display
            const reminderData = {
              name: formData.clientName,
              email: formData.email || 'N/A',
              phone: formData.contactNumber,
              location: formData.location || 'N/A',
              reminderTime: isoString,
              note: formData.actionPlan || `Week/Action reminder for ${formData.clientName}`,
              // Additional enquiry details for popup
              title: `Enquiry Reminder: ${formData.clientName}`,
              productType: formData.productType || '',
              caseStatus: formData.caseStatus || '',
              source: formData.source || '',
              majorComments: formData.majorComments || '',
              address: formData.address || '',
              referenceBy: formData.referenceBy || '',
              clientCode: formData.ClientCode || '',
              projectCode: formData.ProjectCode || '',
              serialNumber: formData.s_No || '',
              // Link to the created enquiry for reference
              enquiryId: createdEnquiry._id || createdEnquiry.id || '',
              contactNumber: formData.contactNumber || ''
            };
            
            console.log('📤 Creating Week/Action reminder with full enquiry details:', reminderData);
            console.log('🔗 API URL:', `${API_BASE_URL}/employee/reminders/create-from-lead`);
            
            // Use create-from-lead endpoint - no assignment required
            const reminderResponse = await axios.post(
              `${API_BASE_URL}/employee/reminders/create-from-lead`, 
              reminderData, 
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            console.log('✅ Reminder creation response:', reminderResponse.data);
            
            // Log the created reminder details for verification
            if (reminderResponse.data?.data) {
              const createdReminder = reminderResponse.data.data;
              console.log('📝 Created Reminder Details:');
              console.log('   ID:', createdReminder._id);
              console.log('   Stored reminderDateTime:', createdReminder.reminderDateTime);
              console.log('   Status:', createdReminder.status);
              
              // Verify the stored time matches what we sent
              const storedDate = new Date(createdReminder.reminderDateTime);
              console.log('   Parsed back:', storedDate.toLocaleString());
              console.log('   Matches input?', storedDate.toLocaleString() === dateTimeObj.toLocaleString());
            }
            
            // ALSO add to local reminder storage for guaranteed popup
            const localReminderData = {
              _id: reminderResponse.data?.data?._id || `local-enquiry-${Date.now()}`,
              title: `Enquiry Reminder: ${formData.clientName}`,
              note: formData.actionPlan || `Week/Action reminder for ${formData.clientName}`,
              clientName: formData.clientName,
              phone: formData.contactNumber,
              contactNumber: formData.contactNumber,
              email: formData.email || 'N/A',
              location: formData.location || 'N/A',
              address: formData.address || '',
              productType: formData.productType || '',
              caseStatus: formData.caseStatus || '',
              source: formData.source || '',
              majorComments: formData.majorComments || '',
              referenceBy: formData.referenceBy || '',
              clientCode: formData.ClientCode || '',
              projectCode: formData.ProjectCode || '',
              serialNumber: formData.s_No || '',
              enquiryId: createdEnquiry._id || createdEnquiry.id || '',
              reminderDateTime: dateTimeObj.toISOString(), // Use original local time as ISO
              status: 'pending',
              assignmentType: 'enquiry'
            };
            
            // Add to local storage for backup popup triggering
            globalReminderService.addLocalReminder(localReminderData);
            console.log('🏠 Local reminder added for guaranteed popup at:', dateTimeObj.toLocaleString());
            
            toast.success("Week/Action reminder set successfully!", {
              position: "top-right",
              autoClose: 2000,
            });
          } catch (reminderError) {
            console.error("Error creating reminder:", reminderError);
            console.error("Error details:", reminderError.response?.data);
            console.error("Error status:", reminderError.response?.status);
            
            // Even if API fails, still add local reminder
            const localReminderData = {
              _id: `local-enquiry-${Date.now()}`,
              title: `Enquiry Reminder: ${formData.clientName}`,
              note: formData.actionPlan || `Week/Action reminder for ${formData.clientName}`,
              clientName: formData.clientName,
              phone: formData.contactNumber,
              contactNumber: formData.contactNumber,
              email: formData.email || 'N/A',
              location: formData.location || 'N/A',
              address: formData.address || '',
              productType: formData.productType || '',
              caseStatus: formData.caseStatus || '',
              source: formData.source || '',
              majorComments: formData.majorComments || '',
              referenceBy: formData.referenceBy || '',
              clientCode: formData.ClientCode || '',
              projectCode: formData.ProjectCode || '',
              serialNumber: formData.s_No || '',
              enquiryId: createdEnquiry._id || createdEnquiry.id || '',
              reminderDateTime: dateTimeObj.toISOString(),
              status: 'pending',
              assignmentType: 'enquiry'
            };
            
            globalReminderService.addLocalReminder(localReminderData);
            console.log('🏠 Local reminder added (API failed) for popup at:', dateTimeObj.toLocaleString());
            
            const errorMessage = reminderError.response?.data?.message || reminderError.message || 'Unknown error';
            
            toast.warning(`Enquiry created. Reminder will trigger locally. (API: ${errorMessage})`, {
              position: "top-right",
              autoClose: 4000,
            });
          }
        } else {
          console.log('No Week/Action DateTime provided, skipping reminder creation');
        }
        
        setShowAddForm(false);
        setFormData({
          s_No: '',
          clientName: '',
          contactNumber: '',
          ClientCode: '',
          ProjectCode: '',
          productType: '',
          location: '',
          date: '',
          caseStatus: '',
          source: '',
          majorComments: '',
          address: '',
          weekActionDateTime: '',
          actionPlan: '',
          referenceBy: ''
        });
        fetchAllEnquiries();
      } else {
        toast.error(response.data.message || "Failed to create enquiry");
      }
    } catch (error) {
      console.error("Error creating enquiry:", error);
      toast.error("Failed to create enquiry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to play reminder sound
  const playReminderSound = () => {
    try {
      if (audioRef.current) {
        audioRef.current.volume = 1.0;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => {
          console.log('Sound play failed:', err);
        });
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const openReminderModal = (enquiry) => {
    // Determine if this is a manual enquiry or client enquiry
    const isManualEnquiry = !enquiry.buyerId && !enquiry.propertyId && enquiry.clientName;
    
    // Extract data based on enquiry type
    let name, email, phone, location;
    
    if (isManualEnquiry) {
      // Manual enquiry - data is directly on enquiry object
      name = enquiry.clientName || 'N/A';
      email = enquiry.email || 'N/A';
      phone = enquiry.contactNumber || 'N/A';
      location = enquiry.location || enquiry.address || 'N/A';
    } else {
      // Client enquiry - data is in buyerId
      name = enquiry.buyerId?.fullName || enquiry.buyerId?.name || enquiry.clientName || enquiry.fullName || 'N/A';
      email = enquiry.buyerId?.email || enquiry.email || 'N/A';
      phone = enquiry.buyerId?.phone || enquiry.buyerId?.phoneNumber || enquiry.contactNumber || 'N/A';
      
      // Build location from city and state if available
      const city = enquiry.buyerId?.city || enquiry.propertyId?.propertyLocation || enquiry.location || '';
      const state = enquiry.buyerId?.state || '';
      location = city && state ? `${city}, ${state}` : (city || state || 'N/A');
    }
    
    console.log('🔔 Opening reminder modal for:', { name, email, phone, location, isManualEnquiry });
    
    setReminderModal({
      isOpen: true,
      data: {
        enquiryId: enquiry._id,
        name: name,
        email: email,
        phone: phone,
        location: location,
        date: '',
        hour: '1',
        minute: '00',
        period: 'AM',
        note: ''
      }
    });
    // Play sound when reminder modal opens
    setTimeout(() => playReminderSound(), 100);
  };

  const closeReminderModal = () => {
    setReminderModal({
      isOpen: false,
      data: null
    });
  };

  const handleReminderChange = (field, value) => {
    if (reminderModal.isOpen && reminderModal.data) {
      setReminderModal({
        ...reminderModal,
        data: {
          ...reminderModal.data,
          [field]: value
        }
      });
    }
  };

  const handleSaveReminder = async () => {
    try {
      if (!reminderModal.data.date || !reminderModal.data.hour || !reminderModal.data.minute) {
        toast.error("Please fill in the date and time fields", {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }
      
      // Parse the date string (YYYY-MM-DD format from input)
      const [year, month, day] = reminderModal.data.date.split('-').map(Number);
      
      // Get hours and minutes
      let hours = parseInt(reminderModal.data.hour);
      const minutes = parseInt(reminderModal.data.minute);
      
      // Convert 12-hour format to 24-hour format
      if (reminderModal.data.period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (reminderModal.data.period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      // Create a date string in ISO format without timezone conversion
      // This ensures the EXACT local time is stored
      const paddedMonth = String(month).padStart(2, '0');
      const paddedDay = String(day).padStart(2, '0');
      const paddedHours = String(hours).padStart(2, '0');
      const paddedMinutes = String(minutes).padStart(2, '0');
      
      // Format: YYYY-MM-DDTHH:mm:ss.000Z but with LOCAL time (not UTC adjusted)
      const isoString = `${year}-${paddedMonth}-${paddedDay}T${paddedHours}:${paddedMinutes}:00.000Z`;
      
      console.log('🕐 Reminder Time Details:');
      console.log('  - Input Date:', reminderModal.data.date);
      console.log('  - Input Time:', `${reminderModal.data.hour}:${reminderModal.data.minute} ${reminderModal.data.period}`);
      console.log('  - 24hr Format:', `${hours}:${minutes}`);
      console.log('  - Final ISO String:', isoString);
      console.log('  - Will ring at:', `${paddedDay}/${paddedMonth}/${year} at ${paddedHours}:${paddedMinutes}`);
      
      // Create a proper title - avoid "N/A" in title
      const clientName = reminderModal.data.name && reminderModal.data.name !== 'N/A' 
        ? reminderModal.data.name 
        : 'Client';
      const reminderTitle = `Reminder for ${clientName}`;
      
      const requestData = {
        name: reminderModal.data.name,
        email: reminderModal.data.email,
        phone: reminderModal.data.phone,
        location: reminderModal.data.location,
        comment: reminderModal.data.note || 'Reminder from Enquiries Page',
        reminderDateTime: isoString, // Properly timezone-adjusted ISO string
        title: reminderTitle,
        status: 'pending'
      };
      
      console.log('📤 Sending reminder request:', requestData);
      
      // Use employee reminders endpoint so GlobalReminderPopup can detect it
      const response = await axios.post(`${API_BASE_URL}/employee/reminders/create`, requestData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('employeeToken') || localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        toast.success("Reminder created successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        closeReminderModal();
      } else {
        toast.error("Failed to create reminder. Please try again.", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error saving reminder:", error);
      toast.error("Failed to create reminder. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleCreateFollowUp = (enquiry) => {
    console.log('🔍 Creating follow-up for enquiry:', enquiry);
    
    // Determine lead type based on enquiry source
    let leadType, leadId, leadData;

    // Check if this is a manual enquiry (has clientName and contactNumber directly)
    // Manual enquiries don't have buyerId or propertyId
    const isManualEnquiry = !enquiry.buyerId && !enquiry.propertyId && enquiry.clientName;
    
    console.log('📋 Is Manual Enquiry?', isManualEnquiry);

    if (isManualEnquiry) {
      // This is a manual enquiry
      leadType = 'ManualInquiry';
      leadId = enquiry._id;
      leadData = {
        clientName: enquiry.clientName || 'Unknown Client',
        phone: enquiry.contactNumber || 'N/A',
        email: enquiry.email || 'N/A',
        propertyType: enquiry.productType || 'N/A',
        location: enquiry.location || 'N/A'
      };
      
      console.log('✅ Manual Enquiry Lead Data:', leadData);
    } else {
      // This is a regular/client enquiry with buyer and property info
      leadType = 'Inquiry';
      leadId = enquiry._id;
      leadData = {
        clientName: enquiry.buyerId?.fullName || enquiry.buyerId?.name || enquiry.clientName || 'Unknown Client',
        phone: enquiry.buyerId?.phone || enquiry.buyerId?.phoneNumber || enquiry.contactNumber || 'N/A',
        email: enquiry.buyerId?.email || enquiry.email || 'N/A',
        propertyType: enquiry.propertyId?.propertyType || enquiry.productType || 'N/A',
        location: enquiry.propertyId?.propertyLocation || enquiry.propertyId?.location || enquiry.location || 'N/A'
      };
      
      console.log('✅ Client Enquiry Lead Data:', leadData);
    }

    // For enquiries, we need to create a lead assignment first
    // or use the enquiry directly. Let's handle this properly.
    setSelectedLead({
      leadId: leadId,
      leadType: leadType,
      leadData: leadData,
      enquiry: enquiry
    });
    setShowFollowUpModal(true);
  };

  const handleFollowUpCreated = (followUpData) => {
    toast.success('Follow-up created successfully!');
    // Optionally refresh enquiries or update UI
    fetchAllEnquiries();
  };

  if (loading && !showAddForm) {
    return (
      <div className="enquiries-page">
        <ToastContainer />
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
            <h2 className="mb-0">
              <MessageSquare size={24} className="me-2" />
              Property Enquiries
            </h2>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <p>Loading enquiries...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !showAddForm) {
    return (
      <div className="enquiries-page">
        <ToastContainer />
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
            <h2 className="mb-0">
              <MessageSquare size={24} className="me-2" />
              Property Enquiries
            </h2>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <p className="text-danger">{error}</p>
              <button className="btn btn-primary" onClick={fetchAllEnquiries}>
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="enquiries-page">
      {/* Hidden audio element for reminder sound */}
      <audio ref={audioRef} preload="auto">
        <source src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" type="audio/mpeg" />
        <source src="https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3" type="audio/mpeg" />
      </audio>
      
      <ToastContainer />
      <div className="container-fluid">
        <div className="enquiries-header mb-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div className="d-flex align-items-center mb-2 mb-md-0">
              <MessageSquare size={24} className="me-2 text-primary" />
              <h2 className="mb-0">Property Enquiries</h2>
            </div>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <span className="badge bg-primary fs-6">
                Total Enquiries: {enquiries.length}
              </span>
              <span className="badge bg-info fs-6">
                Client Enquiries: {userEnquiries.length}
              </span>
              <span className="badge bg-warning fs-6">
                Manual Enquiries: {manualEnquiries.length}
              </span>
              <button 
                className="btn btn-success ms-2"
                onClick={() => setShowAddForm(true)}
              >
                <User size={16} className="me-1" />
                Add Enquiry
              </button>
              {selectedEnquiries.length > 0 && (
                <>
                  <button 
                    className="btn btn-primary ms-2"
                    onClick={openAssignmentModal}
                  >
                    <UserPlus size={16} className="me-1" />
                    Assign ({selectedEnquiries.length})
                  </button>
                  <button 
                    className="btn btn-info ms-2"
                    onClick={() => setShowAutoAssignModal(true)}
                  >
                    <Target size={16} className="me-1" />
                    Auto Assign ({selectedEnquiries.length})
                  </button>
                </>
              )}
              <button 
                className="btn btn-outline-secondary ms-2"
                onClick={handleSelectAll}
              >
                {selectedEnquiries.length === enquiries.length ? (
                  <CheckSquare size={16} className="me-1" />
                ) : (
                  <Square size={16} className="me-1" />
                )}
                {selectedEnquiries.length === enquiries.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>
          <hr className="my-3" />
        </div>

        <div className="row mb-4 g-3">
          <div className="col-lg-7 d-flex align-items-center">
            <EnquiryChart 
              total={enquiries.length}
              client={userEnquiries.length}
              manual={manualEnquiries.length}
            />
          </div>
          
          <div className="col-lg-5 d-flex align-items-center justify-content-end">
            <div className="row justify-content-end">
              <div className="col-md-12 position-relative">
                <select 
                  className="form-select form-select-sm"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  style={{ 
                    width: '200px', 
                    paddingRight: '35px',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    background: '#fff',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="all">All Sources</option>
                  <option value="manual">Manually Added</option>
                  <option value="user">Client Enquiries</option>
                </select>
                <div 
                  style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    pointerEvents: 'none',
                    color: '#495057',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '16px',
                    height: '16px'
                  }}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="14" 
                    height="14" 
                    fill="currentColor" 
                    viewBox="0 0 16 16"
                    style={{ transition: 'transform 0.2s ease' }}
                  >
                    <path d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* {showAddForm && (
          <div className="add-enquiry-modal-overlay">
            <div className="add-enquiry-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="add-enquiry-modal-header">
                <h5 className="add-enquiry-modal-title">Add New Enquiry</h5>
                <button 
                  type="button" 
                  className="add-enquiry-modal-close" 
                  onClick={() => setShowAddForm(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="add-enquiry-modal-body">
                <form onSubmit={handleFormSubmit}>
                  <div className="add-enquiry-form-row">
                    <div className="add-enquiry-form-group">
                      <label className="add-enquiry-form-label">S.No (Auto-Generated)</label>
                      <input 
                        type="number" 
                        name="s_No"
                        className="add-enquiry-form-input" 
                        placeholder="Auto-generated serial number"
                        value={formData.s_No}
                        onChange={handleInputChange}
                        required
                        readOnly
                        style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                      />
                    </div>
                    <div className="add-enquiry-form-group">
                      <label className="add-enquiry-form-label">Client Name</label>
                      <input 
                        type="text" 
                        name="clientName"
                        className="add-enquiry-form-input" 
                        placeholder="Client name"
                        value={formData.clientName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="add-enquiry-form-row">
                    <div className="add-enquiry-form-group">
                      <label className="add-enquiry-form-label">Contact</label>
                      <input 
                        type="text" 
                        name="contactNumber"
                        className="add-enquiry-form-input" 
                        placeholder="Contact number"
                        value={formData.contactNumber}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="add-enquiry-form-group">
                      <label className="add-enquiry-form-label">Client Code</label>
                      <input 
                        type="text" 
                        name="ClientCode"
                        className="add-enquiry-form-input" 
                        placeholder="Client code"
                        value={formData.ClientCode}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="add-enquiry-form-group">
                    <label className="add-enquiry-form-label">Project Code</label>
                    <input 
                      type="text" 
                      name="ProjectCode"
                      className="add-enquiry-form-input" 
                      placeholder="Project code"
                      value={formData.ProjectCode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="add-enquiry-form-row">
                    <div className="add-enquiry-form-group">
                      <label className="add-enquiry-form-label">Product Type</label>
                      <select 
                        name="productType"
                        className="add-enquiry-form-select" 
                        value={formData.productType || ''}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="" disabled hidden>Select Product Type</option>
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Plot">Plot</option>
                        <option value="Apartment">Apartment</option>
                        <option value="Villa">Villa</option>
                      </select>
                    </div>
                    <div className="add-enquiry-form-group">
                      <label className="add-enquiry-form-label">Location</label>
                      <input 
                        type="text" 
                        name="location"
                        className="add-enquiry-form-input" 
                        placeholder="Location"
                        value={formData.location}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="add-enquiry-form-row">
                    <div className="add-enquiry-form-group">
                      <label className="add-enquiry-form-label">Date</label>
                      <input 
                        type="date" 
                        name="date"
                        className="add-enquiry-form-input"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="add-enquiry-form-group">
                      <label className="add-enquiry-form-label">Source</label>
                      <select 
                        name="source"
                        className="add-enquiry-form-select" 
                        value={formData.source || ''}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="" disabled hidden>Select Source</option>
                        <option value="Walk In">Walk In</option>
                        <option value="OLX">OLX</option>
                        <option value="Just Dial">Just Dial</option>
                        <option value="Reference By">Reference By</option>
                      </select>
                    </div>
                  </div>
                  
                  {formData.source === 'Reference By' && (
                    <div className="add-enquiry-form-group">
                      <label className="add-enquiry-form-label">Reference By (Name)</label>
                      <input 
                        type="text" 
                        name="referenceBy"
                        className="add-enquiry-form-input" 
                        placeholder="Enter reference name"
                        value={formData.referenceBy}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  )}
                  
                  <div className="add-enquiry-form-group">
                    <label className="add-enquiry-form-label">Case Status</label>
                    <select 
                      name="caseStatus"
                      className="add-enquiry-form-select"
                      value={formData.caseStatus || ''}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="" disabled hidden>Select Case Status</option>
                      <option value="Open">Open</option>
                      <option value="Closed">Closed</option>
                      < option value="Week One">Week One</option>
                      <option value="Week Two">Week Two</option>
                      <option value="Unassigned">Unassigned</option>
                    </select>
                  </div>
                  
                  <div className="add-enquiry-form-group">
                    <label className="add-enquiry-form-label">Major Comments</label>
                    <textarea 
                      name="majorComments"
                      className="add-enquiry-form-textarea" 
                      rows="3" 
                      placeholder="Major comments"
                      value={formData.majorComments}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                  
                  <div className="add-enquiry-form-group">
                    <label className="add-enquiry-form-label">Address</label>
                    <textarea 
                      name="address"
                      className="add-enquiry-form-textarea" 
                      rows="2" 
                      placeholder="Full address"
                      value={formData.address}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                  
                  <div className="add-enquiry-form-row">
                    <div className="add-enquiry-form-group">
                      <label className="add-enquiry-form-label">Week/Action Date</label>
                      <input 
                        type="date" 
                        name="weekOrActionTaken"
                        className="add-enquiry-form-input" 
                        value={formData.weekOrActionTaken}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="add-enquiry-form-group">
                      <label className="add-enquiry-form-label">Week/Action Time</label>
                      <input 
                        type="time" 
                        name="actionTime"
                        className="add-enquiry-form-input" 
                        value={formData.actionTime}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="add-enquiry-form-row">
                    <div className="add-enquiry-form-group">
                      <label className="add-enquiry-form-label">Reminder Date</label>
                      <input 
                        type="date" 
                        name="reminderDate"
                        className="add-enquiry-form-input" 
                        placeholder="Select reminder date"
                        value={formData.reminderDate}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="add-enquiry-form-group">
                      <label className="add-enquiry-form-label">Reminder Time</label>
                      <input 
                        type="time" 
                        name="reminderTime"
                        className="add-enquiry-form-input" 
                        placeholder="Select reminder time"
                        value={formData.reminderTime}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="add-enquiry-form-group">
                    <label className="add-enquiry-form-label">Action Plan</label>
                    <textarea 
                      name="actionPlan"
                      className="add-enquiry-form-textarea" 
                      rows="2" 
                      placeholder="Action plan"
                      value={formData.actionPlan}
                      onChange={handleInputChange}
                    ></textarea>
                    </div>
                  </div>
                  
                  <div className="add-enquiry-form-group">
                    <label className="add-enquiry-form-label">Reference By</label>
                    <input 
                      type="text" 
                      name="referenceBy"
                      className="add-enquiry-form-input" 
                      placeholder="Reference"
                      value={formData.referenceBy}
                      onChange={handleInputChange}
                    />
                  </div>
                </form>
              </div>
              <div className="add-enquiry-modal-footer">
                <button 
                  type="button" 
                  className="add-enquiry-btn add-enquiry-btn-primary" 
                  onClick={handleFormSubmit}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Enquiry'}
                </button>
              </div>
            </div>
          </div>
        )} */}

        {showAddForm && (
  <div className="add-enquiry-modal-overlay">
    <div className="add-enquiry-modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="add-enquiry-modal-header">
        <h5 className="add-enquiry-modal-title">Add New Enquiry</h5>
        <button 
          type="button" 
          className="add-enquiry-modal-close" 
          onClick={() => setShowAddForm(false)}
        >
          <X size={18} />
        </button>
      </div>
      <div className="add-enquiry-modal-body">
        <form onSubmit={handleFormSubmit}>
          <div className="add-enquiry-form-row">
            <div className="add-enquiry-form-group">
              <label className="add-enquiry-form-label">S. No</label>
              <input 
                type="number" 
                name="s_No"
                className="add-enquiry-form-input" 
                value={formData.s_No}
                readOnly
                disabled
              />
            </div>
            <div className="add-enquiry-form-group">
              <label className="add-enquiry-form-label">Client Name</label>
              <input 
                type="text" 
                name="clientName"
                className="add-enquiry-form-input" 
                placeholder="Client name"
                value={formData.clientName}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          <div className="add-enquiry-form-row">
            <div className="add-enquiry-form-group">
              <label className="add-enquiry-form-label">Contact</label>
              <input 
                type="text" 
                name="contactNumber"
                className="add-enquiry-form-input" 
                placeholder="Contact number"
                value={formData.contactNumber}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="add-enquiry-form-group">
              <label className="add-enquiry-form-label">Client Code (CC)</label>
              <input 
                type="text" 
                name="ClientCode"
                className="add-enquiry-form-input" 
                placeholder="Auto-generated"
                value={formData.ClientCode}
                readOnly
                disabled
              />
            </div>
          </div>
          
          <div className="add-enquiry-form-group">
            <label className="add-enquiry-form-label">Project Code (PC)</label>
            <input 
              type="text" 
              name="ProjectCode"
              className="add-enquiry-form-input" 
              placeholder="Auto-generated"
              value={formData.ProjectCode}
              readOnly
              disabled
            />
          </div>
          
          <div className="add-enquiry-form-row">
            <div className="add-enquiry-form-group">
              <label className="add-enquiry-form-label">Product Type</label>
              <select 
                name="productType"
                className="add-enquiry-form-select" 
                value={formData.productType || ''}
                onChange={handleInputChange}
                required
              >
                <option value="" disabled hidden>Select Product Type</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Plot">Plot</option>
                <option value="Apartment">Apartment</option>
                <option value="Villa">Villa</option>
              </select>
            </div>
            <div className="add-enquiry-form-group">
              <label className="add-enquiry-form-label">Location</label>
              <input 
                type="text" 
                name="location"
                className="add-enquiry-form-input" 
                placeholder="Location"
                value={formData.location}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          <div className="add-enquiry-form-row">
  {/* Date field (jo pehle tha, same row mein rakha hai) */}
  <div className="add-enquiry-form-group">
    <label className="add-enquiry-form-label">Date</label>
    <input 
      type="date" 
      name="date"
      className="add-enquiry-form-input"
      value={formData.date}
      onChange={handleInputChange}
      required
    />
  </div>

  {/* Source Dropdown + Conditional Reference Input */}
  <div className="add-enquiry-form-group">
    <label className="add-enquiry-form-label">Source</label>
    <select 
      name="source"
      className="add-enquiry-form-select"
      value={formData.source || ''}
      onChange={handleInputChange}
      required
    >
      <option value="" disabled hidden>Select Source</option>
      <option value="Walk In">Walk In</option>
      <option value="OLX">OLX</option>
      <option value="Just Dial">Just Dial</option>
      <option value="Reference">Reference</option>
    </select>

    {/* Conditional Reference Name Input */}
    {formData.source === 'Reference' && (
      <div style={{ marginTop: '8px' }}>
        <input 
          type="text"
          name="referenceBy"
          className="add-enquiry-form-input"
          placeholder="Enter Reference Name"
          value={formData.referenceBy || ''}
          onChange={handleInputChange}
          required={formData.source === 'Reference'}
        />
      </div>
    )}
  </div>
</div>
          <div className="add-enquiry-form-group">
            <label className="add-enquiry-form-label">Case Status</label>
            <select 
              name="caseStatus"
              className="add-enquiry-form-select"
              value={formData.caseStatus || ''}
              onChange={handleInputChange}
              required
            >
              <option value="" disabled hidden>Select Case Status</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
              <option value="Week One">Week One</option>
              <option value="Week Two">Week Two</option>
              <option value="Unassigned">Unassigned</option>
            </select>
          </div>
          
          <div className="add-enquiry-form-group">
            <label className="add-enquiry-form-label">Major Comments</label>
            <textarea 
              name="majorComments"
              className="add-enquiry-form-textarea" 
              rows="3" 
              placeholder="Major comments"
              value={formData.majorComments}
              onChange={handleInputChange}
            ></textarea>
          </div>
          
          <div className="add-enquiry-form-group">
            <label className="add-enquiry-form-label">Address</label>
            <textarea 
              name="address"
              className="add-enquiry-form-textarea" 
              rows="2" 
              placeholder="Full address"
              value={formData.address}
              onChange={handleInputChange}
            ></textarea>
          </div>
          
          <div className="add-enquiry-form-row">
            <div className="add-enquiry-form-group">
              <label className="add-enquiry-form-label">Week/Action Date & Time</label>
              <input 
                type="datetime-local" 
                name="weekActionDateTime"
                className="add-enquiry-form-input" 
                value={formData.weekActionDateTime}
                onChange={handleInputChange}
              />
            </div>
            <div className="add-enquiry-form-group">
              <label className="add-enquiry-form-label">Action Plan</label>
              <textarea 
                name="actionPlan"
                className="add-enquiry-form-textarea" 
                rows="2" 
                placeholder="Action plan"
                value={formData.actionPlan}
                onChange={handleInputChange}
              ></textarea>
            </div>
          </div>
          
          {/* Reference By field removed */}
        </form>
      </div>
      <div className="add-enquiry-modal-footer">
        <button 
          type="button" 
          className="add-enquiry-btn add-enquiry-btn-primary" 
          onClick={handleFormSubmit}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Enquiry'}
        </button>
      </div>
    </div>
  </div>
)}

        {/* Conditional Rendering Based on Filter */}
        {filter === 'all' && (
          <>
            {/* User Enquiries Table */}
            {userEnquiries.length > 0 ? (
              <div className="enquiries-table-container mb-4">
                <h5 className="table-title">Client Enquiries</h5>
                <div className="table-responsive">
                  <table className="table enquiries-table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={
                              userEnquiries.filter(e => e.assignment === null).length > 0 &&
                              userEnquiries.filter(e => e.assignment === null).every(e => selectedEnquiries.includes(e._id))
                            }
                            onChange={() => {
                              const unassignedUserIds = userEnquiries.filter(e => e.assignment === null).map(e => e._id);
                              if (unassignedUserIds.every(id => selectedEnquiries.includes(id))) {
                                setSelectedEnquiries(prev => prev.filter(id => !unassignedUserIds.includes(id)));
                              } else {
                                setSelectedEnquiries(prev => [...new Set([...prev, ...unassignedUserIds])]);
                              }
                            }}
                            title="Select all unassigned enquiries"
                          />
                        </th>
                        <th>S.No</th>
                        <th>Property Details</th>
                        <th>Buyer Information</th>
                        <th>Owner Information</th>
                        <th>Assigned Employee</th>
                        <th>Created Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUserEnquiries.map((enquiry, index) => (
                        <tr key={enquiry._id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedEnquiries.includes(enquiry._id)}
                              onChange={() => handleEnquirySelection(enquiry._id)}
                              disabled={enquiry.assignment !== null}
                              title={enquiry.assignment !== null ? "This enquiry is already assigned" : ""}
                            />
                          </td>
                          <td>
                            <div className="serial-number">
                              {enquiry.s_No || 'N/A'}
                            </div>
                          </td>
                          <td>
                            <div className="property-details">
                              <div className="property-type">
                                <span className="detail-label">Property:</span>
                                <span className="detail-value">{enquiry.propertyId?.propertyType || enquiry.productType || 'N/A'}</span>
                              </div>
                              <div className="property-subtype">
                                <span className="detail-label">Type:</span>
                                <span className="detail-value">{enquiry.propertyId?.residentialType || enquiry.propertyId?.commercialType || 'N/A'}</span>
                              </div>
                              <div className="property-location">
                                <span className="detail-label">Location:</span>
                                <span className="detail-value">{enquiry.propertyId?.propertyLocation || enquiry.location || 'N/A'}</span>
                              </div>
                              <div className="property-area">
                                <span className="detail-label">Area:</span>
                                <span className="detail-value">{enquiry.propertyId?.areaDetails || 'N/A'} sq.ft</span>
                              </div>
                              <div className="property-price">
                                <span className="detail-label">Price:</span>
                                <span className="detail-value">{enquiry.propertyId?.price ? `₹${Number(enquiry.propertyId.price).toLocaleString()}` : 'N/A'}</span>
                              </div>
                              <div className="property-availability">
                                <span className="detail-label">Availability:</span>
                                <span className="detail-value">{enquiry.propertyId?.availability || 'N/A'}</span>
                              </div>
                              <div className="property-furnishing">
                                <span className="detail-label">Furnishing:</span>
                                <span className="detail-value">{enquiry.propertyId?.furnishingStatus || 'N/A'}</span>
                              </div>
                              <div className="property-purpose">
                                <span className="detail-label">Purpose:</span>
                                <span className="detail-value">{enquiry.propertyId?.purpose || 'N/A'}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="buyer-details">
                              <div className="buyer-name">
                                <span className="detail-label">Name:</span>
                                <span className="detail-value">{enquiry.buyerId?.fullName || enquiry.clientName || enquiry.fullName || 'N/A'}</span>
                              </div>
                              <div className="buyer-contact">
                                <span className="detail-label">Email:</span>
                                <span className="detail-value">{enquiry.buyerId?.email || enquiry.email || 'N/A'}</span>
                              </div>
                              <div className="buyer-phone">
                                <span className="detail-label">Phone:</span>
                                <span className="detail-value">{enquiry.buyerId?.phone || enquiry.contactNumber || 'N/A'}</span>
                              </div>
                              <div className="buyer-location">
                                <span className="detail-label">Location:</span>
                                <span className="detail-value">{enquiry.buyerId?.city || 'N/A'}, {enquiry.buyerId?.state || 'N/A'}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="owner-details">
                              <div className="owner-name">
                                <span className="detail-label">Name:</span>
                                <span className="detail-value">{enquiry.ownerId?.fullName || 'N/A'}</span>
                              </div>
                              <div className="owner-contact">
                                <span className="detail-label">Email:</span>
                                <span className="detail-value">{enquiry.ownerId?.email || 'N/A'}</span>
                              </div>
                              <div className="owner-phone">
                                <span className="detail-label">Phone:</span>
                                <span className="detail-value">{enquiry.ownerId?.phone || 'N/A'}</span>
                              </div>
                              <div className="owner-location">
                                <span className="detail-label">Location:</span>
                                <span className="detail-value">{enquiry.ownerId?.city || 'N/A'}, {enquiry.ownerId?.state || 'N/A'}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="assignment-details">
                              {enquiry.assignment ? (
                                <div className="assigned-employee">
                                  <div className="employee-name"><span className="detail-label">Assigned to:</span> <span className="detail-value text-success font-weight-bold">{enquiry.assignment.employeeName}</span></div>
                                  <div className="employee-email"><span className="detail-label">Email:</span> <span className="detail-value">{enquiry.assignment.employeeEmail}</span></div>
                                  <div className="assignment-status"><span className="detail-label">Status:</span> <span className={`detail-value badge ${enquiry.assignment.status === 'active' ? 'bg-success' : enquiry.assignment.status === 'pending' ? 'bg-warning' : 'bg-info'}`}>{enquiry.assignment.status}</span></div>
                                  <div className="assignment-date"><span className="detail-label">Assigned:</span> <span className="detail-value">{new Date(enquiry.assignment.assignedDate).toLocaleDateString()}</span></div>
                                  <div className="assignment-priority"><span className="detail-label">Priority:</span> <span className={`detail-value badge ${enquiry.assignment.priority === 'high' ? 'bg-danger' : enquiry.assignment.priority === 'medium' ? 'bg-warning' : 'bg-secondary'}`}>{enquiry.assignment.priority}</span></div>
                                </div>
                              ) : (
                                <div className="not-assigned">
                                  <span className="text-muted">Not Assigned</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="created-date">
                              <div className="created-date">
                                {new Date(enquiry.createdAt).toLocaleDateString()}
                                <div className="created-time text-muted">
                                  {new Date(enquiry.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons-cell">
                              <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => openReminderModal(enquiry)}
                              >
                                <Bell size={14} />
                                Reminder
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-success"
                                onClick={() => handleCreateFollowUp(enquiry)}
                                title="Create follow-up"
                              >
                                <Target size={14} />
                                Follow-up
                              </button>
                              {enquiry.assignment && (
                                <button 
                                  className="btn btn-sm btn-outline-danger mt-1"
                                  onClick={() => handleUnassignLead(enquiry._id, 'Inquiry')}
                                  title="Unassign from employee"
                                >
                                  <X size={14} />
                                  Unassign
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Fixed Pagination - No Page Jump */}
                {userEnquiriesTotalPages > 1 && (
                  <div className="pagination-wrapper">
                    <div className="pagination-container">
                      <div className="pagination-info">
                        <div className="pagination-info-icon">
                          <User size={20} />
                        </div>
                        <div className="pagination-info-text">
                          <span className="pagination-info-label">Showing</span>
                          <span className="pagination-info-numbers">{userEnquiriesStartIndex + 1}-{Math.min(userEnquiriesEndIndex, userEnquiries.length)}</span>
                          <span className="pagination-info-label">of</span>
                          <span className="pagination-info-total">{userEnquiries.length}</span>
                          <span className="pagination-info-label">Client Enquiries</span>
                        </div>
                      </div>
                      <div className="pagination-nav">
                        <ul className="pagination-list">
                          <li className="pagination-item">
                            <button
                              type="button"
                              className={`pagination-btn pagination-btn-prev ${userEnquiriesPage === 1 ? 'disabled' : ''}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (userEnquiriesPage > 1) setUserEnquiriesPage(prev => prev - 1);
                              }}
                              disabled={userEnquiriesPage === 1}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6"></polyline>
                              </svg>
                              <span className="pagination-btn-text">Prev</span>
                            </button>
                          </li>
                          
                          {Array.from({ length: userEnquiriesTotalPages }, (_, i) => i + 1).map(page => (
                            <li className="pagination-item" key={page}>
                              <button
                                type="button"
                                className={`pagination-btn pagination-btn-number ${userEnquiriesPage === page ? 'active' : ''}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setUserEnquiriesPage(page);
                                }}
                              >
                                {page}
                              </button>
                            </li>
                          ))}
                          
                          <li className="pagination-item">
                            <button
                              type="button"
                              className={`pagination-btn pagination-btn-next ${userEnquiriesPage === userEnquiriesTotalPages ? 'disabled' : ''}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (userEnquiriesPage < userEnquiriesTotalPages) setUserEnquiriesPage(prev => prev + 1);
                              }}
                              disabled={userEnquiriesPage === userEnquiriesTotalPages}
                            >
                              <span className="pagination-btn-text">Next</span>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                              </svg>
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card mb-4">
                <div className="card-body text-center">
                  <MessageSquare size={48} className="text-muted mb-3" />
                  <h5>No Client Enquiries Found</h5>
                  <p className="text-muted">There are no client enquiries at the moment.</p>
                </div>
              </div>
            )}

            {/* Manual Enquiries Table */}
            {manualEnquiries.length > 0 ? (
              <div className="enquiries-table-container">
                <h5 className="table-title">Manually Added Enquiries</h5>
                <div className="table-responsive">
                  <table className="table enquiries-table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={
                              manualEnquiries.filter(e => e.assignment === null).length > 0 &&
                              manualEnquiries.filter(e => e.assignment === null).every(e => selectedEnquiries.includes(e._id))
                            }
                            onChange={() => {
                              const unassignedManualIds = manualEnquiries.filter(e => e.assignment === null).map(e => e._id);
                              if (unassignedManualIds.every(id => selectedEnquiries.includes(id))) {
                                setSelectedEnquiries(prev => prev.filter(id => !unassignedManualIds.includes(id)));
                              } else {
                                setSelectedEnquiries(prev => [...new Set([...prev, ...unassignedManualIds])]);
                              }
                            }}
                            title="Select all unassigned enquiries"
                          />
                        </th>
                        <th>S.No</th>
                        <th>Client Details</th>
                        <th>Project Details</th>
                        <th>Case Details</th>
                        <th>Assigned Employee</th>
                        <th>Created Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedManualEnquiries.map((enquiry, index) => (
                        <tr key={enquiry._id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedEnquiries.includes(enquiry._id)}
                              onChange={() => handleEnquirySelection(enquiry._id)}
                              disabled={enquiry.assignment !== null}
                              title={enquiry.assignment !== null ? "This enquiry is already assigned" : ""}
                            />
                          </td>
                          <td>
                            <div className="serial-number">
                              {enquiry.s_No || 'N/A'}
                            </div>
                          </td>
                          <td>
                            <div className="client-details">
                              <div className="client-name">
                                <span className="detail-label">Name:</span>
                                <span className="detail-value">{enquiry.clientName || 'N/A'}</span>
                              </div>
                              <div className="client-contact">
                                <span className="detail-label">Phone:</span>
                                <span className="detail-value">{enquiry.contactNumber || 'N/A'}</span>
                              </div>
                              <div className="client-code">
                                <span className="detail-label">Client Code:</span>
                                <span className="detail-value">{enquiry.ClientCode || 'N/A'}</span>
                              </div>
                              <div className="project-code">
                                <span className="detail-label">Project Code:</span>
                                <span className="detail-value">{enquiry.ProjectCode || 'N/A'}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="project-details">
                              <div className="product-type">
                                <span className="detail-label">Type:</span>
                                <span className="detail-value">{enquiry.productType || 'N/A'}</span>
                              </div>
                              <div className="location">
                                <span className="detail-label">Location:</span>
                                <span className="detail-value">{enquiry.location || 'N/A'}</span>
                              </div>
                              <div className="address">
                                <span className="detail-label">Address:</span>
                                <span className="detail-value">{enquiry.address || 'N/A'}</span>
                              </div>
                              <div className="reference">
                                <span className="detail-label">Reference:</span>
                                <span className="detail-value">{enquiry.referenceBy || 'N/A'}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="case-details">
                              <div className="case-status">
                                <span className="detail-label">Status:</span>
                                <span className="detail-value">{enquiry.caseStatus || 'N/A'}</span>
                              </div>
                              <div className="case-source">
                                <span className="detail-label">Source:</span>
                                <span className="detail-value">{enquiry.source || 'N/A'}</span>
                              </div>
                              <div className="week-action">
                                <span className="detail-label">Week/Action:</span>
                                <span className="detail-value">{enquiry.weekOrActionTaken || 'N/A'}</span>
                              </div>
                              <div className="action-plan">
                                <span className="detail-label">Action Plan:</span>
                                <span className="detail-value">{enquiry.actionPlan || 'N/A'}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="assignment-details">
                              {enquiry.assignment ? (
                                <div className="assigned-employee">
                                  <div className="employee-name"><span className="detail-label">Assigned to:</span> <span className="detail-value text-success font-weight-bold">{enquiry.assignment.employeeName}</span></div>
                                  <div className="employee-email"><span className="detail-label">Email:</span> <span className="detail-value">{enquiry.assignment.employeeEmail}</span></div>
                                  <div className="assignment-status"><span className="detail-label">Status:</span> <span className={`detail-value badge ${enquiry.assignment.status === 'active' ? 'bg-success' : enquiry.assignment.status === 'pending' ? 'bg-warning' : 'bg-info'}`}>{enquiry.assignment.status}</span></div>
                                  <div className="assignment-date"><span className="detail-label">Assigned:</span> <span className="detail-value">{new Date(enquiry.assignment.assignedDate).toLocaleDateString()}</span></div>
                                  <div className="assignment-priority"><span className="detail-label">Priority:</span> <span className={`detail-value badge ${enquiry.assignment.priority === 'high' ? 'bg-danger' : enquiry.assignment.priority === 'medium' ? 'bg-warning' : 'bg-secondary'}`}>{enquiry.assignment.priority}</span></div>
                                </div>
                              ) : (
                                <div className="not-assigned">
                                  <span className="text-muted">Not Assigned</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="created-date">
                              <div className="created-date">
                                {new Date(enquiry.createdAt).toLocaleDateString()}
                                <div className="created-time text-muted">
                                  {new Date(enquiry.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons-cell">
                              <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => openReminderModal(enquiry)}
                              >
                                <Bell size={14} />
                                Reminder
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-success"
                                onClick={() => handleCreateFollowUp(enquiry)}
                                title="Create follow-up"
                              >
                                <Target size={14} />
                                Follow-up
                              </button>
                              {enquiry.assignment && (
                                <button 
                                  className="btn btn-sm btn-outline-danger mt-1"
                                  onClick={() => handleUnassignLead(enquiry._id, 'ManualInquiry')}
                                  title="Unassign from employee"
                                >
                                  <X size={14} />
                                  Unassign
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Fixed Pagination - Manual Enquiries */}
                {manualEnquiriesTotalPages > 1 && (
                  <div className="pagination-wrapper">
                    <div className="pagination-container">
                      <div className="pagination-info">
                        <div className="pagination-info-icon">
                          <User size={20} />
                        </div>
                        <div className="pagination-info-text">
                          <span className="pagination-info-label">Showing</span>
                          <span className="pagination-info-numbers">{manualEnquiriesStartIndex + 1}-{Math.min(manualEnquiriesEndIndex, manualEnquiries.length)}</span>
                          <span className="pagination-info-label">of</span>
                          <span className="pagination-info-total">{manualEnquiries.length}</span>
                          <span className="pagination-info-label">Manual Enquiries</span>
                        </div>
                      </div>
                      <div className="pagination-nav">
                        <ul className="pagination-list">
                          <li className="pagination-item">
                            <button
                              type="button"
                              className={`pagination-btn pagination-btn-prev ${manualEnquiriesPage === 1 ? 'disabled' : ''}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (manualEnquiriesPage > 1) setManualEnquiriesPage(prev => prev - 1);
                              }}
                              disabled={manualEnquiriesPage === 1}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6"></polyline>
                              </svg>
                              <span className="pagination-btn-text">Prev</span>
                            </button>
                          </li>
                          
                          {Array.from({ length: manualEnquiriesTotalPages }, (_, i) => i + 1).map(page => (
                            <li className="pagination-item" key={page}>
                              <button
                                type="button"
                                className={`pagination-btn pagination-btn-number ${manualEnquiriesPage === page ? 'active' : ''}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setManualEnquiriesPage(page);
                                }}
                              >
                                {page}
                              </button>
                            </li>
                          ))}
                          
                          <li className="pagination-item">
                            <button
                              type="button"
                              className={`pagination-btn pagination-btn-next ${manualEnquiriesPage === manualEnquiriesTotalPages ? 'disabled' : ''}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (manualEnquiriesPage < manualEnquiriesTotalPages) setManualEnquiriesPage(prev => prev + 1);
                              }}
                              disabled={manualEnquiriesPage === manualEnquiriesTotalPages}
                            >
                              <span className="pagination-btn-text">Next</span>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                              </svg>
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card">
                <div className="card-body text-center">
                  <MessageSquare size={48} className="text-muted mb-3" />
                  <h5>No Manually Added Enquiries Found</h5>
                  <p className="text-muted">There are no manually added enquiries at the moment.</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Filtered Views - Fixed Pagination */}
        {filter === 'user' && (
          <div className="enquiries-table-container">
            <div className="table-responsive">
              <table className="table enquiries-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={
                          userEnquiries.filter(e => e.assignment === null).length > 0 &&
                          userEnquiries.filter(e => e.assignment === null).every(e => selectedEnquiries.includes(e._id))
                        }
                        onChange={() => {
                          const unassignedUserIds = userEnquiries.filter(e => e.assignment === null).map(e => e._id);
                          if (unassignedUserIds.every(id => selectedEnquiries.includes(id))) {
                            setSelectedEnquiries(prev => prev.filter(id => !unassignedUserIds.includes(id)));
                          } else {
                            setSelectedEnquiries(prev => [...new Set([...prev, ...unassignedUserIds])]);
                          }
                        }}
                        title="Select all unassigned enquiries"
                      />
                    </th>
                    <th>S.No</th>
                    <th>Property Details</th>
                    <th>Buyer Information</th>
                    <th>Owner Information</th>
                    <th>Assigned Employee</th>
                    <th>Created Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUserEnquiries.map((enquiry, index) => (
                    <tr key={enquiry._id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedEnquiries.includes(enquiry._id)}
                          onChange={() => handleEnquirySelection(enquiry._id)}
                          disabled={enquiry.assignment !== null}
                          title={enquiry.assignment !== null ? "This enquiry is already assigned" : ""}
                        />
                      </td>
                      <td><div className="serial-number">{enquiry.s_No || 'N/A'}</div></td>
                      <td>
                        <div className="property-details">
                          <div className="property-type"><span className="detail-label">Property:</span> <span className="detail-value">{enquiry.propertyId?.propertyType || enquiry.productType || 'N/A'}</span></div>
                          <div className="property-subtype"><span className="detail-label">Type:</span> <span className="detail-value">{enquiry.propertyId?.residentialType || enquiry.propertyId?.commercialType || 'N/A'}</span></div>
                          <div className="property-location"><span className="detail-label">Location:</span> <span className="detail-value">{enquiry.propertyId?.propertyLocation || enquiry.location || 'N/A'}</span></div>
                          <div className="property-area"><span className="detail-label">Area:</span> <span className="detail-value">{enquiry.propertyId?.areaDetails || 'N/A'} sq.ft</span></div>
                          <div className="property-price"><span className="detail-label">Price:</span> <span className="detail-value">₹{enquiry.propertyId?.price ? Number(enquiry.propertyId.price).toLocaleString() : 'N/A'}</span></div>
                          <div className="property-availability"><span className="detail-label">Availability:</span> <span className="detail-value">{enquiry.propertyId?.availability || 'N/A'}</span></div>
                          <div className="property-furnishing"><span className="detail-label">Furnishing:</span> <span className="detail-value">{enquiry.propertyId?.furnishingStatus || 'N/A'}</span></div>
                          <div className="property-purpose"><span className="detail-label">Purpose:</span> <span className="detail-value">{enquiry.propertyId?.purpose || 'N/A'}</span></div>
                        </div>
                      </td>
                      <td>
                        <div className="buyer-details">
                          <div className="buyer-name"><span className="detail-label">Name:</span> <span className="detail-value">{enquiry.buyerId?.fullName || enquiry.clientName || enquiry.fullName || 'N/A'}</span></div>
                          <div className="buyer-id"><span className="detail-label">ID:</span> <span className="detail-value">{enquiry.buyerId?._id?.substring(0, 8) || enquiry._id?.substring(0, 8) || 'N/A'}</span></div>
                          <div className="buyer-contact"><span className="detail-label">Email:</span> <span className="detail-value">{enquiry.buyerId?.email || enquiry.email || 'N/A'}</span></div>
                          <div className="buyer-phone"><span className="detail-label">Phone:</span> <span className="detail-value">{enquiry.buyerId?.phone || enquiry.contactNumber || 'N/A'}</span></div>
                          <div className="buyer-location"><span className="detail-label">Location:</span> <span className="detail-value">{enquiry.buyerId?.city || 'N/A'}, {enquiry.buyerId?.state || 'N/A'}</span></div>
                        </div>
                      </td>
                      <td>
                        <div className="owner-details">
                          <div className="owner-name"><span className="detail-label">Name:</span> <span className="detail-value">{enquiry.ownerId?.fullName || 'N/A'}</span></div>
                          <div className="owner-id"><span className="detail-label">ID:</span> <span className="detail-value">{enquiry.ownerId?._id?.substring(0, 8) || 'N/A'}</span></div>
                          <div className="owner-contact"><span className="detail-label">Email:</span> <span className="detail-value">{enquiry.ownerId?.email || 'N/A'}</span></div>
                          <div className="owner-phone"><span className="detail-label">Phone:</span> <span className="detail-value">{enquiry.ownerId?.phone || 'N/A'}</span></div>
                          <div className="owner-location"><span className="detail-label">Location:</span> <span className="detail-value">{enquiry.ownerId?.city || 'N/A'}, {enquiry.ownerId?.state || 'N/A'}</span></div>
                        </div>
                      </td>
                      <td>
                        <div className="assignment-details">
                          {enquiry.assignment ? (
                            <div className="assigned-employee">
                              <div className="employee-name"><span className="detail-label">Assigned to:</span> <span className="detail-value text-success font-weight-bold">{enquiry.assignment.employeeName}</span></div>
                              <div className="employee-email"><span className="detail-label">Email:</span> <span className="detail-value">{enquiry.assignment.employeeEmail}</span></div>
                              <div className="assignment-status"><span className="detail-label">Status:</span> <span className={`detail-value badge ${enquiry.assignment.status === 'active' ? 'bg-success' : enquiry.assignment.status === 'pending' ? 'bg-warning' : 'bg-info'}`}>{enquiry.assignment.status}</span></div>
                              <div className="assignment-date"><span className="detail-label">Assigned:</span> <span className="detail-value">{new Date(enquiry.assignment.assignedDate).toLocaleDateString()}</span></div>
                              <div className="assignment-priority"><span className="detail-label">Priority:</span> <span className={`detail-value badge ${enquiry.assignment.priority === 'high' ? 'bg-danger' : enquiry.assignment.priority === 'medium' ? 'bg-warning' : 'bg-secondary'}`}>{enquiry.assignment.priority}</span></div>
                            </div>
                          ) : (
                            <div className="not-assigned">
                              <span className="text-muted">Not Assigned</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="created-date">
                          {new Date(enquiry.createdAt).toLocaleDateString()}
                          <div className="created-time text-muted">
                            {new Date(enquiry.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons-cell">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => openReminderModal(enquiry)}>
                            <Bell size={14} />
                            Reminder
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleCreateFollowUp(enquiry)}
                            title="Create follow-up"
                          >
                            <Target size={14} />
                            Follow-up
                          </button>
                          {enquiry.assignment && (
                            <button 
                              className="btn btn-sm btn-outline-danger mt-1"
                              onClick={() => handleUnassignLead(enquiry._id, 'Inquiry')}
                              title="Unassign from employee"
                            >
                              <X size={14} />
                              Unassign
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {userEnquiriesTotalPages > 1 && (
              <div className="pagination-wrapper">
                <div className="pagination-container">
                  <div className="pagination-info">
                    <div className="pagination-info-icon"><User size={20} /></div>
                    <div className="pagination-info-text">
                      <span className="pagination-info-label">Showing</span>
                      <span className="pagination-info-numbers">{userEnquiriesStartIndex + 1}-{Math.min(userEnquiriesEndIndex, userEnquiries.length)}</span>
                      <span className="pagination-info-label">of</span>
                      <span className="pagination-info-total">{userEnquiries.length}</span>
                      <span className="pagination-info-label">User Enquiries</span>
                    </div>
                  </div>
                  <div className="pagination-nav">
                    <ul className="pagination-list">
                      <li className="pagination-item">
                        <button
                          type="button"
                          className={`pagination-btn pagination-btn-prev ${userEnquiriesPage === 1 ? 'disabled' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (userEnquiriesPage > 1) setUserEnquiriesPage(prev => prev - 1);
                          }}
                          disabled={userEnquiriesPage === 1}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                          </svg>
                          <span className="pagination-btn-text">Prev</span>
                        </button>
                      </li>
                      {Array.from({ length: userEnquiriesTotalPages }, (_, i) => i + 1).map(page => (
                        <li className="pagination-item" key={page}>
                          <button
                            type="button"
                            className={`pagination-btn pagination-btn-number ${userEnquiriesPage === page ? 'active' : ''}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setUserEnquiriesPage(page);
                            }}
                          >
                            {page}
                          </button>
                        </li>
                      ))}
                      <li className="pagination-item">
                        <button
                          type="button"
                          className={`pagination-btn pagination-btn-next ${userEnquiriesPage === userEnquiriesTotalPages ? 'disabled' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (userEnquiriesPage < userEnquiriesTotalPages) setUserEnquiriesPage(prev => prev + 1);
                          }}
                          disabled={userEnquiriesPage === userEnquiriesTotalPages}
                        >
                          <span className="pagination-btn-text">Next</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {filter === 'manual' && (
          <div className="enquiries-table-container">
            <div className="table-responsive">
              <table className="table enquiries-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={
                          manualEnquiries.filter(e => e.assignment === null).length > 0 &&
                          manualEnquiries.filter(e => e.assignment === null).every(e => selectedEnquiries.includes(e._id))
                        }
                        onChange={() => {
                          const unassignedManualIds = manualEnquiries.filter(e => e.assignment === null).map(e => e._id);
                          if (unassignedManualIds.every(id => selectedEnquiries.includes(id))) {
                            setSelectedEnquiries(prev => prev.filter(id => !unassignedManualIds.includes(id)));
                          } else {
                            setSelectedEnquiries(prev => [...new Set([...prev, ...unassignedManualIds])]);
                          }
                        }}
                        title="Select all unassigned enquiries"
                      />
                    </th>
                    <th>S.No</th>
                    <th>Client Details</th>
                    <th>Project Details</th>
                    <th>Case Details</th>
                    <th>Assigned Employee</th>
                    <th>Created Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedManualEnquiries.map((enquiry, index) => (
                    <tr key={enquiry._id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedEnquiries.includes(enquiry._id)}
                          onChange={() => handleEnquirySelection(enquiry._id)}
                          disabled={enquiry.assignment !== null}
                          title={enquiry.assignment !== null ? "This enquiry is already assigned" : ""}
                        />
                      </td>
                      <td><div className="serial-number">{enquiry.s_No || 'N/A'}</div></td>
                      <td>
                        <div className="client-details">
                          <div className="client-name"><span className="detail-label">Name:</span> <span className="detail-value">{enquiry.clientName || 'N/A'}</span></div>
                          <div className="client-contact"><span className="detail-label">Phone:</span> <span className="detail-value">{enquiry.contactNumber || 'N/A'}</span></div>
                          <div className="client-code"><span className="detail-label">Client Code:</span> <span className="detail-value">{enquiry.ClientCode || 'N/A'}</span></div>
                          <div className="project-code"><span className="detail-label">Project Code:</span> <span className="detail-value">{enquiry.ProjectCode || 'N/A'}</span></div>
                        </div>
                      </td>
                      <td>
                        <div className="project-details">
                          <div className="product-type"><span className="detail-label">Type:</span> <span className="detail-value">{enquiry.productType || 'N/A'}</span></div>
                          <div className="location"><span className="detail-label">Location:</span> <span className="detail-value">{enquiry.location || 'N/A'}</span></div>
                          <div className="address"><span className="detail-label">Address:</span> <span className="detail-value">{enquiry.address || 'N/A'}</span></div>
                          <div className="reference"><span className="detail-label">Reference:</span> <span className="detail-value">{enquiry.referenceBy || 'N/A'}</span></div>
                        </div>
                      </td>
                      <td>
                        <div className="case-details">
                          <div className="case-status"><span className="detail-label">Status:</span> <span className="detail-value">{enquiry.caseStatus || 'N/A'}</span></div>
                          <div className="case-source"><span className="detail-label">Source:</span> <span className="detail-value">{enquiry.source || 'N/A'}</span></div>
                          <div className="week-action"><span className="detail-label">Week/Action:</span> <span className="detail-value">{enquiry.weekOrActionTaken || 'N/A'}</span></div>
                          <div className="action-plan"><span className="detail-label">Action Plan:</span> <span className="detail-value">{enquiry.actionPlan || 'N/A'}</span></div>
                        </div>
                      </td>
                      <td>
                        <div className="assignment-details">
                          {enquiry.assignment ? (
                            <div className="assigned-employee">
                              <div className="employee-name"><span className="detail-label">Assigned to:</span> <span className="detail-value text-success font-weight-bold">{enquiry.assignment.employeeName}</span></div>
                              <div className="employee-email"><span className="detail-label">Email:</span> <span className="detail-value">{enquiry.assignment.employeeEmail}</span></div>
                              <div className="assignment-status"><span className="detail-label">Status:</span> <span className={`detail-value badge ${enquiry.assignment.status === 'active' ? 'bg-success' : enquiry.assignment.status === 'pending' ? 'bg-warning' : 'bg-info'}`}>{enquiry.assignment.status}</span></div>
                              <div className="assignment-date"><span className="detail-label">Assigned:</span> <span className="detail-value">{new Date(enquiry.assignment.assignedDate).toLocaleDateString()}</span></div>
                              <div className="assignment-priority"><span className="detail-label">Priority:</span> <span className={`detail-value badge ${enquiry.assignment.priority === 'high' ? 'bg-danger' : enquiry.assignment.priority === 'medium' ? 'bg-warning' : 'bg-secondary'}`}>{enquiry.assignment.priority}</span></div>
                            </div>
                          ) : (
                            <div className="not-assigned">
                              <span className="text-muted">Not Assigned</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="created-date">
                          {new Date(enquiry.createdAt).toLocaleDateString()}
                          <div className="created-time text-muted">
                            {new Date(enquiry.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons-cell">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => openReminderModal(enquiry)}>
                            <Bell size={14} />
                            Reminder
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleCreateFollowUp(enquiry)}
                            title="Create follow-up"
                          >
                            <Target size={14} />
                            Follow-up
                          </button>
                          {enquiry.assignment && (
                            <button 
                              className="btn btn-sm btn-outline-danger mt-1"
                              onClick={() => handleUnassignLead(enquiry._id, 'ManualInquiry')}
                              title="Unassign from employee"
                            >
                              <X size={14} />
                              Unassign
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {manualEnquiriesTotalPages > 1 && (
              <div className="pagination-wrapper">
                <div className="pagination-container">
                  <div className="pagination-info">
                    <div className="pagination-info-icon"><User size={20} /></div>
                    <div className="pagination-info-text">
                      <span className="pagination-info-label">Showing</span>
                      <span className="pagination-info-numbers">{manualEnquiriesStartIndex + 1}-{Math.min(manualEnquiriesEndIndex, manualEnquiries.length)}</span>
                      <span className="pagination-info-label">of</span>
                      <span className="pagination-info-total">{manualEnquiries.length}</span>
                      <span className="pagination-info-label">Manual Enquiries</span>
                    </div>
                  </div>
                  <div className="pagination-nav">
                    <ul className="pagination-list">
                      <li className="pagination-item">
                        <button
                          type="button"
                          className={`pagination-btn pagination-btn-prev ${manualEnquiriesPage === 1 ? 'disabled' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (manualEnquiriesPage > 1) setManualEnquiriesPage(prev => prev - 1);
                          }}
                          disabled={manualEnquiriesPage === 1}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                          </svg>
                          <span className="pagination-btn-text">Prev</span>
                        </button>
                      </li>
                      {Array.from({ length: manualEnquiriesTotalPages }, (_, i) => i + 1).map(page => (
                        <li className="pagination-item" key={page}>
                          <button
                            type="button"
                            className={`pagination-btn pagination-btn-number ${manualEnquiriesPage === page ? 'active' : ''}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setManualEnquiriesPage(page);
                            }}
                          >
                            {page}
                          </button>
                        </li>
                      ))}
                      <li className="pagination-item">
                        <button
                          type="button"
                          className={`pagination-btn pagination-btn-next ${manualEnquiriesPage === manualEnquiriesTotalPages ? 'disabled' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (manualEnquiriesPage < manualEnquiriesTotalPages) setManualEnquiriesPage(prev => prev + 1);
                          }}
                          disabled={manualEnquiriesPage === manualEnquiriesTotalPages}
                        >
                          <span className="pagination-btn-text">Next</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lead Assignment Modal */}
      {showAssignmentModal && (
        <div className="assignment-modal-overlay" onClick={closeAssignmentModal}>
          <div className="assignment-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="assignment-modal-header">
              <h5 className="assignment-modal-title">
                <UserPlus size={20} className="me-2" />
                Assign Leads to Employee
              </h5>
              <button 
                type="button" 
                className="assignment-modal-close" 
                onClick={closeAssignmentModal}
              >
                <X size={18} />
              </button>
            </div>
            <div className="assignment-modal-body">
              <div className="assignment-info mb-3">
                <div className="selected-count">
                  <strong>{selectedEnquiries.length}</strong> enquiries selected for assignment
                </div>
              </div>
              
              <div className="assignment-form-group">
                <label className="assignment-form-label">Select Employee *</label>
                <select 
                  className="assignment-form-select" 
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  required
                >
                  <option value="">Choose an employee...</option>
                  {employees.length === 0 ? (
                    <option value="" disabled>No employees available - Create employees first</option>
                  ) : (
                    employees.map(employee => (
                      <option key={employee._id} value={employee._id}>
                        {employee.name} - {employee.email}
                      </option>
                    ))
                  )}
                </select>
                {employees.length === 0 && (
                  <small className="text-muted mt-2 d-block">
                    💡 Go to Employee Management to create employees first
                  </small>
                )}
              </div>

              <div className="assignment-form-group">
                <label className="assignment-form-label">Priority Level</label>
                <select 
                  className="assignment-form-select" 
                  value={assignmentPriority}
                  onChange={(e) => setAssignmentPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="assignment-form-group">
                <label className="assignment-form-label">Assignment Notes</label>
                <textarea 
                  className="assignment-form-textarea" 
                  rows="3" 
                  placeholder="Add any instructions or notes for the employee..."
                  value={assignmentNote}
                  onChange={(e) => setAssignmentNote(e.target.value)}
                ></textarea>
              </div>
            </div>
            <div className="assignment-modal-footer">
              <button 
                type="button" 
                className="assignment-btn assignment-btn-secondary" 
                onClick={closeAssignmentModal}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="assignment-btn assignment-btn-primary" 
                onClick={handleAssignLeads}
                disabled={!selectedEmployee}
              >
                <UserPlus size={16} className="me-1" />
                Assign Leads
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {reminderModal.isOpen && (
        <div className="reminder-modal-overlay">
          <div className="reminder-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="reminder-modal-header">
              <h6 className="reminder-modal-title">Set Reminder</h6>
              <button type="button" className="reminder-modal-close" onClick={closeReminderModal}>
                <X size={16} />
              </button>
            </div>
            <div className="reminder-modal-body">
              <div className="reminder-form-group">
                <label className="reminder-form-label">Name</label>
                <input type="text" className="reminder-form-control" value={reminderModal.data?.name || ''} onChange={(e) => handleReminderChange('name', e.target.value)} />
              </div>
              <div className="reminder-form-group">
                <label className="reminder-form-label">Email</label>
                <input type="email" className="reminder-form-control" value={reminderModal.data?.email || ''} onChange={(e) => handleReminderChange('email', e.target.value)} />
              </div>
              <div className="reminder-form-group">
                <label className="reminder-form-label">Phone</label>
                <input type="text" className="reminder-form-control" value={reminderModal.data?.phone || ''} onChange={(e) => handleReminderChange('phone', e.target.value)} />
              </div>
              <div className="reminder-form-group">
                <label className="reminder-form-label">Location</label>
                <input type="text" className="reminder-form-control" value={reminderModal.data?.location || ''} onChange={(e) => handleReminderChange('location', e.target.value)} />
              </div>
              <div className="reminder-form-row">
                <div className="reminder-form-group reminder-form-col">
                  <label className="reminder-form-label">Date</label>
                  <input type="date" className="reminder-form-control" value={reminderModal.data?.date || ''} onChange={(e) => handleReminderChange('date', e.target.value)} />
                </div>
                <div className="reminder-form-group reminder-form-col">
                  <label className="reminder-form-label">Time</label>
                  <div className="reminder-time-row">
                    <select className="reminder-time-select reminder-form-col" value={reminderModal.data?.hour || '1'} onChange={(e) => handleReminderChange('hour', e.target.value)}>
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span style={{alignSelf: 'center', padding: '0 5px'}}>:</span>
                    <select className="reminder-time-select reminder-form-col" value={reminderModal.data?.minute || '00'} onChange={(e) => handleReminderChange('minute', e.target.value)}>
                      {Array.from({length:60},(_,i)=> {
                        const m = i < 10 ? `0${i}` : `${i}`;
                        return <option key={i} value={m}>{m}</option>
                      })}
                    </select>
                    <select className="reminder-period-select" value={reminderModal.data?.period || 'AM'} onChange={(e) => handleReminderChange('period', e.target.value)}>
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="reminder-form-group">
                <label className="reminder-form-label">Note</label>
                <textarea className="reminder-form-control reminder-textarea" rows="2" value={reminderModal.data?.note || ''} onChange={(e) => handleReminderChange('note', e.target.value)}></textarea>
              </div>
            </div>
            <div className="reminder-modal-footer">
              <button type="button" className="reminder-btn reminder-btn-secondary" onClick={closeReminderModal}>Cancel</button>
              <button type="button" className="reminder-btn reminder-btn-primary" onClick={handleSaveReminder}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Auto Assignment Modal */}
      {showAutoAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAutoAssignModal(false)}>
          <div className="assignment-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="assignment-modal-header">
              <h5 className="assignment-modal-title">
                <Target size={20} className="me-2" />
                Auto Assign Enquiries
              </h5>
              <button 
                type="button" 
                className="assignment-modal-close" 
                onClick={() => setShowAutoAssignModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="assignment-modal-body">
              <div className="auto-assign-info mb-3">
                <div className="alert alert-info">
                  <strong>Selected Enquiries:</strong> {selectedEnquiries.length} unassigned enquiries will be distributed equally among employees of the selected roles.
                </div>
              </div>
              
              <div className="assignment-form-group">
                <label className="assignment-form-label">Select Roles</label>
                <div className="roles-selection-container">
                  {roles.length > 0 ? (
                    roles.map(role => (
                      <div key={role._id} className="role-checkbox-item">
                        <input
                          type="checkbox"
                          id={`role-${role._id}`}
                          checked={selectedRoles.includes(role._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRoles(prev => [...prev, role._id]);
                            } else {
                              setSelectedRoles(prev => prev.filter(id => id !== role._id));
                            }
                          }}
                        />
                        <label htmlFor={`role-${role._id}`} className="role-label">
                          {role.name}
                          <span className="role-employees-count">
                            ({employees.filter(emp => emp.role?._id === role._id).length} employees)
                          </span>
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">No roles available</p>
                  )}
                </div>
              </div>

              {selectedRoles.length > 0 && (
                <div className="assignment-preview mt-3">
                  <h6>Assignment Preview:</h6>
                  <div className="preview-info">
                    {(() => {
                      const roleEmployees = employees.filter(emp => 
                        selectedRoles.includes(emp.role?._id)
                      );
                      const unassignedCount = enquiries.filter(enquiry => 
                        selectedEnquiries.includes(enquiry._id) && enquiry.assignment === null
                      ).length;
                      const employeeCount = roleEmployees.length;
                      
                      if (employeeCount === 0) {
                        return <span className="text-warning">No employees found for selected roles</span>;
                      }
                      
                      const baseAssignments = Math.floor(unassignedCount / employeeCount);
                      const extraAssignments = unassignedCount % employeeCount;
                      
                      return (
                        <div>
                          <p><strong>{employeeCount}</strong> employees will receive assignments:</p>
                          <ul>
                            {extraAssignments > 0 && (
                              <li>{extraAssignments} employees will get {baseAssignments + 1} enquiries each</li>
                            )}
                            {(employeeCount - extraAssignments) > 0 && (
                              <li>{employeeCount - extraAssignments} employees will get {baseAssignments} enquiries each</li>
                            )}
                          </ul>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
            <div className="assignment-modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowAutoAssignModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-info"
                onClick={handleAutoAssignment}
                disabled={selectedRoles.length === 0 || autoAssignLoading}
              >
                {autoAssignLoading ? 'Assigning...' : 'Auto Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Modal */}
      <FollowUpModal
        isOpen={showFollowUpModal}
        onClose={() => {
          setShowFollowUpModal(false);
          setSelectedLead(null);
        }}
        leadData={selectedLead?.leadData}
        leadType={selectedLead?.leadType}
        leadId={selectedLead?.leadId}
        onFollowUpCreated={handleFollowUpCreated}
      />
    </div>
  );
};

export default EnquiriesPage;