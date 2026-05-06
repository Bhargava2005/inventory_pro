import express from 'express';
import {
  exportInventory,
  exportSales,
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'manager'));

router.get('/inventory/export', exportInventory);
router.get('/sales/export', exportSales);

export default router;
