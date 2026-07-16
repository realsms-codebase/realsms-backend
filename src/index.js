// index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require("./config/db");
require('dotenv').config();

// ROUTES
const authRoutes = require('./routes/authRoutes');
const usdtRoutes = require('./routes/usdtRoutes');
const walletRoutes = require('./routes/walletRoutes');
const paystackRoutes = require("./routes/paystackRoutes");
const korapayRoutes = require("./routes/korapayRoutes");
const flutterwaveRoutes = require("./routes/flutterwaveRoutes");
const smspoolRoutes = require("./routes/smspoolRoutes");
const transactionRoutes = require("./routes/transactionsRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminAnalyticsRoutes = require("./routes/adminAnalyticsRoutes");
const logRoutes = require("./routes/logRoutes");
const broadcastRoutes = require("./routes/broadcastRoutes");
const supportRoutes = require("./routes/supportRoutes");
const activityRoutes = require("./routes/activityRoutes");
const tutorialRoutes = require("./routes/tutorialRoutes");


// CRON JOBS
// require("./cron/transactionCleanup");
// require("./cron/orderCleanup");
// require("./cron/broadcastCron");

const app = express();

// ================= TRUST PROXY =================
app.set('trust proxy', 1);

// ================= HELMET SECURITY =================
app.use(helmet());

// ================= RATE LIMITERS =================

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 200,
  message: {
    error: "Too many requests. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth limiter (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: "Too many authentication attempts. Try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Payment initialization limiter
const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 30,
  message: {
    error: "Too many payment attempts. Please wait before trying again."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Webhook limiter (light, do NOT block retries)
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general limiter to entire API
app.use('/api', apiLimiter);

// ================= CORS =================
const allowedOrigins = [ 
  'http://localhost:3000',
  'https://www.realsms.store',
  'https://admin-realsms-sepia.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS blocked'));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ================= BODY PARSER =================
app.use(express.json({ limit: "10mb" }));

// ================= ROOT =================
app.get('/', (req, res) => {
  res.json({ message: 'RealSMS API is running 🚀' });
});

// ================= ROUTES =================

// AUTH (strict limiter)
app.use('/api/auth', authLimiter, authRoutes);

// WALLET / USDT / SMS / ADMIN
app.use('/api/usdt', usdtRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/smspool', smspoolRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/log", logRoutes);
app.use("/api/broadcast", broadcastRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/tutorials", tutorialRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);

// ================= PAYMENT WEBHOOKS (SAFE) =================
// IMPORTANT: Place webhook routes BEFORE paymentLimiter routes

app.use("/api/paystack/webhook", webhookLimiter, paystackRoutes);
app.use("/api/korapay/webhook", webhookLimiter, korapayRoutes);
app.use("/api/flutterwave/webhook", webhookLimiter, flutterwaveRoutes);

// ================= PAYMENT INITIALIZATION (STRICT) =================
app.use("/api/paystack", paymentLimiter, paystackRoutes);
app.use("/api/korapay", paymentLimiter, korapayRoutes);
app.use("/api/flutterwave", paymentLimiter, flutterwaveRoutes);

// // // ================= GLOBAL ERROR HANDLER =================
// app.use((err, req, res, next) => {
//   console.error(
//     "SERVER ERROR:",
//     err.stack
//   );

//   res.status(500).json({
//     error: "Something went wrong"
//   });
// });

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();

    console.log("✅ MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error(
      "❌ MongoDB Error:",
      err.message
    );
  }
})();
