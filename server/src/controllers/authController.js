import { validationResult } from 'express-validator';
import User from '../models/User.js';
import Store from '../models/Store.js';
import Branch from '../models/Branch.js';
import Attendance from '../models/Attendance.js';
import Setting from '../models/Setting.js';
import { sendTokenResponse } from '../utils/jwt.js';
import { sendEmail } from '../utils/sendEmail.js';

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
      });
    }

    const { 
      fullName, email, phone, username, password, 
      businessName, storeCode, address, gstNumber 
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Username';
      return res.status(400).json({
        success: false,
        message: `${field} is already registered`,
      });
    }

    // 1. Create the Admin User
    const user = await User.create({
      fullName,
      email,
      phone,
      username,
      password,
      role: 'admin', // First registration is always Admin/Owner
      isVerified: true,
    });

    // 2. Create the First Store automatically
    const store = await Store.create({
      name: businessName || `${fullName}'s Store`,
      code: storeCode?.toUpperCase() || 'MAIN-01',
      location: address || 'Default Location',
      phone: phone,
      manager: user._id,
      createdBy: user._id
    });

    // 3. Create the First Default Branch
    const branch = await Branch.create({
      name: 'Main Branch',
      code: 'MB-01',
      location: address || 'Default Location',
      phone: phone,
      email: email,
      manager: user._id,
      storeId: store._id,
      createdBy: user._id
    });

    // 4. Link the User to the Store
    user.storeId = store._id;
    await user.save();

    // 5. Create Default Settings Profile & Store GST Number
    await Setting.create({
      storeId: store._id,
      business: {
        name: store.name,
        address: store.location,
        phone: store.phone,
        email: user.email,
        taxId: gstNumber || '',
      }
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! You can now log in.',
      email: user.email,
      needsVerification: false
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
      });
    }

    const { identifier, password, storeCode, intendedRole } = req.body; // identifier = email OR username

    // Trim inputs to avoid hidden space errors
    const cleanIdentifier = identifier.trim();
    const cleanStoreCode = storeCode?.trim();

    const query = {
      $or: [
        { email: cleanIdentifier.toLowerCase() },
        { username: { $regex: new RegExp(`^${cleanIdentifier}$`, 'i') } },
      ],
    };

    // If a specific role is intended (Manager/Staff), enforce it
    if (intendedRole && intendedRole !== 'admin') {
      query.role = intendedRole;
    } else if (intendedRole === 'admin') {
      query.role = 'admin';
    }

    // If storeCode is provided, we must find the store first
    if (cleanStoreCode) {
      const store = await Store.findOne({ code: cleanStoreCode.toUpperCase() });
      if (!store) {
        console.error('Login Error: Store not found for code:', cleanStoreCode);
        return res.status(401).json({
          success: false,
          message: 'Invalid Store ID',
        });
      }
      query.storeId = store._id;
    }

    console.log('Login Attempt - Query:', JSON.stringify(query, null, 2));

    // Find user by email or username, include password field
    const user = await User.findOne(query).select('+password');

    if (!user) {
      let errorMessage = 'Invalid credentials';
      if (intendedRole) errorMessage = `Invalid credentials for ${intendedRole} access`;
      if (storeCode && !user) errorMessage = `User not found in Store ${storeCode}`;

      return res.status(401).json({
        success: false,
        message: errorMessage,
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account deactivated. Contact your administrator.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Email verification check skipped (Disabled for now)

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Record attendance
    await Attendance.create({
      userId: user._id,
      storeId: user.storeId,
      loginTime: new Date(),
    });

    // Populate storeId to get the store code for the frontend
    await user.populate('storeId', 'name location code');

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email address
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified' });
    }

    if (user.verificationOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    if (user.verificationOTPExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
    }

    // Mark as verified
    user.isVerified = true;
    user.verificationOTP = null;
    user.verificationOTPExpires = null;
    await user.save({ validateBeforeSave: false });

    // Log in immediately
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Resend verification code
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified' });
    }

    // Generate fresh OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationOTP = otp;
    user.verificationOTPExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    // Send email
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email - Inventory Pro OTP',
      text: `Your email verification OTP code is: ${otp}. It expires in 15 minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #6366f1; text-align: center;">Email Verification Required</h2>
          <p>Use the following 6-digit one-time password (OTP) to complete your email verification:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 15px; background: #f3f4f6; text-align: center; border-radius: 8px; color: #4f46e5; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #6b7280; font-size: 12px; text-align: center;">This code will expire in 15 minutes.</p>
        </div>
      `
    });

    res.status(200).json({
      success: true,
      message: 'Verification code resent successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('storeId', 'name location code');
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { fullName, phone, profileImage } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, phone, profileImage },
      { new: true, runValidators: true }
    ).populate('storeId', 'name location code');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Suggest a unique username based on full name
// @route   GET /api/auth/suggest-username
// @access  Public
export const suggestUsername = async (req, res, next) => {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    // 1. Clean the name (lowercase, remove spaces/special chars)
    let baseUsername = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (baseUsername.length < 3) baseUsername += 'user';
    
    let username = baseUsername;
    let exists = true;
    let counter = 0;

    // 2. Loop until we find a unique one
    while (exists) {
      const user = await User.findOne({ username });
      if (!user) {
        exists = false;
      } else {
        // Append a random number or counter
        username = `${baseUsername}${Math.floor(Math.random() * 999)}`;
      }
      counter++;
      if (counter > 10) break; // Safety break
    }

    res.status(200).json({
      success: true,
      username
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user & record attendance
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    // Find the latest active attendance record for this user
    const attendance = await Attendance.findOne({
      userId: req.user.id,
      status: 'active',
    }).sort({ loginTime: -1 });

    if (attendance) {
      attendance.logoutTime = new Date();
      await attendance.save();
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Heartbeat — Update last active status
// @route   POST /api/auth/heartbeat
// @access  Private
export const heartbeat = async (req, res, next) => {
  try {
    const now = new Date();
    await User.findByIdAndUpdate(req.user.id, { lastActive: now });
    await Attendance.findOneAndUpdate(
      { userId: req.user.id, status: 'active' },
      { lastHeartbeat: now },
      { sort: { loginTime: -1 } }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
