import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    brand: {
      type: String,
      trim: true,
      default: '',
    },
    sku: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Price cannot be negative'],
    },
    costPrice: {
      type: Number,
      min: [0, 'Cost price cannot be negative'],
      default: 0,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    minStockLevel: {
      type: Number,
      default: 5,
      min: [0, 'Minimum stock level cannot be negative'],
    },
    unit: {
      type: String,
      default: 'pcs',
      trim: true,
    },
    supplier: {
      type: String,
      trim: true,
      maxlength: [100, 'Supplier name cannot exceed 100 characters'],
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    image: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '#3b82f6',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    // Stock-state fields — populated via Excel import or manual audit
    damagedStock: { type: Number, default: 0, min: 0 },
    sampleStock: { type: Number, default: 0, min: 0 },
    exchangedStock: { type: Number, default: 0, min: 0 },
    wrongProductStock: { type: Number, default: 0, min: 0 },
    // Piece-selling fields
    pieces_per_box: { type: Number, default: 1, min: 1 }, // number of pieces in one box
    ava_pieces: { type: Number, default: 0, min: 0 },     // loose/separate pieces available
    weight_of_unit: { type: Number, default: 0, min: 0 },  // weight of one unit (box or bag) in kg
    measurements: { type: String, trim: true, default: '' }, // physical dimensions e.g. 10x20x30 or weight e.g. 25 kg
  },
  { timestamps: true }
);

// Compound text index for fuzzy full-text search
productSchema.index({ name: 'text', sku: 'text', brand: 'text', supplier: 'text' });

// Auto-generate SKU before saving if not provided
productSchema.pre('save', async function (next) {
  if (!this.sku) {
    const count = await mongoose.model('Product').countDocuments();
    this.sku = `PRD-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Virtual: stock status
productSchema.virtual('stockStatus').get(function () {
  if (this.quantity === 0) return 'out';
  if (this.quantity <= this.minStockLevel) return 'low';
  return 'ok';
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
