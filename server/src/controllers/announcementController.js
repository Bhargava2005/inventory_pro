import Announcement from '../models/Announcement.js';

// @desc    Create a new announcement
// @route   POST /api/announcements
// @access  Private (Admin only)
export const createAnnouncement = async (req, res, next) => {
  try {
    const { title, message, bannerImage, durationMinutes } = req.body;

    if (!title || !message || !durationMinutes) {
      return res.status(400).json({ success: false, message: 'Please provide title, message and duration' });
    }

    if (!req.user.storeId) {
      console.error('Create Announcement Error: req.user.storeId is missing', req.user);
      return res.status(400).json({ success: false, message: 'Admin user must be linked to a store' });
    }

    // Set expiration time
    const endTime = new Date();
    endTime.setMinutes(endTime.getMinutes() + parseInt(durationMinutes));

    // Deactivate previous active announcements for this store
    await Announcement.updateMany(
      { storeId: req.user.storeId, isActive: true },
      { isActive: false }
    );

    console.log('Creating Announcement in DB:', { storeId: req.user.storeId, title, endTime });

    const announcement = await Announcement.create({
      storeId: req.user.storeId,
      title,
      message,
      bannerImage,
      endTime,
      createdBy: req.user.id,
    });

    console.log('Announcement Created Successfully:', announcement._id);
    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    console.error('CRITICAL: Create Announcement Failed:', error);
    next(error);
  }
};

// @desc    Get current active announcement
// @route   GET /api/announcements/active
// @access  Private
export const getActiveAnnouncement = async (req, res, next) => {
  try {
    const query = {
      storeId: req.user.storeId,
      isActive: true,
      endTime: { $gt: new Date() },
    };
    
    console.log('Fetching active announcement with query:', query);

    const announcement = await Announcement.findOne(query).sort('-createdAt');
    console.log('Found announcement:', announcement ? announcement.title : 'None');

    res.status(200).json({ success: true, data: announcement });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all announcements (history)
// @route   GET /api/announcements
// @access  Private (Admin only)
export const getAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find({ storeId: req.user.storeId })
      .populate('createdBy', 'fullName')
      .sort('-createdAt');

    res.status(200).json({ success: true, data: announcements });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Deactivate announcement
// @route   DELETE /api/announcements/:id
// @access  Private (Admin only)
export const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findOne({
      _id: req.params.id,
      storeId: req.user.storeId,
    });

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    await announcement.deleteOne();
    res.status(200).json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    next(error);
  }
};
