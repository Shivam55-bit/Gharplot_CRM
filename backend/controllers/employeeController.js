import Employee from "../models/employeeSchema.js";
import Role from "../models/roleSchema.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Create new employee
export const createEmployee = async (req, res) => {
  try {
    const { name, email, phone, role, password, department, address, giveAdminAccess } = req.body;

    // Check if employee with email already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: "Employee with this email already exists"
      });
    }

    // Verify role exists
    const roleExists = await Role.findById(role);
    if (!roleExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid role selected"
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Handle admin access - store the flag, admin access will be handled by frontend logic
    let finalRole = role;

    // Create new employee
    const newEmployee = new Employee({
      name,
      email,
      phone,
      role: finalRole,
      password: hashedPassword,
      department,
      address,
      giveAdminAccess: giveAdminAccess || false,
      createdBy: req.user?.id || null
    });

    const savedEmployee = await newEmployee.save();

    // Populate role information
    await savedEmployee.populate('role', 'name permissions');

    // Remove password from response
    const employeeResponse = savedEmployee.toObject();
    delete employeeResponse.password;

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: employeeResponse
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get all employees
export const getAllEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", roleFilter, isActive, department } = req.query;
    
    const query = {};
    
    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Add role filter
    if (roleFilter) {
      query.role = roleFilter;
    }

    // Add active filter
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Add department filter
    if (department) {
      query.department = { $regex: department, $options: 'i' };
    }

    const employees = await Employee.find(query)
      .populate('role', 'name permissions')
      .populate('createdBy', 'name email')
      .select('-password') // Exclude password from results
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Employee.countDocuments(query);

    res.status(200).json({
      success: true,
      data: employees,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalEmployees: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get employee by ID
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id)
      .populate('role', 'name permissions')
      .populate('createdBy', 'name email')
      .select('-password');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Update employee
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, department, address, isActive, giveAdminAccess, adminReminderPopupEnabled } = req.body;

    // Check if employee exists
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Check if new email conflicts with existing employees (excluding current employee)
    if (email && email !== employee.email) {
      const existingEmployee = await Employee.findOne({ 
        email,
        _id: { $ne: id }
      });
      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          message: "Employee with this email already exists"
        });
      }
    }

    // Handle admin access - store the flag, admin access will be handled by frontend logic
    let finalRole = role;

    // Verify role exists if role is being updated
    if (finalRole && finalRole !== employee.role.toString()) {
      const roleExists = await Role.findById(finalRole);
      if (!roleExists) {
        return res.status(400).json({
          success: false,
          message: "Invalid role selected"
        });
      }
    }

    // Prepare update data
    const updateData = {
      name,
      email,
      phone,
      role: finalRole,
      department,
      address,
      isActive,
      giveAdminAccess: giveAdminAccess || false,
      updatedAt: Date.now()
    };

    // Include adminReminderPopupEnabled if provided
    if (adminReminderPopupEnabled !== undefined) {
      updateData.adminReminderPopupEnabled = adminReminderPopupEnabled;
    }

    // Update employee
    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('role', 'name permissions').select('-password');

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: updatedEmployee
    });
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Delete employee
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if employee exists
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    await Employee.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Update employee password
export const updateEmployeePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword, currentPassword } = req.body;

    // Check if employee exists
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Verify current password if provided
    if (currentPassword) {
      const isValidPassword = await bcrypt.compare(currentPassword, employee.password);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect"
        });
      }
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await Employee.findByIdAndUpdate(id, {
      password: hashedPassword,
      updatedAt: Date.now()
    });

    res.status(200).json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Employee login
export const employeeLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if employee exists and is active
    const employee = await Employee.findOne({ email, isActive: true })
      .populate('role', 'name permissions isActive');
    
    if (!employee) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials or account inactive"
      });
    }

    // Check if role is active
    if (!employee.role.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your role has been deactivated. Please contact administrator."
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, employee.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Update last login
    await Employee.findByIdAndUpdate(employee._id, { lastLogin: Date.now() });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: employee._id,
        email: employee.email,
        role: employee.role._id,
        permissions: employee.role.permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from response
    const employeeResponse = employee.toObject();
    delete employeeResponse.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        employee: employeeResponse,
        token
      }
    });
  } catch (error) {
    console.error("Error during employee login:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get employee dashboard stats
export const getEmployeeDashboardStats = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ isActive: true });
    const inactiveEmployees = await Employee.countDocuments({ isActive: false });
    const totalRoles = await Role.countDocuments();

    // Get employees by department
    const employeesByDepartment = await Employee.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        totalRoles,
        employeesByDepartment
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};