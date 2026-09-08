import { verifyToken, extractToken } from '../utils/jwt.js';
import { ROLES } from '../config/constants.js';

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);

    if (!token) {
      return res.status(401).json({
        error: 'No token provided',
        code: 'UNAUTHORIZED',
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'UNAUTHORIZED',
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Authentication error',
      code: 'SERVER_ERROR',
    });
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authenticated',
        code: 'UNAUTHORIZED',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
      });
    }

    next();
  };
};

export const requireAdmin = authorize(ROLES.ADMIN);
export const requireDriver = authorize(ROLES.DRIVER);
export const requireStudent = authorize(ROLES.STUDENT);
export const requireAdminOrDriver = authorize(ROLES.ADMIN, ROLES.DRIVER);
