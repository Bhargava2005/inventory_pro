import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Setting from '../models/Setting.js';
import mongoose from 'mongoose';
import { logAction } from './notificationController.js';

// Helper to determine status string
const getStatusString = (item) => {
  if (item.isDamaged) return 'Damaged';
  if (item.isWrongProduct) return 'Wrong Product';
  if (item.isExchange) return 'Exchange';
  if (item.isSample) return 'Sample';
  return 'Normal';
};

// @desc    Process a new sale
// @route   POST /api/sales
// @access  Private
export const createSale = async (req, res, next) => {
  try {
    const { items, customer, paymentMethod, tax = 0, discount = 0, transporter = {} } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in sale' });
    }

    // Fetch settings for invoice prefix
    const settings = await Setting.findOne({ storeId: req.user.storeId });
    const prefix = settings?.sales?.invoicePrefix || 'INV-';

    let totalAmount = 0;
    let totalWeight = 0;
    const processedItems = [];

    // 1. Validate items and update stock
    for (const item of items) {
      const product = await Product.findOne({ _id: item.product, storeId: req.user.storeId });
      
      if (!product || !product.isActive) {
        throw new Error(`Product ${item.name || item.product} not found`);
      }

      const boxes = parseInt(item.quantity) || 0;
      const pieces = parseInt(item.pieces) || 0;
      const piecesPerBox = product.pieces_per_box || 1;
      const weightPerUnit = product.weight_of_unit || 0;

      if (boxes === 0 && pieces === 0) {
        throw new Error(`Cannot sell 0 quantity for ${product.name}`);
      }

      // Validate total stock (boxes + pieces)
      const totalPiecesRequested = (boxes * piecesPerBox) + pieces;
      const totalPiecesAvailable = (product.quantity * piecesPerBox) + product.ava_pieces;

      if (totalPiecesAvailable < totalPiecesRequested) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity} boxes, ${product.ava_pieces} loose pieces.`);
      }

      // Decrement box stock
      product.quantity -= boxes;

      // Decrement loose pieces
      if (pieces > 0) {
        product.ava_pieces -= pieces;
        // If ava_pieces goes negative, open new boxes until positive
        while (product.ava_pieces < 0) {
          if (product.quantity < 1) {
            throw new Error(`Cannot open new box for ${product.name} — no more boxes in stock`);
          }
          product.quantity -= 1;
          product.ava_pieces += piecesPerBox;
        }
      }

      await product.save();

      // Calculate weight contribution
      const pieceWeight = weightPerUnit / piecesPerBox;
      const itemWeight = (boxes * weightPerUnit) + (pieces * pieceWeight);
      totalWeight += itemWeight;

      // Pricing: pricePerPiece = box_price / pieces_per_box
      const pricePerPiece = product.price / piecesPerBox;

      // Calculate subtotal - Damaged and Wrong Products are free (reporting only)
      const isFree = item.isDamaged || item.isWrongProduct;
      const boxSubtotal = isFree ? 0 : (boxes * item.price);
      const pieceSubtotal = isFree ? 0 : (pieces * pricePerPiece);
      const itemSubtotal = boxSubtotal + pieceSubtotal;
      totalAmount += itemSubtotal;
      
      processedItems.push({
        product: product._id,
        name: product.name,
        brand: product.brand,
        quantity: boxes,
        pieces,
        pricePerPiece: parseFloat(pricePerPiece.toFixed(2)),
        weight: parseFloat(itemWeight.toFixed(3)),
        price: item.price,
        subtotal: parseFloat(itemSubtotal.toFixed(2)),
        isDamaged: !!item.isDamaged,
        isExchange: false, // Exchange happens after sale, removed from POS
        isSample: !!item.isSample,
        isWrongProduct: !!item.isWrongProduct,
        statusHistory: [{
          status: getStatusString(item),
          reason: item.statusReason || 'Initial sale',
          updatedBy: req.user.id
        }]
      });
    }

    // Generate Invoice Number: #inv-DDMMYYCC (CC = daily count)
    const date = new Date();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    
    // Count how many sales were created today for this store to get the daily counter
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    const dailyCount = await Sale.countDocuments({
      storeId: req.user.storeId,
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    });
    const counter = (dailyCount + 1).toString();
    const invoiceNumber = `#inv-${day}${month}${year}${counter}`;

    // Final total calculation — guard against NaN if client sends undefined/null
    const safeTax = isNaN(Number(tax)) ? 0 : Number(tax);
    const safeDiscount = isNaN(Number(discount)) ? 0 : Number(discount);
    const finalTotal = totalAmount + safeTax - safeDiscount;

    // 2. Create Sale Record
    const sale = await Sale.create({
      invoiceNumber,
      items: processedItems,
      totalAmount: parseFloat(finalTotal.toFixed(2)),
      tax: safeTax,
      discount: safeDiscount,
      paymentMethod,
      customer,
      transporter: {
        name: transporter.name || '',
        mobile: transporter.mobile || '',
        vehicleType: transporter.vehicleType || '',
        vehicleNumber: transporter.vehicleNumber || '',
      },
      totalWeight: parseFloat(totalWeight.toFixed(3)),
      storeId: req.user.storeId,
      branchId: req.user.role === 'admin' ? req.body.branchId || null : req.user.branchId,
      soldBy: req.user.id,
    });

    // 3. Return populated sale
    const savedSale = await Sale.findById(sale._id)
      .populate('items.product')
      .populate('items.product.category')
      .populate('items.statusHistory.updatedBy', 'fullName username')
      .populate('storeId', 'name')
      .populate('soldBy', 'fullName username phone');

    // 3. Log Notification
    await logAction({
      storeId: req.user.storeId,
      message: `New sale completed: ${invoiceNumber} by ${req.user.fullName}`,
      type: 'sale',
      performedBy: req.user.id,
      metadata: { saleId: savedSale._id, invoiceNumber }
    });

    res.status(201).json({
      success: true,
      message: 'Sale processed successfully',
      data: savedSale,
    });
  } catch (error) {
    console.error('SALE CREATION ERROR:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all sales (paginated)
// @route   GET /api/sales
// @access  Private
export const getSales = async (req, res, next) => {
  try {
    const { startDate, endDate, branchId, soldBy, search, page = 1, limit = 20 } = req.query;
    const query = { storeId: req.user.storeId };

    // Access Control: Staff can only see their own sales
    if (req.user.role === 'staff') {
      query.soldBy = req.user.id;
    } else if (req.user.role !== 'admin' && req.user.branchId) {
      query.branchId = req.user.branchId;
    } else if (branchId) {
      query.branchId = branchId;
    }

    if (soldBy) query.soldBy = soldBy;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Server-side fuzzy search by invoice number or customer name/phone
    if (search && search.trim()) {
      const tokens = search.trim().split(/\s+/).filter(Boolean);
      query.$and = tokens.map(token => {
        const fuzzyPattern = token.split('').map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
        return {
          $or: [
            { invoiceNumber: { $regex: fuzzyPattern, $options: 'i' } },
            { 'customer.name': { $regex: fuzzyPattern, $options: 'i' } },
            { 'customer.phone': { $regex: fuzzyPattern, $options: 'i' } },
          ]
        };
      });
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [sales, total] = await Promise.all([
      Sale.find(query)
        .populate('items.product')
        .populate('items.product.category')
        .populate('items.statusHistory.updatedBy', 'fullName username')
        .populate('storeId', 'name')
        .populate('soldBy', 'fullName username phone')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum),
      Sale.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: sales.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
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
    const query = { storeId: req.user.storeId };
    
    // Branch filtering
    if (req.user.role !== 'admin' && req.user.branchId) {
      query.branchId = req.user.branchId;
    } else if (req.query.branchId) {
      query.branchId = req.query.branchId;
    }

    // 1. Daily Revenue (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyRevenue = await Sale.aggregate([
      { $match: { ...query, createdAt: { $gte: sevenDaysAgo } } },
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
      { $match: query },
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
      { $match: query },
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

// @desc    Import sales from CSV/Excel
// @route   POST /api/sales/import
// @access  Private
export const importSales = async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Invalid items data' });
    }

    // Fetch settings for defaults
    const settings = await Setting.findOne({ storeId: req.user.storeId });
    const defaultTaxRate = (settings?.sales?.defaultTax || 0) / 100;
    const prefix = settings?.sales?.invoicePrefix || 'INV-';

    const importedSales = [];
    const errors = [];

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      try {
        // 1. Find the product
        const product = await Product.findOne({
          $or: [
            { sku: row.sku?.trim() },
            { name: new RegExp(`^${row.productName?.trim()}$`, 'i') }
          ]
        });

        if (!product) {
          errors.push(`Row ${i + 1}: Product not found (${row.sku || row.productName})`);
          continue;
        }

        const quantity = Number(row.quantity) || 1;
        const price = Number(row.price) || product.price;

        if (product.quantity < quantity) {
          errors.push(`Row ${i + 1}: Insufficient stock for ${product.name}`);
          continue;
        }

        // 2. Update stock
        product.quantity -= quantity;
        await product.save();

        // 3. Calculate financial data
        const isFree = !!row.isDamaged || !!row.isWrongProduct;
        const subtotal = isFree ? 0 : quantity * price;
        // Use default tax rate from settings if not provided in row
        const tax = row.tax ? Number(row.tax) : subtotal * defaultTaxRate; 
        const finalTotal = subtotal + tax - (Number(row.discount) || 0);

        // Generate invoice number: #inv-DDMMYYCC
        const date = row.date ? new Date(row.date) : new Date();
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
        const dailyCount = await Sale.countDocuments({
          storeId: req.user.storeId,
          createdAt: { $gte: startOfDay, $lt: endOfDay }
        });
        const counter = (dailyCount + 1).toString();
        const invoiceNumber = `#inv-${day}${month}${year}${counter}`;

        // 4. Prepare Sale data
        importedSales.push({
          invoiceNumber,
          items: [{
            product: product._id,
            name: product.name,
            quantity,
            price,
            subtotal,
            isSample: !!row.isSample,
            isDamaged: !!row.isDamaged,
            isWrongProduct: !!row.isWrongProduct,
            statusHistory: [{
              status: getStatusString(row),
              reason: 'Bulk Import',
              updatedBy: req.user.id
            }]
          }],
          totalAmount: finalTotal,
          tax,
          discount: Number(row.discount) || 0,
          paymentMethod: (row.paymentMethod || 'cash').toLowerCase(),
          customer: {
            name: row.customerName || 'Walk-in Customer',
            phone: row.customerPhone || ''
          },
          storeId: req.user.storeId,
          soldBy: req.user.id,
          createdAt: date
        });

      } catch (err) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    if (importedSales.length === 0) {
      throw new Error(`No valid sales to import. Errors: ${errors.join(', ')}`);
    }

    // 5. Bulk Create
    const results = await Sale.create(importedSales);

    // 6. Log Notification
    await logAction({
      storeId: req.user.storeId,
      message: `Bulk Import: ${results.length} sales imported by ${req.user.fullName}`,
      type: 'sale',
      performedBy: req.user.id,
      metadata: { count: results.length, errorsCount: errors.length }
    });

    res.status(201).json({
      success: true,
      message: `Successfully imported ${results.length} sales`,
      errors: errors.length > 0 ? errors : null
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update a sale item status
// @route   PUT /api/sales/:saleId/items/:itemId
// @access  Private
export const updateSaleItem = async (req, res, next) => {
  try {
    const { saleId, itemId } = req.params;
    const { isDamaged, isExchange, isSample, isWrongProduct, statusReason } = req.body;

    const sale = await Sale.findById(saleId);
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

    // Security check: Only admin, manager, or the person who made the sale can update it
    const isOwner = sale.soldBy.toString() === req.user.id.toString();
    const isPrivileged = ['admin', 'manager'].includes(req.user.role);
    
    if (!isPrivileged && !isOwner) {
      return res.status(403).json({ success: false, message: 'You can only update your own sales' });
    }

    // Find item in items array
    const item = sale.items.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found in sale' });

    // --- Inventory Synchronization Logic ---
    // If we mark as Wrong Product or Exchange, it usually means the customer returned the original item.
    // We should put the stock back (+ quantity) for that product.
    const wasNormal = !item.isWrongProduct && !item.isExchange;
    const isNowIncident = isWrongProduct || isExchange;

    if (wasNormal && isNowIncident) {
      // Return to stock
      await Product.findByIdAndUpdate(
        item.product, 
        { $inc: { quantity: item.quantity } }
      );
    } else if (!wasNormal && !isNowIncident) {
      // Re-selling the item (remove from stock)
      const product = await Product.findById(item.product);
      if (product.quantity < item.quantity) {
        throw new Error(`Insufficient stock to re-activate this item for ${product.name}`);
      }
      product.quantity -= item.quantity;
      await product.save();
    }

    // Update flags
    item.statusReason = statusReason !== undefined ? statusReason : item.statusReason;

    // Track status history
    const oldStatus = getStatusString({ ...item.toObject(), isDamaged: !isDamaged, isExchange: !isExchange, isSample: !isSample, isWrongProduct: !isWrongProduct }); // This is tricky, let's just check if flags changed
    
    const statusChanged = 
      (isDamaged !== undefined && isDamaged !== item.toObject().isDamaged) ||
      (isExchange !== undefined && isExchange !== item.toObject().isExchange) ||
      (isSample !== undefined && isSample !== item.toObject().isSample) ||
      (isWrongProduct !== undefined && isWrongProduct !== item.toObject().isWrongProduct);

    if (statusChanged) {
      item.statusHistory.push({
        status: getStatusString({
          isDamaged: isDamaged !== undefined ? isDamaged : item.isDamaged,
          isExchange: isExchange !== undefined ? isExchange : item.isExchange,
          isSample: isSample !== undefined ? isSample : item.isSample,
          isWrongProduct: isWrongProduct !== undefined ? isWrongProduct : item.isWrongProduct,
        }),
        reason: statusReason || 'Status updated',
        updatedBy: req.user.id
      });
    }

    // Update flags (moved after history check to use old values for comparison if needed, but we already handled it)
    item.isDamaged = isDamaged !== undefined ? isDamaged : item.isDamaged;
    item.isExchange = isExchange !== undefined ? isExchange : item.isExchange;
    item.isSample = isSample !== undefined ? isSample : item.isSample;
    item.isWrongProduct = isWrongProduct !== undefined ? isWrongProduct : item.isWrongProduct;

    // Recalculate item subtotal
    // Damaged and Wrong Products are free. Normal and Sample are paid.
    const isFree = item.isDamaged || item.isWrongProduct;
    const boxSubtotal = isFree ? 0 : (item.quantity * item.price);
    const pieceSubtotal = isFree ? 0 : (item.pieces * (item.pricePerPiece || 0));
    item.subtotal = parseFloat((boxSubtotal + pieceSubtotal).toFixed(2));

    // Recalculate sale totalAmount based on new subtotals
    const itemsTotal = sale.items.reduce((acc, it) => acc + it.subtotal, 0);
    sale.totalAmount = itemsTotal + (sale.tax || 0) - (sale.discount || 0);

    await sale.save();

    // Log Notification for Admin if updated by manager or staff
    if (req.user.role !== 'admin') {
      await logAction({
        storeId: req.user.storeId,
        message: `${req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1)} ${req.user.fullName} updated sale status for ${sale.invoiceNumber}`,
        type: 'sale',
        performedBy: req.user.id,
        metadata: { saleId: sale._id, itemId }
      });
    }

    const updatedSale = await Sale.findById(saleId)
      .populate('items.product')
      .populate('items.product.category')
      .populate('items.statusHistory.updatedBy', 'fullName username')
      .populate('storeId', 'name')
      .populate('soldBy', 'fullName');

    res.status(200).json({ success: true, data: updatedSale });
  } catch (error) {
    next(error);
  }
};
