import Product from '../models/Product.js';
import Sale from '../models/Sale.js';
import User from '../models/User.js';

// @desc    Get dashboard summary
// @route   GET /api/dashboard/summary
// @access  Private
export const getDashboardSummary = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role === 'admin';
    const matchStore = { storeId: req.user.storeId };
    const productMatch = { storeId: req.user.storeId, isActive: true };

    if (!isSuperAdmin && req.user.branchId) {
      matchStore.branchId = req.user.branchId;
      productMatch.branchId = req.user.branchId;
    }

    // 1. Product Stats (Total, In Stock, Low Stock, Out of Stock, Total Value)
    const totalProducts = await Product.countDocuments(productMatch);
    const outOfStock = await Product.countDocuments({ ...productMatch, quantity: 0 });

    const allActive = await Product.find(productMatch, { quantity: 1, minStockLevel: 1 });
    const lowStockCount = allActive.filter((p) => p.quantity > 0 && p.quantity <= p.minStockLevel).length;
    const inStock = totalProducts - outOfStock - lowStockCount;

    const valueAgg = await Product.aggregate([
      { $match: productMatch },
      { $group: { _id: null, totalValue: { $sum: { $multiply: ['$price', '$quantity'] } } } },
    ]);
    const totalValue = valueAgg[0]?.totalValue || 0;

    // 2. Recent Sales (Last 5)
    const recentSales = await Sale.find(matchStore)
      .populate('items.product', 'name sku')
      .populate('soldBy', 'fullName')
      .sort('-createdAt')
      .limit(5);

    // 3. Top Selling Products (Top 5 all time, or could restrict to recent)
    const topProducts = await Sale.aggregate([
      { $match: matchStore },
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

    // 4. Low Stock Products (Top 5 with lowest quantity)
    // Filter out out-of-stock and get those close to or below minStockLevel
    const lowStockProductsQuery = await Product.find({ ...productMatch, quantity: { $gt: 0 } })
      .select('name sku quantity minStockLevel')
      .lean();
    
    // Sort manually since minStockLevel can vary
    const lowStockProducts = lowStockProductsQuery
      .filter((p) => p.quantity <= p.minStockLevel)
      .sort((a, b) => (a.quantity / a.minStockLevel) - (b.quantity / b.minStockLevel))
      .slice(0, 5);

    // 5. Revenue Today vs Yesterday (Simple)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const revenueTodayAgg = await Sale.aggregate([
      { $match: { ...matchStore, createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
    ]);
    const revenueToday = revenueTodayAgg[0]?.total || 0;
    const salesToday = revenueTodayAgg[0]?.count || 0;

    // 6. Today's Staff Activity
    const activityStaff = await User.find({ 
      ...matchStore, 
      $or: [
        { lastLogin: { $gte: today } },
        { lastLogout: { $gte: today } }
      ]
    }).select('fullName role lastLogin lastLogout').lean();

    const todayActivity = await Promise.all(activityStaff.map(async (staff) => {
      const salesCount = await Sale.countDocuments({ 
        soldBy: staff._id, 
        createdAt: { $gte: today } 
      });
      return {
        ...staff,
        salesCount
      };
    }));

    res.status(200).json({
      success: true,
      data: {
        stats: { total: totalProducts, inStock, lowStock: lowStockCount, outOfStock, totalValue },
        recentSales,
        topProducts,
        lowStockProducts,
        revenueToday,
        salesToday,
        todayActivity
      },
    });
  } catch (error) {
    next(error);
  }
};
