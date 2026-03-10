// middleware/supportAuthMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect normal users for support routes
const protectSupportUser = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      // Only allow non-admin users
      if (user.role === "admin")
        return res.status(403).json({ message: "Admins cannot use user support routes" });

      req.user = user;
      next();
    } catch (err) {
      console.error("protectSupportUser error:", err);
      return res.status(401).json({ message: "Not authorized" });
    }
  } else {
    return res.status(401).json({ message: "No token provided" });
  }
};

// Protect admin users for support routes
const protectSupportAdmin = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");
      if (!user || user.role !== "admin")
        return res.status(403).json({ message: "Admin access only" });

      req.user = user;
      next();
    } catch (err) {
      console.error("protectSupportAdmin error:", err);
      return res.status(401).json({ message: "Not authorized" });
    }
  } else {
    return res.status(401).json({ message: "No token provided" });
  }
};

module.exports = {
  protectSupportUser,
  protectSupportAdmin,
};
