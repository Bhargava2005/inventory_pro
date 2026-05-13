import express from 'express';
import {
  exportInventory,
  exportSales,
  getAnalysisData,
  exportAnalysisExcel,
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/inventory/export', authorize('admin', 'manager'), exportInventory);
router.get('/sales/export', authorize('admin', 'manager'), exportSales);
router.get('/analysis', authorize('admin', 'manager', 'staff'), getAnalysisData);
router.get('/analysis/export', authorize('admin', 'manager', 'staff'), exportAnalysisExcel);

export default router;
