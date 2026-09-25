const express = require('express');
const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

let products = [
  { id: '501', name: 'Database Textbook', price: 79.99, category: 'Books', stock: 50 },
  { id: '502', name: 'Wireless Mouse', price: 24.99, category: 'Electronics', stock: 120 }
];

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'Product Service', timestamp: new Date() });
});

app.get('/products', (req, res) => {
  res.json(products);
});

app.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found', id: req.params.id });
  }
  res.json(product);
});

app.post('/products', (req, res) => {
  const { name, price, category, stock } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Name and price are required' });
  }
  const newProduct = {
    id: String(Date.now()),
    name,
    price: Number(price),
    category: category || 'General',
    stock: stock !== undefined ? Number(stock) : 10
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.put('/products/:id', (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found', id: req.params.id });
  }
  products[index] = { ...products[index], ...req.body, id: req.params.id };
  res.json(products[index]);
});

app.delete('/products/:id', (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found', id: req.params.id });
  }
  const deleted = products.splice(index, 1);
  res.json({ message: 'Product deleted successfully', product: deleted[0] });
});

app.listen(PORT, () => {
  console.log(`Product Service running on port ${PORT}`);
});
