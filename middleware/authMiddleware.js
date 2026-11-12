const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token and protect private routes
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from Bearer header string
      token = req.headers.authorization.split(' ')[1];

      // Verify token validity using secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach authenticated user data to request object (excluding password)
      req.user = await User.findById(decoded.id).select('-password');

      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };