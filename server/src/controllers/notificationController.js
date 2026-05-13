import Notification from '../models/Notification.js';
import Setting from '../models/Setting.js';
import User from '../models/User.js';

// @desc    Get all notifications for current user (Admin or Manager)
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
  try {
    const { role, id, storeId } = req.user;
    const query = { storeId };

    if (role === 'admin') {
      query.$or = [
        { recipientId: id },
        { recipientRole: 'admin' },
        { type: 'system' }
      ];
    } else if (role === 'manager') {
      query.$or = [
        { recipientId: id },
        { recipientRole: 'manager' }
      ];
    } else {
      query.recipientId = id;
    }

    const notifications = await Notification.find(query)
      .populate('performedBy', 'fullName role branchId')
      .populate('parentId', 'message performedBy createdAt')
      .sort('-createdAt')
      .limit(50);

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, storeId: req.user.storeId },
      { isRead: true },
      { new: true }
    );
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res, next) => {
  try {
    const { role, id, storeId } = req.user;
    const query = { _id: req.params.id, storeId };
    
    // If not admin, restrict deletion to things you can actually see
    if (role === 'manager') {
      query.$or = [
        { recipientId: id },
        { recipientRole: 'manager' }
      ];
    } else if (role !== 'admin') {
      query.recipientId = id;
    }

    const notification = await Notification.findOne(query);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found or access denied' });
    }

    await notification.deleteOne();
    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all notifications for the current user
// @route   DELETE /api/notifications
// @access  Private
export const clearNotifications = async (req, res, next) => {
  try {
    const { role, id, storeId } = req.user;
    const query = { storeId };
    
    if (role === 'admin') {
      query.$or = [
        { recipientId: id },
        { recipientRole: 'admin' },
        { type: 'system' }
      ];
    } else if (role === 'manager') {
      query.$or = [
        { recipientId: id },
        { recipientRole: 'manager' }
      ];
    } else {
      query.recipientId = id;
    }

    const result = await Notification.deleteMany(query);
    res.status(200).json({ success: true, message: `${result.deletedCount} notifications cleared` });
  } catch (error) {
    next(error);
  }
};

// @desc    Reply to a notification
// @route   POST /api/notifications/:id/reply
// @access  Private
export const replyNotification = async (req, res, next) => {
  try {
    const { message } = req.body;
    const parentNotification = await Notification.findOne({ 
      _id: req.params.id, 
      storeId: req.user.storeId 
    }).populate('performedBy', 'role branchId');

    if (!parentNotification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const replyRecipientId = parentNotification.performedBy?._id || parentNotification.performedBy;

    const reply = await Notification.create({
      storeId: req.user.storeId,
      message: message,
      type: 'message',
      performedBy: req.user.id,
      recipientId: replyRecipientId,
      recipientRole: parentNotification.performedBy?.role,
      parentId: parentNotification._id,
    });

    const populated = await Notification.findById(reply._id)
      .populate('performedBy', 'fullName role')
      .populate('parentId', 'message createdAt');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// ─── Helper: Log an action as a notification ─────────────────────────────────
export const logAction = async ({ storeId, message, type, performedBy, metadata }) => {
  try {
    const settings = await Setting.findOne({ storeId });
    if (settings && settings.notifications) {
      if (type === 'inventory' && settings.notifications.inAppInventoryAlerts === false) return;
      if (type === 'sale' && settings.notifications.inAppSaleAlerts === false) return;
      if (type === 'staff' && settings.notifications.inAppStaffAlerts === false) return;
    }

    const actor = await User.findById(performedBy).select('role branchId');
    if (!actor) return;

    if (actor.role === 'staff') {
      const manager = actor.branchId
        ? await User.findOne({ role: 'manager', branchId: actor.branchId, storeId })
        : null;

      if (manager) {
        await Notification.create({
          storeId,
          message,
          type,
          performedBy,
          recipientId: manager._id,
          recipientRole: 'manager',
          metadata,
        });
      }

      const admin = await User.findOne({ role: 'admin', storeId });
      if (admin) {
        await Notification.create({
          storeId,
          message,
          type,
          performedBy,
          recipientId: admin._id,
          recipientRole: 'admin',
          metadata,
        });
      }

    } else if (actor.role === 'manager') {
      const admin = await User.findOne({ role: 'admin', storeId });
      if (admin) {
        await Notification.create({
          storeId,
          message,
          type,
          performedBy,
          recipientId: admin._id,
          recipientRole: 'admin',
          metadata,
        });
      }
    } else {
      // For Admin/System actions, keep it visible to Admin for audit log
      const admin = await User.findOne({ role: 'admin', storeId });
      await Notification.create({ 
        storeId, 
        message, 
        type, 
        performedBy, 
        metadata,
        recipientRole: 'admin',
        recipientId: admin?._id
      });
    }

  } catch (error) {
    console.error('Error logging notification:', error);
  }
};
