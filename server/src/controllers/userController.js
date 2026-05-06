import User from '../models/User.js';
import { sendTokenResponse } from '../utils/jwt.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin, Manager)
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .populate('storeId', 'name code')
      .select('-password');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new user (Admin only)
// @route   POST /api/users
// @access  Private (Admin)
export const createUser = async (req, res, next) => {
  try {
    const { fullName, email, username, password, role, storeId } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      fullName,
      email,
      username,
      password,
      role: role || 'staff',
      storeId: storeId || null,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role or store assignment
// @route   PUT /api/users/:id
// @access  Private (Admin)
export const updateUser = async (req, res, next) => {
  try {
    const { role, storeId, isActive, fullName, phone } = req.body;

    // Only allow specific fields to be updated via this admin endpoint
    const updates = {};
    if (role) updates.role = role;
    if (storeId !== undefined) updates.storeId = storeId === '' ? null : storeId;
    if (isActive !== undefined) updates.isActive = isActive;
    if (fullName) updates.fullName = fullName;
    if (phone) updates.phone = phone;

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password').populate('storeId', 'name code');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

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
// @access  Private (Admin)
export const deleteUser = async (req, res, next) => {
  try {
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
