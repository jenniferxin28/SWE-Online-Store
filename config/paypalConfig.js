const paypal = require('@paypal/checkout-server-sdk');
const axios = require('axios');

// Set up PayPal SDK environment
const environment = new paypal.core.SandboxEnvironment(
  'AbqAGEQazItY88IShmgn0ayvVIvWSGcCgyPBRGHbhiA-lqnkgZ6sVx2w9cjZsS1xPMtj3utJ5nlD31Cu',
  'EJuhnWtPi-Wv-mN2qruyT9402tYJItBOBdmOn9V-wWs25Ss-kzzfASVIT53S2UEW1Du21ko9Ams0jseb'
);

const client = new paypal.core.PayPalHttpClient(environment);

// Base URL for PayPal API
const baseUrl = 'https://api.sandbox.paypal.com';

// Function to get an access token for custom HTTP calls
async function getAccessToken() {
  const auth = Buffer.from(
    `${environment.clientId}:${environment.clientSecret}`
  ).toString('base64');
  try {
    const response = await axios.post(
      `${baseUrl}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('Error fetching access token:', error.response.data);
    throw error;
  }
}

module.exports = {
  client, // For SDK usage
  getAccessToken, // For custom HTTP calls
};
