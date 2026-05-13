import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    code: {
      type: String,
      required: [true, 'Branch code is required'],
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
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

// Compound unique index: Code must be unique within a Store
branchSchema.index({ code: 1, storeId: 1 }, { unique: true });

const Branch = mongoose.model('Branch', branchSchema);
export default Branch;
