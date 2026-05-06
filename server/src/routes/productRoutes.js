import express from 'express';
import {
  getProducts,
  getProductStats,
  getProduct,
  createProduct,
  updateProduct,
  adjustStock,
  deleteProduct,
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/stats', getProductStats);
router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', authorize('admin', 'manager'), createProduct);
router.put('/:id', authorize('admin', 'manager'), updateProduct);
router.patch('/:id/stock', adjustStock);
router.delete('/:id', authorize('admin'), deleteProduct);

export default router;
