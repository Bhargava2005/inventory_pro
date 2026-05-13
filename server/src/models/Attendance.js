import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    loginTime: {
      type: Date,
      default: Date.now,
    },
    logoutTime: {
      type: Date,
      default: null,
    },
    lastHeartbeat: {
      type: Date,
      default: Date.now,
    },
    totalHours: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Calculate total hours before saving if logoutTime is provided
attendanceSchema.pre('save', function (next) {
  if (this.logoutTime && this.loginTime) {
    const diff = this.logoutTime.getTime() - this.loginTime.getTime();
    this.totalHours = parseFloat((diff / (1000 * 60 * 60)).toFixed(2));
    this.status = 'completed';
  }
  next();
});

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
