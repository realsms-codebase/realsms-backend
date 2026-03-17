// // const axios = require("axios");
// // const User = require("../models/User");
// // const Transaction = require("../models/Transaction");

// // const KORAPAY_SECRET_KEY = process.env.KORAPAY_SECRET_KEY;
// // const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
// // const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

// // const MIN_AMOUNT = 200;        // ₦200 minimum
// // const MAX_AMOUNT = 1000000;    // ₦1,000,000 (Korapay card max)

// // // ======================================
// // // 1️⃣ Initialize Payment (Protected)
// // // ======================================
// // exports.initializePayment = async (req, res) => {
// //   try {
// //     const { amount } = req.body;
// //     const numericAmount = Number(amount);

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

// //     if (!req.user) {
// //       return res.status(401).json({ message: "Unauthorized" });
// //     }

// //     const reference = `rsms-${Date.now()}-${Math.floor(
// //       Math.random() * 1000000
// //     )}`;

// //     // Initialize Korapay charge
// //     const response = await axios.post(
// //       "https://api.korapay.com/merchant/api/v1/charges/initialize",
// //       {
// //         amount: numericAmount, // ⚠️ Korapay expects NAIRA (NOT kobo)
// //         currency: "NGN",
// //         reference,
// //         redirect_url: `${BACKEND_URL}/api/korapay/verify?reference=${reference}`,
// //         customer: {
// //           email: req.user.email,
// //           name: req.user.name || req.user.email,
// //         },
// //         metadata: {
// //           userId: req.user._id,
// //           source: "RealSMS Wallet Funding",
// //         },
// //       },
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
// //       });
// //     }

// //     // Save transaction
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
// //     console.error(
// //       "Korapay Init Error:",
// //       error.response?.data || error.message
// //     );

// //     return res.status(500).json({
// //       message: "Korapay payment initialization failed",
// //     });
// //   }
// // };

// // // ======================================
// // // 2️⃣ Verify Payment (Public Redirect)
// // // ======================================
// // exports.verifyPayment = async (req, res) => {
// //   try {
// //     const { reference } = req.query;

// //     if (!reference) {
// //       return res.redirect(`${FRONTEND_URL}/fund-cancel`);
// //     }

// //     const transaction = await Transaction.findOne({ reference });

// //     if (!transaction) {
// //       return res.redirect(`${FRONTEND_URL}/fund-cancel`);
// //     }

// //     // Prevent double processing
// //     if (transaction.status === "SUCCESS") {
// //       return res.redirect(`${FRONTEND_URL}/fund-success`);
// //     }

// //     // Verify with Korapay
// //     const response = await axios.get(
// //       `https://api.korapay.com/merchant/api/v1/charges/${reference}`,
// //       {
// //         headers: {
// //           Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
// //           "Content-Type": "application/json",
// //         },
// //       }
// //     );

// //     const paymentData = response.data?.data;

// //     // Validate payment properly
// //     if (
// //       !paymentData ||
// //       paymentData.status !== "success" ||
// //       paymentData.amount !== transaction.amount ||
// //       paymentData.currency !== "NGN"
// //     ) {
// //       transaction.status = "FAILED";
// //       await transaction.save();

// //       return res.redirect(`${FRONTEND_URL}/fund-cancel`);
// //     }

// //     const user = await User.findById(transaction.user);
// //     if (!user) {
// //       return res.redirect(`${FRONTEND_URL}/fund-cancel`);
// //     }

// //     // Credit wallet
// //     user.walletBalanceNGN += transaction.amount;
// //     await user.save();

// //     // Update transaction
// //     transaction.status = "SUCCESS";
// //     transaction.processedAt = new Date();
// //     await transaction.save();

// //     return res.redirect(`${FRONTEND_URL}/fund-success`);
// //   } catch (error) {
// //     console.error(
// //       "Korapay Verify Error:",
// //       error.response?.data || error.message
// //     );

// //     return res.redirect(`${FRONTEND_URL}/fund-cancel`);
// //   }
// // };


// const axios = require("axios");
// const User = require("../models/User");
// const Transaction = require("../models/Transaction");

// const KORAPAY_SECRET_KEY = process.env.KORAPAY_SECRET_KEY;
// const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
// const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

// const MIN_AMOUNT = 200;
// const MAX_AMOUNT = 1000000; // Korapay card limit

// // ======================================
// // 1️⃣ Initialize Payment
// // ======================================
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

//     if (!req.user) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     const reference = `rsms-${Date.now()}-${Math.floor(
//       Math.random() * 1000000
//     )}`;

//     const response = await axios.post(
//       "https://api.korapay.com/merchant/api/v1/charges/initialize",
//       {
//         amount: numericAmount, // ⚠️ IMPORTANT: Do NOT multiply by 100
//         currency: "NGN",
//         reference,
//         redirect_url: `${BACKEND_URL}/api/korapay/verify?reference=${reference}`,
//         customer: {
//           email: req.user.email,
//           name: req.user.name || req.user.email,
//         },
//         metadata: {
//           userId: req.user._id,
//           source: "RealSMS Wallet Funding",
//         },
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     const checkoutUrl = response.data?.data?.checkout_url;

//     if (!checkoutUrl) {
//       return res.status(400).json({
//         message: "Unable to initialize payment",
//       });
//     }

//     await Transaction.create({
//       user: req.user._id,
//       reference,
//       amount: numericAmount,
//       currency: "NGN",
//       provider: "KORAPAY",
//       status: "PENDING",
//     });

//     return res.status(200).json({
//       checkout_url: checkoutUrl,
//     });
//   } catch (error) {
//     console.error(
//       "Korapay Init Error:",
//       error.response?.data || error.message
//     );

//     return res.status(500).json({
//       message: "Korapay payment initialization failed",
//     });
//   }
// };

// // ======================================
// // 2️⃣ Verify Payment (FIXED)
// // ======================================
// exports.verifyPayment = async (req, res) => {
//   try {
//     const { reference } = req.query;

//     if (!reference) {
//       return res.redirect(`${FRONTEND_URL}/fund-cancel`);
//     }

//     const transaction = await Transaction.findOne({ reference });

//     if (!transaction) {
//       return res.redirect(`${FRONTEND_URL}/fund-cancel`);
//     }

//     // Prevent double credit
//     if (transaction.status === "SUCCESS") {
//       return res.redirect(`${FRONTEND_URL}/fund-success`);
//     }

//     const response = await axios.get(
//       `https://api.korapay.com/merchant/api/v1/charges/${reference}`,
//       {
//         headers: {
//           Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     const paymentData = response.data?.data;

//     console.log("🔍 KORAPAY VERIFY RESPONSE:", paymentData);

//     if (!paymentData) {
//       transaction.status = "FAILED";
//       await transaction.save();
//       return res.redirect(`${FRONTEND_URL}/fund-cancel`);
//     }

//     // ✅ FIX: Korapay returns "successful"
//     if (paymentData.status !== "successful") {
//       transaction.status = "FAILED";
//       await transaction.save();
//       return res.redirect(`${FRONTEND_URL}/fund-cancel`);
//     }

//     // ✅ Safe number comparison
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

//     // ✅ Credit wallet
//     user.walletBalanceNGN += transaction.amount;
//     await user.save();

//     transaction.status = "SUCCESS";
//     transaction.processedAt = new Date();
//     await transaction.save();

//     return res.redirect(`${FRONTEND_URL}/fund-success`);
//   } catch (error) {
//     console.error(
//       "Korapay Verify Error:",
//       error.response?.data || error.message
//     );

//     return res.redirect(`${FRONTEND_URL}/fund-cancel`);
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

// ======================================
// 1️⃣ INITIALIZE PAYMENT
// ======================================
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

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ✅ Merchant reference (your internal tracking)
    const merchantReference = `rsms-${Date.now()}-${Math.floor(
      Math.random() * 1000000
    )}`;

    // Initialize payment
    const response = await axios.post(
      "https://api.korapay.com/merchant/api/v1/charges/initialize",
      {
        amount: numericAmount,
        currency: "NGN",
        reference: merchantReference, // merchant reference
        redirect_url: `${BACKEND_URL}/api/korapay/verify`,
        customer: {
          email: req.user.email,
          name: req.user.name || req.user.email,
        },
        metadata: {
          userId: req.user._id,
          source: "RealSMS Wallet Funding",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const korapayReference = response.data?.data?.reference;
    const checkoutUrl = response.data?.data?.checkout_url;

    if (!checkoutUrl || !korapayReference) {
      return res.status(400).json({
        message: "Unable to initialize payment",
      });
    }

    // ✅ Save both references in DB
    await Transaction.create({
      user: req.user._id,
      merchantReference,  // your internal
      korapayReference,   // KPY-... returned from Korapay
      amount: numericAmount,
      currency: "NGN",
      provider: "KORAPAY",
      status: "PENDING",
    });

    return res.status(200).json({
      checkout_url: checkoutUrl,
    });
  } catch (error) {
    console.error(
      "❌ Korapay Init Error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message: "Korapay payment initialization failed",
    });
  }
};

// ======================================
// 2️⃣ VERIFY PAYMENT
// ======================================
exports.verifyPayment = async (req, res) => {
  try {
    const merchantReference =
      req.query.reference || req.query.tx_ref || req.query.trxref;

    if (!merchantReference) {
      return res.redirect(`${FRONTEND_URL}/fund-cancel`);
    }

    // ✅ Find transaction by merchant reference
    const transaction = await Transaction.findOne({ merchantReference });

    if (!transaction) {
      return res.redirect(`${FRONTEND_URL}/fund-cancel`);
    }

    // Prevent double credit
    if (transaction.status === "SUCCESS") {
      return res.redirect(`${FRONTEND_URL}/fund-success`);
    }

    let paymentData = null;
    let attempts = 0;
    const maxAttempts = 5;

    // 🔁 Retry loop to avoid timing issues
    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(
          `https://api.korapay.com/merchant/api/v1/transactions/verify/${transaction.korapayReference}`,
          {
            headers: {
              Authorization: `Bearer ${KORAPAY_SECRET_KEY}`,
            },
          }
        );

        paymentData = response.data?.data;

        console.log(`🔍 Attempt ${attempts + 1}:`, paymentData?.status);

        if (paymentData?.status === "success") break;
      } catch (err) {
        console.log("Retry error:", err.message);
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;
    }

    // ⏳ Payment still pending → redirect to pending page
    if (!paymentData || paymentData.status !== "success") {
      console.log("⏳ Payment still pending");
      return res.redirect(`${FRONTEND_URL}/fund-pending`);
    }

    // ✅ Validate amount
    const paidAmount = Number(paymentData.amount);
    const expectedAmount = Number(transaction.amount);

    if (paidAmount !== expectedAmount) {
      console.log("❌ Amount mismatch");
      transaction.status = "FAILED";
      await transaction.save();
      return res.redirect(`${FRONTEND_URL}/fund-cancel`);
    }

    // ✅ Validate currency
    if (paymentData.currency !== "NGN") {
      console.log("❌ Currency mismatch");
      transaction.status = "FAILED";
      await transaction.save();
      return res.redirect(`${FRONTEND_URL}/fund-cancel`);
    }

    // ✅ Credit user wallet
    const user = await User.findById(transaction.user);
    if (!user) {
      return res.redirect(`${FRONTEND_URL}/fund-cancel`);
    }

    user.walletBalanceNGN += expectedAmount;
    await user.save();

    transaction.status = "SUCCESS";
    transaction.processedAt = new Date();
    await transaction.save();

    console.log("✅ Wallet credited successfully");

    return res.redirect(`${FRONTEND_URL}/fund-success`);
  } catch (error) {
    console.error(
      "❌ Korapay Verify Error:",
      error.response?.data || error.message
    );

    return res.redirect(`${FRONTEND_URL}/fund-cancel`);
  }
};
