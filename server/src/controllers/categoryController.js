import Category from '../models/Category.js';
import Product from '../models/Product.js';

// @desc   Get all categories
// @route  GET /api/categories
// @access Private
export const getCategories = async (req, res, next) => {
  try {
    const query = { isActive: true };
    if (req.user.role !== 'admin') {
      query.storeId = req.user.storeId;
    }

    const categories = await Category.find(query)
      .populate('createdBy', 'fullName')
      .sort({ name: 1 })
      .lean();

    // Get product counts for each category
    const productCounts = await Product.aggregate([
      { $match: { isActive: true, storeId: req.user.storeId } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const countMap = productCounts.reduce((acc, curr) => {
      acc[curr._id?.toString()] = curr.count;
      return acc;
    }, {});

    const categoriesWithCounts = categories.map(cat => ({
      ...cat,
      productCount: countMap[cat._id.toString()] || 0
    }));

    res.status(200).json({ success: true, count: categories.length, data: categoriesWithCounts });
  } catch (error) {
    next(error);
  }
};

// @desc   Create category
// @route  POST /api/categories
// @access Private (admin, manager)
export const createCategory = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;
    
    const query = { name: { $regex: `^${name}$`, $options: 'i' } };
    if (req.user.role !== 'admin') {
      query.storeId = req.user.storeId;
    }

    const existing = await Category.findOne(query);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category already exists in this store' });
    }

    const category = await Category.create({ 
      name, description, color, 
      createdBy: req.user.id,
      storeId: req.user.storeId 
    });
    res.status(201).json({ success: true, message: 'Category created', data: category });
  } catch (error) {
    next(error);
  }
};

// @desc   Update category
// @route  PUT /api/categories/:id
// @access Private (admin, manager)
export const updateCategory = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;
    const targetCategory = await Category.findById(req.params.id);

    if (!targetCategory) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Security check
    if (req.user.role !== 'admin' && targetCategory.storeId.toString() !== req.user.storeId.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, color },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, message: 'Category updated', data: category });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete category (soft)
// @route  DELETE /api/categories/:id
// @access Private (admin, manager)
export const deleteCategory = async (req, res, next) => {
  try {
    const targetCategory = await Category.findById(req.params.id);

    if (!targetCategory) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Security check
    if (req.user.role !== 'admin' && targetCategory.storeId.toString() !== req.user.storeId.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};
