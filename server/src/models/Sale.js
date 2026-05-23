import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    trim: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: String, // Snapshot of name at time of sale
  brand: String, // Snapshot of brand at time of sale
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  price: {
    type: Number,
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  pieces: {
    type: Number,
    default: 0,
    min: 0,
  }, // separate loose pieces sold for this item
  pricePerPiece: {
    type: Number,
    default: 0,
  }, // price_per_box / pieces_per_box
  weight: {
    type: Number,
    default: 0,
  }, // total weight for this row (boxes + pieces)
  isDamaged: {
    type: Boolean,
    default: false,
  },
  isExchange: {
    type: Boolean,
    default: false,
  },
  isSample: {
    type: Boolean,
    default: false,
  },
  isWrongProduct: {
    type: Boolean,
    default: false,
  },
  statusReason: {
    type: String,
    trim: true,
  },
  statusHistory: [statusHistorySchema],
});

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      required: true,
    },
    items: [saleItemSchema],
    totalAmount: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'credit'],
      default: 'cash',
    },
    customer: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      companyName: { type: String, trim: true },
      addressLine: { type: String, trim: true },
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
    soldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Transporter / delivery details
    transporter: {
      name: { type: String, trim: true, default: '' },
      mobile: { type: String, trim: true, default: '' },
      vehicleType: { type: String, trim: true, default: '' },
      vehicleNumber: { type: String, trim: true, default: '' },
    },
    // Total weight of this order (computed at sale time)
    totalWeight: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Auto-generate invoice number before saving
saleSchema.pre('validate', async function (next) {
  if (!this.invoiceNumber) {
    const date = new Date();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    const SaleModel = mongoose.model('Sale');
    const dailyCount = await SaleModel.countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    });
    const counter = (dailyCount + 1).toString();
    this.invoiceNumber = `#inv-${day}${month}${year}${counter}`;
  }
  next();
});

const Sale = mongoose.model('Sale', saleSchema);
export default Sale;
