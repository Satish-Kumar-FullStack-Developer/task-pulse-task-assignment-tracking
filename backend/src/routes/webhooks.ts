import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// WhatsApp delivery webhook (Msg91)
router.post('/whatsapp/msg91', async (req, res) => {
  try {
    const { message_id, status, phone } = req.body;

    console.log('Msg91 webhook received:', req.body);

    if (!message_id) {
      return res.status(400).json({ error: 'message_id required' });
    }

    // Update delivery log
    const updateResult = await prisma.deliveryLog.updateMany({
      where: { externalId: message_id },
      data: {
        status: status === 'delivered' ? 'DELIVERED' : status === 'read' ? 'READ' : 'FAILED',
        updatedAt: new Date(),
      },
    });

    console.log(`Updated ${updateResult.count} delivery logs`);

    res.json({ success: true, updated: updateResult.count });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// WhatsApp delivery webhook (Gupshup)
router.post('/whatsapp/gupshup', async (req, res) => {
  try {
    const { messageId, status } = req.body;

    console.log('Gupshup webhook received:', req.body);

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

    console.log(`Updated ${updateResult.count} delivery logs`);

    res.json({ success: true, updated: updateResult.count });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
