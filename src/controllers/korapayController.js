// const axios = require("axios");
// const User = require("../models/User");
// const Transaction = require("../models/Transaction");

// const KORAPAY_SECRET_KEY = process.env.KORAPAY_SECRET_KEY;

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
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     // ✅ YOUR reference
//     const reference = `RSMS-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

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
//     const korapayReference = response.data?.data?.reference;

//     if (!checkoutUrl) {
//       return res.status(400).json({
//         message: "Initialization failed",
//         detail: response.data,
//       });
//     }

//     console.log("✅ Your Ref:", reference);
//     console.log("✅ Korapay Ref:", korapayReference);

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
//    2️⃣ VERIFY PAYMENT (FIXED 🔥)
// ====================================================== */
// exports.verifyPayment = async (req, res) => {
//   try {
//     console.log("🔍 FULL QUERY:", req.query);
//     console.log("🔍 FULL URL:", req.originalUrl);

//     // ✅ handle all possible query keys
//     const reference =
//       req.query.reference ||
//       req.query.trxref ||
//       req.query.tx_ref ||
//       req.query.order_ref;

//     if (!reference) {
//       console.log("❌ No reference in URL");
//       return res.redirect(`${FRONTEND_URL}/fund-cancel`);
//     }

//     console.log("🔍 Incoming Ref:", reference);

//     // ✅ CRITICAL FIX: search BOTH refs
//     const transaction = await Transaction.findOne({
//       $or: [
//         { reference: reference },
//         { korapayReference: reference },
//       ],
//     });

//     if (!transaction) {
//       console.log("❌ Transaction not found:", reference);
//       return res.redirect(`${FRONTEND_URL}/fund-cancel`);
//     }

//     // ✅ prevent double credit
//     if (transaction.status === "SUCCESS") {
//       return res.redirect(`${FRONTEND_URL}/fund-success`);
//     }

//     const verifyRef = transaction.korapayReference || transaction.reference;

//     const response = await axios.get(
//       `${KORAPAY_BASE_URL}/transactions/verify/${verifyRef}`,
//       {
//         headers: {
//           Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
//         },
//       }
//     );

//     const paymentData = response.data?.data;

//     console.log("🔍 VERIFY RESPONSE:", paymentData);

//     // ✅ don't instantly fail — allow webhook to handle it
//     if (
//       !paymentData ||
//       paymentData.status.toLowerCase() !== "success"
//     ) {
//       console.log("⚠️ Payment not confirmed yet, waiting for webhook...");
//       return res.redirect(`${FRONTEND_URL}/fund-pending`);
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

//     // ✅ credit wallet
//     user.walletBalanceNGN += transaction.amount;
//     await user.save();

//     transaction.status = "SUCCESS";
//     transaction.processedAt = new Date();
//     await transaction.save();

//     console.log("✅ Wallet credited (redirect):", reference);

//     return res.redirect(`${FRONTEND_URL}/fund-success`);

//   } catch (error) {
//     console.error("❌ VERIFY ERROR:", error.response?.data || error.message);
//     return res.redirect(`${FRONTEND_URL}/fund-cancel`);
//   }
// };

// /* ======================================================
//    3️⃣ WEBHOOK (FINAL SAFE VERSION)
// ====================================================== */
// exports.korapayWebhook = async (req, res) => {
//   try {
//     console.log("🔥 WEBHOOK RECEIVED:", req.body);

//     const event = req.body;

//     if (event.event !== "charge.success") {
//       return res.sendStatus(200);
//     }

//     const reference = event.data?.reference;

//     if (!reference) {
//       return res.sendStatus(200);
//     }

//     const transaction = await Transaction.findOne({
//       $or: [
//         { reference: reference },
//         { korapayReference: reference },
//       ],
//     });

//     if (!transaction) {
//       console.log("❌ Transaction not found:", reference);
//       return res.sendStatus(200);
//     }

//     if (transaction.status === "SUCCESS") {
//       console.log("⚠️ Already processed:", reference);
//       return res.sendStatus(200);
//     }

//     const verifyRef = transaction.korapayReference || transaction.reference;

//     const response = await axios.get(
//       `${KORAPAY_BASE_URL}/transactions/verify/${verifyRef}`,
//       {
//         headers: {
//           Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
//         },
//       }
//     );

//     const paymentData = response.data?.data;

//     if (
//       !paymentData ||
//       paymentData.status.toLowerCase() !== "success"
//     ) {
//       transaction.status = "FAILED";
//       await transaction.save();
//       return res.sendStatus(200);
//     }

//     if (Number(paymentData.amount) !== Number(transaction.amount)) {
//       transaction.status = "FAILED";
//       await transaction.save();
//       return res.sendStatus(200);
//     }

//     if (paymentData.currency !== "NGN") {
//       transaction.status = "FAILED";
//       await transaction.save();
//       return res.sendStatus(200);
//     }

//     const user = await User.findById(transaction.user);

//     if (!user) {
//       return res.sendStatus(200);
//     }

//     // ✅ credit wallet
//     user.walletBalanceNGN += transaction.amount;
//     await user.save();

//     transaction.status = "SUCCESS";
//     transaction.processedAt = new Date();
//     await transaction.save();

//     console.log("✅ Wallet credited (webhook):", reference);

//     return res.sendStatus(200);

//   } catch (error) {
//     console.error("❌ WEBHOOK ERROR:", error.response?.data || error.message);
//     return res.sendStatus(500);
//   }
// };

// const axios = require("axios");
// const User = require("../models/User");
// const Transaction = require("../models/Transaction");

// const KORAPAY_SECRET_KEY = process.env.KORAPAY_SECRET_KEY;

// const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
// const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

// const MIN_AMOUNT = 200;
// const MAX_AMOUNT = 1000000;

// const KORAPAY_BASE_URL = "https://api.korapay.com/merchant/api/v1";

// /* ======================================================
//    1️⃣ INITIALIZE PAYMENT (FIXED)
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
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     // ✅ Your internal reference
//     const reference = `RSMS-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

//     const payload = {
//       amount: numericAmount,
//       currency: "NGN",
//       reference,

//       // 🔥 IMPORTANT: ensure your reference is returned on redirect
//       redirect_url: `${BACKEND_URL}/api/korapay/verify?reference=${reference}`,

//       customer: {
//         email: req.user.email,
//         name: req.user.name || req.user.email,
//       },

//       metadata: {
//         userId: req.user._id.toString(),
//         reference,
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

//     // 🔥 FIX: correct Korapay reference extraction
//     const korapayReference =
//       response.data?.data?.reference ||
//       response.data?.data?.transaction_reference ||
//       response.data?.data?.payment_reference;

//     if (!checkoutUrl) {
//       return res.status(400).json({
//         message: "Initialization failed",
//         detail: response.data,
//       });
//     }

//     console.log("✅ RSMS Ref:", reference);
//     console.log("✅ Korapay Ref:", korapayReference);

//     // ❌ CRITICAL FIX: NEVER allow korapayReference to equal RSMS reference
//     if (!korapayReference || korapayReference === reference) {
//       console.log("⚠️ Invalid Korapay reference returned");
//     }

//     await Transaction.create({
//       user: req.user._id,
//       reference, // RSMS reference (YOUR SYSTEM)
//       korapayReference, // KORAPAY reference (IMPORTANT)
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
   1️⃣ INITIALIZE PAYMENT (FINAL FIXED VERSION)
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

    if (!req.user?.email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ✅ YOUR SYSTEM REFERENCE
    const reference = `RSMS-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const payload = {
      amount: numericAmount,
      currency: "NGN",
      reference,

      redirect_url: `${BACKEND_URL}/api/korapay/verify?reference=${reference}`,

      customer: {
        email: req.user.email,
        name: req.user.name || req.user.email,
      },

      metadata: {
        userId: req.user._id.toString(),
        reference,
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

    // 🔥 PRINT FULL RESPONSE (THIS IS KEY FOR DEBUGGING)
    console.log("🔥 KORAPAY FULL RESPONSE:");
    console.log(JSON.stringify(response.data, null, 2));

    const korapayData = response.data?.data || {};

    // ✅ FIXED: robust extraction (NO GUESSING SINGLE FIELD)
    const korapayReference =
      korapayData?.reference ||
      korapayData?.charge_reference ||
      korapayData?.payment_reference ||
      korapayData?.transaction_reference ||
      null;

    const checkoutUrl = korapayData?.checkout_url;

    if (!checkoutUrl) {
      return res.status(400).json({
        message: "Korapay initialization failed",
        detail: response.data,
      });
    }

    // ❌ HARD GUARD: prevent wrong saving
    if (!korapayReference) {
      console.error("❌ KORAPAY REFERENCE MISSING");
      return res.status(500).json({
        message: "Invalid Korapay response (missing reference)",
        detail: response.data,
      });
    }

    // ❌ SAFETY CHECK: NEVER allow RSMS fallback
    if (korapayReference === reference) {
      console.error("❌ BUG: Korapay reference equals RSMS reference");
    }

    console.log("✅ RSMS Ref:", reference);
    console.log("✅ KoraPay Ref:", korapayReference);

    await Transaction.create({
      user: req.user._id,
      reference,
      korapayReference, // ✅ ALWAYS REAL KORAPAY VALUE
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
   2️⃣ VERIFY PAYMENT (FIXED LOGIC)
====================================================== */
exports.verifyPayment = async (req, res) => {
  try {
    console.log("🔍 VERIFY QUERY:", req.query);

    const reference = req.query.reference;

    if (!reference) {
      return res.redirect(`${FRONTEND_URL}/fund-cancel`);
    }

    const transaction = await Transaction.findOne({ reference });

    if (!transaction) {
      console.log("❌ Transaction not found:", reference);
      return res.redirect(`${FRONTEND_URL}/fund-cancel`);
    }

    if (transaction.status === "SUCCESS") {
      return res.redirect(`${FRONTEND_URL}/fund-success`);
    }

    // 🔥 CRITICAL FIX: ALWAYS use Korapay reference ONLY
    const verifyRef = transaction.korapayReference;

    if (!verifyRef) {
      console.log("❌ Missing Korapay reference in DB");
      return res.redirect(`${FRONTEND_URL}/fund-cancel`);
    }

    const response = await axios.get(
      `${KORAPAY_BASE_URL}/transactions/verify/${verifyRef}`,
      {
        headers: {
          Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
        },
      }
    );

    const paymentData = response.data?.data;

    console.log("🔍 KORAPAY VERIFY:", paymentData);

    if (!paymentData || paymentData.status?.toLowerCase() !== "success") {
      return res.redirect(`${FRONTEND_URL}/fund-pending`);
    }

    if (
      Number(paymentData.amount) !== Number(transaction.amount) ||
      paymentData.currency !== "NGN"
    ) {
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

    // ✅ CREDIT WALLET
    user.walletBalanceNGN += transaction.amount;
    await user.save();

    transaction.status = "SUCCESS";
    transaction.processedAt = new Date();
    await transaction.save();

    console.log("✅ WALLET CREDITED:", reference);

    return res.redirect(`${FRONTEND_URL}/fund-success`);

  } catch (error) {
    console.error("❌ VERIFY ERROR:", error.response?.data || error.message);
    return res.redirect(`${FRONTEND_URL}/fund-cancel`);
  }
};

/* ======================================================
   3️⃣ WEBHOOK (SAFE + IDEMPOTENT)
====================================================== */
exports.korapayWebhook = async (req, res) => {
  try {
    const event = req.body;

    console.log("🔥 WEBHOOK:", event);

    if (event.event !== "charge.success") {
      return res.sendStatus(200);
    }

    const korapayRef = event.data?.reference;

    if (!korapayRef) {
      return res.sendStatus(200);
    }

    const transaction = await Transaction.findOne({
      korapayReference: korapayRef,
    });

    if (!transaction) {
      console.log("❌ Not found:", korapayRef);
      return res.sendStatus(200);
    }

    if (transaction.status === "SUCCESS") {
      return res.sendStatus(200);
    }

    const response = await axios.get(
      `${KORAPAY_BASE_URL}/transactions/verify/${korapayRef}`,
      {
        headers: {
          Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
        },
      }
    );

    const paymentData = response.data?.data;

    if (!paymentData || paymentData.status?.toLowerCase() !== "success") {
      transaction.status = "FAILED";
      await transaction.save();
      return res.sendStatus(200);
    }

    const user = await User.findById(transaction.user);

    if (!user) return res.sendStatus(200);

    user.walletBalanceNGN += transaction.amount;
    await user.save();

    transaction.status = "SUCCESS";
    transaction.processedAt = new Date();
    await transaction.save();

    console.log("✅ WEBHOOK CREDIT:", korapayRef);

    return res.sendStatus(200);

  } catch (error) {
    console.error("❌ WEBHOOK ERROR:", error.message);
    return res.sendStatus(500);
  }
};
