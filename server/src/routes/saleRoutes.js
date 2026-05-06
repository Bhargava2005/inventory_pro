import express from 'express';
import {
  createSale,
  getSales,
  getSalesStats,
} from '../controllers/saleController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getSales)
  .post(createSale);

router.get('/stats', authorize('admin', 'manager'), getSalesStats);

export default router;
