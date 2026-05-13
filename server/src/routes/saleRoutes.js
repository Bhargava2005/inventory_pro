import express from 'express';
import {
  createSale,
  getSales,
  getSalesStats,
  importSales,
  updateSaleItem,
} from '../controllers/saleController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getSales)
  .post(createSale);

router.put('/:saleId/items/:itemId', updateSaleItem);

router.get('/stats', authorize('admin', 'manager'), getSalesStats);
router.post('/import', authorize('admin', 'manager'), importSales);

export default router;
