import express from 'express';
import { getEmployeeBehavior, getEmployeeDetail, exportEmployeesExcel } from '../controllers/employeeController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/behavior', authorize('admin', 'manager', 'staff'), getEmployeeBehavior);
router.get('/:id/detail', authorize('admin', 'manager', 'staff'), getEmployeeDetail);
router.post('/export', authorize('admin', 'manager'), exportEmployeesExcel);

export default router;
