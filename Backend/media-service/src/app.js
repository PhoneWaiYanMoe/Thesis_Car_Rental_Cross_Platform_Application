const express = require('express');

const app = express();
const PORT = 3008;

// middleware to parse JSON
app.use(express.json());

// basic route
app.get('/', (req, res) => {
  res.send('This is from media-service. Server is running on port 3008.');
});

// sample API route
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
