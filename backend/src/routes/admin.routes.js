import express from 'express';
import { authenticate, isAdmin } from '../middleware/auth.middleware.js';
import { getAllPolls, deletePoll, suspendUser } from '../controllers/admin.controller.js';

const router = express.Router();

router.use(authenticate, isAdmin);

router.get('/polls', getAllPolls);
router.delete('/polls/:id', deletePoll);
router.patch('/users/:id/suspend', suspendUser);

export default router;