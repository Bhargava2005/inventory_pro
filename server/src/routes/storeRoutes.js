import express from 'express';
import {
  getStores,
  getStore,
  createStore,
  updateStore,
  deleteStore,
} from '../controllers/storeController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize('admin', 'manager'), getStores)
  .post(authorize('admin'), createStore);

router.route('/:id')
  .get(getStore)
  .put(authorize('admin', 'manager'), updateStore)
  .delete(authorize('admin'), deleteStore);

export default router;
