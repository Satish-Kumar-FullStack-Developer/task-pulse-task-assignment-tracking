import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { JWT, USER_ROLES } from '../constants';

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
      JWT.SECRET,
      { expiresIn: JWT.TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT.REFRESH_SECRET,
      { expiresIn: JWT.REFRESH_TOKEN_EXPIRY }
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
      JWT.REFRESH_SECRET
    ) as any;

    const newToken = jwt.sign(
      { userId: decoded.userId },
      JWT.SECRET,
      { expiresIn: JWT.TOKEN_EXPIRY }
    );

    res.json({ token: newToken });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

export default router;
