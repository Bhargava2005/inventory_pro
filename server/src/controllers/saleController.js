import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

// @desc    Process a new sale
// @route   POST /api/sales
// @access  Private
export const createSale = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, customer, paymentMethod, tax = 0, discount = 0 } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in sale' });
    }

    let totalAmount = 0;
    const processedItems = [];

    // 1. Validate items and update stock
    for (const item of items) {
      const product = await Product.findById(item.product).session(session);
      
      if (!product || !product.isActive) {
        throw new Error(`Product ${item.name || item.product} not found`);
      }

      if (product.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity}`);
      }

      // Decrement stock
      product.quantity -= item.quantity;
      await product.save({ session });

      const subtotal = item.quantity * item.price;
      totalAmount += subtotal;

      processedItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: item.price,
        subtotal,
      });
    }

    // Final total calculation
    const finalTotal = totalAmount + Number(tax) - Number(discount);

    // 2. Create Sale Record
    const sale = await Sale.create([{
      items: processedItems,
      totalAmount: finalTotal,
      tax,
      discount,
      paymentMethod,
      customer,
      storeId: req.user.storeId, // Sale linked to staff's assigned store
      soldBy: req.user.id,
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Sale processed successfully',
      data: sale[0],
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
export const getSales = async (req, res, next) => {
  try {
    const { startDate, endDate, storeId, soldBy } = req.query;
    const query = {};

    // Filter by store (managers see their store, staff see their store, admins see all)
    if (req.user.role !== 'admin') {
      query.storeId = req.user.storeId;
    } else if (storeId) {
      query.storeId = storeId;
    }

    if (soldBy) query.soldBy = soldBy;

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const sales = await Sale.find(query)
      .populate('items.product', 'name sku')
      .populate('storeId', 'name')
      .populate('soldBy', 'fullName')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: sales.length,
      data: sales,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sales analytics
// @route   GET /api/sales/stats
// @access  Private (Admin, Manager)
export const getSalesStats = async (req, res, next) => {
  try {
    const storeId = req.user.role === 'admin' ? null : req.user.storeId;
    const match = {};
    if (storeId) match.storeId = storeId;

    // 1. Daily Revenue (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyRevenue = await Sale.aggregate([
      { $match: { ...match, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          salesCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 2. Top 5 Products
    const topProducts = await Sale.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    // 3. Payment Method Distribution
    const paymentStats = await Sale.aggregate([
      { $match: match },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, value: { $sum: '$totalAmount' } } },
    ]);

    res.status(200).json({
      success: true,
      data: { dailyRevenue, topProducts, paymentStats },
    });
  } catch (error) {
    next(error);
  }
};
