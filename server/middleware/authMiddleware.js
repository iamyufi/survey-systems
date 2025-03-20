// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // Try to get token from Authorization header (Bearer format)
    let token = req.headers.authorization?.split(' ')[1];
    
    // If no Bearer token, check x-auth-token header
    if (!token) {
      token = req.header('x-auth-token');
    }
    
    // Check if no token
    if (!token) {
      return res.status(401).json({ 
        msg: 'No token, authorization denied',
        details: 'No token found in Authorization or x-auth-token headers'
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your-secret-key'
    );
    
    // Add user from payload
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Authentication error:', err);

    // Provide more detailed error response
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        msg: 'Token expired', 
        details: 'Your session has expired. Please log in again.' 
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        msg: 'Invalid token', 
        details: 'The provided token is not valid.' 
      });
    }

    res.status(401).json({ 
      msg: 'Token is not valid', 
      details: err.message 
    });
  }
};