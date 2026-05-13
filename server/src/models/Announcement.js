import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    bannerImage: {
      type: String, // Base64 or URL
    },
    endTime: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for performance on active announcements
announcementSchema.index({ storeId: 1, isActive: 1, endTime: 1 });

const Announcement = mongoose.model('Announcement', announcementSchema);
export default Announcement;
