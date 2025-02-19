// services/utmifyService.js
const axios = require('axios');

class UtmifyService {
  constructor() {
    this.apiToken = '8uQ4ZJcEhKnO2ZWmkdynb4DO4QQYPPWVQxFI';
    this.baseUrl = 'https://api.utmify.com.br/api-credentials/orders';
  }

  async sendOrder(transactionData, user, trackingParams = {}) {
    try {
      const now = new Date();
      const payload = {
        orderId: transactionData.transactionId,
        platform: "BsPay",
        paymentMethod: "pix",
        status: this._mapStatus(transactionData.status),
        createdAt: this._formatDate(transactionData.createdAt || now),
        approvedDate: transactionData.status === 'completed' ? this._formatDate(now) : null,
        refundedAt: null,
        customer: {
          name: user.name,
          email: user.email,
          phone: null,
          document: user.cpf,
          country: "BR",
          ip: trackingParams.ip || null
        },
        products: [{
          id: transactionData.transactionId,
          name: "Winb",
          planId: null,
          planName: null,
          quantity: 1,
          priceInCents: Math.round(transactionData.amount * 100)
        }],
        trackingParameters: {
          src: null,
          sck: null,
          utm_source: trackingParams.utm_source || null,
          utm_campaign: trackingParams.utm_campaign || null,
          utm_medium: trackingParams.utm_medium || null,
          utm_content: trackingParams.utm_content || null,
          utm_term: trackingParams.utm_term || null
        },
        commission: {
          totalPriceInCents: Math.round(transactionData.amount * 100),
          gatewayFeeInCents: Math.round((transactionData.amount * 0.05) * 100),
          userCommissionInCents: Math.round((transactionData.amount * 0.95) * 100)
        },
        isTest: false
      };

      const response = await axios.post(this.baseUrl, payload, {
        headers: {
          'x-api-token': this.apiToken,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao enviar dados para Utmify:', error.response?.data || error.message);
      throw error;
    }
  }

  _mapStatus(status) {
    const statusMap = {
      'pending': 'waiting_payment',
      'completed': 'paid',
      'failed': 'refused',
      'refunded': 'refunded',
      'chargedback': 'chargedback'
    };
    return statusMap[status] || 'waiting_payment';
  }

  _formatDate(date) {
    return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
  }
}

module.exports = new UtmifyService();