const express = require('express');
const { sendOtp, verifyOtp, registerUser, loginAdmin, login, socialLogin, linkPhoneNumber, updateProfile, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register', registerUser);
router.post('/login/admin', loginAdmin);
router.post('/login', login);
router.post('/social-login', socialLogin);
router.post('/link-phone', protect, linkPhoneNumber);
router.put('/profile', protect, updateProfile);
router.delete('/delete-account', protect, deleteAccount);

module.exports = router;
