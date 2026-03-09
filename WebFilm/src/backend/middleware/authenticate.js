const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔐 Auth middleware:', {
    hasAuthHeader: !!authHeader,
    hasToken: !!token,
    path: req.path
  });

  if (!token) {
    console.error('❌ No token provided');
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id };
    console.log('✅ Token verified, userId:', decoded.id);
    next();
  } catch (err) {
    console.error('❌ Token verification failed:', err.message);
    return res.status(403).json({ error: 'Forbidden - Invalid token' });
  }
};

module.exports = authenticateToken;