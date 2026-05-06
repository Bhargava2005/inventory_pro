import express from 'express';
import multer from 'multer';
import {
  getProducts,
  getProductStats,
  getProduct,
  createProduct,
  updateProduct,
  adjustStock,
  deleteProduct,
  importProducts,
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

router.get('/stats', getProductStats);
router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', authorize('admin', 'manager'), createProduct);
router.put('/:id', authorize('admin', 'manager'), updateProduct);
router.patch('/:id/stock', adjustStock);
router.delete('/:id', authorize('admin'), deleteProduct);
router.post('/import', authorize('admin', 'manager'), upload.single('file'), importProducts);

export default router;
