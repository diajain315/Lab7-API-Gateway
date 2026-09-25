const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3003;
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

app.use(express.json());

let orders = [];
let nextOrderId = 1001;

app.get('/health', (req, res) => {
  res.json({ 
    status: 'UP', 
    service: 'Order Service', 
    dependencies: {
      userServiceUrl: USER_SERVICE_URL,
      productServiceUrl: PRODUCT_SERVICE_URL
    },
    timestamp: new Date() 
  });
});

app.get('/orders', (req, res) => {
  res.json(orders);
});

app.get('/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found', id: req.params.id });
  }
  res.json(order);
});

app.post('/orders', async (req, res) => {
  const { userId, productId, quantity } = req.body;

  if (!userId || !productId) {
    return res.status(400).json({ error: 'userId and productId are required' });
  }

  const orderQty = quantity ? Number(quantity) : 1;

  let userData;
  try {
    const userRes = await axios.get(`${USER_SERVICE_URL}/users/${userId}`, { timeout: 3000 });
    userData = userRes.data;
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).json({
        error: 'User Validation Failed',
        message: `User with ID '${userId}' not found in User Service.`,
        statusCode: 404
      });
    }
    console.error(`Error connecting to User Service at ${USER_SERVICE_URL}:`, err.message);
    return res.status(503).json({
      error: 'Service Unavailable',
      message: `Failed to communicate with User Service at ${USER_SERVICE_URL}. Service may be offline or unreachable.`,
      statusCode: 503
    });
  }

  let productData;
  try {
    const productRes = await axios.get(`${PRODUCT_SERVICE_URL}/products/${productId}`, { timeout: 3000 });
    productData = productRes.data;
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).json({
        error: 'Product Validation Failed',
        message: `Product with ID '${productId}' not found in Product Service.`,
        statusCode: 404
      });
    }
    console.error(`Error connecting to Product Service at ${PRODUCT_SERVICE_URL}:`, err.message);
    return res.status(503).json({
      error: 'Service Unavailable',
      message: `Failed to communicate with Product Service at ${PRODUCT_SERVICE_URL}. Service may be offline or unreachable.`,
      statusCode: 503
    });
  }

  const newOrder = {
    id: String(nextOrderId++),
    userId,
    userName: userData.name,
    userEmail: userData.email,
    productId,
    productName: productData.name,
    unitPrice: productData.price,
    quantity: orderQty,
    totalPrice: Number((productData.price * orderQty).toFixed(2)),
    status: 'CONFIRMED',
    createdAt: new Date().toISOString()
  };

  orders.push(newOrder);
  res.status(201).json(newOrder);
});

app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
  console.log(`Configured User Service URL: ${USER_SERVICE_URL}`);
  console.log(`Configured Product Service URL: ${PRODUCT_SERVICE_URL}`);
});
