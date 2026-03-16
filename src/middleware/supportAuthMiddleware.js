// // middleware/supportAuthMiddleware.js
// const jwt = require("jsonwebtoken");
// const User = require("../models/User");

// // Protect normal users for support routes
// const protectSupportUser = async (req, res, next) => {
//   let token;
//   if (req.headers.authorization?.startsWith("Bearer")) {
//     try {
//       token = req.headers.authorization.split(" ")[1];
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);

//       const user = await User.findById(decoded.id).select("-password");
//       if (!user) return res.status(401).json({ message: "Unauthorized" });

//       // Only allow non-admin users
//       if (user.role === "admin")
//         return res.status(403).json({ message: "Admins cannot use user support routes" });

//       req.user = user;
//       next();
//     } catch (err) {
//       console.error("protectSupportUser error:", err);
//       return res.status(401).json({ message: "Not authorized" });
//     }
//   } else {
//     return res.status(401).json({ message: "No token provided" });
//   }
// };

// // Protect admin users for support routes
// const protectSupportAdmin = async (req, res, next) => {
//   let token;
//   if (req.headers.authorization?.startsWith("Bearer")) {
//     try {
//       token = req.headers.authorization.split(" ")[1];
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);

//       const user = await User.findById(decoded.id).select("-password");
//       if (!user || user.role !== "admin")
//         return res.status(403).json({ message: "Admin access only" });

//       req.user = user;
//       next();
//     } catch (err) {
//       console.error("protectSupportAdmin error:", err);
//       return res.status(401).json({ message: "Not authorized" });
//     }
//   } else {
//     return res.status(401).json({ message: "No token provided" });
//   }
// };

// module.exports = {
//   protectSupportUser,
//   protectSupportAdmin,
// };

// middleware/supportAuthMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Helper: Verify token and return decoded payload
 */
const verifyToken = (authHeader) => {
  if (!authHeader?.startsWith("Bearer")) {
    throw new Error("No token provided");
  }
  const token = authHeader.split(" ")[1];
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Protect normal users for support routes
 */
const protectSupportUser = async (req, res, next) => {
  try {
    const decoded = verifyToken(req.headers.authorization);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Only allow non-admin users
    if (user.role === "admin") {
      return res.status(403).json({ message: "Admins cannot use user support routes" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("protectSupportUser error:", err.message);
    const status = err.message === "No token provided" ? 401 : 401;
    return res.status(status).json({ message: err.message || "Not authorized" });
  }
};

/**
 * Protect admin users for support routes
 */
const protectSupportAdmin = async (req, res, next) => {
  try {
    const decoded = verifyToken(req.headers.authorization);
    const user = await User.findById(decoded.id).select("-password");

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("protectSupportAdmin error:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }

    return res.status(401).json({ message: err.message || "Not authorized" });
  }
};

module.exports = {
  protectSupportUser,
  protectSupportAdmin,
};
