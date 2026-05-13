import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['inventory', 'sale', 'staff', 'system', 'message'],
      default: 'system',
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    recipientRole: {
      type: String,
      enum: ['admin', 'manager', 'staff'],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification',
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // e.g. { productId: '...', saleId: '...' }
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
