import Branch from '../models/Branch.js';
import User from '../models/User.js';

// @desc    Get all branches
// @route   GET /api/branches
// @access  Private (Admin, Manager)
export const getBranches = async (req, res, next) => {
  try {
    const { storeId } = req.user;
    const branches = await Branch.find({ storeId, isActive: true }).populate('manager', 'fullName email');
    res.status(200).json({
      success: true,
      count: branches.length,
      data: branches,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single branch
// @route   GET /api/branches/:id
// @access  Private
export const getBranch = async (req, res, next) => {
  try {
    const { storeId } = req.user;
    const branch = await Branch.findOne({ _id: req.params.id, storeId }).populate('manager', 'fullName email');
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }
    res.status(200).json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new branch
// @route   POST /api/branches
// @access  Private (Admin)
export const createBranch = async (req, res, next) => {
  try {
    const { name, code, location, phone, email, manager } = req.body;
    const { storeId } = req.user;

    const branch = await Branch.create({
      name,
      code,
      location,
      phone,
      email,
      manager: manager || null,
      storeId,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: branch,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Branch code already exists in this store' });
    }
    next(error);
  }
};

// @desc    Update branch
// @route   PUT /api/branches/:id
// @access  Private (Admin, Manager)
export const updateBranch = async (req, res, next) => {
  try {
    const { storeId } = req.user;
    const branch = await Branch.findOneAndUpdate({ _id: req.params.id, storeId }, req.body, {
      new: true,
      runValidators: true,
    }).populate('manager', 'fullName email');

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    res.status(200).json({
      success: true,
      data: branch,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete branch (soft delete)
// @route   DELETE /api/branches/:id
// @access  Private (Admin)
export const deleteBranch = async (req, res, next) => {
  try {
    const { storeId } = req.user;
    const branch = await Branch.findOneAndUpdate({ _id: req.params.id, storeId }, { isActive: false }, { new: true });

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Branch deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};
