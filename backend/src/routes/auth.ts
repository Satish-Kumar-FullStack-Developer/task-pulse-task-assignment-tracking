import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';

const router = Router();



router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginRequest;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production',
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key_change_in_production',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      refreshToken,
      user,
    });
  } catch (error) {
    
});

router.post('/refresh', (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key_change_in_production'
    ) as any;

    const newToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production',
      { expiresIn: '24h' }
    );

    res.json({ token: newToken });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

export default router;
