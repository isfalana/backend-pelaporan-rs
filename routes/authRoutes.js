const express = require('express');
const router = express.Router();
// [MODIFIKASI] Import resetPassword untuk endpoint forgot/reset password
const { login, getProfile, updateFcmToken, resetPassword } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', login);
// [MODIFIKASI] Route publik untuk reset/forgot password
router.post('/reset-password', resetPassword);
router.get('/profile', authMiddleware, getProfile);
router.put('/fcm-token', authMiddleware, updateFcmToken);

module.exports = router;
