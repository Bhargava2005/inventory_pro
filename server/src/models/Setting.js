import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      unique: true,
    },
    business: {
      name: { type: String, trim: true },
      address: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      logo: { type: String }, // Base64 or URL
      taxId: { type: String, trim: true },
      currency: { type: String, default: 'INR' },
      timezone: { type: String, default: 'Asia/Kolkata' },
    },
    sales: {
      defaultTax: { type: Number, default: 0 },
      invoicePrefix: { type: String, default: 'INV-' },
      terms: { type: String, default: 'Thank you for your business!' },
      defaultPaymentMethod: { type: String, default: 'cash', enum: ['cash', 'card', 'upi'] },
    },
    inventory: {
      lowStockThreshold: { type: Number, default: 10 },
      skuPattern: { type: String, default: 'PROD-{RAND4}' },
      defaultUnit: { type: String, default: 'pcs' },
    },
    notifications: {
      lowStockEmail: { type: Boolean, default: true },
      dailyReportEmail: { type: Boolean, default: false },
      inAppInventoryAlerts: { type: Boolean, default: true },
      inAppSaleAlerts: { type: Boolean, default: true },
      inAppStaffAlerts: { type: Boolean, default: true },
    },
    privacy: {
      hideStaffPriceDetails: { type: Boolean, default: true },
      hideStaffTaxDetails: { type: Boolean, default: true },
      hideStaffPaymentMethod: { type: Boolean, default: true },
      hideAllFinancialDetails: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

const Setting = mongoose.model('Setting', settingSchema);
export default Setting;
