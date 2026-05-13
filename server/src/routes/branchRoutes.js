import express from 'express';
import {
  getBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch,
} from '../controllers/branchController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getBranches)
  .post(authorize('admin'), createBranch);

router.route('/:id')
  .get(getBranch)
  .put(authorize('admin', 'manager'), updateBranch)
  .delete(authorize('admin'), deleteBranch);

export default router;
