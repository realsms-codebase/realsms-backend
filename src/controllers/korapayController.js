const axios = require("axios");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

const KORAPAY_SECRET_KEY = process.env.KORAPAY_SECRET_KEY;

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

const KORAPAY_BASE_URL = "https://api.korapay.com/merchant/api/v1";

const MIN_AMOUNT = 1000;
const MAX_AMOUNT = 1000000;

/* ======================================================
   1️⃣ INIT PAYMENT (FIXED FOR YOUR KORAPAY FLOW)
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

    console.log("🔥 FULL KORAPAY RESPONSE:", JSON.stringify(response.data, null, 2));

    const korapayData = response.data?.data;

    // 🚨 IMPORTANT FIX: use `reference` (NOT internal_reference)
    const korapayReference = korapayData?.reference;

    const checkoutUrl = korapayData?.checkout_url;

    if (!checkoutUrl) {
      return res.status(400).json({
        message: "Korapay initialization failed",
        detail: response.data,
      });
    }

    if (!korapayReference) {
      return res.status(500).json({
        message: "Missing Korapay reference",
        detail: response.data,
      });
    }

    console.log("✅ RSMS REF:", reference);
    console.log("✅ KORAPAY REF:", korapayReference);

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
   2️⃣ VERIFY PAYMENT (FIXED)
====================================================== */
exports.verifyPayment = async (req, res) => {
  try {
    const reference = req.query.reference;

    if (!reference) {
      return res.redirect(`${FRONTEND_URL}/fund-cancel`);
    }

    const transaction = await Transaction.findOne({ reference });

    if (!transaction) {
      return res.redirect(`${FRONTEND_URL}/fund-cancel`);
    }

    if (transaction.status === "SUCCESS") {
      return res.redirect(`${FRONTEND_URL}/fund-success`);
    }

    const korapayRef = transaction.korapayReference;

    if (!korapayRef) {
      return res.redirect(`${FRONTEND_URL}/fund-cancel`);
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

    console.log("🔥 VERIFY RESPONSE:", paymentData);

    const status = paymentData?.status?.toLowerCase();

    if (!["success", "successful", "paid"].includes(status)) {
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
      return res.redirect(`${FRONTEND_URL}/fund-cancel`);
    }

    user.walletBalanceNGN += transaction.amount;
    await user.save();

    transaction.status = "SUCCESS";
    transaction.processedAt = new Date();
    await transaction.save();

    return res.redirect(`${FRONTEND_URL}/fund-success`);

  } catch (error) {
    console.error("❌ VERIFY ERROR:", error.message);
    return res.redirect(`${FRONTEND_URL}/fund-cancel`);
  }
};

/* ======================================================
   3️⃣ WEBHOOK (SAFE + FINAL)
====================================================== */
exports.korapayWebhook = async (req, res) => {
  try {
    const event = req.body;

    console.log("🔥 WEBHOOK:", event);

    if (event.event !== "charge.success") {
      return res.sendStatus(200);
    }

    const korapayRef = event.data?.reference; // IMPORTANT FIX

    if (!korapayRef) {
      return res.sendStatus(200);
    }

    const transaction = await Transaction.findOne({
      korapayReference: korapayRef,
    });

    if (!transaction || transaction.status === "SUCCESS") {
      return res.sendStatus(200);
    }

    const user = await User.findById(transaction.user);

    if (!user) return res.sendStatus(200);

    user.walletBalanceNGN += transaction.amount;
    await user.save();

    transaction.status = "SUCCESS";
    transaction.processedAt = new Date();
    await transaction.save();

    console.log("✅ WEBHOOK CREDITED:", korapayRef);

    return res.sendStatus(200);

  } catch (error) {
    console.error("❌ WEBHOOK ERROR:", error.message);
    return res.sendStatus(500);
  }
};
