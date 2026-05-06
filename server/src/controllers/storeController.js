import Store from '../models/Store.js';
import User from '../models/User.js';

// @desc    Get all stores
// @route   GET /api/stores
// @access  Private (Admin, Manager)
export const getStores = async (req, res, next) => {
  try {
    const stores = await Store.find({ isActive: true }).populate('manager', 'fullName email');
    res.status(200).json({
      success: true,
      count: stores.length,
      data: stores,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single store
// @route   GET /api/stores/:id
// @access  Private
export const getStore = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.id).populate('manager', 'fullName email');
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    res.status(200).json({ success: true, data: store });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new store
// @route   POST /api/stores
// @access  Private (Admin)
export const createStore = async (req, res, next) => {
  try {
    const { name, code, location, phone, email, manager } = req.body;

    const store = await Store.create({
      name,
      code,
      location,
      phone,
      email,
      manager: manager || null,
    });

    res.status(201).json({
      success: true,
      data: store,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Store name or code already exists' });
    }
    next(error);
  }
};

// @desc    Update store
// @route   PUT /api/stores/:id
// @access  Private (Admin, Manager)
export const updateStore = async (req, res, next) => {
  try {
    const store = await Store.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    res.status(200).json({
      success: true,
      data: store,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete store (soft delete)
// @route   DELETE /api/stores/:id
// @access  Private (Admin)
export const deleteStore = async (req, res, next) => {
  try {
    const store = await Store.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });

    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Store deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};
