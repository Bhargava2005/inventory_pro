import Category from '../models/Category.js';

// @desc   Get all categories
// @route  GET /api/categories
// @access Private
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('createdBy', 'fullName')
      .sort({ name: 1 });

    res.status(200).json({ success: true, count: categories.length, data: categories });
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
    const existing = await Category.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }
    const category = await Category.create({ name, description, color, createdBy: req.user.id });
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
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, color },
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, message: 'Category updated', data: category });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete category (soft)
// @route  DELETE /api/categories/:id
// @access Private (admin)
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};
