import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';

// @desc    Export inventory to Excel
// @route   GET /api/reports/inventory/export
// @access  Private (Admin, Manager)
export const exportInventory = async (req, res, next) => {
  try {
    const { branchId } = req.query;
    const query = { isActive: true };

    // Apply branch filter if provided and user is admin
    if (req.user.role === 'admin' && branchId) {
      query.branchId = branchId;
    } else if (req.user.role !== 'admin' && req.user.branchId) {
      // Non-admins are locked to their own branch
      query.branchId = req.user.branchId;
    }

    const products = await Product.find(query).populate('category', 'name');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory');

    worksheet.columns = [
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Product Name', key: 'name', width: 30 },
      { header: 'Brand', key: 'brand', width: 15 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Dimensions', key: 'dimensions', width: 15 },
      { header: 'Selling Price', key: 'price', width: 15 },
      { header: 'Cost Price', key: 'costPrice', width: 15 },
      { header: 'Boxes Stock', key: 'quantity', width: 12 },
      { header: 'Separate Pieces', key: 'ava_pieces', width: 15 },
      { header: 'Pieces Per Box', key: 'pieces_per_box', width: 15 },
      { header: 'Box Weight (KG)', key: 'weight_of_box', width: 15 },
      { header: 'Sample Stock', key: 'sampleStock', width: 12 },
      { header: 'Damaged Stock', key: 'damagedStock', width: 12 },
      { header: 'Exchanged Stock', key: 'exchangedStock', width: 12 },
      { header: 'Wrong Delivery Stock', key: 'wrongProductStock', width: 18 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Min Stock Level', key: 'minStockLevel', width: 15 },
      { header: 'Supplier', key: 'supplier', width: 20 },
      { header: 'Color', key: 'color', width: 10 },
      { header: 'Image URL', key: 'image', width: 40 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    products.forEach(p => {
      worksheet.addRow({
        sku: p.sku,
        name: p.name,
        brand: p.brand || '',
        category: p.category?.name || 'Uncategorized',
        dimensions: p.dimensions || '',
        price: p.price,
        costPrice: p.costPrice || 0,
        quantity: p.quantity,
        ava_pieces: p.ava_pieces || 0,
        pieces_per_box: p.pieces_per_box || 1,
        weight_of_box: p.weight_of_box || 0,
        sampleStock: p.sampleStock || 0,
        damagedStock: p.damagedStock || 0,
        exchangedStock: p.exchangedStock || 0,
        wrongProductStock: p.wrongProductStock || 0,
        unit: p.unit,
        minStockLevel: p.minStockLevel || 5,
        supplier: p.supplier || '',
        color: p.color || '#3b82f6',
        image: p.image || '',
        description: p.description || '',
        status: p.stockStatus.toUpperCase(),
      });
    });

    // Styling
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory_report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Export sales to Excel
// @route   GET /api/reports/sales/export
// @access  Private (Admin, Manager)
export const exportSales = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const sales = await Sale.find(query)
      .populate('soldBy', 'fullName')
      .populate('storeId', 'name')
      .sort('-createdAt');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.columns = [
      { header: 'Invoice #', key: 'invoice', width: 15 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Customer', key: 'customer', width: 25 },
      { header: 'Items Count', key: 'count', width: 12 },
      { header: 'Payment', key: 'payment', width: 12 },
      { header: 'Total Amount', key: 'total', width: 15 },
      { header: 'Sold By', key: 'staff', width: 20 },
      { header: 'Store', key: 'store', width: 20 },
    ];

    sales.forEach(s => {
      worksheet.addRow({
        invoice: s.invoiceNumber,
        date: s.createdAt.toLocaleDateString(),
        customer: s.customer?.name || 'Walk-in',
        count: s.items.length,
        payment: s.paymentMethod.toUpperCase(),
        total: s.totalAmount,
        staff: s.soldBy?.fullName,
        store: s.storeId?.name,
      });
    });

    // Premium Styling
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' } // Indigo-600
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    
    // Add auto-filter
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 8 }
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Get Comprehensive Analysis Data
// @route   GET /api/reports/analysis
// @access  Private (Admin, Manager)
export const getAnalysisData = async (req, res, next) => {
  try {
    const { startDate, endDate, branchId } = req.query;
    const query = {};
    if (req.user.storeId) {
      query.storeId = new mongoose.Types.ObjectId(String(req.user.storeId));
    }
    
    if (req.user.role === 'staff') {
      query.soldBy = new mongoose.Types.ObjectId(String(req.user._id || req.user.id));
    } else if (req.user.role !== 'admin' && req.user.branchId) {
      query.branchId = new mongoose.Types.ObjectId(String(req.user.branchId));
    } else if (branchId && branchId !== '') {
      query.branchId = new mongoose.Types.ObjectId(String(branchId));
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const { 
      categoryId, brand, search, productIds, groupBy = 'day', page = 1, limit = 10,
      transactionType = 'all', sortByField = 'salesCount', sortByDir = -1 
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Base filter for general search/category
    const baseMatch = { ...query };
    
    const productPipeline = [
      { $match: baseMatch },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' }
    ];

    if (search) {
      const tokens = search.trim().split(/\s+/).filter(Boolean);
      tokens.forEach(token => {
        const fuzzyPattern = token.split('').map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
        productPipeline.push({
          $match: { 
            $or: [
              { 'items.name': { $regex: fuzzyPattern, $options: 'i' } },
              { 'productInfo.sku': { $regex: fuzzyPattern, $options: 'i' } }
            ]
          }
        });
      });
    }

    if (categoryId) {
      productPipeline.push({
        $match: { 'productInfo.category': new mongoose.Types.ObjectId(categoryId) }
      });
    }

    if (brand) {
      productPipeline.push({
        $match: { 'productInfo.brand': brand }
      });
    }

    // Transaction Type Filter
    if (transactionType !== 'all') {
      if (transactionType === 'sale') {
        productPipeline.push({
          $match: {
            'items.isSample': false,
            'items.isDamaged': false,
            'items.isExchange': false,
            'items.isWrongProduct': false
          }
        });
      } else if (transactionType === 'sample') {
        productPipeline.push({ $match: { 'items.isSample': true } });
      } else if (transactionType === 'damaged') {
        productPipeline.push({ $match: { 'items.isDamaged': true } });
      } else if (transactionType === 'exchange') {
        productPipeline.push({ $match: { 'items.isExchange': true } });
      } else if (transactionType === 'wrong') {
        productPipeline.push({ $match: { 'items.isWrongProduct': true } });
      }
    }


    // Trend pipeline (Inherits filters + specific product selection)
    const trendPipeline = [...productPipeline];
    let ids = productIds;
    if (ids && !Array.isArray(ids)) ids = [ids];

    if (ids && ids.length > 0) {
      trendPipeline.push({
        $match: { 'items.product': { $in: ids.map(id => new mongoose.Types.ObjectId(id)) } }
      });
    }

    // 1. Time-based aggregation with grouping (Paginated)
    let groupFormat = '%Y-%m-%d';
    if (groupBy === 'week') groupFormat = '%G-W%V';
    else if (groupBy === 'month') groupFormat = '%Y-%m';

    const timeResults = await Sale.aggregate([
      ...trendPipeline,
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          totalSales: { $sum: '$items.subtotal' },
          salesCount: { $sum: '$items.quantity' },
          sampleCount: { $sum: { $cond: ['$items.isSample', '$items.quantity', 0] } },
          damagedCount: { $sum: { $cond: ['$items.isDamaged', '$items.quantity', 0] } },
          exchangeCount: { $sum: { $cond: ['$items.isExchange', '$items.quantity', 0] } },
          wrongProductCount: { $sum: { $cond: ['$items.isWrongProduct', '$items.quantity', 0] } },
        }
      },
      { $sort: { _id: 1 } },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: skip }, { $limit: parseInt(limit) }]
        }
      }
    ]);

    // 2. Product-based aggregation (Paginated) - Group by Product ID/SKU
    const productResults = await Sale.aggregate([
      ...productPipeline,
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          sku: { $first: '$productInfo.sku' },
          totalSales: { $sum: '$items.subtotal' },
          salesCount: { $sum: '$items.quantity' },
          sampleCount: { $sum: { $cond: ['$items.isSample', '$items.quantity', 0] } },
          damagedCount: { $sum: { $cond: ['$items.isDamaged', '$items.quantity', 0] } },
          exchangeCount: { $sum: { $cond: ['$items.isExchange', '$items.quantity', 0] } },
          wrongProductCount: { $sum: { $cond: ['$items.isWrongProduct', '$items.quantity', 0] } },
        }
      },
      { $sort: { [sortByField]: parseInt(sortByDir) || -1 } },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: skip }, { $limit: parseInt(limit) }]
        }
      }
    ]);

    const timeData = timeResults[0].data;
    const timeTotal = timeResults[0].metadata[0]?.total || 0;
    const productData = productResults[0].data;
    const productTotal = productResults[0].metadata[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: { 
        timeAnalysis: timeData, 
        productAnalysis: productData,
        timeTotal,
        productTotal,
        page: parseInt(page),
        totalPages: Math.ceil((req.query.activeTab === 'time' ? timeTotal : productTotal) / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export Analysis Data to Excel
// @route   GET /api/reports/analysis/export
// @access  Private (Admin, Manager)
export const exportAnalysisExcel = async (req, res, next) => {
  try {
    const { startDate, endDate, branchId } = req.query;
    const query = {};
    if (req.user.storeId) {
      query.storeId = new mongoose.Types.ObjectId(String(req.user.storeId));
    }
    
    if (req.user.role === 'staff') {
      query.soldBy = new mongoose.Types.ObjectId(String(req.user._id || req.user.id));
    } else if (req.user.role !== 'admin' && req.user.branchId) {
      query.branchId = new mongoose.Types.ObjectId(String(req.user.branchId));
    } else if (branchId && branchId !== '') {
      query.branchId = new mongoose.Types.ObjectId(String(branchId));
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const { 
      categoryId, brand, search, productIds, groupBy = 'day',
      transactionType = 'all', sortByField = 'salesCount', sortByDir = -1
    } = req.query;
    const baseMatch = { ...query };
    
    const productPipeline = [
      { $match: baseMatch },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' }
    ];

    if (search) {
      const tokens = search.trim().split(/\s+/).filter(Boolean);
      tokens.forEach(token => {
        const fuzzyPattern = token.split('').map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
        productPipeline.push({
          $match: { 
            $or: [
              { 'items.name': { $regex: fuzzyPattern, $options: 'i' } },
              { 'productInfo.sku': { $regex: fuzzyPattern, $options: 'i' } }
            ]
          }
        });
      });
    }

    if (categoryId) {
      productPipeline.push({
        $match: { 'productInfo.category': new mongoose.Types.ObjectId(categoryId) }
      });
    }

    if (brand) {
      productPipeline.push({
        $match: { 'productInfo.brand': brand }
      });
    }

    // Transaction Type Filter
    if (transactionType !== 'all') {
      if (transactionType === 'sale') {
        productPipeline.push({
          $match: {
            'items.isSample': false,
            'items.isDamaged': false,
            'items.isExchange': false,
            'items.isWrongProduct': false
          }
        });
      } else if (transactionType === 'sample') {
        productPipeline.push({ $match: { 'items.isSample': true } });
      } else if (transactionType === 'damaged') {
        productPipeline.push({ $match: { 'items.isDamaged': true } });
      } else if (transactionType === 'exchange') {
        productPipeline.push({ $match: { 'items.isExchange': true } });
      } else if (transactionType === 'wrong') {
        productPipeline.push({ $match: { 'items.isWrongProduct': true } });
      }
    }


    const trendPipeline = [...productPipeline];
    let ids = productIds;
    if (ids && !Array.isArray(ids)) ids = [ids];

    if (ids && ids.length > 0) {
      trendPipeline.push({
        $match: { 'items.product': { $in: ids.map(id => new mongoose.Types.ObjectId(id)) } }
      });
    }

    let groupFormat = '%Y-%m-%d';
    if (groupBy === 'week') groupFormat = '%G-W%V';
    else if (groupBy === 'month') groupFormat = '%Y-%m';

    const [timeData, productData] = await Promise.all([
      Sale.aggregate([
        ...trendPipeline,
        {
          $group: {
            _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
            totalSales: { $sum: '$items.subtotal' },
            salesCount: { $sum: '$items.quantity' },
            sampleCount: { $sum: { $cond: ['$items.isSample', '$items.quantity', 0] } },
            damagedCount: { $sum: { $cond: ['$items.isDamaged', '$items.quantity', 0] } },
            exchangeCount: { $sum: { $cond: ['$items.isExchange', '$items.quantity', 0] } },
            wrongProductCount: { $sum: { $cond: ['$items.isWrongProduct', '$items.quantity', 0] } },
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Sale.aggregate([
        ...productPipeline,
        {
          $group: {
            _id: '$items.product',
            name: { $first: '$items.name' },
            sku: { $first: '$productInfo.sku' },
            salesCount: { $sum: '$items.quantity' },
            totalSales: { $sum: '$items.subtotal' },
            sampleCount: { $sum: { $cond: ['$items.isSample', '$items.quantity', 0] } },
            damagedCount: { $sum: { $cond: ['$items.isDamaged', '$items.quantity', 0] } },
            exchangeCount: { $sum: { $cond: ['$items.isExchange', '$items.quantity', 0] } },
            wrongProductCount: { $sum: { $cond: ['$items.isWrongProduct', '$items.quantity', 0] } },
          }
        },
        { $sort: { [sortByField]: parseInt(sortByDir) || -1 } }
      ])
    ]);

    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: Time Analysis
    const timeSheet = workbook.addWorksheet('Time Analysis');
    timeSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Items Sold', key: 'salesCount', width: 12 },
      { header: 'Revenue', key: 'totalSales', width: 15 },
      { header: 'Samples', key: 'sampleCount', width: 12 },
      { header: 'Damages', key: 'damagedCount', width: 12 },
      { header: 'Exchanges', key: 'exchangeCount', width: 12 },
      { header: 'Wrong Deliveries', key: 'wrongProductCount', width: 18 },
    ];
    timeSheet.getRow(1).font = { bold: true };
    timeData.forEach(d => {
      timeSheet.addRow({
        date: d._id,
        salesCount: d.salesCount,
        totalSales: d.totalSales,
        sampleCount: d.sampleCount,
        damagedCount: d.damagedCount,
        exchangeCount: d.exchangeCount,
        wrongProductCount: d.wrongProductCount,
      });
    });

    // Sheet 2: Product Analysis
    const productSheet = workbook.addWorksheet('Product Analysis');
    productSheet.columns = [
      { header: 'Product Name', key: 'name', width: 30 },
      { header: 'Items Sold', key: 'salesCount', width: 12 },
      { header: 'Revenue', key: 'totalSales', width: 15 },
      { header: 'Samples', key: 'sampleCount', width: 12 },
      { header: 'Damages', key: 'damagedCount', width: 12 },
      { header: 'Exchanges', key: 'exchangeCount', width: 12 },
      { header: 'Wrong Deliveries', key: 'wrongProductCount', width: 18 },
    ];
    productSheet.getRow(1).font = { bold: true };
    productData.forEach(d => {
      productSheet.addRow({
        name: d.name || 'Unknown Product',
        salesCount: d.salesCount,
        totalSales: d.totalSales,
        sampleCount: d.sampleCount,
        damagedCount: d.damagedCount,
        exchangeCount: d.exchangeCount,
        wrongProductCount: d.wrongProductCount,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=comprehensive_analysis.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};
