# 📋 Admin Enquiries Management System - COMPLETE Documentation

## 🏗️ Overview
Admin Enquiries section ek comprehensive system hai jo property enquiries ko manage karta hai. Yeh system do types ki enquiries handle karta hai:
1. **User/Client Enquiries** - App users dwara submit ki gayi enquiries
2. **Manual Enquiries** - Admin/employees dwara manually add ki gayi enquiries

### 🎯 Key Features At a Glance
- ✅ Dual-source enquiry management (User + Manual)
- ✅ Auto-generation of Serial Numbers, Client Codes, Project Codes
- ✅ Manual lead assignment to specific employees
- ✅ Auto lead assignment by roles with equal distribution
- ✅ Lead unassignment functionality
- ✅ Reminder system with sound alerts
- ✅ Week/Action date-time reminders (auto-created)
- ✅ Follow-up management system
- ✅ Visual analytics with charts
- ✅ Advanced filtering (All/Manual/User)
- ✅ Pagination for both enquiry types
- ✅ Checkbox selection for bulk operations
- ✅ Toast notifications for all actions
- ✅ Real-time assignment status tracking
- ✅ Priority levels (Low/Medium/High/Urgent)
- ✅ Responsive table design with detailed views

---

## 📂 File Structure

```
src/pages/Enquiries/
├── EnquiriesPage.jsx        # Main enquiry management component
└── EnquiriesPage.css         # Styling
```

---

## 🔄 Complete System Flows

### 1️⃣ **Initial Load Flow**
```
Page Load
    ↓
Show Loading State ("Loading enquiries...")
    ↓
┌───────────────────────────────────────────┐
│  Parallel API Calls:                      │
│  1. GET /api/inquiry/get-enquiries        │
│  2. GET /api/inquiry/all                  │
│  3. GET /admin/leads/available-employees  │
│  4. GET /admin/roles/                     │
└───────────────────────────────────────────┘
    ↓
Process & Merge Data:
  - Add sourceType flag (user/manual)
  - Normalize data structures
  - Sort by createdAt (newest first)
    ↓
Update State:
  - setEnquiries(merged data)
  - setEmployees(employee list)
  - setRoles(roles list)
    ↓
Render Dashboard:
  - Statistics badges (Total/Client/Manual)
  - Analytics chart (EnquiryChart)
  - Filter dropdown
  - Enquiry tables with pagination
    ↓
Ready for User Interaction
```

### 2️⃣ **Enquiry Creation Flow (Complete)**
```
1. Admin clicks "Add Enquiry" Button (Green)
    ↓
2. Modal Opens (showAddForm = true)
    ↓
3. Auto-Generation Triggered (useEffect):
   ┌──────────────────────────────────────────┐
   │ Serial Number (S.No):                    │
   │ - Logic: enquiries.length                │
   │ - If 5 exist → next = 6                  │
   │ - Display in disabled input (read-only)  │
   └──────────────────────────────────────────┘
   ┌──────────────────────────────────────────┐
   │ Client Code:                             │
   │ - Count = enquiries.length               │
   │ - Format: CC + padStart(3, '0')          │
   │ - Example: CC006                         │
   │ - Disabled input (auto-generated)        │
   └──────────────────────────────────────────┘
   ┌──────────────────────────────────────────┐
   │ Project Code:                            │
   │ - Count = enquiries.length               │
   │ - Format: PC + padStart(3, '0')          │
   │ - Example: PC006                         │
   │ - Disabled input (auto-generated)        │
   └──────────────────────────────────────────┘
   ┌──────────────────────────────────────────┐
   │ Date Field:                              │
   │ - Auto-filled: new Date().toISOString()  │
   │ - Format: YYYY-MM-DD                     │
   └──────────────────────────────────────────┘
    ↓
4. Admin Fills Form Fields:
   ✅ Required Fields:
      • Client Name (text)
      • Contact Number (text)
      • Product Type (select: Residential/Commercial/Plot/Apartment/Villa)
      • Location (text)
      • Date (date picker - pre-filled)
      • Source (select: Walk In/OLX/Just Dial/Reference)
      • Case Status (select: Open/Closed/Week One/Week Two/Unassigned)
   
   📝 Optional Fields:
      • Major Comments (textarea)
      • Address (textarea)
      • Week/Action Date & Time (datetime-local)
        🔔 ALERT: Agar fill kiya to reminder create hoga!
        ⏰ Set time par POPUP + SOUND notification milega!
      • Action Plan (textarea)
      • Reference By (text - only if Source = "Reference")
    ↓
5. Form Validation:
   ✅ All required fields filled?
   ✅ If Source = Reference → Reference By required
    ↓
6. Click "Save Enquiry" Button
    ↓
7. Loading State: Button → "Saving..."
    ↓
8. Data Preparation:
   - Parse s_No to integer
   - Set date if empty
   - Convert weekActionDateTime to display format
   - Remove empty/null fields from submitData
    ↓
9. 📤 API CALL:
   POST ${API_BASE_URL}/api/inquiry/create
   Headers: { Content-Type: application/json }
   Body: {
     s_No: 6,
     clientName: "Priya Patel",
     contactNumber: "9988776655",
     ClientCode: "CC006",
     ProjectCode: "PC006",
     productType: "Residential",
     location: "Juhu",
     date: "2025-12-20",
     caseStatus: "Open",
     source: "OLX",
     majorComments: "Looking for 3BHK",
     address: "Near Juhu Beach",
     weekOrActionTaken: "Dec 25, 2025, 10:30 AM",
     actionPlan: "Call for details",
     referenceBy: ""
   }
    ↓
10. ✅ SUCCESS Response
    ↓
11. 🎉 Toast Success: "Enquiry created successfully!"
    ↓
12. ⏰ Week/Action DateTime Provided?
    ↓
    YES → Reminder Creation Sub-Flow:
    ┌─────────────────────────────────────────────────┐
    │ 1. Parse datetime-local input (YYYY-MM-DDTHH:mm)│
    │    Example: "2025-12-25T10:30"                  │
    │                                                 │
    │ 2. Create Date object:                          │
    │    const dateTimeObj = new Date(input)          │
    │                                                 │
    │ 3. Timezone Adjustment:                         │
    │    - Get timezone offset (minutes)              │
    │    - Adjust date: dateTimeObj - offset          │
    │    - Ensures exact local time trigger           │
    │                                                 │
    │ 4. Convert to ISO String (UTC):                 │
    │    adjustedDate.toISOString()                   │
    │    → "2025-12-25T10:30:00.000Z"                 │
    │                                                 │
    │ 5. Prepare Full Reminder Data:                  │
    │    {                                            │
    │      name: clientName,                          │
    │      email: email || 'N/A',                     │
    │      phone: contactNumber,                      │
    │      location: location,                        │
    │      reminderTime: isoString,                   │
    │      note: actionPlan,                          │
    │      title: "Enquiry Reminder: {name}",         │
    │      productType, caseStatus, source,           │
    │      majorComments, address, referenceBy,       │
    │      clientCode, projectCode, serialNumber,     │
    │      enquiryId: createdEnquiry._id              │
    │    }                                            │
    │                                                 │
    │ 6. 📤 API CALL:                                 │
    │    POST /employee/reminders/create-from-lead    │
    │    Headers: { Authorization: Bearer {token} }   │
    │    Body: { ...reminderData }                    │
    │                                                 │
    │ 7. ✅ Reminder API Success:                     │
    │    → Store reminder ID & details                │
    │    → Verify stored time matches input           │
    │                                                 │
    │ 8. 💾 Local Storage Backup:                     │
    │    globalReminderService.addLocalReminder({     │
    │      _id, title, note, clientName, phone,       │
    │      email, location, address, productType,     │
    │      caseStatus, source, majorComments,         │
    │      referenceBy, clientCode, projectCode,      │
    │      serialNumber, enquiryId,                   │
    │      reminderDateTime: ISO string,              │
    │      status: 'pending',                         │
    │      assignmentType: 'enquiry'                  │
    │    })                                           │
    │                                                 │
    │ 9. 🎉 Toast Success:                            │
    │    "Week/Action reminder set successfully!"     │
    │    (2000ms auto-close)                          │
    │                                                 │
    │ 10. ❌ Reminder API Failed?                     │
    │     → Still create local reminder (backup)      │
    │     → Toast Warning:                            │
    │       "Enquiry created. Reminder will trigger   │
    │        locally. (API: {error})"                 │
    └─────────────────────────────────────────────────┘
    ↓
13. Close Modal (showAddForm = false)
    ↓
14. Reset Form Data:
    - Clear all fields
    - Reset to empty state
    ↓
15. 🔄 Refresh Enquiries List:
    fetchAllEnquiries() → Re-fetch from API
    ↓
16. UI Updates:
    - New enquiry in table
    - Analytics chart updates
    - Badge counts update
    - Scroll to top of list
    ↓
17. ⏰ Reminder Scheduled (if Week/Action time set):
    ┌─────────────────────────────────────────────────┐
    │ 🔔 ALERT SYSTEM - Kya Hoga Reminder Time Par:  │
    │                                                 │
    │ 1. Exact time aane par:                         │
    │    • GlobalReminderService trigger hogi         │
    │    • Popup modal screen par aayega              │
    │                                                 │
    │ 2. Popup Content:                               │
    │    • Client Name                                │
    │    • Phone Number                               │
    │    • Product Type                               │
    │    • Location                                   │
    │    • Case Status                                │
    │    • Major Comments                             │
    │    • Action Plan                                │
    │    • All enquiry details                        │
    │                                                 │
    │ 3. Sound Notification:                          │
    │    • 🔊 Audio alert play hoga                   │
    │    • Full volume (1.0)                          │
    │    • Attention grabbing sound                   │
    │                                                 │
    │ 4. Popup Actions:                               │
    │    • "Mark as Done" button                      │
    │    • "Snooze" button (optional)                 │
    │    • "Close" button                             │
    │                                                 │
    │ 5. Dual Storage Guarantee:                      │
    │    • Stored in database (via API)               │
    │    • Backup in localStorage                     │
    │    • Agar API fail bhi ho, local trigger hoga   │
    │                                                 │
    │ ⚠️ Important:                                    │
    │ Browser open rehna chahiye reminder time par!   │
    │ Background notification nahi hoga (web app)     │
    └─────────────────────────────────────────────────┘
    ↓
18. ✅ Ready for Next Action

❌ ERROR HANDLING:
   • Network failure → Toast error + Stay in modal
   • Validation failure → Highlight fields
   • Reminder API failure → Local reminder + Warning toast
   • Duplicate entry → Toast error with message
   • Token missing → Redirect to login
```

### 3️⃣ **Lead Assignment Flow (Manual - Detailed)**

```
1. Admin Selects Enquiries via Checkboxes:
   ┌──────────────────────────────────────────┐
   │ Selection Rules:                         │
   │ • Can only select unassigned enquiries   │
   │ • Assigned enquiries → checkbox disabled │
   │ • Visual feedback on hover               │
   │ • Count displayed in button              │
   └──────────────────────────────────────────┘
    ↓
2. Click "Assign (X)" Button
   (X = number of selected enquiries)
    ↓
3. Validation Check:
   selectedEnquiries.length === 0?
    ↓
    YES → 🚫 Toast Error: "Please select enquiries to assign"
           → Stop process
    ↓
    NO → Continue
    ↓
4. 📂 Assignment Modal Opens (showAssignmentModal = true)
   ┌──────────────────────────────────────────┐
   │ Modal Header:                            │
   │ • Title: "Assign Leads to Employee"      │
   │ • UserPlus icon                          │
   │ • Close button (X)                       │
   └──────────────────────────────────────────┘
   ┌──────────────────────────────────────────┐
   │ Modal Body Displays:                     │
   │                                          │
   │ 1. Selected Count Info:                  │
   │    "{X} enquiries selected for assign"   │
   │                                          │
   │ 2. Employee Dropdown:                    │
   │    - Label: "Select Employee *"          │
   │    - Options: All available employees    │
   │    - Format: "Name - Email"              │
   │    - Empty state msg if no employees     │
   │                                          │
   │ 3. Priority Level Dropdown:              │
   │    - Low (default)                       │
   │    - Medium                              │
   │    - High                                │
   │    - Urgent                              │
   │                                          │
   │ 4. Assignment Notes (Textarea):          │
   │    - Placeholder: "Add instructions..."  │
   │    - Optional field                      │
   │    - Multi-line input                    │
   └──────────────────────────────────────────┘
    ↓
5. Admin Fills Assignment Form:
   • Selects employee from dropdown
   • Chooses priority level
   • Adds optional notes
    ↓
6. Click "Assign Leads" Button
    ↓
7. Validation:
   !selectedEmployee?
    ↓
    YES → 🚫 Toast Error: "Please select an employee"
           → Stay in modal
    ↓
    NO → Continue
    ↓
8. Check Admin Token:
   adminToken = localStorage.getItem('adminToken')
   !adminToken?
    ↓
    YES → 🚫 Toast Error: "Admin token not found"
           → Stop process
    ↓
    NO → Continue
    ↓
9. Format Enquiries Data:
   For each selectedEnquiry:
   ┌──────────────────────────────────────────┐
   │ Find enquiry in current data             │
   │ Determine type:                          │
   │ • sourceType === 'manual'                │
   │   → enquiryType: 'ManualInquiry'         │
   │ • sourceType === 'user'                  │
   │   → enquiryType: 'Inquiry'               │
   │                                          │
   │ Create object:                           │
   │ {                                        │
   │   enquiryId: enquiry._id,                │
   │   enquiryType: 'ManualInquiry'/'Inquiry' │
   │ }                                        │
   └──────────────────────────────────────────┘
    ↓
10. Prepare Assignment Payload:
    {
      enquiries: [
        { enquiryId: "id1", enquiryType: "ManualInquiry" },
        { enquiryId: "id2", enquiryType: "Inquiry" }
      ],
      employeeId: "selected_employee_id",
      priority: "medium",
      notes: "Follow up within 2 days"
    }
    ↓
11. 📤 API CALL:
    POST ${API_BASE_URL}/admin/leads/assign
    Headers: {
      Authorization: Bearer ${adminToken},
      Content-Type: application/json
    }
    Body: { ...assignmentData }
    ↓
12. ✅ SUCCESS Response:
    {
      success: true,
      message: "Successfully assigned X enquiries",
      data: {
        assignments: [...],
        errors: []
      }
    }
    ↓
13. 🎉 Toast Success:
    "Successfully assigned {count} enquiries"
    ↓
14. Cleanup & Refresh:
    - Clear selection: setSelectedEnquiries([])
    - Close modal: closeAssignmentModal()
    - Reset form fields
    - Refresh list: fetchAllEnquiries()
    ↓
15. UI Updates:
    - Assigned enquiries show employee info
    - Status badges update
    - Checkboxes become disabled
    - Assignment details visible in table
    ↓
16. ✅ Ready for Next Action

❌ ERROR HANDLING:
   • No employee selected → Toast + Stay in modal
   • No admin token → Toast + Close modal
   • API failure → Toast error + Stay in modal
   • Partial assignment failure → Toast with details
   • Network error → Toast + Retry option
```

### 4️⃣ **Auto Assignment Flow (Role-Based - Detailed)**

```
1. Admin Selects Multiple Enquiries (Checkboxes)
    ↓
2. Click "Auto Assign (X)" Button
   (X = number of selected enquiries)
    ↓
3. 📂 Auto Assignment Modal Opens
   (showAutoAssignModal = true)
   ┌──────────────────────────────────────────┐
   │ Modal Header:                            │
   │ • Title: "Auto Assign Enquiries"         │
   │ • Target icon                            │
   │ • Close button (X)                       │
   └──────────────────────────────────────────┘
   ┌──────────────────────────────────────────┐
   │ Info Alert Box:                          │
   │ "Selected Enquiries: {X} unassigned      │
   │  enquiries will be distributed equally   │
   │  among employees of the selected roles." │
   └──────────────────────────────────────────┘
    ↓
4. Display Roles Selection:
   ┌──────────────────────────────────────────┐
   │ For each role in system:                 │
   │ ☐ Sales Executive (5 employees)          │
   │ ☐ Marketing Manager (3 employees)        │
   │ ☐ Customer Support (7 employees)         │
   │                                          │
   │ Features:                                │
   │ • Checkbox for each role                 │
   │ • Shows employee count per role          │
   │ • Multiple role selection allowed        │
   └──────────────────────────────────────────┘
    ↓
5. Admin Selects Role(s)
    ↓
6. 📊 Assignment Preview Shows:
   ┌──────────────────────────────────────────┐
   │ Based on selection:                      │
   │ • Total employees in selected roles      │
   │ • Distribution logic:                    │
   │   - Base assignments per employee        │
   │   - Extra assignments calculation        │
   │                                          │
   │ Example:                                 │
   │ "8 employees will receive assignments:   │
   │  • 3 employees get 3 enquiries each      │
   │  • 5 employees get 2 enquiries each"     │
   └──────────────────────────────────────────┘
    ↓
7. Click "Auto Assign" Button
    ↓
8. Validation Checks:
   A) selectedRoles.length === 0?
      ↓
      YES → 🚫 Toast Error: "Please select at least one role"
             → Stop process
      ↓
      NO → Continue
   
   B) Get employees from selected roles:
      roleEmployees = employees.filter(
        emp => selectedRoles.includes(emp.role?._id)
      )
      
      roleEmployees.length === 0?
      ↓
      YES → 🚫 Toast Error: "No employees found for selected roles"
             → Stop process
      ↓
      NO → Continue
   
   C) Get unassigned enquiries:
      unassignedEnquiries = enquiries.filter(
        e => selectedEnquiries.includes(e._id) && 
             e.assignment === null
      )
      
      unassignedEnquiries.length === 0?
      ↓
      YES → 🚫 Toast Error: "No unassigned enquiries selected"
             → Stop process
      ↓
      NO → Continue
    ↓
9. 📐 Calculate Distribution:
   ┌──────────────────────────────────────────┐
   │ employeeCount = roleEmployees.length     │
   │ totalEnquiries = unassignedEnquiries.len │
   │                                          │
   │ baseAssignments = floor(total/employees) │
   │ extraAssignments = total % employees     │
   │                                          │
   │ Distribution Logic:                      │
   │ • First {extra} employees get base+1     │
   │ • Remaining employees get base           │
   │                                          │
   │ Example: 23 enquiries, 8 employees       │
   │ • baseAssignments = 2                    │
   │ • extraAssignments = 7                   │
   │ • 7 employees get 3 enquiries            │
   │ • 1 employee gets 2 enquiries            │
   └──────────────────────────────────────────┘
    ↓
10. Build Assignments Array:
    For each employee (with index):
    ┌──────────────────────────────────────────┐
    │ enquiriesToAssign =                      │
    │   baseAssignments +                      │
    │   (index < extraAssignments ? 1 : 0)     │
    │                                          │
    │ For each enquiry to assign:              │
    │ {                                        │
    │   enquiryId: enquiry._id,                │
    │   enquiryType: sourceType === 'user'     │
    │                ? 'Inquiry'               │
    │                : 'ManualInquiry',        │
    │   employeeId: employee._id,              │
    │   priority: 'medium',                    │
    │   notes: "Auto-assigned based on role:   │
    │           {role.name}"                   │
    │ }                                        │
    └──────────────────────────────────────────┘
    ↓
11. Group by Employee:
    ┌──────────────────────────────────────────┐
    │ For efficient bulk assignment:           │
    │ {                                        │
    │   employeeId1: {                         │
    │     employeeId: "id1",                   │
    │     enquiries: [                         │
    │       {enquiryId, enquiryType}, ...      │
    │     ],                                   │
    │     priority: "medium",                  │
    │     notes: "Auto-assigned..."            │
    │   },                                     │
    │   employeeId2: { ... }                   │
    │ }                                        │
    └──────────────────────────────────────────┘
    ↓
12. 📤 Parallel API Calls:
    For each employee assignment:
    ┌──────────────────────────────────────────┐
    │ POST ${API_BASE_URL}/admin/leads/assign  │
    │ Headers: {                               │
    │   Authorization: Bearer ${adminToken}    │
    │ }                                        │
    │ Body: {                                  │
    │   enquiries: [...],                      │
    │   employeeId: "id",                      │
    │   priority: "medium",                    │
    │   notes: "Auto-assigned..."              │
    │ }                                        │
    └──────────────────────────────────────────┘
    
    Use Promise.allSettled() to handle all
    ↓
13. Process Results:
    ┌──────────────────────────────────────────┐
    │ For each result:                         │
    │ • fulfilled + success → Count success    │
    │ • rejected → Count failure + Log error   │
    │ • partial success → Count both           │
    │                                          │
    │ Track:                                   │
    │ - totalSuccessCount                      │
    │ - totalFailureCount                      │
    │ - allErrors array                        │
    └──────────────────────────────────────────┘
    ↓
14. Show Results:
    A) totalSuccessCount > 0?
       ↓
       🎉 Toast Success:
       "Successfully auto-assigned {count} enquiries to employees"
    
    B) totalFailureCount > 0?
       ↓
       🚫 Toast Error:
       "Failed to assign {count} enquiries: {firstError}"
    ↓
15. Cleanup:
    - Clear selection: setSelectedEnquiries([])
    - Clear role selection: setSelectedRoles([])
    - Close modal: setShowAutoAssignModal(false)
    - Refresh list: fetchAllEnquiries()
    ↓
16. UI Updates:
    - All assigned enquiries show employee details
    - Status badges update with colors
    - Checkboxes become disabled
    - Distribution visible in table
    ↓
17. ✅ Ready for Next Action

❌ ERROR HANDLING:
   • No roles selected → Toast + Stay in modal
   • No employees in roles → Toast + Show error
   • No admin token → Toast + Close modal
   • Partial failures → Toast with count + details
   • All failures → Toast error + Retry option
   • Network error → Toast + Keep modal open
```

### 5️⃣ **Follow-up Creation Flow (Complete)**

```
1. Admin clicks "Follow Up" button on any enquiry
    ↓
2. System Detects Enquiry Type:
   ┌──────────────────────────────────────────┐
   │ Check if Manual Enquiry:                 │
   │ isManualEnquiry = !enquiry.buyerId &&    │
   │                   !enquiry.propertyId && │
   │                   enquiry.clientName     │
   │                                          │
   │ IF Manual Enquiry:                       │
   │   leadType: "ManualInquiry"              │
   │   leadId: enquiry._id                    │
   │   leadData: {                            │
   │     clientName, phone, email,            │
   │     propertyType, location               │
   │   }                                      │
   │                                          │
   │ IF Client Enquiry:                       │
   │   leadType: "Inquiry"                    │
   │   leadId: enquiry._id                    │
   │   leadData: {                            │
   │     clientName: buyerId.fullName,        │
   │     phone: buyerId.phone,                │
   │     email: buyerId.email,                │
   │     propertyType: propertyId.type,       │
   │     location: propertyId.location        │
   │   }                                      │
   └──────────────────────────────────────────┘
    ↓
3. Set Selected Lead State:
   setSelectedLead({
     leadId, leadType, leadData, enquiry
   })
    ↓
4. 📂 Open Follow-up Modal (FollowUpModal component)
   showFollowUpModal = true
   ┌──────────────────────────────────────────┐
   │ Modal Pre-fills Data:                    │
   │ • Client Name                            │
   │ • Phone Number                           │
   │ • Email                                  │
   │ • Property Type                          │
   │ • Location                               │
   │ • Lead Type (hidden)                     │
   │ • Lead ID (hidden)                       │
   └──────────────────────────────────────────┘
    ↓
5. Admin Fills Follow-up Form:
   • Follow-up Date (date picker)
   • Follow-up Time (time picker)
   • Priority (Low/Medium/High)
   • Follow-up Notes (textarea)
   • Status (optional)
    ↓
6. Click "Create Follow-up" Button
    ↓
7. Form Validation in FollowUpModal:
   ✅ Date & time filled?
   ✅ Notes provided?
    ↓
8. Prepare Follow-up Data:
   {
     leadId: selectedLead.leadId,
     leadType: selectedLead.leadType,
     followUpDate: "YYYY-MM-DD",
     followUpTime: "HH:mm",
     priority: "medium",
     notes: "Follow up with client",
     clientName: leadData.clientName,
     phone: leadData.phone,
     status: "pending"
   }
    ↓
9. 📤 API CALL (from FollowUpModal):
   POST ${API_BASE_URL}/employee/follow-ups/create
   Headers: {
     Authorization: Bearer ${token}
   }
   Body: { ...followUpData }
    ↓
10. ✅ SUCCESS Response
    ↓
11. Callback to Parent:
    onFollowUpCreated(followUpData)
    ↓
12. 🎉 Toast Success:
    "Follow-up created successfully!"
    ↓
13. Close Modal & Cleanup:
    - Close modal: setShowFollowUpModal(false)
    - Clear selected lead: setSelectedLead(null)
    - Refresh enquiries: fetchAllEnquiries()
    ↓
14. ✅ Follow-up Scheduled

❌ ERROR HANDLING:
   • Validation failure → Toast + Highlight fields
   • API failure → Toast error + Stay in modal
   • No authentication → Toast + Redirect
   • Network error → Toast + Retry option
```

### 6️⃣ **Reminder Creation Flow (Manual - Complete)**

```
1. Admin clicks "Reminder" button (Bell icon)
    ↓
2. Extract Client Details:
   ┌──────────────────────────────────────────┐
   │ IF Manual Enquiry:                       │
   │   name = enquiry.clientName              │
   │   email = enquiry.email                  │
   │   phone = enquiry.contactNumber          │
   │   location = enquiry.location            │
   │                                          │
   │ IF Client Enquiry:                       │
   │   name = buyerId.fullName                │
   │   email = buyerId.email                  │
   │   phone = buyerId.phone                  │
   │   location = city + state                │
   └──────────────────────────────────────────┘
    ↓
3. 🔊 Play Sound Notification:
   setTimeout(() => playReminderSound(), 100)
   ┌──────────────────────────────────────────┐
   │ audioRef.current.volume = 1.0            │
   │ audioRef.current.currentTime = 0         │
   │ audioRef.current.play()                  │
   └──────────────────────────────────────────┘
    ↓
4. 📂 Open Reminder Modal:
   setReminderModal({
     isOpen: true,
     data: {
       enquiryId, name, email, phone, location,
       date: '', hour: '1', minute: '00',
       period: 'AM', note: ''
     }
   })
   ┌──────────────────────────────────────────┐
   │ Modal Displays:                          │
   │ • Name (pre-filled, editable)            │
   │ • Email (pre-filled, editable)           │
   │ • Phone (pre-filled, editable)           │
   │ • Location (pre-filled, editable)        │
   │ • Date Picker (required)                 │
   │ • Time Selectors:                        │
   │   - Hour (1-12 dropdown)                 │
   │   - Minute (00-59 dropdown)              │
   │   - Period (AM/PM dropdown)              │
   │ • Note (textarea)                        │
   └──────────────────────────────────────────┘
    ↓
5. Admin Sets Reminder Details:
   • Select date (future date)
   • Select hour (1-12)
   • Select minute (00-59)
   • Select period (AM/PM)
   • Add optional note
    ↓
6. Click "Save" Button
    ↓
7. Validation:
   !date || !hour || !minute?
    ↓
    YES → 🚫 Toast Error:
          "Please fill in the date and time fields"
          (3000ms auto-close)
          → Stay in modal
    ↓
    NO → Continue
    ↓
8. Time Conversion (12hr → 24hr):
   ┌──────────────────────────────────────────┐
   │ Parse date components:                   │
   │ [year, month, day] = date.split('-')     │
   │                                          │
   │ Convert to 24-hour format:               │
   │ • If PM && hour !== 12: hours += 12      │
   │ • If AM && hour === 12: hours = 0        │
   │                                          │
   │ Example Conversions:                     │
   │ • 10:30 AM → 10:30                       │
   │ • 12:00 PM → 12:00                       │
   │ • 1:00 PM → 13:00                        │
   │ • 12:00 AM → 00:00                       │
   └──────────────────────────────────────────┘
    ↓
9. Build ISO String (Local Time):
   ┌──────────────────────────────────────────┐
   │ Pad values:                              │
   │ • month: padStart(2, '0')                │
   │ • day: padStart(2, '0')                  │
   │ • hours: padStart(2, '0')                │
   │ • minutes: padStart(2, '0')              │
   │                                          │
   │ Format: YYYY-MM-DDTHH:mm:00.000Z         │
   │ Example: "2025-12-25T14:30:00.000Z"      │
   │                                          │
   │ ⚠️ Note: This is LOCAL time, not UTC!   │
   │          Will ring at exact local time   │
   └──────────────────────────────────────────┘
    ↓
10. Prepare Reminder Request:
    {
      name: reminderModal.data.name,
      email: reminderModal.data.email,
      phone: reminderModal.data.phone,
      location: reminderModal.data.location,
      comment: reminderModal.data.note || 
               "Reminder from Enquiries Page",
      reminderDateTime: isoString,
      title: "Reminder for {name}",
      status: "pending"
    }
    ↓
11. Get Authentication Token:
    token = localStorage.getItem('token') ||
            localStorage.getItem('employeeToken') ||
            localStorage.getItem('adminToken')
    ↓
12. 📤 API CALL:
    POST ${API_BASE_URL}/employee/reminders/create
    Headers: {
      Authorization: Bearer ${token},
      Content-Type: application/json
    }
    Body: { ...requestData }
    ↓
13. ✅ SUCCESS Response:
    {
      success: true,
      message: "Reminder created successfully",
      data: {
        _id, reminderDateTime, status, title
      }
    }
    ↓
14. 🎉 Toast Success:
    "Reminder created successfully!"
    (3000ms auto-close)
    ↓
15. Close Modal:
    closeReminderModal()
    - isOpen: false
    - data: null
    ↓
16. ⏰ Reminder Scheduled:
    Will trigger via GlobalReminderService
    at exact local time
    ↓
17. ✅ Ready for Next Action

❌ ERROR HANDLING:
   • Date/time missing → Toast + Stay in modal
   • Invalid date format → Toast error
   • No auth token → Toast + Redirect
   • API failure → Toast error
   • Network error → Toast + Retry option
```

### 7️⃣ **Lead Unassignment Flow (Complete)**

```
1. Admin finds assigned enquiry in table
   (Shows employee details in "Assigned Employee" column)
    ↓
2. Click "Unassign" button (X icon, red color)
   (Button only visible if enquiry is assigned)
    ↓
3. Determine Enquiry Type:
   enquiryType = enquiry.sourceType === 'manual'
                 ? 'ManualInquiry'
                 : 'Inquiry'
    ↓
4. Check Admin Token:
   adminToken = localStorage.getItem('adminToken')
   !adminToken?
    ↓
    YES → 🚫 Toast Error: "Admin token not found"
           → Stop process
    ↓
    NO → Continue
    ↓
5. Prepare Unassignment Data:
   {
     enquiryId: enquiry._id,
     enquiryType: enquiryType
   }
    ↓
6. 📤 API CALL:
   POST ${API_BASE_URL}/admin/leads/unassign
   Headers: {
     Authorization: Bearer ${adminToken}
   }
   Body: {
     enquiryId, enquiryType
   }
    ↓
7. ✅ SUCCESS Response:
   {
     success: true,
     message: "Lead unassigned successfully"
   }
    ↓
8. 🎉 Toast Success:
   "Lead unassigned successfully"
    ↓
9. Refresh Enquiries:
   fetchAllEnquiries()
    ↓
10. UI Updates:
    - Assignment details removed
    - "Not Assigned" text shows
    - Checkbox becomes enabled
    - Row becomes selectable again
    - Unassign button disappears
    ↓
11. ✅ Lead Available for Reassignment

❌ ERROR HANDLING:
   • No admin token → Toast error + Stop
   • API failure → Toast error + No change
   • Network error → Toast + Retry option
   • Already unassigned → Toast warning
```

### 8️⃣ **Filter & Pagination Flow**

```
FILTER FLOW:
1. User clicks filter dropdown
    ↓
2. Options:
   • All Sources (default)
   • Manually Added
   • Client Enquiries
    ↓
3. On selection:
   setFilter(selectedValue)
    ↓
4. Conditional Rendering:
   ┌──────────────────────────────────────────┐
   │ IF filter === 'all':                     │
   │   → Show both Client & Manual tables     │
   │   → Separate pagination for each         │
   │                                          │
   │ IF filter === 'user':                    │
   │   → Show only Client Enquiries table     │
   │   → Single pagination                    │
   │                                          │
   │ IF filter === 'manual':                  │
   │   → Show only Manual Enquiries table     │
   │   → Single pagination                    │
   └──────────────────────────────────────────┘
    ↓
5. Tables re-render with filtered data
    ↓
6. Pagination resets to page 1

PAGINATION FLOW:
1. Calculate Total Pages:
   ┌──────────────────────────────────────────┐
   │ For User Enquiries:                      │
   │ totalPages = ceil(userEnquiries.len / 10)│
   │                                          │
   │ For Manual Enquiries:                    │
   │ totalPages = ceil(manualEnq.len / 10)    │
   │                                          │
   │ itemsPerPage = 10 (configurable)         │
   └──────────────────────────────────────────┘
    ↓
2. Calculate Current Page Data:
   ┌──────────────────────────────────────────┐
   │ startIndex = (currentPage - 1) * 10      │
   │ endIndex = startIndex + 10               │
   │                                          │
   │ paginatedData = enquiries.slice(         │
   │   startIndex, endIndex                   │
   │ )                                        │
   └──────────────────────────────────────────┘
    ↓
3. Render Pagination UI:
   ┌──────────────────────────────────────────┐
   │ Info Section:                            │
   │ "Showing X-Y of Z enquiries"             │
   │                                          │
   │ Navigation:                              │
   │ [<Prev] [1] [2] [3] [4] [Next>]          │
   │                                          │
   │ Features:                                │
   │ • Current page highlighted (active)      │
   │ • Prev disabled on page 1                │
   │ • Next disabled on last page             │
   │ • Click number to jump to page           │
   │ • SVG icons for arrows                   │
   └──────────────────────────────────────────┘
    ↓
4. User Clicks Page Number or Prev/Next:
    ↓
5. Event Handlers:
   ┌──────────────────────────────────────────┐
   │ onClick with preventDefault():           │
   │ e.preventDefault()                       │
   │ e.stopPropagation()                      │
   │                                          │
   │ Update state:                            │
   │ setUserEnquiriesPage(newPage)            │
   │ OR                                       │
   │ setManualEnquiriesPage(newPage)          │
   │                                          │
   │ No page jump - smooth transition         │
   └──────────────────────────────────────────┘
    ↓
6. Table re-renders with new page data
    ↓
7. Pagination info updates
    ↓
8. Selection preserved if switching pages
```

---

## 🔌 Complete API Integration Guide

### 🌐 Base Configuration
```javascript
// API Base URL
const API_BASE_URL = "https://abc.bhoomitechzone.us"

// Import in component
import { API_BASE_URL } from "../../config/apiConfig.jsx";

// Authentication Tokens (from localStorage)
const adminToken = localStorage.getItem('adminToken');
const employeeToken = localStorage.getItem('employeeToken');
const token = localStorage.getItem('token');
```

---

### 📥 **GET Endpoints (Read Operations)**

#### 1️⃣ Get User/Client Enquiries
```javascript
// Endpoint
GET ${API_BASE_URL}/api/inquiry/get-enquiries

// Where Used in Code
fetchAllEnquiries() → Line ~160

// Headers
No authentication required

// Query Parameters
None

// Response Structure
{
  "success": true,
  "data": [
    {
      "_id": "67654abc12345def67890abc",
      "buyerId": {
        "_id": "buyer_id_123",
        "fullName": "Rajesh Kumar",
        "email": "rajesh@email.com",
        "phone": "9876543210",
        "city": "Mumbai",
        "state": "Maharashtra"
      },
      "propertyId": {
        "_id": "property_id_456",
        "propertyType": "Residential",
        "residentialType": "Apartment",
        "propertyLocation": "Andheri West, Mumbai",
        "areaDetails": "1200",
        "price": 5000000,
        "availability": "Immediate",
        "furnishingStatus": "Semi-Furnished",
        "purpose": "Sale"
      },
      "ownerId": {
        "_id": "owner_id_789",
        "fullName": "Priya Sharma",
        "email": "priya@email.com",
        "phone": "9123456789",
        "city": "Mumbai",
        "state": "Maharashtra"
      },
      "status": "pending",
      "createdAt": "2025-12-20T10:30:00.000Z",
      "updatedAt": "2025-12-20T10:30:00.000Z",
      "assignment": {
        "employeeId": "employee_id_001",
        "employeeName": "Amit Verma",
        "employeeEmail": "amit@company.com",
        "assignedDate": "2025-12-20T11:00:00.000Z",
        "status": "active",
        "priority": "medium"
      }
    }
  ]
}

// Data Processing in Code
• Add sourceType: 'user' flag
• Normalize buyer/property data
• Handle null/undefined values with 'N/A'
• Map to consistent structure for table display

// Error Handling
try {
  const response = await axios.get(endpoint);
  // Process data...
} catch (error) {
  console.error("Error fetching user enquiries:", error);
  setError("Failed to fetch enquiries");
}
```

#### 2️⃣ Get Manual Enquiries
```javascript
// Endpoint
GET ${API_BASE_URL}/api/inquiry/all

// Where Used in Code
fetchAllEnquiries() → Line ~160

// Headers
No authentication required

// Query Parameters
None

// Response Structure
{
  "success": true,
  "data": [
    {
      "_id": "67654xyz98765abc12345def",
      "s_No": 6,
      "clientName": "Priya Patel",
      "contactNumber": "9988776655",
      "ClientCode": "CC006",
      "ProjectCode": "PC006",
      "productType": "Residential",
      "location": "Juhu, Mumbai",
      "date": "2025-12-20",
      "caseStatus": "Open",
      "source": "OLX",
      "majorComments": "Looking for 3BHK flat near beach",
      "address": "Near Juhu Beach, Mumbai 400049",
      "weekOrActionTaken": "Dec 25, 2025, 10:30 AM",
      "actionPlan": "Call for site visit details",
      "referenceBy": "",
      "createdAt": "2025-12-20T11:00:00.000Z",
      "updatedAt": "2025-12-20T11:00:00.000Z",
      "assignment": {
        "employeeId": "employee_id_002",
        "employeeName": "Neha Singh",
        "employeeEmail": "neha@company.com",
        "assignedDate": "2025-12-20T12:00:00.000Z",
        "status": "pending",
        "priority": "high"
      }
    }
  ]
}

// Data Processing in Code
• Add sourceType: 'manual' flag
• Create virtual propertyId/buyerId from manual data
• Map to consistent structure for table display
• Handle optional fields with fallbacks

// Error Handling
Same as User Enquiries endpoint
```

#### 3️⃣ Get Available Employees (Admin Only)
```javascript
// Endpoint
GET ${API_BASE_URL}/admin/leads/available-employees

// Where Used in Code
fetchAvailableEmployees() → Line ~220

// Headers
{
  "Authorization": "Bearer ${adminToken}"
}

// Query Parameters
None

// Response Structure
{
  "success": true,
  "data": [
    {
      "_id": "employee_id_001",
      "name": "Amit Verma",
      "email": "amit@company.com",
      "phone": "9876543210",
      "role": {
        "_id": "role_id_123",
        "name": "Sales Executive",
        "permissions": ["view_leads", "create_leads"]
      },
      "assignedLeadsCount": 5,
      "status": "active",
      "createdAt": "2025-11-15T08:00:00.000Z"
    },
    {
      "_id": "employee_id_002",
      "name": "Neha Singh",
      "email": "neha@company.com",
      "phone": "9123456789",
      "role": {
        "_id": "role_id_124",
        "name": "Marketing Manager",
        "permissions": ["view_leads", "assign_leads", "create_leads"]
      },
      "assignedLeadsCount": 3,
      "status": "active",
      "createdAt": "2025-11-20T09:30:00.000Z"
    }
  ]
}

// Where Data is Used
1. Assignment Modal - Employee dropdown
2. Auto Assignment - Role-based filtering
3. Display in assigned column

// Error Handling
if (response.data.success) {
  setEmployees(response.data.data);
  if (response.data.data.length === 0) {
    toast.info('No employees found. Create in Employee Management first.');
  }
} else {
  toast.error('Failed to fetch employees');
}

// Special Cases
• Empty employees → Show info toast
• No admin token → Skip fetch
• API failure → Show error toast
```

#### 4️⃣ Get All Roles (Admin Only)
```javascript
// Endpoint
GET ${API_BASE_URL}/admin/roles/

// Where Used in Code
fetchAvailableRoles() → Line ~370

// Headers
{
  "Authorization": "Bearer ${adminToken}"
}

// Query Parameters
None

// Response Structure
{
  "success": true,
  "data": [
    {
      "_id": "role_id_123",
      "name": "Sales Executive",
      "permissions": [
        "view_leads",
        "create_leads",
        "update_leads",
        "view_enquiries"
      ],
      "description": "Handles sales leads and client enquiries",
      "createdAt": "2025-10-01T10:00:00.000Z"
    },
    {
      "_id": "role_id_124",
      "name": "Marketing Manager",
      "permissions": [
        "view_leads",
        "create_leads",
        "assign_leads",
        "view_reports",
        "manage_campaigns"
      ],
      "description": "Manages marketing campaigns and lead distribution",
      "createdAt": "2025-10-01T10:30:00.000Z"
    },
    {
      "_id": "role_id_125",
      "name": "Customer Support",
      "permissions": [
        "view_leads",
        "view_enquiries",
        "create_followups"
      ],
      "description": "Handles customer queries and follow-ups",
      "createdAt": "2025-10-01T11:00:00.000Z"
    }
  ]
}

// Where Data is Used
1. Auto Assignment Modal - Role selection checkboxes
2. Display employee count per role
3. Filter employees by role

// Error Handling
if (!adminToken) {
  toast.error('Admin authentication required');
  return;
}

try {
  const response = await axios.get(endpoint, { headers });
  if (response.data.success) {
    setRoles(response.data.data || []);
  } else {
    toast.error('Failed to fetch roles');
  }
} catch (error) {
  console.error('Error fetching roles:', error);
  toast.error('Failed to fetch roles');
}
```

---

### 📤 **POST Endpoints (Create/Update Operations)**

#### 5️⃣ Create Manual Enquiry
```javascript
POST /api/inquiry/create
Content-Type: application/json
```

**Request Body:**
```json
{
  "s_No": 6,
  "clientName": "Priya Patel",
  "contactNumber": "9988776655",
  "ClientCode": "CC006",
  "ProjectCode": "PC006",
  "productType": "Residential",
  "location": "Juhu",
  "date": "2025-12-20",
  "caseStatus": "Open",
  "source": "OLX",
  "majorComments": "Looking for 3BHK flat",
  "address": "Near Juhu Beach, Mumbai",
  "weekOrActionTaken": "Dec 25, 2025, 10:30 AM",
  "actionPlan": "Call for details",
  "referenceBy": ""
}
```

**Response:**
```json
{
  "success": true,
  "message": "Enquiry created successfully",
  "data": {
    "_id": "new_enquiry_id",
    "s_No": 6,
    "clientName": "Priya Patel",
    "contactNumber": "9988776655",
    // ... rest of the data
    "createdAt": "2025-12-20T11:00:00.000Z"
  }
}
```

---

#### 6. Assign Leads to Employee (Manual)
```javascript
POST /admin/leads/assign
Headers: { Authorization: "Bearer <adminToken>" }
Content-Type: application/json
```

**Request Body:**
```json
{
  "enquiries": [
    {
      "enquiryId": "enquiry_id_1",
      "enquiryType": "ManualInquiry"  // or "Inquiry"
    },
    {
      "enquiryId": "enquiry_id_2",
      "enquiryType": "Inquiry"
    }
  ],
  "employeeId": "employee_id",
  "priority": "medium",  // "low", "medium", "high"
  "notes": "Follow up within 2 days"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully assigned 2 enquiries",
  "data": {
    "assignments": [
      {
        "_id": "assignment_id_1",
        "enquiryId": "enquiry_id_1",
        "employeeId": "employee_id",
        "priority": "medium",
        "status": "pending"
      }
    ],
    "errors": []
  }
}
```

---

#### 7. Unassign Lead
```javascript
POST /admin/leads/unassign
Headers: { Authorization: "Bearer <adminToken>" }
Content-Type: application/json
```

**Request Body:**
```json
{
  "enquiryId": "enquiry_id",
  "enquiryType": "ManualInquiry"  // or "Inquiry"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lead unassigned successfully"
}
```

---

#### 8. Create Reminder from Lead
```javascript
POST /employee/reminders/create-from-lead
Headers: { Authorization: "Bearer <token>" }
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Priya Patel",
  "email": "priya@email.com",
  "phone": "9988776655",
  "location": "Juhu, Mumbai",
  "reminderTime": "2025-12-25T10:30:00.000Z",
  "note": "Week/Action reminder for Priya Patel",
  "title": "Enquiry Reminder: Priya Patel",
  "productType": "Residential",
  "caseStatus": "Open",
  "source": "OLX",
  "majorComments": "Looking for 3BHK",
  "address": "Near Juhu Beach",
  "referenceBy": "",
  "clientCode": "CC006",
  "projectCode": "PC006",
  "serialNumber": "6",
  "enquiryId": "enquiry_id",
  "contactNumber": "9988776655"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reminder created successfully",
  "data": {
    "_id": "reminder_id",
    "reminderDateTime": "2025-12-25T10:30:00.000Z",
    "status": "pending",
    "title": "Enquiry Reminder: Priya Patel"
  }
}
```

---

#### 9. Create General Reminder
```javascript
POST /employee/reminders/create
Headers: { Authorization: "Bearer <token>" }
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Rajesh Kumar",
  "email": "rajesh@email.com",
  "phone": "9876543210",
  "location": "Bandra, Mumbai",
  "comment": "Reminder from Enquiries Page",
  "reminderDateTime": "2025-12-22T14:00:00.000Z",
  "title": "Reminder for Rajesh Kumar",
  "status": "pending"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reminder created successfully",
  "data": {
    "_id": "reminder_id",
    "reminderDateTime": "2025-12-22T14:00:00.000Z",
    "status": "pending"
  }
}
```

---

## � Alert & Notification System

### 📢 Toast Notifications (react-toastify)

#### Success Messages 🟢
```javascript
1. "Enquiry created successfully!"
   - Trigger: After successful enquiry creation
   - Position: top-right, Auto-close: 3000ms

2. "Week/Action reminder set successfully!"
   - Trigger: After reminder creation from enquiry
   - Position: top-right, Auto-close: 2000ms

3. "Successfully assigned {count} enquiries"
   - Trigger: After manual lead assignment
   - Dynamic count based on selected enquiries

4. "Lead unassigned successfully"
   - Trigger: After unassigning a lead

5. "Successfully auto-assigned {count} enquiries to employees"
   - Trigger: After auto assignment completion
   - Shows number of successful assignments

6. "Reminder created successfully!"
   - Trigger: After manual reminder creation
   - Position: top-right, Auto-close: 3000ms

7. "Follow-up created successfully!"
   - Trigger: After follow-up creation
```

#### Error Messages 🔴
```javascript
1. "Failed to create enquiry. Please try again."
   - Trigger: Enquiry creation API failure

2. "Please fill in the date and time fields"
   - Trigger: Reminder form validation failure

3. "Failed to create reminder. Please try again."
   - Trigger: Reminder API failure

4. "Failed to fetch employees. Make sure employees exist in the system."
   - Trigger: Employee fetch API failure

5. "Please select enquiries to assign"
   - Trigger: Assignment modal opened with no selection

6. "Please select an employee"
   - Trigger: Assignment submitted without employee selection

7. "Admin token not found"
   - Trigger: Missing admin authentication

8. "Failed to assign leads. Please try again."
   - Trigger: Lead assignment API failure

9. "Failed to unassign lead. Please try again."
   - Trigger: Unassignment API failure

10. "Admin authentication required"
    - Trigger: Role fetch without admin token

11. "Failed to fetch roles"
    - Trigger: Roles API failure

12. "Please select at least one role"
    - Trigger: Auto assign without role selection

13. "No employees found for the selected roles"
    - Trigger: Selected roles have no employees

14. "No unassigned enquiries selected"
    - Trigger: All selected enquiries are already assigned

15. "Failed to assign {count} enquiries: {error}"
    - Trigger: Partial/complete auto assignment failure
    - Shows specific error message

16. "Failed to auto-assign enquiries. Please try again."
    - Trigger: Auto assignment process failure
```

#### Info Messages ℹ️
```javascript
1. "No employees found. Please create employees in Employee Management first."
   - Trigger: Empty employees list
   - Guides user to create employees
```

#### Warning Messages ⚠️
```javascript
1. "Cannot select enquiries that are already assigned to an employee"
   - Trigger: Attempting to select assigned enquiry

2. "Enquiry created. Reminder will trigger locally. (API: {error})"
   - Trigger: Enquiry created but reminder API failed
   - Position: top-right, Auto-close: 4000ms
   - Fallback: Local reminder still created
```

### 🔊 Sound Notifications
```javascript
// Audio Element Setup
<audio ref={audioRef} preload="auto">
  <source src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />
  <source src="https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3" />
</audio>

// Plays when:
1. Reminder modal opens
2. Reminder popup appears (from GlobalReminderService)

// Features:
- Full volume (1.0)
- Resets to start (currentTime = 0)
- Error handling (silent fail if blocked)
- Multiple source fallbacks
```

### 🚨 Visual Alerts in Modals
```javascript
// Auto Assignment Modal - Info Alert
<div className="alert alert-info">
  Selected Enquiries: {count} unassigned enquiries will be distributed
  equally among employees of the selected roles.
</div>

// Assignment Preview Section
- Shows distribution logic
- Employee count per role
- Enquiries per employee calculation
- Warning if no employees found
```

---

## 📊 Key Features

### 1. **Dual Source Enquiries**
- **User Enquiries:** App se direct client submissions
- **Manual Enquiries:** Admin panel se manual entry

### 2. **Auto-Generation**
- **Serial Number (S.No):** Sequential auto-increment based on total count
- **Client Code:** CC001, CC002, CC003, etc. (auto-padded to 3 digits)
- **Project Code:** PC001, PC002, PC003, etc. (auto-padded to 3 digits)

### 3. **Lead Assignment**
- **Manual:** Specific employee ko specific enquiries assign karo
- **Auto:** Role-based automatic equal distribution
- **Unassign:** Assigned leads ko wapas unassign karo
- **Bulk Selection:** Checkbox system for multiple enquiries
- **Priority Levels:** Low/Medium/High/Urgent

### 4. **Filtering & Pagination**
- Filter by source: All, Manual, User
- Paginated display (10 items per page)
- Separate pagination for user and manual enquiries
- Page navigation with Prev/Next buttons
- Current page indicator with info text

### 5. **Reminder System**
- **Week/Action Reminders:** Enquiry creation ke sath automatic
- **Manual Reminders:** Kisi bhi enquiry ke liye custom reminder
- **Popup Notifications:** Sound + visual alert
- **Dual Storage:** API + Local Storage (guaranteed delivery)
- **12-hour format:** Time selection with AM/PM
- **Timezone handling:** Proper local time conversion

### 6. **Follow-up Management**
- Create follow-ups for any enquiry
- Automatically detects enquiry type (Manual/User)
- Pre-fills client information
- Links to original enquiry
- Uses FollowUpModal component

### 7. **Analytics Dashboard**
- Total enquiries count (real-time)
- Client vs Manual breakdown
- Visual chart representation (EnquiryChart component)
- Statistics badges in header

### 8. **Checkbox Selection System**
- Individual row selection
- Select All (only unassigned enquiries)
- Deselect All functionality
- Disabled state for assigned enquiries
- Visual feedback on hover
- Selection count in buttons

### 9. **Assignment Status Tracking**
- Employee Name (bold + green)
- Employee Email
- Status Badge (Active/Pending/Info)
- Assigned Date
- Priority Badge (color-coded)
- Unassign button (conditional)

---

## 🎨 UI Components

### Main Sections
1. **Header:** Statistics badges + Action buttons
2. **Chart Section:** Visual representation of enquiries
3. **Filter Dropdown:** Source-based filtering
4. **Enquiry Cards:** Individual enquiry details
5. **Modals:**
   - Add Enquiry Form
   - Assignment Modal (Manual)
   - Auto-Assignment Modal (Role-based)
   - Reminder Modal
   - Follow-up Modal

---

## 🔐 Authentication

### Required Tokens
```javascript
// Admin operations
const adminToken = localStorage.getItem('adminToken');

// Employee operations
const employeeToken = localStorage.getItem('employeeToken');

// General token
const token = localStorage.getItem('token');
```

### Headers
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## 🎯 Product Types
- Residential
- Commercial
- Plot
- Apartment
- Villa

## 📍 Sources
- Walk In
- OLX
- Just Dial
- Reference By

## 📈 Case Status Options
- Open
- Closed
- Week One
- Week Two
- Unassigned

## ⚡ Priority Levels
- Low
- Medium
- High

---

## 🔔 Reminder System Details

### Time Conversion
```javascript
// Input: datetime-local (YYYY-MM-DDTHH:mm)
// Example: "2025-12-25T10:30"

// Conversion Process:
1. Parse local datetime
2. Adjust for timezone offset
3. Convert to ISO string
4. Store in UTC format
5. Trigger at exact local time
```

### Dual Storage Strategy
1. **API Storage:** Primary database storage
2. **Local Storage:** Backup for guaranteed popup (if API fails)

### Popup Features
- 🔊 Sound notification
- 📋 Full enquiry details
- ⏰ Exact reminder time
- 🔗 Link to original enquiry

---

## 📱 Responsive Design
- Mobile-friendly cards
- Flexible grid layout
- Collapsible forms
- Touch-friendly buttons

---

## 🐛 Error Handling

```javascript
// API call with proper error handling
try {
  const response = await axios.get(endpoint);
  if (response.data.success) {
    // Success handling
    toast.success("Operation successful!");
  } else {
    toast.error(response.data.message);
  }
} catch (error) {
  console.error("Error:", error);
  toast.error("Failed to complete operation");
}
```

---

## 🧪 Testing API Endpoints

### Using Postman/Insomnia:

```bash
# 1. Get User Enquiries
GET https://abc.bhoomitechzone.us/api/inquiry/get-enquiries

# 2. Get Manual Enquiries
GET https://abc.bhoomitechzone.us/api/inquiry/all

# 3. Create Enquiry
POST https://abc.bhoomitechzone.us/api/inquiry/create
Body: {raw JSON with enquiry data}

# 4. Get Employees (Admin only)
GET https://abc.bhoomitechzone.us/admin/leads/available-employees
Headers: Authorization: Bearer YOUR_ADMIN_TOKEN

# 5. Assign Leads (Admin only)
POST https://abc.bhoomitechzone.us/admin/leads/assign
Headers: Authorization: Bearer YOUR_ADMIN_TOKEN
Body: {assignment data}
```

---

## 💡 Best Practices

1. **Always validate form data** before submission
2. **Use toast notifications** for user feedback
3. **Refresh lists** after CRUD operations
4. **Handle API errors gracefully**
5. **Store tokens securely** in localStorage
6. **Validate reminder times** before creating
7. **Log important operations** for debugging
8. **Test both enquiry types** (Manual & User)

---

## � Week/Action Reminder Alert System - Detailed Explanation

### 📋 Kya Hai Ye Feature?
Jab aap **Manual Enquiry create** karte ho aur **Week/Action Date & Time** field fill karte ho, to system automatically ek **reminder set** kar deta hai jo us exact time par **alert popup + sound** ke saath trigger hota hai.

### ⏰ Kaise Kaam Karta Hai?

#### Step 1: Enquiry Creation Time
```
Admin fills Week/Action Date & Time:
• Example: "25 Dec 2025, 10:30 AM"
• System creates enquiry ✅
• System creates reminder ✅ (automatic)
• Shows success toast ✅
```

#### Step 2: Reminder Storage (Dual Storage)
```
1. Database Storage:
   POST /employee/reminders/create-from-lead
   • Stores in backend database
   • Returns reminder ID
   • Status: 'pending'

2. LocalStorage Backup:
   globalReminderService.addLocalReminder()
   • Stores in browser localStorage
   • Guaranteed trigger even if API fails
   • Fallback mechanism
```

#### Step 3: Exact Time Par (25 Dec, 10:30 AM)
```
🔔 REMINDER TRIGGERS:

1. GlobalReminderService checks time every minute
2. Match found: Current time === Reminder time
3. Popup Modal Opens on Screen:

   ╔═══════════════════════════════════════════╗
   ║  🔔 REMINDER ALERT                        ║
   ╠═══════════════════════════════════════════╣
   ║                                           ║
   ║  📋 Enquiry Reminder: Priya Patel         ║
   ║                                           ║
   ║  👤 Client: Priya Patel                   ║
   ║  📞 Phone: 9988776655                     ║
   ║  📧 Email: priya@email.com                ║
   ║  📍 Location: Juhu, Mumbai                ║
   ║                                           ║
   ║  🏠 Product Type: Residential             ║
   ║  📊 Case Status: Open                     ║
   ║  🔍 Source: OLX                           ║
   ║                                           ║
   ║  💬 Comments: Looking for 3BHK near beach ║
   ║  📝 Action Plan: Call for site visit      ║
   ║                                           ║
   ║  🔢 Client Code: CC006                    ║
   ║  🔢 Project Code: PC006                   ║
   ║  #️⃣ Serial Number: 6                      ║
   ║                                           ║
   ║  [Mark as Done]  [Snooze]  [Close]       ║
   ║                                           ║
   ╚═══════════════════════════════════════════╝

4. 🔊 Sound Plays Simultaneously:
   • Audio: Alert notification sound
   • Volume: 100% (full)
   • Duration: 2-3 seconds
   • Multiple fallback audio sources

5. Browser Focus (if minimized):
   • Tab title blinks
   • Notification badge shows
```

### 🎯 Popup Features

#### Displayed Information:
```javascript
✅ Title: "Enquiry Reminder: {Client Name}"
✅ Client Name (pre-filled)
✅ Phone Number
✅ Email
✅ Location/Address
✅ Product Type (Residential/Commercial/etc)
✅ Case Status (Open/Closed/etc)
✅ Source (OLX/Walk In/Just Dial/Reference)
✅ Major Comments (full text)
✅ Action Plan (what to do)
✅ Reference By (if any)
✅ Client Code (CC###)
✅ Project Code (PC###)
✅ Serial Number
✅ Original Enquiry Link (to view full details)
```

#### Action Buttons:
```
1. "Mark as Done" Button:
   • Updates reminder status to 'completed'
   • Removes from pending reminders
   • Closes popup
   • Shows success toast

2. "Snooze" Button (if available):
   • Reschedules for later
   • Options: 10 min, 30 min, 1 hour
   • Keeps reminder active

3. "Close" Button:
   • Dismisses popup
   • Reminder stays in pending state
   • Will show again on refresh/reload
```

### 🔊 Sound Notification Details

```javascript
// Audio Configuration
Audio Sources:
1. Primary: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
2. Fallback: "https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3"

Settings:
• Volume: 1.0 (100%)
• Preload: "auto"
• CurrentTime: Reset to 0
• Play on: Popup open

Error Handling:
• Browser blocks audio? → Visual popup still shows
• No internet? → Uses fallback source
• Audio failed? → Silent mode, popup works
```

### ⚠️ Important Points

#### 1. Browser Must Be Open
```
⚠️ Web Application Limitation:
• Browser tab MUST be open at reminder time
• Background notifications NOT supported (web)
• If browser closed → Reminder won't trigger
• Solution: Keep tab open OR check manually

For Mobile App:
✅ Background notifications possible
✅ Push notifications work
✅ Even if app is closed
```

#### 2. Timezone Accuracy
```
✅ System automatically handles timezone
✅ Reminder triggers at EXACT local time
✅ Example:
   Set: "10:30 AM IST"
   Triggers: Exactly 10:30 AM IST
   Not affected by: Server timezone, UTC conversion
```

#### 3. Dual Storage Guarantee
```
Scenario 1: API Success
• Reminder saved in database ✅
• Also saved in localStorage ✅
• Both sources active

Scenario 2: API Failed
• Database save failed ❌
• localStorage backup works ✅
• Reminder still triggers!
• Warning toast shows

Result: 100% guarantee ki reminder trigger hoga!
```

#### 4. Popup Behavior
```
When Popup Shows:
• Z-index: 9999 (topmost layer)
• Overlay: Semi-transparent background
• Position: Center of screen
• Responsive: Works on all screen sizes
• Modal: Blocks background interaction
• Scrollable: If content is long

Multiple Reminders:
• Shows one at a time
• Queue system for multiple
• Priority-based display
```

### 🧪 Testing the Alert

#### Test Scenario:
```
1. Create Manual Enquiry
   Client Name: Test Client
   Week/Action: Today's date + 2 minutes from now
   
2. Click Save
   ✅ Enquiry created
   ✅ Reminder success toast shown
   
3. Wait for 2 minutes
   Keep browser tab open!
   
4. At exact time:
   🔔 Popup appears on screen
   🔊 Sound plays
   ✅ All details visible
   
5. Verification:
   • Check popup has all enquiry details
   • Verify sound played
   • Test "Mark as Done" button
   • Test "Close" button
```

### 📱 Mobile App Considerations

```
For Your Mobile App Implementation:

1. Use Push Notifications:
   ✅ Works even when app is closed
   ✅ Background notification service
   ✅ System notification tray
   
2. Local Notifications:
   ✅ Schedule local notification at reminder time
   ✅ No internet required
   ✅ Reliable trigger
   
3. Sound Notification:
   ✅ System notification sound
   ✅ Custom alert tone
   ✅ Vibration support
   
4. Popup/Alert:
   ✅ Full-screen alert (iOS)
   ✅ Notification banner (Android)
   ✅ In-app modal (if app is open)
   
5. Action Buttons:
   ✅ "Call Client" button (direct call)
   ✅ "View Details" button (open enquiry)
   ✅ "Mark Done" button
   ✅ "Snooze" button
```

### 🎨 Popup UI Preview (Web)

```css
/* Visual Appearance */
Modal Size: 500px width (desktop), 90% width (mobile)
Background: White (#ffffff)
Border: 1px solid #e0e0e0
Border Radius: 12px
Box Shadow: 0 4px 20px rgba(0,0,0,0.15)
Overlay: rgba(0,0,0,0.5)

Header:
• Background: Linear gradient (blue to purple)
• Icon: 🔔 Bell icon
• Title: Bold, 20px font
• Close button: Top-right corner (X)

Body:
• Padding: 24px
• Font: 14px, readable
• Line height: 1.6
• Icons: Before each field
• Colors: Label (gray), Value (black)

Footer:
• Buttons: Full width on mobile
• Primary button: Blue (#007bff)
• Secondary button: Gray (#6c757d)
• Spacing: 8px between buttons
```

### 🔍 Debugging Alert Issues

```
Issue: Popup not showing?

Check:
✅ Browser is open at reminder time?
✅ Console errors present?
✅ localStorage has reminder data?
✅ GlobalReminderService is running?
✅ Time conversion correct?
✅ Reminder status is 'pending'?

Fix:
1. Open browser console
2. Check: localStorage.getItem('reminders')
3. Verify: Reminder object exists
4. Check: reminderDateTime matches current time
5. Test: Manually trigger GlobalReminderService

Issue: Sound not playing?

Check:
✅ Browser allows autoplay?
✅ Volume not muted?
✅ Audio file accessible?
✅ No network error?

Fix:
1. Click anywhere on page first (user interaction)
2. Check browser autoplay policy
3. Test audio file URL directly
4. Use fallback audio source
```

---

## �🚀 Future Enhancements

- [ ] Bulk operations (delete, status update)
- [ ] Advanced search and filters
- [ ] Export to Excel/PDF
- [ ] Email notifications
- [ ] SMS integration
- [ ] WhatsApp business integration
- [ ] Call recording integration
- [ ] Property matching suggestions
- [ ] AI-powered lead scoring
- [ ] Conversion tracking

---

## 📞 Support

For any issues or queries related to the Enquiries system:
- Check browser console for detailed error logs
- Verify API endpoints are accessible
- Ensure proper authentication tokens
- Check network tab for failed requests

---

## 📊 Complete Feature Summary Table

| Feature | Manual Enquiries | Client Enquiries | API Endpoint | Alert Type |
|---------|-----------------|------------------|--------------|------------|
| **View Enquiries** | ✅ | ✅ | GET /api/inquiry/all, /get-enquiries | - |
| **Create Enquiry** | ✅ | ❌ (Auto from app) | POST /api/inquiry/create | Success Toast |
| **Auto-generation** | ✅ S.No, CC, PC | ❌ | - | - |
| **Filter Display** | ✅ | ✅ | - | - |
| **Pagination** | ✅ (10/page) | ✅ (10/page) | - | - |
| **Checkbox Selection** | ✅ | ✅ | - | Warning (if assigned) |
| **Manual Assignment** | ✅ | ✅ | POST /admin/leads/assign | Success/Error Toast |
| **Auto Assignment** | ✅ | ✅ | POST /admin/leads/assign (bulk) | Success/Error Toast |
| **Unassignment** | ✅ | ✅ | POST /admin/leads/unassign | Success/Error Toast |
| **Set Reminder** | ✅ | ✅ | POST /employee/reminders/create | Success/Error Toast + Sound |
| **Week/Action Reminder** | ✅ (auto) | ❌ | POST /employee/reminders/create-from-lead | Success/Warning Toast |
| **Follow-up** | ✅ | ✅ | POST /employee/follow-ups/create | Success Toast |
| **Assignment Status** | ✅ Show details | ✅ Show details | - | - |
| **Priority Levels** | ✅ (4 levels) | ✅ (4 levels) | - | - |
| **Analytics Chart** | ✅ | ✅ | - | - |
| **Sound Alerts** | ✅ | ✅ | - | Audio plays |
| **Local Storage Backup** | ✅ (reminders) | ✅ (reminders) | - | - |

---

## 🎯 Quick Integration Checklist for Mobile App

### ✅ Must Implement Features:
1. **Dual Enquiry Tables**
   - Client Enquiries (from app users)
   - Manual Enquiries (admin created)
   - Separate pagination (10 items/page)

2. **Auto-Generation System**
   - Serial Number: Based on total count
   - Client Code: CC + 3-digit number
   - Project Code: PC + 3-digit number

3. **Complete Assignment System**
   - Manual assignment with employee dropdown
   - Auto assignment with role selection
   - Distribution algorithm (equal split)
   - Unassign functionality
   - Priority levels (Low/Medium/High/Urgent)

4. **Reminder System**
   - Week/Action datetime (auto-create on enquiry)
   - Manual reminder creation (Bell button)
   - 12-hour time format (AM/PM)
   - Timezone-aware storage
   - Dual storage (API + Local)
   - Sound notification on trigger

5. **Follow-up System**
   - Detect enquiry type (Manual/User)
   - Pre-fill client details
   - Link to original enquiry
   - Date/time picker

6. **Toast Notifications**
   - All success messages (green)
   - All error messages (red)
   - Info messages (blue)
   - Warning messages (orange)
   - Positioned top-right
   - Auto-close (2-4 seconds)

7. **Filter & Selection**
   - Dropdown filter (All/Manual/User)
   - Checkbox selection (bulk operations)
   - Select All/Deselect All
   - Disabled state for assigned items

8. **Analytics Dashboard**
   - Total count badge
   - Client count badge
   - Manual count badge
   - Visual chart (pie/bar)

9. **Assignment Status Display**
   - Employee name (bold + green)
   - Employee email
   - Status badge (color-coded)
   - Assigned date
   - Priority badge (color-coded)

### 📱 Mobile-Specific Considerations:
- Responsive table design
- Touch-friendly buttons (min 44x44 dp)
- Swipe gestures for actions
- Pull-to-refresh for list
- Loading skeletons
- Offline mode support (localStorage)
- Push notifications for reminders
- Deep linking for enquiry details

### 🔐 Authentication Requirements:
- Admin token for:
  - Lead assignment
  - Lead unassignment
  - Fetch employees
  - Fetch roles
- Employee/General token for:
  - Create enquiry
  - Create reminder
  - Create follow-up
  - View enquiries

### 🛠️ API Integration Order:
1. **Setup**: Configure API_BASE_URL
2. **Initial Load**: Fetch enquiries + employees + roles
3. **Create**: Implement enquiry creation with auto-generation
4. **Assignment**: Manual + Auto assignment flows
5. **Reminders**: Week/Action + Manual reminder creation
6. **Follow-ups**: FollowUp modal integration
7. **Unassign**: Implement unassignment flow
8. **Filters**: Add filter dropdown logic
9. **Pagination**: Separate pagination for both tables
10. **Polish**: Toast notifications, sound alerts, loading states

---

## 🚨 Critical Points - DO NOT MISS

### ⚠️ Data Type Detection
```javascript
// MUST correctly identify enquiry type for API calls
const enquiryType = enquiry.sourceType === 'manual' 
  ? 'ManualInquiry'  // For manual enquiries
  : 'Inquiry';        // For client enquiries
```

### ⚠️ Timezone Handling
```javascript
// Week/Action Reminder - MUST adjust for timezone
const timezoneOffset = dateTimeObj.getTimezoneOffset();
const adjustedDate = new Date(dateTimeObj.getTime() - (timezoneOffset * 60 * 1000));
const isoString = adjustedDate.toISOString();
// This ensures reminder triggers at EXACT local time
```

### ⚠️ Assignment Validation
```javascript
// NEVER allow selection of already assigned enquiries
if (enquiry.assignment !== null) {
  toast.warn('Cannot select assigned enquiries');
  return; // Stop execution
}
```

### ⚠️ Auto-Generation Logic
```javascript
// MUST use enquiries.length for consistency
const nextSerial = enquiries.length;  // If 5 exist, next is 6
const nextClientCode = `CC${String(enquiries.length).padStart(3, '0')}`;
const nextProjectCode = `PC${String(enquiries.length).padStart(3, '0')}`;
```

### ⚠️ Dual Storage for Reminders
```javascript
// ALWAYS create local backup if API fails
try {
  await axios.post(reminderEndpoint, data);
} catch (error) {
  // Even if API fails, create local reminder
  globalReminderService.addLocalReminder(localData);
  toast.warning('Reminder will trigger locally');
}
```

---

## 📞 Support & Troubleshooting

### Common Issues & Solutions:

**Issue 1: Enquiries not loading**
- ✅ Check API_BASE_URL is correct
- ✅ Verify network connectivity
- ✅ Check browser console for errors
- ✅ Ensure backend server is running

**Issue 2: Auto-generation not working**
- ✅ Verify useEffect dependency: [showAddForm, enquiries]
- ✅ Check enquiries array has data
- ✅ Ensure state update is happening

**Issue 3: Assignment failing**
- ✅ Check adminToken in localStorage
- ✅ Verify employee exists in system
- ✅ Ensure enquiry is unassigned
- ✅ Check enquiryType is correct

**Issue 4: Reminders not triggering**
- ✅ Verify GlobalReminderService is running
- ✅ Check localStorage for reminder data
- ✅ Ensure datetime conversion is correct
- ✅ Verify browser allows audio playback

**Issue 5: Toast notifications not showing**
- ✅ Import ToastContainer in component
- ✅ Check react-toastify CSS is imported
- ✅ Verify toast.success/error calls
- ✅ Ensure no CSS z-index conflicts

---

**Last Updated:** December 20, 2025 (COMPLETE VERSION)  
**Version:** 3.0 - Full Feature Documentation  
**Maintained by:** GharPlot Admin Team  
**Documentation Type:** Production-Ready Implementation Guide

---

## ✨ What's Documented:
✅ ALL Features (19 major features)  
✅ ALL API Endpoints (9 endpoints with full details)  
✅ ALL Flows (8 complete flows with step-by-step)  
✅ ALL Alerts (20+ toast messages documented)  
✅ ALL Error Handling scenarios  
✅ ALL UI Components (tables, modals, buttons, forms)  
✅ ALL Data Transformations  
✅ ALL Integration Points  
✅ Mobile App Implementation Guide  
✅ Troubleshooting Section  
✅ Quick Reference Tables  

**📖 Total Documentation:** Complete & Production-Ready for Mobile App Integration!
