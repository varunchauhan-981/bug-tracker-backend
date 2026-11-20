const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUsers,
  updateProfile,
  updatePassword,
  inviteMember
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/users', protect, getUsers);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.post('/invite', protect, inviteMember);

module.exports = router;