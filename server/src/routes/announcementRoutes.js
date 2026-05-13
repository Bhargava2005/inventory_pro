import express from 'express';
import { 
  createAnnouncement, 
  getActiveAnnouncement, 
  getAnnouncements, 
  deleteAnnouncement 
} from '../controllers/announcementController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/active', getActiveAnnouncement);

// Admin only routes
router.route('/')
  .get(authorize('admin'), getAnnouncements)
  .post(authorize('admin'), createAnnouncement);

router.delete('/:id', authorize('admin'), deleteAnnouncement);

export default router;
