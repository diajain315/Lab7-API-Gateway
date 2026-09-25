const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

const getServiceRegistry = () => ({
  userServiceUrl: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  productServiceUrl: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
  orderServiceUrl: process.env.ORDER_SERVICE_URL || 'http://localhost:3003'
});

app.use(express.json());

app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[GATEWAY LOG] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} (${duration}ms)`);
  });
  next();
});

app.get('/health', (req, res) => {
  const registry = getServiceRegistry();
  res.json({
    status: 'UP',
    service: 'API Gateway',
    timestamp: new Date().toISOString(),
    routes: {
      '/users': registry.userServiceUrl,
      '/products': registry.productServiceUrl,
      '/orders': registry.orderServiceUrl
    }
  });
});

const createProxyHandler = (getServiceUrl, serviceName) => async (req, res) => {
  const targetBase = getServiceUrl();
  const targetUrl = `${targetBase}${req.originalUrl}`;
  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      headers: {
        'content-type': req.headers['content-type'] || 'application/json'
      },
      validateStatus: () => true
    });
    console.log(`[GATEWAY ROUTE] ${req.method} ${req.originalUrl} -> ${serviceName} (${targetUrl}) [${response.status}]`);
    return res.status(response.status).json(response.data);
  } catch (err) {
    console.error(`[GATEWAY ERROR] ${req.method} ${req.originalUrl} -> ${serviceName} (${targetUrl}) FAILED: ${err.message}`);
    return res.status(502).json({
      error: 'Bad Gateway',
      message: `Failed to communicate with ${serviceName} at ${targetBase}. Service may be offline or unreachable.`,
      targetService: serviceName,
      targetUrl: targetBase,
      statusCode: 502
    });
  }
};

const registry = getServiceRegistry();

app.use('/users', createProxyHandler(() => getServiceRegistry().userServiceUrl, 'User Service'));
app.use('/products', createProxyHandler(() => getServiceRegistry().productServiceUrl, 'Product Service'));
app.use('/orders', createProxyHandler(() => getServiceRegistry().orderServiceUrl, 'Order Service'));

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `No gateway route defined for ${req.method} ${req.originalUrl}`,
    statusCode: 404
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Configured Service Registry:`, getServiceRegistry());
});
