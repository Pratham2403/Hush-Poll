const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth.middleware');
const { getAllPolls, deletePoll, suspendUser } = require('../controllers/admin.controller');

router.use(authenticate, isAdmin);

router.get('/polls', getAllPolls);
router.delete('/polls/:id', deletePoll);
router.patch('/users/:id/suspend', suspendUser);

module.exports = router;