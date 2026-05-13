import express from 'express';
import { getNotifications, markAsRead, deleteNotification, clearNotifications, replyNotification } from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'manager'), getNotifications);
router.delete('/', authorize('admin', 'manager'), clearNotifications);
router.put('/:id/read', authorize('admin', 'manager'), markAsRead);
router.delete('/:id', authorize('admin', 'manager'), deleteNotification);
router.post('/:id/reply', authorize('admin', 'manager'), replyNotification);

export default router;
