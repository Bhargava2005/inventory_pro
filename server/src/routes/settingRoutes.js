import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// All authenticated users (including staff) can READ settings for tax rates, invoice prefix, etc.
router.get('/', getSettings);

// Only admin and manager can UPDATE settings
router.put('/', authorize('admin', 'manager'), updateSettings);

export default router;
