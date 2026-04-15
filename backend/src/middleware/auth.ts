import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production'
    ) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.userId = user.id;
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const managerOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'MANAGER') {
    return res.status(403).json({ error: 'Only managers can access this resource' });
  }
  next();
};

export const employeeOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'EMPLOYEE') {
    return res.status(403).json({ error: 'Only employees can access this resource' });
  }
  next();
};
