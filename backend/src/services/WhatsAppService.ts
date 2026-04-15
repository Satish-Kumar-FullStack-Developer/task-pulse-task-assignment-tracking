import axios from 'axios';

export interface WhatsAppMessage {
  phone: string;
  templateName: string;
  parameters: string[];
  externalId?: string;
}

export class WhatsAppService {
  private static provider = process.env.WHATSAPP_PROVIDER || 'msg91';

  static async sendMessage(message: WhatsAppMessage): Promise<{
    success: boolean;
    externalId?: string;
    error?: string;
  }> {
    try {
      if (this.provider === 'msg91') {
        return await this.sendMsg91(message);
      } else if (this.provider === 'gupshup') {
        return await this.sendGupshup(message);
      }

      return { success: false, error: 'Unknown WhatsApp provider' };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private static async sendMsg91(message: WhatsAppMessage) {
    const authKey = process.env.MSG91_AUTH_KEY;
    const route = process.env.MSG91_ROUTE || '1';

    if (!authKey) {
      return { success: false, error: 'MSG91_AUTH_KEY not configured' };
    }

    const formattedPhone = message.phone.replace(/\D/g, '').slice(-10);

    try {
      const response = await axios.post(
        'https://api.msg91.com/api/v5/whatsapp/send',
        {
          template_id: message.templateName,
          recipients: [
            {
              mobiles: `91${formattedPhone}`,
              name: 'User',
            },
          ],
          values: message.parameters,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authkey': authKey,
          },
        }
      );

      const messageId = response.data?.message?.[0]?.messageid;
      return {
        success: response.data?.type === 'success',
        externalId: messageId,
      };
    } catch (error: any) {
      throw error;
    }
  }

  private static async sendGupshup(message: WhatsAppMessage) {
    const apiKey = process.env.GUPSHUP_API_KEY;
    const appName = process.env.GUPSHUP_APP_NAME;

    if (!apiKey || !appName) {
      return { success: false, error: 'Gupshup credentials not configured' };
    }

    const formattedPhone = message.phone.replace(/\D/g, '').slice(-10);

    try {
      const response = await axios.post(
        'https://api.gupshup.io/wa/api/v1/msg',
        {
          channel: 'whatsapp',
          source: '919999999999',
          destination: `91${formattedPhone}`,
          'message-type': 'template',
          'template-id': message.templateName,
          'template-params': message.parameters,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-Gupshup-Api-Key': apiKey,
          },
        }
      );

      return {
        success: response.data?.status === 'submitted',
        externalId: response.data?.messageId,
      };
    } catch (error: any) {
      throw error;
    }
  }

  static async simulateDelivery(externalId: string) {
    return { success: true };
  }
}
