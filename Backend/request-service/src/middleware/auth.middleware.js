const authenticate = (req, res, next) => {
  const userId = req.headers["x-user-id"];
  const userType = req.headers["x-user-type"];

  if (!userId || !userType) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - Missing user credentials",
    });
  }

  req.user = {
    id: userId,
    type: userType,
  };

  next();
};

module.exports = authenticate;
