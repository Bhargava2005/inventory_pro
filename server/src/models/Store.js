import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
      unique: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    code: {
      type: String,
      required: [true, 'Store code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Store = mongoose.model('Store', storeSchema);
export default Store;
