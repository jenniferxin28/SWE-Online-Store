const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const paypal = require('@paypal/checkout-server-sdk'); // PayPal SDK
const db = require('./config/db');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const paymentsRouter = require('./routes/payments');  // Import PayPal routes

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set view engine to EJS
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

// Session configuration
app.use(session({
  secret: 'test-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Session storing middleware
app.use((req, res, next) => {
  res.locals.loggedIn = req.session.loggedIn || false; 
  res.locals.username = req.session.username || null; 
  next();
});

// PayPal client configuration
const paypalClient = new paypal.core.PayPalHttpClient(new paypal.core.SandboxEnvironment(
  'AbqAGEQazItY88IShmgn0ayvVIvWSGcCgyPBRGHbhiA-lqnkgZ6sVx2w9cjZsS1xPMtj3utJ5nlD31Cu', // Replace with your PayPal sandbox client ID
  'EJuhnWtPi-Wv-mN2qruyT9402tYJItBOBdmOn9V-wWs25Ss-kzzfASVIT53S2UEW1Du21ko9Ams0jseb'      // Replace with your PayPal sandbox secret
));

// PayPal Order Creation Route
app.post('/api/payments/create-order', async (req, res) => {
  const { amount } = req.body;  // Total amount received from frontend
  const totalAmount = 20.00;    // Hardcoded total amount for now

  // Set up order details
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'USD',
        value: totalAmount.toFixed(2),
      },
      description: 'Sample Order',  // Hardcoded description
    }],
  });

  try {
    const response = await paypalClient.execute(request);

    // Send order ID and approval URL
    const approvalUrl = response.result.links.find(link => link.rel === 'approve').href;
    res.json({
      orderId: response.result.id,
      approvalUrl: approvalUrl,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).send('Error creating order');
  }
});

// Capture Payment Route
app.post('/api/payments/capture-order', async (req, res) => {
  const { orderId } = req.body;  // Order ID from PayPal after approval

  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  try {
    const captureResponse = await paypalClient.execute(request);

    // Check if the payment was successfully captured
    if (captureResponse.result.status === 'COMPLETED') {
      res.json({ message: 'Payment successful!', orderId: captureResponse.result.id });
    } else {
      res.status(400).send('Payment failed or was canceled');
    }
  } catch (error) {
    console.error('Error capturing payment:', error);
    res.status(500).send('Error capturing payment');
  }
});

// Routers for different parts of the app
app.use('/', indexRouter);  // Handles index page
app.use('/users', usersRouter);  // Handles user-related routes
app.use('/api/payments', paymentsRouter);  // PayPal payment routes

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
