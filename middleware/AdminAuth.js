// middleware/adminAuth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.adminAuth = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access only' });
    }

    req.user = user;  // ✅ CRITICAL — sets req.user so controller can use req.user.id
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};