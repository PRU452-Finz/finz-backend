'use strict';

/**
 * Chat Routes
 * POST /api/chat/ask — Kirim pesan ke AI chatbot
 */

const express = require('express');
const router  = express.Router();
const authMiddleware  = require('../middlewares/authMiddleware');
const chatController  = require('../controllers/chatController');

router.use(authMiddleware);

router.post('/ask', chatController.askChat);

module.exports = router;
