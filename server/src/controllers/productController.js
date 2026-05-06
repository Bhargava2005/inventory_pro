import ExcelJS from 'exceljs';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

// @desc   Get all products (search, filter, sort, paginate)
// @route  GET /api/products
// @access Private
export const getProducts = async (req, res, next) => {
  try {
    const { search, category, sort = '-createdAt', page = 1, limit = 12, status } = req.query;

    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'all') query.category = category;

    if (status === 'low') {
      // Will be filtered post-query using the virtual — use aggregate instead
      const all = await Product.find(query).populate('category', 'name color');
      const low = all.filter((p) => p.quantity > 0 && p.quantity <= p.minStockLevel);
      return res.status(200).json({ success: true, count: low.length, total: low.length, data: low });
    }

    if (status === 'out') {
      query.quantity = 0;
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
    const total = await Product.countDocuments({ isActive: true });
    const outOfStock = await Product.countDocuments({ isActive: true, quantity: 0 });

    // low stock: quantity > 0 AND quantity <= minStockLevel
    const allActive = await Product.find({ isActive: true }, { quantity: 1, minStockLevel: 1 });
    const lowStock = allActive.filter((p) => p.quantity > 0 && p.quantity <= p.minStockLevel).length;
    const inStock = total - outOfStock - lowStock;

    // Total inventory value
    const valueAgg = await Product.aggregate([
      { $match: { isActive: true } },
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
    const { name, category, description, price, costPrice, quantity, minStockLevel, unit, supplier, sku } = req.body;

    const product = await Product.create({
      name, category: category || null, description, price, costPrice, quantity, minStockLevel,
      unit, supplier, sku, createdBy: req.user.id,
    });

    await product.populate('category', 'name color');
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
    const { name, category, description, price, costPrice, quantity, minStockLevel, unit, supplier } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, category: category || null, description, price, costPrice, quantity, minStockLevel, unit, supplier },
      { new: true, runValidators: true }
    ).populate('category', 'name color');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
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

// @desc    Import products from Excel
// @route   POST /api/products/import
// @access  Private (Admin, Manager)
export const importProducts = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel file' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet(1);

    const productsToImport = [];
    const errors = [];

    // Skip header row
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;

      const [_, name, sku, categoryName, price, quantity, unit, description] = row.values;

      if (!name || !sku || !price) {
        errors.push(`Row ${rowNumber}: Name, SKU, and Price are required`);
        return;
      }

      productsToImport.push({
        name,
        sku: sku.toString(),
        categoryName,
        price: Number(price),
        quantity: Number(quantity) || 0,
        unit: unit || 'pcs',
        description: description || '',
      });
    });

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const results = { created: 0, updated: 0 };

    for (const item of productsToImport) {
      let categoryId = null;
      if (item.categoryName) {
        let category = await Category.findOne({ name: new RegExp(`^${item.categoryName}$`, 'i') });
        if (!category) {
          category = await Category.create({ name: item.categoryName });
        }
        categoryId = category._id;
      }

      const existingProduct = await Product.findOne({ sku: item.sku });
      if (existingProduct) {
        await Product.findByIdAndUpdate(existingProduct._id, { ...item, category: categoryId });
        results.updated++;
      } else {
        await Product.create({ ...item, category: categoryId });
        results.created++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Import complete: ${results.created} created, ${results.updated} updated`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};
