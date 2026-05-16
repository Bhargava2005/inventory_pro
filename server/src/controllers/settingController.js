import Setting from '../models/Setting.js';

// @desc    Get settings for the current store
// @route   GET /api/settings
// @access  Private (Admin, Manager)
export const getSettings = async (req, res, next) => {
  try {
    const storeId = req.user.storeId;
    
    if (!storeId && req.user.role !== 'admin') {
      return res.status(400).json({ success: false, message: 'User is not assigned to a store' });
    }

    // Find settings for the store, create if not exists
    let settings = await Setting.findOne({ storeId });
    
    if (!settings) {
      settings = await Setting.create({ 
        storeId,
        business: {
          name: req.user.storeId?.name || 'Inventory Pro',
          email: req.user.storeId?.email || '',
          phone: req.user.storeId?.phone || '',
          address: req.user.storeId?.location || '',
        }
      });
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private (Admin, Manager)
export const updateSettings = async (req, res, next) => {
  try {
    const storeId = req.user.storeId;
    
    if (!storeId && req.user.role !== 'admin') {
      return res.status(400).json({ success: false, message: 'User is not assigned to a store' });
    }

    const { business, sales, inventory, notifications, privacy } = req.body;

    let settings = await Setting.findOneAndUpdate(
      { storeId },
      { business, sales, inventory, notifications, privacy },
      { new: true, runValidators: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};
