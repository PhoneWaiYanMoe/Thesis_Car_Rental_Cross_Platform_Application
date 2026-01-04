module.exports = (err, req, res, next) => {
  console.error("❌ Error:", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === "23505") {
    return res.status(400).json({ error: "Duplicate entry" });
  }

  if (err.type === "StripeCardError") {
    return res.status(402).json({
      error: "Card declined",
      message: err.message,
    });
  }

  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
};
