import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { AuthRequest } from '../types';

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Access token required'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthRequest['user'];
    req.user = decoded;
    next();
  } catch (error: unknown) {
    const jwtError = error as { name?: string };
    if (jwtError.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: 'Token expired'
      });
      return;
    }
    res.status(403).json({
      success: false,
      error: 'Invalid token'
    });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
    return;
  }
  next();
}
