const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

let users = [
  { id: '101', name: 'Alice Smith', email: 'alice@example.com', role: 'Student' },
  { id: '102', name: 'Bob Jones', email: 'bob@example.com', role: 'Instructor' }
];

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'User Service', timestamp: new Date() });
});

app.get('/users', (req, res) => {
  res.json(users);
});

app.get('/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found', id: req.params.id });
  }
  res.json(user);
});

app.post('/users', (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  const newUser = {
    id: String(Date.now()),
    name,
    email,
    role: role || 'Student'
  };
  users.push(newUser);
  res.status(201).json(newUser);
});

app.put('/users/:id', (req, res) => {
  const index = users.findIndex(u => u.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'User not found', id: req.params.id });
  }
  users[index] = { ...users[index], ...req.body, id: req.params.id };
  res.json(users[index]);
});

app.delete('/users/:id', (req, res) => {
  const index = users.findIndex(u => u.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'User not found', id: req.params.id });
  }
  const deleted = users.splice(index, 1);
  res.json({ message: 'User deleted successfully', user: deleted[0] });
});

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});
