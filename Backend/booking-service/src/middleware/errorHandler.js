// Backend/booking-service/src/middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(400).json({ error: 'Duplicate entry' });
  }

  if (err.code === '23503') { // PostgreSQL foreign key violation
    return res.status(400).json({ error: 'Referenced resource not found' });
  }

  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};