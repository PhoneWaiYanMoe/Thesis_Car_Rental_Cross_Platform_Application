const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Home route
app.get('/', (req, res) => {
  res.send('Hello, From the NOTIFICATIONS!');
});

// Example API route
app.get('/api', (req, res) => {
  res.json({ message: 'API is working' });
});

// Server
const PORT = process.env.PORT || 3007;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
