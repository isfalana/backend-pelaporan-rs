const express = require('express');
const router = express.Router();
const { login, getProfile, updateFcmToken } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);
router.put('/fcm-token', authMiddleware, updateFcmToken);

module.exports = router;
