const express = require('express');
const axios = require('axios');
const paypalConfig = require('../config/paypalConfig');
const db = require('../config/db');
const router = express.Router();

// Helper function to get access token
async function getAccessToken() {
  const url = 'https://api.paypal.com/v1/oauth2/token';
  const auth = Buffer.from(`${paypalConfig.client_id}:${paypalConfig.secret}`).toString('base64');
  const response = await axios.post(url, 'grant_type=client_credentials', {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  });
  return response.data.access_token;
}

// Create PayPal Order (new approach with OAuth)
router.post('/create-paypal-order', async (req, res) => {
  const { userID, orderID, totalAmount } = req.body;
  const accessToken = await getAccessToken();

  if (!userID || !orderID || !totalAmount) {
    return res.status(400).send('Missing required information');
  }

  const orderData = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: 'USD',
          value: totalAmount.toFixed(2), 
        },
      },
    ],
  };

  try {
    const response = await axios.post('https://api.paypal.com/v2/checkout/orders', orderData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    const approvalUrl = response.data.links.find(link => link.rel === 'approve').href;
    res.json({
      orderId: response.data.id,
      approvalUrl: approvalUrl,
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).send('Failed to create PayPal order');
  }
});

// Capture PayPal Payment
router.post('/capture-paypal-order', async (req, res) => {
  const { orderID } = req.body;
  const accessToken = await getAccessToken();

  if (!orderID) {
    return res.status(400).send('Missing PayPal order ID');
  }

  try {
    const response = await axios.post(`https://api.paypal.com/v2/checkout/orders/${orderID}/capture`, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (response.data.status === 'COMPLETED') {
      const updateQuery = 'UPDATE OrderTable SET status = ? WHERE orderID = ?';
      db.query(updateQuery, ['Completed', orderID], (err) => {
        if (err) {
          console.error('Error updating order status:', err);
          return res.status(500).send('Failed to update order status');
        }
        res.json({ message: 'Payment captured successfully' });
      });
    } else {
      res.status(500).send('Payment capture failed');
    }
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    res.status(500).send('Error capturing PayPal order');
  }
});

module.exports = router;
