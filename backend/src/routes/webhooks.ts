import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/whatsapp/msg91', async (req, res) => {
  try {
    const { message_id, status, phone } = req.body;

    if (!message_id) {
      return res.status(400).json({ error: 'message_id required' });
    }

    const updateResult = await prisma.deliveryLog.updateMany({
      where: { externalId: message_id },
      data: {
        status: status === 'delivered' ? 'DELIVERED' : status === 'read' ? 'READ' : 'FAILED',
        updatedAt: new Date(),
      },
    });

    res.json({ success: true, updated: updateResult.count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/whatsapp/gupshup', async (req, res) => {
  try {
    const { messageId, status } = req.body;

    if (!messageId) {
      return res.status(400).json({ error: 'messageId required' });
    }

    const updateResult = await prisma.deliveryLog.updateMany({
      where: { externalId: messageId },
      data: {
        status: status === 'delivered' ? 'DELIVERED' : status === 'read' ? 'READ' : 'FAILED',
        updatedAt: new Date(),
      },
    });

    res.json({ success: true, updated: updateResult.count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
