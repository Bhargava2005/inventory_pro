import ExcelJS from 'exceljs';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { logAction } from './notificationController.js';

// @desc   Get all products (search, filter, sort, paginate)
// @route  GET /api/products
// @access Private
export const getProducts = async (req, res, next) => {
  try {
    const { search, category, brand, sort = '-createdAt', page = 1, limit = 12, status } = req.query;

    const query = { isActive: true, storeId: req.user.storeId };

    // Branch-based filtering
    if (req.user.role !== 'admin' && req.user.branchId) {
      query.branchId = req.user.branchId;
    } else if (req.query.branchId) {
      query.branchId = req.query.branchId;
    }

    if (search) {
      const q = search.trim();
      
      // 1. Check for exact SKU match (Highest priority)
      const exactMatch = await Product.findOne({ 
        sku: { $regex: new RegExp(`^${q}$`, 'i') }, 
        storeId: req.user.storeId, 
        isActive: true 
      });

      if (exactMatch) {
        query._id = exactMatch._id;
      } else {
        // 2. Fallback to fuzzy search
        const tokens = q.split(/\s+/).filter(Boolean);
        query.$and = tokens.map(token => {
          const fuzzyPattern = token.split('').map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
          
          return {
            $or: [
              { name: { $regex: fuzzyPattern, $options: 'i' } },
              { sku: { $regex: fuzzyPattern, $options: 'i' } },
              { brand: { $regex: fuzzyPattern, $options: 'i' } },
              { supplier: { $regex: fuzzyPattern, $options: 'i' } },
            ],
          };
        });
      }
    }

    if (category && category !== 'all') query.category = category;
    if (brand && brand !== 'all') query.brand = brand;

    if (status === 'low') {
      query.$expr = {
        $and: [
          { $gt: ['$quantity', 0] },
          { $lte: ['$quantity', '$minStockLevel'] }
        ]
      };
    } else if (status === 'out') {
      query.quantity = 0;
    } else if (status === 'ok') {
      query.$expr = { $gt: ['$quantity', '$minStockLevel'] };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name color')
      .populate('createdBy', 'fullName')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      page: Number(page),
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Get dashboard stats
// @route  GET /api/products/stats
// @access Private
export const getProductStats = async (req, res, next) => {
  try {
    const query = { isActive: true, storeId: req.user.storeId };
    
    // Branch-based filtering
    if (req.user.role !== 'admin' && req.user.branchId) {
      query.branchId = req.user.branchId;
    } else if (req.query.branchId) {
      query.branchId = req.query.branchId;
    }

    const total = await Product.countDocuments(query);
    const outOfStock = await Product.countDocuments({ ...query, quantity: 0 });

    const allActive = await Product.find(query, { quantity: 1, minStockLevel: 1 });
    const lowStock = allActive.filter((p) => p.quantity > 0 && p.quantity <= p.minStockLevel).length;
    const inStock = total - outOfStock - lowStock;

    // Total inventory value
    const valueAgg = await Product.aggregate([
      { $match: query },
      { $group: { _id: null, totalValue: { $sum: { $multiply: ['$price', '$quantity'] } } } },
    ]);
    const totalValue = valueAgg[0]?.totalValue || 0;

    res.status(200).json({
      success: true,
      data: { total, inStock, lowStock, outOfStock, totalValue },
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Get single product
// @route  GET /api/products/:id
// @access Private
export const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name color')
      .populate('createdBy', 'fullName');

    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Security check
    if (req.user.role !== 'admin' && product.storeId.toString() !== req.user.storeId.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc   Create product
// @route  POST /api/products
// @access Private (admin, manager)
export const createProduct = async (req, res, next) => {
  try {
    const { 
      name, category, description, price, costPrice, quantity, minStockLevel, 
      unit, supplier, sku, branchId, brand, image, color,
      damagedStock, sampleStock, exchangedStock, wrongProductStock,
      pieces_per_box, ava_pieces, weight_of_unit, measurements
    } = req.body;

    // Auto-extract measurements from name if not provided
    const finalMeasurements = measurements || (name ? (name.match(/(\d+(?:\.\d+)?\s*[xX*]\s*\d+(?:\.\d+)?(?:\s*[xX*]\s*\d+(?:\.\d+)?)?)/)?.[0]?.replace(/\s+/g, '') || '') : '');

    // Verify category belongs to this store
    if (category) {
      const cat = await Category.findOne({ _id: category, storeId: req.user.storeId });
      if (!cat) return res.status(403).json({ success: false, message: 'Invalid category for this store' });
    }

    const assignedBranchId = req.user.role === 'admin' ? branchId : req.user.branchId;

    const product = await Product.create({
      name, category: category || null, description, price, costPrice, quantity, minStockLevel,
      unit, supplier, sku, brand, image, color,
      damagedStock: damagedStock || 0,
      sampleStock: sampleStock || 0,
      exchangedStock: exchangedStock || 0,
      wrongProductStock: wrongProductStock || 0,
      pieces_per_box: pieces_per_box || 1,
      ava_pieces: ava_pieces || 0,
      weight_of_unit: weight_of_unit || 0,
      measurements: finalMeasurements,
      createdBy: req.user.id,
      storeId: req.user.storeId,
      branchId: assignedBranchId || null
    });

    await product.populate('category', 'name color');

    if (req.user.role === 'manager') {
      await logAction({
        storeId: req.user.storeId,
        message: `Manager ${req.user.fullName} created product: ${product.name}`,
        type: 'inventory',
        performedBy: req.user.id,
        metadata: { productId: product._id }
      });
    }

    res.status(201).json({ success: true, message: 'Product created', data: product });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'SKU already exists. Leave blank for auto-generation.' });
    }
    next(error);
  }
};

// @desc   Update product
// @route  PUT /api/products/:id
// @access Private (admin, manager)
export const updateProduct = async (req, res, next) => {
  try {
    const { 
      name, category, description, price, costPrice, quantity, minStockLevel, 
      unit, supplier, brand, image, color,
      damagedStock, sampleStock, exchangedStock, wrongProductStock,
      pieces_per_box, ava_pieces, weight_of_unit, measurements
    } = req.body;

    const targetProduct = await Product.findById(req.params.id);
    if (!targetProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Security check
    if (req.user.role !== 'admin' && targetProduct.storeId.toString() !== req.user.storeId.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { 
        name, category: category || null, description, price, costPrice, quantity, minStockLevel, 
        unit, supplier, brand, image, color,
        damagedStock, sampleStock, exchangedStock, wrongProductStock,
        pieces_per_box: pieces_per_box ?? targetProduct.pieces_per_box,
        ava_pieces: ava_pieces ?? targetProduct.ava_pieces,
        weight_of_unit: weight_of_unit ?? targetProduct.weight_of_unit,
        measurements: measurements ?? (name ? (name.match(/(\d+(?:\.\d+)?\s*[xX*]\s*\d+(?:\.\d+)?(?:\s*[xX*]\s*\d+(?:\.\d+)?)?)/)?.[0]?.replace(/\s+/g, '') || '') : targetProduct.measurements),
      },
      { new: true, runValidators: true }
    ).populate('category', 'name color');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (req.user.role === 'manager') {
      await logAction({
        storeId: req.user.storeId,
        message: `Manager ${req.user.fullName} updated product: ${product.name}`,
        type: 'inventory',
        performedBy: req.user.id,
        metadata: { productId: product._id }
      });
    }

    res.status(200).json({ success: true, message: 'Product updated', data: product });
  } catch (error) {
    next(error);
  }
};

// @desc   Adjust stock
// @route  PATCH /api/products/:id/stock
// @access Private (admin, manager, staff)
export const adjustStock = async (req, res, next) => {
  try {
    const { adjustment, type = 'set' } = req.body; // type: 'set' | 'add' | 'subtract'

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (type === 'add') product.quantity += Number(adjustment);
    else if (type === 'subtract') product.quantity = Math.max(0, product.quantity - Number(adjustment));
    else product.quantity = Number(adjustment);

    await product.save();

    if (req.user.role === 'manager' || req.user.role === 'staff') {
      await logAction({
        storeId: req.user.storeId,
        message: `${req.user.role === 'manager' ? 'Manager' : 'Staff'} ${req.user.fullName} adjusted stock for ${product.name} to ${product.quantity}`,
        type: 'inventory',
        performedBy: req.user.id,
        metadata: { productId: product._id }
      });
    }

    res.status(200).json({ success: true, message: 'Stock updated', data: { quantity: product.quantity } });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete product (soft)
// @route  DELETE /api/products/:id
// @access Private (admin)
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Scan Excel headers
// @route   POST /api/products/import/scan
// @access  Private (Admin, Manager)
export const scanImportFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel file' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet(1);
    
    // Get headers from first row
    const firstRow = worksheet.getRow(1);
    const headers = [];
    firstRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      headers.push({
        name: cell.value ? cell.value.toString() : `Column ${colNumber}`,
        index: colNumber
      });
    });

    res.status(200).json({ success: true, data: { headers } });
  } catch (error) {
    next(error);
  }
};

// @desc    Import products from Excel with mapping
// @route   POST /api/products/import
// @access  Private (Admin, Manager)
export const importProducts = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel file' });
    }

    const mapping = JSON.parse(req.body.mapping || '{}');
    if (!mapping.name || !mapping.price) {
      return res.status(400).json({ success: false, message: 'Invalid mapping. Name and Price are required.' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet(1);

    const productsToImport = [];
    const errors = [];
    
    // Get header row to find column indexes
    const firstRow = worksheet.getRow(1);
    const colMap = {};
    
    // Reverse map: systemField -> colIndex
    Object.entries(mapping).forEach(([systemField, userHeader]) => {
      firstRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (cell.value && cell.value.toString() === userHeader) {
          colMap[systemField] = colNumber;
        }
      });
    });

    // Process rows starting from 2
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;

      const item = {};
      let hasError = false;

      // Extract values based on mapping
      Object.keys(mapping).forEach(field => {
        const colIndex = colMap[field];
        if (colIndex) {
          let val = row.getCell(colIndex).value;
          // Handle Excel formula or object results
          if (val && typeof val === 'object' && val.result !== undefined) val = val.result;
          item[field] = val;
        }
      });

      if (!item.name || !item.price) {
        errors.push(`Row ${rowNumber}: Mapped Name and Price columns must not be empty`);
        return;
      }

      productsToImport.push({
        ...item,
        sku: item.sku ? item.sku.toString() : null,
        brand: item.brand || '',
        price: Number(item.price),
        costPrice: item.costPrice ? Number(item.costPrice) : 0,
        quantity: Number(item.quantity) || 0,
        minStockLevel: Number(item.minStockLevel) || 5,
        unit: item.unit || 'pcs',
        supplier: item.supplier || '',
        color: item.color || '#3b82f6',
        image: item.image || '',
        description: item.description || '',
        // Stock-state fields from import
        damagedStock: Number(item.damagedStock) || 0,
        sampleStock: Number(item.sampleStock) || 0,
        exchangedStock: Number(item.exchangedStock) || 0,
        wrongProductStock: Number(item.wrongProductStock) || 0,
        // Piece-selling fields from import
        pieces_per_box: Number(item.pieces_per_box) || 1,
        ava_pieces: Number(item.ava_pieces) || 0,
        weight_of_unit: Number(item.weight_of_unit) || 0,
        measurements: item.measurements || (item.name ? (item.name.toString().match(/(\d+(?:\.\d+)?\s*[xX*]\s*\d+(?:\.\d+)?(?:\s*[xX*]\s*\d+(?:\.\d+)?)?)/)?.[0]?.replace(/\s+/g, '') || '') : ''),
        createdBy: req.user.id,
        storeId: req.user.storeId,
        branchId: req.user.role === 'admin' ? (req.body.branchId || item.branchId) : req.user.branchId
      });
    });

    if (errors.length > 0 && productsToImport.length === 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const results = { created: 0, updated: 0 };

    for (const item of productsToImport) {
      let categoryId = null;
      if (item.categoryName) {
        let category = await Category.findOne({ 
          name: new RegExp(`^${item.categoryName}$`, 'i'),
          storeId: req.user.storeId
        });
        if (!category) {
          category = await Category.create({ 
            name: item.categoryName,
            createdBy: req.user.id,
            storeId: req.user.storeId
          });
        }
        categoryId = category._id;
      }

      // If SKU is provided, try to update. Otherwise, create new.
      let existingProduct = null;
      if (item.sku) {
        existingProduct = await Product.findOne({ sku: item.sku });
      }

      if (existingProduct) {
        // Only update if it belongs to the target store
        if (existingProduct.storeId.toString() === item.storeId.toString()) {
          await Product.findByIdAndUpdate(existingProduct._id, { ...item, category: categoryId || existingProduct.category });
          results.updated++;
        } else {
          errors.push(`SKU ${item.sku} already exists in another store. Skipping.`);
        }
      } else {
        await Product.create({ ...item, category: categoryId });
        results.created++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Import complete: ${results.created} created, ${results.updated} updated`,
      data: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    next(error);
  }
};
// @desc   Get all unique brands
// @route  GET /api/products/brands
// @access Private
export const getBrands = async (req, res, next) => {
  try {
    const query = { isActive: true, storeId: req.user.storeId };
    
    // Branch-based filtering
    if (req.user.role !== 'admin' && req.user.branchId) {
      query.branchId = req.user.branchId;
    } else if (req.query.branchId) {
      query.branchId = req.query.branchId;
    }

    const brands = await Product.distinct('brand', query);
    
    res.status(200).json({
      success: true,
      data: brands.filter(Boolean).sort(),
    });
  } catch (error) {
    next(error);
  }
};
