import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { DELIVERY_STATUS } from '../constants';

const router = Router();
const prisma = new PrismaClient();

router.post('/whatsapp/msg91', async (req: Request, res: Response) => {
  try {
    const { message_id, status, phone } = req.body;

    if (!message_id) {
      return res.status(400).json({ error: 'message_id required' });
    }

    const updateResult = await prisma.deliveryLog.updateMany({
      where: { externalId: message_id },
      data: {
        status: status === 'delivered' ? DELIVERY_STATUS.DELIVERED : status === 'read' ? DELIVERY_STATUS.READ : DELIVERY_STATUS.FAILED,
        updatedAt: new Date(),
      },
    });

    res.json({ success: true, updated: updateResult.count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/whatsapp/gupshup', async (req: Request, res: Response) => {
  try {
    const { messageId, status } = req.body;

    if (!messageId) {
      return res.status(400).json({ error: 'messageId required' });
    }

    const updateResult = await prisma.deliveryLog.updateMany({
      where: { externalId: messageId },
      data: {
        status: status === 'delivered' ? DELIVERY_STATUS.DELIVERED : status === 'read' ? DELIVERY_STATUS.READ : DELIVERY_STATUS.FAILED,
        updatedAt: new Date(),
      },
    });

    res.json({ success: true, updated: updateResult.count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
