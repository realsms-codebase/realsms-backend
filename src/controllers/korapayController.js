// // const axios = require("axios");
// // const crypto = require("crypto");
// // const User = require("../models/User");
// // const Transaction = require("../models/Transaction");

// // const KORAPAY_SECRET_KEY = process.env.KORAPAY_SECRET_KEY;
// // const KORAPAY_WEBHOOK_SECRET = process.env.KORAPAY_WEBHOOK_SECRET;

// // const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
// // const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

// // const MIN_AMOUNT = 200;
// // const MAX_AMOUNT = 1000000;

// // const KORAPAY_BASE_URL = "https://api.korapay.com/merchant/api/v1";

// // /* ======================================================
// //    1️⃣ INITIALIZE PAYMENT
// // ====================================================== */
// // exports.initializePayment = async (req, res) => {
// //   try {
// //     const { amount } = req.body;
// //     const numericAmount = Number(amount);

// //     // ✅ Validate amount
// //     if (!numericAmount || numericAmount < MIN_AMOUNT) {
// //       return res.status(400).json({
// //         message: `Minimum amount is ₦${MIN_AMOUNT.toLocaleString()}`,
// //       });
// //     }

// //     if (numericAmount > MAX_AMOUNT) {
// //       return res.status(400).json({
// //         message: `Maximum amount is ₦${MAX_AMOUNT.toLocaleString()}`,
// //       });
// //     }

// //     // ✅ Validate user
// //     if (!req.user || !req.user.email) {
// //       return res.status(401).json({
// //         message: "Unauthorized: missing user info",
// //       });
// //     }

// //     // ✅ Generate UNIQUE reference (IMPORTANT FIX)
// //     const reference = `RSMS-${req.user._id}-${Date.now()}`;

// //     const payload = {
// //       amount: numericAmount,
// //       currency: "NGN",
// //       reference, // ✅ REQUIRED
// //       redirect_url: `${BACKEND_URL}/api/korapay/verify`,
// //       customer: {
// //         email: req.user.email,
// //         name: req.user.name || req.user.email,
// //       },
// //       metadata: {
// //         userId: req.user._id.toString(),
// //         source: "Wallet Funding",
// //       },
// //     };

// //     // 🔥 Call Korapay
// //     const response = await axios.post(
// //       `${KORAPAY_BASE_URL}/charges/initialize`,
// //       payload,
// //       {
// //         headers: {
// //           Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
// //           "Content-Type": "application/json",
// //         },
// //       }
// //     );

// //     const checkoutUrl = response.data?.data?.checkout_url;

// //     if (!checkoutUrl) {
// //       return res.status(400).json({
// //         message: "Unable to initialize payment",
// //         detail: response.data,
// //       });
// //     }

// //     // ✅ Save transaction (using SAME reference)
// //     await Transaction.create({
// //       user: req.user._id,
// //       reference,
// //       amount: numericAmount,
// //       currency: "NGN",
// //       provider: "KORAPAY",
// //       status: "PENDING",
// //     });

// //     return res.status(200).json({
// //       checkout_url: checkoutUrl,
// //     });

// //   } catch (error) {
// //     console.error("❌ Init Error FULL:", error.response?.data || error.message);

// //     return res.status(500).json({
// //       message: "Korapay initialization failed",
// //       detail: error.response?.data || error.message,
// //     });
// //   }
// // };

// // /* ======================================================
// //    2️⃣ VERIFY PAYMENT (REDIRECT)
// // ====================================================== */
// // exports.verifyPayment = async (req, res) => {
// //   try {
// //     const reference = req.query.reference;

// //     if (!reference) {
// //       return res.redirect(`${FRONTEND_URL}/fund-cancel`);
// //     }

// //     const transaction = await Transaction.findOne({ reference });

// //     if (!transaction) {
// //       return res.redirect(`${FRONTEND_URL}/fund-cancel`);
// //     }

// //     // ✅ Prevent double credit
// //     if (transaction.status === "SUCCESS") {
// //       return res.redirect(`${FRONTEND_URL}/fund-success`);
// //     }

// //     // 🔥 Verify with Korapay
// //     const response = await axios.get(
// //       `${KORAPAY_BASE_URL}/transactions/verify/${reference}`,
// //       {
// //         headers: {
// //           Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
// //         },
// //       }
// //     );

// //     const paymentData = response.data?.data;

// //     if (!paymentData || paymentData.status !== "success") {
// //       transaction.status = "FAILED";
// //       await transaction.save();
// //       return res.redirect(`${FRONTEND_URL}/fund-cancel`);
// //     }

// //     // ✅ Validate integrity
// //     if (Number(paymentData.amount) !== Number(transaction.amount)) {
// //       transaction.status = "FAILED";
// //       await transaction.save();
// //       return res.redirect(`${FRONTEND_URL}/fund-cancel`);
// //     }

// //     if (paymentData.currency !== "NGN") {
// //       transaction.status = "FAILED";
// //       await transaction.save();
// //       return res.redirect(`${FRONTEND_URL}/fund-cancel`);
// //     }

// //     // ✅ Credit wallet safely
// //     const user = await User.findById(transaction.user);

// //     if (!user) {
// //       transaction.status = "FAILED";
// //       await transaction.save();
// //       return res.redirect(`${FRONTEND_URL}/fund-cancel`);
// //     }

// //     user.walletBalanceNGN += transaction.amount;
// //     await user.save();

// //     transaction.status = "SUCCESS";
// //     transaction.processedAt = new Date();
// //     await transaction.save();

// //     console.log("✅ Wallet credited:", reference);

// //     return res.redirect(`${FRONTEND_URL}/fund-success`);

// //   } catch (error) {
// //     console.error("❌ Verify Error FULL:", error.response?.data || error.message);
// //     return res.redirect(`${FRONTEND_URL}/fund-cancel`);
// //   }
// // };

// // /* ======================================================
// //    3️⃣ (OPTIONAL) WEBHOOK - RECOMMENDED FOR PRODUCTION
// // ====================================================== */
// // exports.korapayWebhook = async (req, res) => {
// //   try {
// //     const signature = req.headers["x-korapay-signature"];

// //     const hash = crypto
// //       .createHmac("sha256", KORAPAY_WEBHOOK_SECRET)
// //       .update(JSON.stringify(req.body))
// //       .digest("hex");

// //     if (hash !== signature) {
// //       console.log("❌ Invalid webhook signature");
// //       return res.sendStatus(401);
// //     }

// //     const event = req.body;

// //     if (event.event === "charge.success") {
// //       const reference = event.data.reference;

// //       const transaction = await Transaction.findOne({ reference });

// //       if (!transaction || transaction.status === "SUCCESS") {
// //         return res.sendStatus(200);
// //       }

// //       const user = await User.findById(transaction.user);

// //       if (!user) return res.sendStatus(200);

// //       user.walletBalanceNGN += transaction.amount;
// //       await user.save();

// //       transaction.status = "SUCCESS";
// //       transaction.processedAt = new Date();
// //       await transaction.save();

// //       console.log("✅ Wallet credited via webhook:", reference);
// //     }

// //     return res.sendStatus(200);

// //   } catch (error) {
// //     console.error("❌ Webhook Error:", error.message);
// //     return res.sendStatus(500);
// //   }
// // };

// const axios = require("axios");
// const crypto = require("crypto");
// const User = require("../models/User");
// const Transaction = require("../models/Transaction");

// const KORAPAY_SECRET_KEY = process.env.KORAPAY_SECRET_KEY;
// const KORAPAY_WEBHOOK_SECRET = process.env.KORAPAY_WEBHOOK_SECRET;

// const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
// const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

// const MIN_AMOUNT = 200;
// const MAX_AMOUNT = 1000000;

// const KORAPAY_BASE_URL = "https://api.korapay.com/merchant/api/v1";

// /* ======================================================
//    1️⃣ INITIALIZE PAYMENT
// ====================================================== */
// exports.initializePayment = async (req, res) => {
//   try {
//     const { amount } = req.body;
//     const numericAmount = Number(amount);

//     if (!numericAmount || numericAmount < MIN_AMOUNT) {
//       return res.status(400).json({
//         message: `Minimum amount is ₦${MIN_AMOUNT.toLocaleString()}`,
//       });
//     }

//     if (numericAmount > MAX_AMOUNT) {
//       return res.status(400).json({
//         message: `Maximum amount is ₦${MAX_AMOUNT.toLocaleString()}`,
//       });
//     }

//     if (!req.user || !req.user.email) {
//       return res.status(401).json({
//         message: "Unauthorized",
//       });
//     }

//     // ✅ Your own reference
//     const reference = `RSMS-${req.user._id}-${Date.now()}`;

//     const payload = {
//       amount: numericAmount,
//       currency: "NGN",
//       reference,
//       redirect_url: `${BACKEND_URL}/api/korapay/verify`,
//       customer: {
//         email: req.user.email,
//         name: req.user.name || req.user.email,
//       },
//       metadata: {
//         userId: req.user._id.toString(),
//       },
//     };

//     const response = await axios.post(
//       `${KORAPAY_BASE_URL}/charges/initialize`,
//       payload,
//       {
//         headers: {
//           Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     const checkoutUrl = response.data?.data?.checkout_url;
//     const korapayReference = response.data?.data?.reference; // ✅ IMPORTANT

//     if (!checkoutUrl || !korapayReference) {
//       return res.status(400).json({
//         message: "Initialization failed",
//         detail: response.data,
//       });
//     }

//     // ✅ Save BOTH references
//     await Transaction.create({
//       user: req.user._id,
//       reference,
//       korapayReference,
//       amount: numericAmount,
//       currency: "NGN",
//       provider: "KORAPAY",
//       status: "PENDING",
//     });

//     return res.status(200).json({
//       checkout_url: checkoutUrl,
//     });

//   } catch (error) {
//     console.error("❌ INIT ERROR:", error.response?.data || error.message);
//     return res.status(500).json({
//       message: "Korapay initialization failed",
//       detail: error.response?.data || error.message,
//     });
//   }
// };

// /* ======================================================
//    2️⃣ VERIFY PAYMENT (REDIRECT)
// ====================================================== */
// exports.verifyPayment = async (req, res) => {
//   try {
//     const reference = req.query.reference;

//     if (!reference) {
//       return res.redirect(`${FRONTEND_URL}/fund-cancel`);
//     }

//     // ✅ Find using BOTH references
//     const transaction = await Transaction.findOne({
//       $or: [
//         { reference },
//         { korapayReference: reference },
//       ],
//     });

//     if (!transaction) {
//       return res.redirect(`${FRONTEND_URL}/fund-cancel`);
//     }

//     if (transaction.status === "SUCCESS") {
//       return res.redirect(`${FRONTEND_URL}/fund-success`);
//     }

//     const verifyRef = transaction.korapayReference || reference;

//     const response = await axios.get(
//       `${KORAPAY_BASE_URL}/transactions/verify/${verifyRef}`,
//       {
//         headers: {
//           Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
//         },
//       }
//     );

//     const paymentData = response.data?.data;

//     if (!paymentData || paymentData.status !== "success") {
//       transaction.status = "FAILED";
//       await transaction.save();
//       return res.redirect(`${FRONTEND_URL}/fund-cancel`);
//     }

//     if (Number(paymentData.amount) !== Number(transaction.amount)) {
//       transaction.status = "FAILED";
//       await transaction.save();
//       return res.redirect(`${FRONTEND_URL}/fund-cancel`);
//     }

//     if (paymentData.currency !== "NGN") {
//       transaction.status = "FAILED";
//       await transaction.save();
//       return res.redirect(`${FRONTEND_URL}/fund-cancel`);
//     }

//     const user = await User.findById(transaction.user);

//     if (!user) {
//       transaction.status = "FAILED";
//       await transaction.save();
//       return res.redirect(`${FRONTEND_URL}/fund-cancel`);
//     }

//     user.walletBalanceNGN += transaction.amount;
//     await user.save();

//     transaction.status = "SUCCESS";
//     transaction.processedAt = new Date();
//     await transaction.save();

//     console.log("✅ Wallet credited (redirect):", verifyRef);

//     return res.redirect(`${FRONTEND_URL}/fund-success`);

//   } catch (error) {
//     console.error("❌ VERIFY ERROR:", error.response?.data || error.message);
//     return res.redirect(`${FRONTEND_URL}/fund-cancel`);
//   }
// };

// /* ======================================================
//    3️⃣ WEBHOOK (PRIMARY PAYMENT CONFIRMATION)
// ====================================================== */
// exports.korapayWebhook = async (req, res) => {
//   try {
//     const signature = req.headers["x-korapay-signature"];

//     const hash = crypto
//       .createHmac("sha256", KORAPAY_WEBHOOK_SECRET)
//       .update(JSON.stringify(req.body))
//       .digest("hex");

//     if (hash !== signature) {
//       console.log("❌ Invalid webhook signature");
//       return res.sendStatus(401);
//     }

//     console.log("🔥 WEBHOOK RECEIVED:", req.body);

//     const event = req.body;

//     if (event.event === "charge.success") {
//       const reference = event.data.reference;

//       // ✅ Match using Korapay reference
//       const transaction = await Transaction.findOne({
//         korapayReference: reference,
//       });

//       if (!transaction) {
//         console.log("❌ Transaction not found:", reference);
//         return res.sendStatus(200);
//       }

//       if (transaction.status === "SUCCESS") {
//         return res.sendStatus(200);
//       }

//       const user = await User.findById(transaction.user);

//       if (!user) return res.sendStatus(200);

//       user.walletBalanceNGN += transaction.amount;
//       await user.save();

//       transaction.status = "SUCCESS";
//       transaction.processedAt = new Date();
//       await transaction.save();

//       console.log("✅ Wallet credited (webhook):", reference);
//     }

//     return res.sendStatus(200);

//   } catch (error) {
//     console.error("❌ WEBHOOK ERROR:", error.message);
//     return res.sendStatus(500);
//   }
// };

const axios = require("axios");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

const KORAPAY_SECRET_KEY = process.env.KORAPAY_SECRET_KEY;

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

const MIN_AMOUNT = 200;
const MAX_AMOUNT = 1000000;

const KORAPAY_BASE_URL = "https://api.korapay.com/merchant/api/v1";

/* ======================================================
   1️⃣ INITIALIZE PAYMENT
====================================================== */
exports.initializePayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount < MIN_AMOUNT) {
      return res.status(400).json({
        message: `Minimum amount is ₦${MIN_AMOUNT.toLocaleString()}`,
      });
    }

    if (numericAmount > MAX_AMOUNT) {
      return res.status(400).json({
        message: `Maximum amount is ₦${MAX_AMOUNT.toLocaleString()}`,
      });
    }

    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const reference = `RSMS-${req.user._id}-${Date.now()}`;

    const payload = {
      amount: numericAmount,
      currency: "NGN",
      reference,
      redirect_url: `${BACKEND_URL}/api/korapay/verify`,
      customer: {
        email: req.user.email,
        name: req.user.name || req.user.email,
      },
      metadata: {
        userId: req.user._id.toString(),
      },
    };

    const response = await axios.post(
      `${KORAPAY_BASE_URL}/charges/initialize`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const checkoutUrl = response.data?.data?.checkout_url;
    const korapayReference = response.data?.data?.reference;

    if (!checkoutUrl || !korapayReference) {
      return res.status(400).json({
        message: "Initialization failed",
        detail: response.data,
      });
    }

    console.log("✅ Your Ref:", reference);
    console.log("✅ Korapay Ref:", korapayReference);

    await Transaction.create({
      user: req.user._id,
      reference,
      korapayReference,
      amount: numericAmount,
      currency: "NGN",
      provider: "KORAPAY",
      status: "PENDING",
    });

    return res.status(200).json({
      checkout_url: checkoutUrl,
    });

  } catch (error) {
    console.error("❌ INIT ERROR:", error.response?.data || error.message);
    return res.status(500).json({
      message: "Korapay initialization failed",
      detail: error.response?.data || error.message,
    });
  }
};

/* ======================================================
   2️⃣ VERIFY PAYMENT (REDIRECT FIXED)
====================================================== */
exports.verifyPayment = async (req, res) => {
  try {
    console.log("🔍 QUERY:", req.query);

    const reference = req.query.reference;

    if (!reference) {
      return res.redirect(`${FRONTEND_URL}/fund-cancel`);
    }

    // ✅ Always try Korapay reference first
    let transaction = await Transaction.findOne({
      korapayReference: reference,
    });

    // ✅ fallback (rare)
    if (!transaction) {
      transaction = await Transaction.findOne({
        reference: reference,
      });
    }

    if (!transaction) {
      console.log("❌ Transaction not found:", reference);
      return res.redirect(`${FRONTEND_URL}/fund-cancel`);
    }

    // ✅ Prevent duplicate credit
    if (transaction.status === "SUCCESS") {
      return res.redirect(`${FRONTEND_URL}/fund-success`);
    }

    const verifyRef = transaction.korapayReference;

    const response = await axios.get(
      `${KORAPAY_BASE_URL}/transactions/verify/${verifyRef}`,
      {
        headers: {
          Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
        },
      }
    );

    const paymentData = response.data?.data;

    console.log("🔍 VERIFY RESPONSE:", paymentData);

    if (!paymentData || paymentData.status !== "success") {
      transaction.status = "FAILED";
      await transaction.save();
      return res.redirect(`${FRONTEND_URL}/fund-cancel`);
    }

    if (Number(paymentData.amount) !== Number(transaction.amount)) {
      transaction.status = "FAILED";
      await transaction.save();
      return res.redirect(`${FRONTEND_URL}/fund-cancel`);
    }

    if (paymentData.currency !== "NGN") {
      transaction.status = "FAILED";
      await transaction.save();
      return res.redirect(`${FRONTEND_URL}/fund-cancel`);
    }

    const user = await User.findById(transaction.user);

    if (!user) {
      transaction.status = "FAILED";
      await transaction.save();
      return res.redirect(`${FRONTEND_URL}/fund-cancel`);
    }

    user.walletBalanceNGN += transaction.amount;
    await user.save();

    transaction.status = "SUCCESS";
    transaction.processedAt = new Date();
    await transaction.save();

    console.log("✅ Wallet credited (redirect):", verifyRef);

    return res.redirect(`${FRONTEND_URL}/fund-success`);

  } catch (error) {
    console.error("❌ VERIFY ERROR:", error.response?.data || error.message);
    return res.redirect(`${FRONTEND_URL}/fund-cancel`);
  }
};

/* ======================================================
   3️⃣ WEBHOOK (API VERIFIED)
====================================================== */
exports.korapayWebhook = async (req, res) => {
  try {
    console.log("🔥 WEBHOOK RECEIVED:", req.body);

    const event = req.body;

    if (event.event !== "charge.success") {
      return res.sendStatus(200);
    }

    const reference = event.data?.reference;

    if (!reference) {
      return res.sendStatus(200);
    }

    const transaction = await Transaction.findOne({
      korapayReference: reference,
    });

    if (!transaction) {
      console.log("❌ Transaction not found:", reference);
      return res.sendStatus(200);
    }

    if (transaction.status === "SUCCESS") {
      console.log("⚠️ Already processed:", reference);
      return res.sendStatus(200);
    }

    // 🔒 VERIFY AGAIN (VERY IMPORTANT)
    const response = await axios.get(
      `${KORAPAY_BASE_URL}/transactions/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
        },
      }
    );

    const paymentData = response.data?.data;

    if (!paymentData || paymentData.status !== "success") {
      transaction.status = "FAILED";
      await transaction.save();
      return res.sendStatus(200);
    }

    if (Number(paymentData.amount) !== Number(transaction.amount)) {
      transaction.status = "FAILED";
      await transaction.save();
      return res.sendStatus(200);
    }

    if (paymentData.currency !== "NGN") {
      transaction.status = "FAILED";
      await transaction.save();
      return res.sendStatus(200);
    }

    const user = await User.findById(transaction.user);

    if (!user) {
      return res.sendStatus(200);
    }

    user.walletBalanceNGN += transaction.amount;
    await user.save();

    transaction.status = "SUCCESS";
    transaction.processedAt = new Date();
    await transaction.save();

    console.log("✅ Wallet credited (webhook):", reference);

    return res.sendStatus(200);

  } catch (error) {
    console.error("❌ WEBHOOK ERROR:", error.response?.data || error.message);
    return res.sendStatus(500);
  }
};
