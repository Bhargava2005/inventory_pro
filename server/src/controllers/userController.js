import User from '../models/User.js';
import { sendTokenResponse } from '../utils/jwt.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin, Manager)
export const getUsers = async (req, res, next) => {
  try {
    const { search, branchId } = req.query;
    let query = { storeId: req.user.storeId }; // Global store barrier
    
    // Branch filtering
    if (req.user.role === 'manager' && req.user.branchId) {
      query.branchId = req.user.branchId;
    } else if (branchId) {
      query.branchId = branchId;
    }

    // Add fuzzy search filter (name or username)
    if (search) {
      const tokens = search.trim().split(/\s+/).filter(Boolean);
      query.$and = tokens.map(token => {
        const fuzzyPattern = token.split('').map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
        return {
          $or: [
            { fullName: { $regex: fuzzyPattern, $options: 'i' } },
            { username: { $regex: fuzzyPattern, $options: 'i' } }
          ]
        };
      });
    }

    const users = await User.find(query)
      .populate('branchId', 'name code')
      .select('-password')
      .sort('fullName')
      .lean();
    
    // Add isOnline calculated field
    const usersWithStatus = users.map(u => ({
      ...u,
      isOnline: u.lastActive && (new Date() - new Date(u.lastActive)) < 60000
    }));
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: usersWithStatus,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new user
// @route   POST /api/users
// @access  Private (Admin, Manager)
export const createUser = async (req, res, next) => {
  try {
    const { fullName, email, username, password, role, branchId, phone } = req.body;

    // Security check: Managers can only create Staff for their own branch
    if (req.user.role === 'manager') {
      if (role !== 'staff') {
        return res.status(403).json({ success: false, message: 'Managers can only create Staff accounts' });
      }
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      fullName,
      email,
      username,
      password,
      phone: phone || undefined,
      role: role || 'staff',
      storeId: req.user.storeId,
      branchId: req.user.role === 'manager' ? req.user.branchId : (branchId || null),
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role or store assignment
// @route   PUT /api/users/:id
// @access  Private (Admin, Manager)
export const updateUser = async (req, res, next) => {
  try {
    const { role, branchId, isActive, fullName, phone } = req.body;
    const targetUser = await User.findById(req.params.id);

    if (!targetUser || targetUser.storeId.toString() !== req.user.storeId.toString()) {
      return res.status(404).json({ success: false, message: 'User not found in your store' });
    }

    // Security check: Managers can only update staff in their own branch
    if (req.user.role === 'manager') {
      if (targetUser.branchId?.toString() !== req.user.branchId?.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied to this user' });
      }
      // Managers cannot change roles to admin
      if (role && role !== 'staff') {
        return res.status(403).json({ success: false, message: 'Managers can only manage staff roles' });
      }
    }

    const updates = {};
    if (role) updates.role = role;
    if (branchId !== undefined) updates.branchId = branchId === '' ? null : branchId;
    if (isActive !== undefined) updates.isActive = isActive;
    if (fullName) updates.fullName = fullName;
    if (phone) updates.phone = phone;

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password').populate('branchId', 'name code');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate user
// @route   DELETE /api/users/:id
// @access  Private (Admin, Manager)
export const deleteUser = async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);

    if (!targetUser || targetUser.storeId.toString() !== req.user.storeId.toString()) {
      return res.status(404).json({ success: false, message: 'User not found in your store' });
    }

    // Security check: Managers can only deactivate staff in their own branch
    if (req.user.role === 'manager') {
      if (targetUser.branchId?.toString() !== req.user.branchId?.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied to this user' });
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};
