import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get current user
router.get('/me', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        managerId: true,
        phone: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get employees (for manager's assignment dropdown)
router.get('/employees', async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Only managers can view employees' });
    }

    // Get employees managed by this manager
    const employees = await prisma.user.findMany({
      where: {
        role: 'EMPLOYEE',
        managerId: req.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    res.json(employees);
  } catch (error: any) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
